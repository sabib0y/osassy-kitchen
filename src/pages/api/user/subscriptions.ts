import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

    // Fetch user's subscriptions with related data
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      include: {
        subscriptionItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                category: true,
              }
            }
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 orders for each subscription
          include: {
            orderItems: {
              include: {
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data for frontend consumption
    const transformedSubscriptions = subscriptions.map(subscription => ({
      id: subscription.id,
      planName: subscription.planName,
      interval: subscription.interval,
      price: subscription.price,
      status: subscription.status,
      startDate: subscription.startDate,
      nextDeliveryDate: subscription.nextDeliveryDate,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      items: subscription.subscriptionItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        menuItem: item.menuItem
      })),
      recentOrders: subscription.orders.map(order => ({
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
    }));

    res.status(200).json({ subscriptions: transformedSubscriptions });
  } catch (error) {
    console.error('User subscriptions API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscriptions';
    res.status(500).json({ 
      message: 'Failed to fetch subscriptions', 
      error: errorMessage 
    });
  }
}
