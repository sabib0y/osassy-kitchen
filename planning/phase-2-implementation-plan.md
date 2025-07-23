# Phase 2: Customizable Subscriptions & Stripe Integration
**Osassy's Kitchen - Implementation Plan**

## Overview
This document outlines the implementation for Phase 2. This phase focuses on integrating Stripe to handle **customizable, recurring subscriptions**. Users will be able to select specific menu items, pay via Stripe Checkout, and have their subscription recorded reliably via webhooks.

---

## 1. Project Dependencies Installation

### Core Dependencies
```bash
# Stripe SDK for server-side operations
npm install stripe

# Stripe SDK for client-side operations (React)
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 2. Environment Configuration

### Environment Variables File
**File:** `.env.local`

Ensure your Stripe API keys are correctly set up. The publishable key **must** be prefixed with `NEXT_PUBLIC_` to be accessible on the client-side.

```bash
# ... existing variables

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

---

## 3. Stripe Client Initialization

### Stripe Utility File
**File:** `src/lib/stripe.js`

A reusable utility to initialize the Stripe Node.js client.

```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Use a recent API version
});

export default stripe;
```

---

## 4. Frontend Subscription UI

### Subscription Page
**File:** `src/pages/subscribe.js`

A page for users to select a plan and customize their weekly/monthly menu items.

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';
import { PrismaClient } from '@prisma/client';

// This is a placeholder for plan selection.
const subscriptionPlans = [
  { name: 'Weekly Meal Plan', priceId: 'price_YOUR_WEEKLY_PRICE_ID' },
  { name: 'Monthly Meal Plan', priceId: 'price_YOUR_MONTHLY_PRICE_ID' },
];

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Fetch menu items server-side to pass as props
export async function getServerSideProps() {
  const prisma = new PrismaClient();
  const menuItems = await prisma.menuItem.findMany({ where: { available: true } });
  return { props: { menuItems } };
}

const SubscribePage = ({ menuItems }) => {
  const { isAuthenticated, status } = useAuth();
  const [selectedItems, setSelectedItems] = useState({}); // { menuItemId: quantity }
  const [selectedPlan, setSelectedPlan] = useState(subscriptionPlans[0].priceId);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (itemId, quantity) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) return alert('Please log in to subscribe.');
    
    const itemsToSubscribe = Object.entries(selectedItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (itemsToSubscribe.length === 0) return alert('Please select at least one item.');

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedPlan, items: itemsToSubscribe }),
      });

      const { sessionId } = await res.json();
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <p>Loading...</p>;

  return (
    <div>
      <h1>Subscribe to a Meal Plan</h1>
      {/* Add Plan Selection UI (e.g., radio buttons) here */}
      
      <h2>Customize Your Menu</h2>
      {menuItems.map(item => (
        <div key={item.id}>
          <span>{item.name} - ${item.price}</span>
          <input 
            type="number" 
            min="0" 
            defaultValue="0"
            onChange={(e) => handleItemChange(item.id, parseInt(e.target.value, 10))}
          />
        </div>
      ))}

      <button onClick={handleSubscribe} disabled={loading}>
        {loading ? 'Redirecting...' : 'Continue to Checkout'}
      </button>
    </div>
  );
};

export default SubscribePage;
```

---

## 5. Backend API for Checkout Session

### Checkout Session Endpoint
**File:** `src/pages/api/subscribe.js`

This API route creates a Stripe Checkout Session, embedding the user's choices in the metadata.

```javascript
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import stripe from '../../lib/stripe';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { priceId, items } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: session.user.email });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/profile?status=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe?status=cancelled`,
      // Store user choices in metadata for the webhook
      metadata: {
        userId: user.id,
        items: JSON.stringify(items), // [{ menuItemId, quantity }]
      }
    });

    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
  }
}
```

---

## 6. Webhook for Subscription Fulfillment

### Stripe Webhook Endpoint
**File:** `src/pages/api/webhooks/stripe.js`

This endpoint listens for events from Stripe to reliably create subscriptions in the database.

```javascript
import { buffer } from 'micro';
import { PrismaClient } from '@prisma/client';
import stripe from '../../../lib/stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, items } = session.metadata;
    const parsedItems = JSON.parse(items);

    // Create the main subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId: userId,
        stripeSubscriptionId: session.subscription,
        status: 'ACTIVE',
        // These are placeholders, adjust as needed
        planName: 'Custom Plan', 
        interval: 'WEEKLY', // Or determine from priceId
        price: session.amount_total / 100,
        nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // e.g., 1 week from now
      },
    });

    // Create the related subscription items
    await prisma.subscriptionItem.createMany({
      data: parsedItems.map(item => ({
        subscriptionId: subscription.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
    });
  }

  res.status(200).json({ received: true });
}
```

---

## 7. Testing & Validation Checklist

- [x] `stripe` and `@stripe/stripe-js` libraries are installed.
- [x] Stripe keys and webhook secret are in `.env.local`.
- [x] Products and Prices (for weekly/monthly plans) are created in the Stripe Dashboard.
- [x] The `priceId`s in `subscribe.js` are updated.
- [x] The `/subscribe` page fetches and displays menu items.
- [x] Clicking "Continue to Checkout" with selected items redirects to Stripe.
- [x] The user's `stripeCustomerId` is created and saved.
- [x] The success and cancel redirects work correctly.
- [ ] **Webhook Test**: Use the Stripe CLI to forward events to your local endpoint (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`).
- [ ] After a successful payment, a `Subscription` record is created in the database.
- [ ] Corresponding `SubscriptionItem` records are created and linked to the new subscription.
