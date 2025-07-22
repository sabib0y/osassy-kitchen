# Phase 2: Stripe Integration & Subscription Flow
**Osassy's Kitchen - Week 2 Implementation Plan**

## Overview
This document outlines the complete implementation plan for Phase 2. This phase focuses on integrating Stripe to handle subscriptions, allowing users to select meal plans and pay for them via Stripe Checkout.

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

Ensure your Stripe API keys are correctly set up. These were added as placeholders in Phase 1.

```bash
# ... existing variables

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret" # This will be used in Phase 3
```

---

## 3. Stripe Client Initialization

### Stripe Utility File
**File:** `src/lib/stripe.js`

Create a reusable utility to initialize the Stripe Node.js client.

```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Use a recent API version
});

export default stripe;
```

---

## 4. Backend API for Subscription Creation

### Subscription API Endpoint
**File:** `src/pages/api/subscribe.js`

This API route will create a Stripe Checkout Session for the user.

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

  const { priceId, quantity = 1 } = req.body;
  if (!priceId) {
    return res.status(400).json({ message: 'Missing priceId' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe?cancelled=true`,
    });

    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
  }
}
```
**Note:** For this to work, you must first create corresponding products and prices in your Stripe Dashboard. The `priceId` (e.g., `price_1P...`) will come from there.

---

## 5. Frontend Subscription Page

### Subscription Page
**File:** `src/pages/subscribe.js`

A new page where users can view available subscription plans and proceed to checkout.

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';

// This is a placeholder. In a real app, you'd fetch these from your DB
// or have them configured in your Stripe Dashboard.
const subscriptionPlans = [
  { name: 'Weekly Meal Plan', priceId: 'price_YOUR_WEEKLY_PRICE_ID', price: 49.99 },
  { name: 'Monthly Meal Plan', priceId: 'price_YOUR_MONTHLY_PRICE_ID', price: 189.99 },
];

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const SubscribePage = () => {
  const { user, isAuthenticated, status } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId) => {
    if (!isAuthenticated) {
      // Or redirect to login
      alert('Please log in to subscribe.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId } = await res.json();
      if (!sessionId) {
        throw new Error('Could not create checkout session.');
      }

      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Subscription Plans</h1>
      {subscriptionPlans.map((plan) => (
        <div key={plan.priceId} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
          <h2>{plan.name}</h2>
          <p>${plan.price} / {plan.name.includes('Weekly') ? 'week' : 'month'}</p>
          <button onClick={() => handleSubscribe(plan.priceId)} disabled={loading}>
            {loading ? 'Redirecting...' : 'Subscribe Now'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default SubscribePage;
```
**Important:** You must expose the Stripe publishable key to the client by prefixing it with `NEXT_PUBLIC_` in `.env.local`.
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"`

---

## 6. App-level Stripe Configuration

### Update App Wrapper
**File:** `src/pages/_app.js`

Wrap the application with Stripe's `Elements` provider. This is not strictly necessary for Checkout redirection but is best practice for future Stripe integrations (e.g., embedded payment forms).

```javascript
// src/pages/_app.js
import { SessionProvider } from 'next-auth/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/style.scss'; // Adjust path if needed

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Elements stripe={stripePromise}>
        <Component {...pageProps} />
      </Elements>
    </SessionProvider>
  );
}

export default MyApp;
```

---

## 7. Testing & Validation Checklist

- [ ] `stripe` and `@stripe/stripe-js` libraries are installed.
- [ ] Stripe keys are present in `.env.local`, and the publishable key is prefixed with `NEXT_PUBLIC_`.
- [ ] Products and Prices are created in the Stripe Dashboard.
- [ ] The `priceId`s in `subscribe.js` are updated with the actual IDs from Stripe.
- [ ] The `/subscribe` page displays subscription plans correctly.
- [ ] Clicking "Subscribe" redirects an authenticated user to the Stripe Checkout page.
- [ ] A new customer is created in Stripe for a first-time subscriber.
- [ ] The user's `stripeCustomerId` is saved to the database.
- [ ] After a successful payment, the user is redirected to the `/profile` page.
- [ ] After cancelling, the user is redirected back to the `/subscribe` page.
