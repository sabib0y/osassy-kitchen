# Phase 2 Setup Instructions - Stripe Integration

## Overview
This document provides step-by-step instructions to complete the Stripe integration for Osassy's Kitchen subscription platform.

## Prerequisites
- Phase 1 (Authentication) must be completed and working
- PostgreSQL database must be running
- Stripe account must be created (https://stripe.com)

## Setup Steps

### 1. Configure Environment Variables
Update your `.env.local` file with actual Stripe keys:

```bash
# Replace with your actual Stripe test keys
STRIPE_SECRET_KEY="sk_test_your_actual_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret" # Will be used in Phase 3
```

### 2. Create Stripe Products and Prices
1. Log into your Stripe Dashboard (https://dashboard.stripe.com)
2. Go to "Products" section
3. Create two products:
   - **Weekly Meal Plan**: $49.99/week
   - **Monthly Meal Plan**: $189.99/month
4. Copy the Price IDs for each product
5. Update `src/pages/subscribe.js` with actual price IDs:

```javascript
// Replace these placeholders with actual Stripe price IDs
priceId: 'price_actual_weekly_price_id_here',
priceId: 'price_actual_monthly_price_id_here',
```

### 3. Test the Integration
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/subscribe

3. Test the subscription flow:
   - Log in with a test user
   - Select a subscription plan
   - Complete the Stripe checkout with test card: `4242 4242 4242 4242`
   - Verify redirect back to profile page

### 4. Verify Database Updates
After successful subscription:
- Check that `stripeCustomerId` is saved in the User table
- Verify the customer appears in your Stripe dashboard

## Testing Checklist
- [ ] Environment variables configured with real Stripe keys
- [ ] Stripe products and prices created
- [ ] Price IDs updated in subscribe.js
- [ ] Subscription page loads correctly
- [ ] Authentication required for subscription
- [ ] Stripe checkout redirects work
- [ ] Customer ID saved to database
- [ ] Error handling works for failed payments

## Next Steps
Once Phase 2 is working, proceed to Phase 3 (Stripe webhooks and order generation).

## Troubleshooting
- **"Invalid API Key"**: Check your Stripe keys in .env.local
- **"Price not found"**: Verify price IDs in subscribe.js match Stripe dashboard
- **"Unauthorized"**: Ensure user is logged in before subscribing
- **Database errors**: Check PostgreSQL connection and Prisma migrations
