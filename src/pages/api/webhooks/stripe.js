import { buffer } from 'micro';
import { PrismaClient } from '@prisma/client';
import stripe from '../../../lib/stripe';

// Disable body parsing to receive raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, items } = session.metadata;
        
        if (!userId || !items) {
          console.error('Missing metadata in checkout session:', session.metadata);
          return res.status(400).json({ error: 'Missing required metadata' });
        }

        const parsedItems = JSON.parse(items);
        
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          console.error('User not found:', userId);
          return res.status(400).json({ error: 'User not found' });
        }

        // Create subscription record
        const subscription = await prisma.subscription.create({
          data: {
            userId: userId,
            stripeSubscriptionId: session.subscription,
            planName: 'Custom Meal Plan',
            interval: 'WEEKLY', // Default, can be enhanced later
            price: session.amount_total / 100,
            status: 'ACTIVE',
            nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          },
        });

        // Create subscription items
        if (parsedItems.length > 0) {
          await prisma.subscriptionItem.createMany({
            data: parsedItems.map(item => ({
              subscriptionId: subscription.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
            })),
          });
        }

        console.log('Subscription created successfully:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status.toUpperCase(),
            updatedAt: new Date(),
          },
        });

        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });

        console.log('Subscription cancelled:', subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
