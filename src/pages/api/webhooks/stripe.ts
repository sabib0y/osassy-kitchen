import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import stripe from '../../../lib/stripe';

// Disable body parsing to receive raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

interface CheckoutSessionMetadata {
  userId: string;
  items: string;
}

interface SubscriptionItem {
  menuItemId: string;
  quantity: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  console.log('Received Stripe event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata as CheckoutSessionMetadata | null;
        
        if (!metadata?.userId || !metadata?.items) {
          console.error('Missing metadata in checkout session:', session.metadata);
          return res.status(400).json({ error: 'Missing required metadata' });
        }

        const parsedItems: SubscriptionItem[] = JSON.parse(metadata.items);
        
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: metadata.userId }
        });

        if (!user) {
          console.error('User not found:', metadata.userId);
          return res.status(400).json({ error: 'User not found' });
        }

        // Create subscription record
        const subscription = await prisma.subscription.create({
          data: {
            userId: metadata.userId,
            stripeSubscriptionId: session.subscription as string,
            planName: 'Custom Meal Plan',
            interval: 'WEEKLY', // Default, can be enhanced later
            price: (session.amount_total || 0) / 100,
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

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle subscription property - it can be string, Subscription object, or null
        const invoiceAny = invoice as any;
        const stripeSubscriptionId = invoiceAny.subscription 
          ? (typeof invoiceAny.subscription === 'string' 
              ? invoiceAny.subscription 
              : invoiceAny.subscription.id)
          : null;

        // Only process for subscription invoices (not one-time payments)
        if (stripeSubscriptionId) {
          console.log('Processing invoice.paid for subscription:', stripeSubscriptionId);

          // Find the subscription in our database
          const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId },
            include: { 
              subscriptionItems: {
                include: {
                  menuItem: true
                }
              }
            },
          });

          if (subscription && subscription.subscriptionItems.length > 0) {
            // Calculate delivery date based on subscription interval
            const deliveryDate = new Date();
            if (subscription.interval === 'WEEKLY') {
              deliveryDate.setDate(deliveryDate.getDate() + 7);
            } else if (subscription.interval === 'MONTHLY') {
              deliveryDate.setMonth(deliveryDate.getMonth() + 1);
            }

            // Calculate total price from current menu item prices
            const totalPrice = subscription.subscriptionItems.reduce((total, item) => {
              return total + (item.menuItem.price * item.quantity);
            }, 0);

            // Create the Order record
            const order = await prisma.order.create({
              data: {
                userId: subscription.userId,
                subscriptionId: subscription.id,
                totalPrice: totalPrice,
                deliveryDate: deliveryDate,
                status: 'PENDING',
                notes: `Auto-generated from subscription ${subscription.planName}`,
              },
            });

            // Create the associated OrderItem records
            await prisma.orderItem.createMany({
              data: subscription.subscriptionItems.map(item => ({
                orderId: order.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.menuItem.price, // Use current menu item price
              })),
            });

            // Update subscription's next delivery date
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                nextDeliveryDate: deliveryDate,
                updatedAt: new Date(),
              },
            });

            console.log('Order created successfully from subscription:', order.id);
          } else {
            console.log('No subscription found or no items for subscription:', stripeSubscriptionId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status.toUpperCase() as any,
            updatedAt: new Date(),
          },
        });

        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
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
