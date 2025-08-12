import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import stripe from '../../../../../lib/stripe';
import { broadcastSubscriptionUpdate } from '@/lib/websocket';
import { EventType } from '@/types/websocket';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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
    const { pauseDate, pauseUntil } = req.body;
    
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

    // Validate subscription can be paused
    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({ 
        message: 'Only active subscriptions can be paused' 
      });
    }

    // Validate pause date if provided
    let pauseStartDate: Date | undefined;
    if (pauseDate) {
      pauseStartDate = new Date(pauseDate);
      if (isNaN(pauseStartDate.getTime())) {
        return res.status(400).json({ message: 'Invalid pause date' });
      }
      
      // Ensure pause date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (pauseStartDate < today) {
        return res.status(400).json({ 
          message: 'Pause date cannot be in the past' 
        });
      }
    }

    // Validate pause until date if provided
    let pauseEndDate: Date | undefined;
    if (pauseUntil) {
      pauseEndDate = new Date(pauseUntil);
      if (isNaN(pauseEndDate.getTime())) {
        return res.status(400).json({ message: 'Invalid pause until date' });
      }
      
      // Ensure pause until date is after pause start date
      if (pauseStartDate && pauseEndDate <= pauseStartDate) {
        return res.status(400).json({ 
          message: 'Pause until date must be after pause start date' 
        });
      }
    }

    // Update subscription status in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: { 
        status: SubscriptionStatus.PAUSED,
        updatedAt: new Date()
      },
      include: {
        subscriptionItems: {
          include: {
            menuItem: true
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
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

    // Update Stripe subscription if exists
    let stripeError: string | null = null;
    if (subscription.stripeSubscriptionId) {
      try {
        if (pauseStartDate && pauseStartDate > new Date()) {
          // Schedule pause for future date
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: {
              behavior: 'mark_uncollectible',
              resumes_at: Math.floor((pauseEndDate || new Date('2099-12-31')).getTime() / 1000)
            }
          });
        } else {
          // Pause immediately
          const pauseOptions: any = {
            behavior: 'keep_as_draft'
          };
          
          if (pauseEndDate) {
            pauseOptions.resumes_at = Math.floor(pauseEndDate.getTime() / 1000);
          }
          
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: pauseOptions
          });
        }
      } catch (error) {
        console.error('Failed to pause Stripe subscription:', error);
        stripeError = error instanceof Error ? error.message : 'Stripe update failed';
        // Continue despite Stripe error - the database has been updated
      }
    }

    // Transform the data for frontend consumption
    const transformedSubscription = {
      id: updatedSubscription.id,
      planName: updatedSubscription.planName,
      interval: updatedSubscription.interval,
      price: updatedSubscription.price,
      status: updatedSubscription.status,
      startDate: updatedSubscription.startDate,
      nextDeliveryDate: updatedSubscription.nextDeliveryDate,
      stripeSubscriptionId: updatedSubscription.stripeSubscriptionId,
      items: updatedSubscription.subscriptionItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        menuItem: item.menuItem
      })),
      recentOrders: updatedSubscription.orders.map(order => ({
        id: order.id,
        totalPrice: order.totalPrice,
        deliveryDate: order.deliveryDate,
        status: order.status,
        notes: order.notes,
        createdAt: order.createdAt,
        items: order.orderItems.map(orderItem => ({
          id: orderItem.id,
          quantity: orderItem.quantity,
          price: orderItem.price,
          menuItem: orderItem.menuItem
        }))
      }))
    };

    const response: any = {
      message: 'Subscription paused successfully',
      subscription: transformedSubscription
    };

    // Include warning if Stripe update failed
    if (stripeError) {
      response.warning = `Subscription paused in our system, but Stripe update failed: ${stripeError}`;
    }

    // Include pause details in response
    if (pauseStartDate) {
      response.pauseStartDate = pauseStartDate.toISOString();
    }
    if (pauseEndDate) {
      response.pauseEndDate = pauseEndDate.toISOString();
      response.message += ` and will automatically resume on ${pauseEndDate.toDateString()}`;
    }

    // Broadcast subscription update via WebSocket
    try {
      broadcastSubscriptionUpdate(id, {
        subscriptionId: id,
        userId: user.id,
        data: {
          status: SubscriptionStatus.PAUSED,
          pauseStartDate: pauseStartDate?.toISOString(),
          pauseEndDate: pauseEndDate?.toISOString(),
          planName: updatedSubscription.planName,
          nextDeliveryDate: updatedSubscription.nextDeliveryDate
        },
        eventType: EventType.SUBSCRIPTION_PAUSED,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to broadcast subscription update:', error);
      // Continue even if WebSocket broadcast fails
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Pause subscription API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to pause subscription';
    res.status(500).json({ 
      message: 'Failed to pause subscription', 
      error: errorMessage 
    });
  }
}