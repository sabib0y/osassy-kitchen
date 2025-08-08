import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import stripe from '../../../../lib/stripe';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!['PATCH', 'GET', 'DELETE', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the JWT token
    const token = await getToken({ req });
    
    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({ 
      where: { email: token.email } 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Handle GET request
    if (req.method === 'GET') {
      const fullSubscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          subscriptionItems: {
            include: {
              menuItem: true
            }
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              orderItems: {
                include: {
                  menuItem: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json({ subscription: fullSubscription });
    }

    // Handle PATCH request (update subscription status or items)
    if (req.method === 'PATCH') {
      const { action, items } = req.body;

      // Handle status actions (pause, resume, cancel)
      if (action) {
        if (!['pause', 'resume', 'cancel'].includes(action)) {
          return res.status(400).json({ message: 'Invalid action' });
        }

        let newStatus: SubscriptionStatus;
        switch (action) {
          case 'pause':
            if (subscription.status !== 'ACTIVE') {
              return res.status(400).json({ message: 'Can only pause active subscriptions' });
            }
            newStatus = SubscriptionStatus.PAUSED;
            break;
          case 'resume':
            if (subscription.status !== 'PAUSED') {
              return res.status(400).json({ message: 'Can only resume paused subscriptions' });
            }
            newStatus = SubscriptionStatus.ACTIVE;
            break;
          case 'cancel':
            if (subscription.status === 'CANCELLED') {
              return res.status(400).json({ message: 'Subscription is already cancelled' });
            }
            newStatus = SubscriptionStatus.CANCELLED;
            break;
          default:
            return res.status(400).json({ message: 'Invalid action' });
        }

        // Update subscription status
        const updatedSubscription = await prisma.subscription.update({
          where: { id },
          data: { 
            status: newStatus,
            updatedAt: new Date()
          },
          include: {
            subscriptionItems: {
              include: {
                menuItem: true
              }
            }
          }
        });

        // Update Stripe subscription if exists
        if (subscription.stripeSubscriptionId) {
          try {
            await updateStripeSubscription(subscription.stripeSubscriptionId, action);
          } catch (stripeError) {
            console.error('Stripe update failed:', stripeError);
            // Continue despite Stripe error - the database has been updated
          }
        }

        return res.status(200).json({ 
          message: `Subscription ${action}d successfully`,
          subscription: updatedSubscription 
        });
      }

      // Handle item updates
      if (items) {
        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: 'Invalid items data' });
        }

        // Validate items exist and are available
        const menuItemIds = items.map(item => item.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
          where: {
            id: { in: menuItemIds },
            available: true
          }
        });

        if (menuItems.length !== menuItemIds.length) {
          return res.status(400).json({ message: 'Some menu items are not available' });
        }

        // Calculate new subscription price
        const newPrice = items.reduce((total, item) => {
          const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
          return total + (menuItem ? menuItem.price * item.quantity : 0);
        }, 0);

        // Update subscription in a transaction
        const updatedSubscription = await prisma.$transaction(async (tx) => {
          // Delete existing subscription items
          await tx.subscriptionItem.deleteMany({
            where: { subscriptionId: id }
          });

          // Create new subscription items
          await tx.subscriptionItem.createMany({
            data: items.map(item => ({
              subscriptionId: id,
              menuItemId: item.menuItemId,
              quantity: item.quantity
            }))
          });

          // Update subscription price
          const updated = await tx.subscription.update({
            where: { id },
            data: { 
              price: newPrice,
              updatedAt: new Date()
            },
            include: {
              subscriptionItems: {
                include: {
                  menuItem: true
                }
              }
            }
          });

          return updated;
        });

        // Update Stripe subscription with new price
        if (subscription.stripeSubscriptionId) {
          try {
            await updateStripeSubscriptionPrice(subscription.stripeSubscriptionId, newPrice);
          } catch (stripeError) {
            console.error('Stripe price update failed:', stripeError);
            // Continue despite Stripe error - the database has been updated
          }
        }

        return res.status(200).json({ 
          message: 'Subscription items updated successfully',
          subscription: updatedSubscription 
        });
      }

      return res.status(400).json({ message: 'No valid update data provided' });
    }

    // Handle PUT request (complete subscription replacement)
    if (req.method === 'PUT') {
      const { planName, items } = req.body;

      if (!planName || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Plan name and items are required' });
      }

      // Validate items exist and are available
      const menuItemIds = items.map(item => item.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
          available: true
        }
      });

      if (menuItems.length !== menuItemIds.length) {
        return res.status(400).json({ message: 'Some menu items are not available' });
      }

      // Calculate new subscription price
      const newPrice = items.reduce((total, item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        return total + (menuItem ? menuItem.price * item.quantity : 0);
      }, 0);

      // Update subscription completely
      const updatedSubscription = await prisma.$transaction(async (tx) => {
        // Delete existing subscription items
        await tx.subscriptionItem.deleteMany({
          where: { subscriptionId: id }
        });

        // Create new subscription items
        await tx.subscriptionItem.createMany({
          data: items.map(item => ({
            subscriptionId: id,
            menuItemId: item.menuItemId,
            quantity: item.quantity
          }))
        });

        // Update subscription
        const updated = await tx.subscription.update({
          where: { id },
          data: { 
            planName,
            price: newPrice,
            updatedAt: new Date()
          },
          include: {
            subscriptionItems: {
              include: {
                menuItem: true
              }
            }
          }
        });

        return updated;
      });

      // Update Stripe subscription
      if (subscription.stripeSubscriptionId) {
        try {
          await updateStripeSubscriptionPrice(subscription.stripeSubscriptionId, newPrice);
        } catch (stripeError) {
          console.error('Stripe update failed:', stripeError);
          // Continue despite Stripe error
        }
      }

      return res.status(200).json({ 
        message: 'Subscription updated successfully',
        subscription: updatedSubscription 
      });
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      // Soft delete by setting status to CANCELLED
      const cancelledSubscription = await prisma.subscription.update({
        where: { id },
        data: { 
          status: SubscriptionStatus.CANCELLED,
          updatedAt: new Date()
        }
      });

      return res.status(200).json({ 
        message: 'Subscription cancelled successfully',
        subscription: cancelledSubscription 
      });
    }

  } catch (error) {
    console.error('Subscription API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    res.status(500).json({ 
      message: 'Failed to process subscription request', 
      error: errorMessage 
    });
  }
}

