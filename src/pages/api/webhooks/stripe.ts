import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import prisma from '../../../lib/prisma';
import stripe from '../../../lib/stripe';
import { sendAdminNewOrderNotification, sendAdminNewSubscriptionNotification, sendAdminCancellationNotification } from '../../../lib/email';

// Disable body parsing to receive raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

interface CheckoutSessionMetadata {
  userId: string;
  items: string;
  // Delivery details
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPostcode?: string;
  deliveryPhone?: string;
  deliveryInstructions?: string;
  preferredDay?: string;
  preferredTimeSlot?: string;
}

/**
 * Calculate the next delivery date based on the preferred day.
 * Finds the next occurrence of the preferred day that is at least 7 days from now.
 * @param preferredDay - Day of the week (e.g., 'monday', 'tuesday', etc.)
 * @returns Date object for the next delivery
 */
function calculateNextDeliveryDate(preferredDay?: string): Date {
  const now = new Date();
  const minimumDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  if (!preferredDay) {
    // No preference - just return 7 days from now
    return minimumDate;
  }

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDay = dayMap[preferredDay.toLowerCase()];

  if (targetDay === undefined) {
    // Invalid day - return 7 days from now
    console.log(`[Webhook] Invalid preferredDay: ${preferredDay}, defaulting to 7 days from now`);
    return minimumDate;
  }

  // Start from the minimum date (7 days from now)
  const result = new Date(minimumDate);
  const currentDay = result.getDay();

  // Calculate days until the next occurrence of the target day
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7; // Move to next week
  }

  result.setDate(result.getDate() + daysUntilTarget);

  return result;
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
        console.log('[Webhook] checkout.session.completed received');
        console.log('[Webhook] Session ID:', session.id);
        console.log('[Webhook] Session metadata:', JSON.stringify(session.metadata));

        const metadata = session.metadata as CheckoutSessionMetadata | null;

        if (!metadata?.userId || !metadata?.items) {
          console.error('[Webhook] Missing metadata in checkout session:', session.metadata);
          return res.status(400).json({ error: 'Missing required metadata' });
        }

        console.log('[Webhook] Processing for userId:', metadata.userId);

        const parsedItems: SubscriptionItem[] = JSON.parse(metadata.items);
        
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: metadata.userId }
        });

        if (!user) {
          console.error('User not found:', metadata.userId);
          return res.status(400).json({ error: 'User not found' });
        }

        // Calculate next delivery date based on preferred day
        const nextDeliveryDate = calculateNextDeliveryDate(metadata.preferredDay);

        console.log('[Webhook] Delivery preferences:', {
          preferredDay: metadata.preferredDay,
          preferredTimeSlot: metadata.preferredTimeSlot,
          address: metadata.deliveryAddress,
          city: metadata.deliveryCity,
          postcode: metadata.deliveryPostcode,
          calculatedDeliveryDate: nextDeliveryDate.toISOString(),
        });

        // Create subscription record with delivery preferences
        const subscription = await prisma.subscription.create({
          data: {
            userId: metadata.userId,
            stripeSubscriptionId: session.subscription as string,
            planName: 'Custom Meal Plan',
            interval: 'WEEKLY', // Default, can be enhanced later
            price: (session.amount_total || 0) / 100,
            status: 'ACTIVE',
            nextDeliveryDate: nextDeliveryDate,
            // Delivery preferences
            preferredDeliveryDay: metadata.preferredDay || null,
            preferredDeliveryTimeSlot: metadata.preferredTimeSlot || null,
            deliveryAddress: metadata.deliveryAddress || null,
            deliveryCity: metadata.deliveryCity || null,
            deliveryPostcode: metadata.deliveryPostcode || null,
            deliveryPhone: metadata.deliveryPhone || null,
            deliveryInstructions: metadata.deliveryInstructions || null,
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

        console.log('[Webhook] Subscription created successfully:', subscription.id);

        // Create the initial Order for the first payment
        // (invoice.paid doesn't have subscription ID for initial payment)
        const menuItems = await prisma.menuItem.findMany({
          where: {
            id: { in: parsedItems.map(item => item.menuItemId) }
          }
        });

        const totalPrice = parsedItems.reduce((total, item) => {
          const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
          return total + ((menuItem?.price || 0) * item.quantity);
        }, 0);

        // Use the same calculated delivery date as the subscription
        const order = await prisma.order.create({
          data: {
            userId: metadata.userId,
            subscriptionId: subscription.id,
            totalPrice: totalPrice,
            deliveryDate: nextDeliveryDate,
            status: 'PENDING',
            notes: `Initial order from subscription: ${subscription.planName}`,
          },
        });

        // Create order items
        await prisma.orderItem.createMany({
          data: parsedItems.map(item => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            return {
              orderId: order.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: menuItem?.price || 0,
            };
          }),
        });

        console.log('[Webhook] Initial order created:', order.id);

        // Send admin notification emails
        try {
          // Notify admin of new subscription
          await sendAdminNewSubscriptionNotification({
            subscriptionId: subscription.id,
            customerName: user.name || 'Customer',
            customerEmail: user.email,
            planName: subscription.planName,
            interval: 'Weekly',
            price: subscription.price,
            startDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            items: parsedItems.map(item => {
              const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
              return {
                name: menuItem?.name || 'Unknown Item',
                quantity: item.quantity,
                price: menuItem?.price || 0,
              };
            }),
          });

          // Notify admin of new order
          await sendAdminNewOrderNotification({
            orderId: order.id,
            customerName: user.name || 'Customer',
            customerEmail: user.email,
            items: parsedItems.map(item => {
              const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
              return {
                name: menuItem?.name || 'Unknown Item',
                quantity: item.quantity,
                price: (menuItem?.price || 0) * item.quantity,
              };
            }),
            totalPrice: totalPrice,
            deliveryDate: nextDeliveryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            deliveryAddress: metadata.deliveryAddress ? `${metadata.deliveryAddress}, ${metadata.deliveryCity || ''} ${metadata.deliveryPostcode || ''}`.trim() : undefined,
          });

          console.log('[Webhook] Admin notification emails sent');
        } catch (emailError) {
          console.error('[Webhook] Failed to send admin notification emails:', emailError);
          // Don't fail the webhook - emails are non-critical
        }

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

        console.log('[Webhook] invoice.paid received');
        console.log('[Webhook] Invoice ID:', invoice.id);
        console.log('[Webhook] stripeSubscriptionId from invoice:', stripeSubscriptionId);

        // Only process for subscription invoices (not one-time payments)
        if (stripeSubscriptionId) {
          console.log('[Webhook] Processing invoice.paid for subscription:', stripeSubscriptionId);

          // Race condition fix: wait briefly for checkout.session.completed to finish creating subscription
          // This handles cases where invoice.paid arrives before subscription is saved
          let subscription = null;
          let retries = 0;
          const maxRetries = 3;

          while (!subscription && retries < maxRetries) {
            subscription = await prisma.subscription.findUnique({
              where: { stripeSubscriptionId },
              include: {
                subscriptionItems: {
                  include: {
                    menuItem: true
                  }
                }
              },
            });

            if (!subscription && retries < maxRetries - 1) {
              console.log(`[Webhook] Subscription not found, retry ${retries + 1}/${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }
            retries++;
          }

          console.log('[Webhook] Subscription lookup result:', subscription ? `Found (${subscription.id})` : 'Not found');
          console.log('[Webhook] Subscription items count:', subscription?.subscriptionItems?.length ?? 0);

          if (subscription && subscription.subscriptionItems.length > 0) {
            // Check if this is a recurring payment (not the initial one)
            // by seeing if an order was created recently (within last hour) for this subscription
            const recentOrder = await prisma.order.findFirst({
              where: {
                subscriptionId: subscription.id,
                createdAt: {
                  gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                }
              }
            });

            if (recentOrder) {
              console.log('[Webhook] Skipping - recent order already exists:', recentOrder.id);
              break;
            }
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

            console.log('[Webhook] Order created successfully:', order.id);

            // Send admin notification for recurring order
            try {
              const subscriptionUser = await prisma.user.findUnique({
                where: { id: subscription.userId }
              });

              if (subscriptionUser) {
                await sendAdminNewOrderNotification({
                  orderId: order.id,
                  customerName: subscriptionUser.name || 'Customer',
                  customerEmail: subscriptionUser.email,
                  items: subscription.subscriptionItems.map(item => ({
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    price: item.menuItem.price * item.quantity,
                  })),
                  totalPrice: totalPrice,
                  deliveryDate: deliveryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                });
                console.log('[Webhook] Admin notification email sent for recurring order');
              }
            } catch (emailError) {
              console.error('[Webhook] Failed to send admin notification email:', emailError);
            }
          } else {
            console.log('[Webhook] FAILED: No subscription found or no items');
            console.log('[Webhook] stripeSubscriptionId was:', stripeSubscriptionId);
          }
        } else {
          console.log('[Webhook] invoice.paid skipped - no stripeSubscriptionId (one-time payment)');
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
        const stripeSubscription = event.data.object as Stripe.Subscription;

        // Get subscription with user info before updating
        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubscription.id },
          include: { user: true }
        });

        await prisma.subscription.update({
          where: { stripeSubscriptionId: stripeSubscription.id },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });

        // Send admin notification
        if (dbSubscription) {
          try {
            await sendAdminCancellationNotification({
              subscriptionId: dbSubscription.id,
              customerName: dbSubscription.user.name || 'Customer',
              customerEmail: dbSubscription.user.email,
              planName: dbSubscription.planName,
              cancelledAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            });
            console.log('[Webhook] Admin cancellation notification sent');
          } catch (emailError) {
            console.error('[Webhook] Failed to send cancellation notification:', emailError);
          }
        }

        console.log('Subscription cancelled:', stripeSubscription.id);
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
