import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH' && req.method !== 'GET' && req.method !== 'DELETE') {
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

    // Handle PATCH request (update subscription status)
    if (req.method === 'PATCH') {
      const { action } = req.body;

      if (!action || !['pause', 'resume', 'cancel'].includes(action)) {
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

      // TODO: If using Stripe, update the Stripe subscription status here
      // if (subscription.stripeSubscriptionId) {
      //   await updateStripeSubscription(subscription.stripeSubscriptionId, action);
      // }

      return res.status(200).json({ 
        message: `Subscription ${action}d successfully`,
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