// Helper function to update Stripe subscription status
async function updateStripeSubscription(stripeSubscriptionId: string, action: string) {
  try {
    switch (action) {
      case 'pause':
        await stripe.subscriptions.update(stripeSubscriptionId, {
          pause_collection: {
            behavior: 'keep_as_draft',
          },
        });
        break;
      case 'resume':
        await stripe.subscriptions.update(stripeSubscriptionId, {
          pause_collection: null,
        });
        break;
      case 'cancel':
        await stripe.subscriptions.cancel(stripeSubscriptionId);
        break;
    }
  } catch (error) {
    console.error(`Failed to ${action} Stripe subscription:`, error);
    throw error;
  }
}

// Helper function to update Stripe subscription price
async function updateStripeSubscriptionPrice(stripeSubscriptionId: string, newPrice: number) {
  try {
    // Get the current subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    if (!stripeSubscription.items.data[0]) {
      throw new Error('No subscription items found');
    }

    // Convert price to cents (Stripe expects prices in smallest currency unit)
    const priceInCents = Math.round(newPrice * 100);

    // Create a new price object
    const newPriceObject = await stripe.prices.create({
      unit_amount: priceInCents,
      currency: 'gbp',
      recurring: {
        interval: stripeSubscription.items.data[0].price.recurring?.interval || 'month',
      },
      product_data: {
        name: 'Osassy\'s Kitchen Subscription',
      },
    });

    // Update the subscription with the new price
    await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceObject.id,
      }],
      proration_behavior: 'create_prorations',
    });
  } catch (error) {
    console.error('Failed to update Stripe subscription price:', error);
    throw error;
  }
}