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

    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    // Fetch order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id,
        // Only allow users to see their own orders unless they're admin
        ...(user.role !== 'ADMIN' && { userId: user.id })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                category: true
              }
            }
          }
        },
        subscription: {
          select: {
            id: true,
            planName: true,
            interval: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Transform for OrderTracker component format
    const transformedOrder = {
      id: order.id,
      orderNumber: `#${order.id.slice(-6)}`,
      status: order.status,
      deliveryStatus: order.status === 'IN_PROGRESS' ? 'PREPARING' : 
                     order.status === 'DELIVERED' ? 'DELIVERED' : 'PENDING',
      items: order.orderItems.map(item => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: order.totalPrice,
      estimatedDelivery: order.deliveryDate?.toISOString(),
      actualDelivery: order.status === 'DELIVERED' ? order.updatedAt.toISOString() : undefined,
      deliveryAddress: order.user.address ? {
        street: order.user.address,
        city: 'London', // Would need to parse from address or add fields
        postcode: 'SW1', // Would need to parse from address or add fields
        instructions: order.notes || undefined
      } : undefined,
      driver: undefined, // Would need driver table/relation
      timeline: generateTimeline(order),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    };

    res.status(200).json(transformedOrder);
  } catch (error) {
    console.error('Get order API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order';
    res.status(500).json({ 
      message: 'Failed to fetch order', 
      error: errorMessage 
    });
  }
}

function generateTimeline(order: any) {
  const timeline = [];
  
  // Order placed
  timeline.push({
    id: 'timeline-1',
    status: 'PENDING',
    message: 'Order placed',
    timestamp: order.createdAt.toISOString(),
    isCompleted: true
  });

  // Order confirmed
  if (['PENDING', 'IN_PROGRESS', 'DELIVERED'].includes(order.status)) {
    timeline.push({
      id: 'timeline-2',
      status: 'CONFIRMED',
      message: 'Order confirmed',
      timestamp: new Date(order.createdAt.getTime() + 300000).toISOString(), // +5 minutes
      isCompleted: order.status !== 'PENDING'
    });
  }

  // Preparing
  if (['IN_PROGRESS', 'DELIVERED'].includes(order.status)) {
    timeline.push({
      id: 'timeline-3',
      status: 'PREPARING',
      message: 'Preparing your order',
      timestamp: new Date(order.createdAt.getTime() + 900000).toISOString(), // +15 minutes
      isCompleted: true
    });
  }

  // Out for delivery (if applicable)
  if (order.status === 'DELIVERED') {
    timeline.push({
      id: 'timeline-4',
      status: 'OUT_FOR_DELIVERY',
      message: 'Out for delivery',
      timestamp: new Date(order.updatedAt.getTime() - 1800000).toISOString(), // -30 minutes from delivery
      isCompleted: true
    });
  }

  // Delivered
  if (order.status === 'DELIVERED') {
    timeline.push({
      id: 'timeline-5',
      status: 'DELIVERED',
      message: 'Order delivered',
      timestamp: order.updatedAt.toISOString(),
      isCompleted: true
    });
  }

  // Cancelled
  if (order.status === 'CANCELLED') {
    timeline.push({
      id: 'timeline-cancelled',
      status: 'CANCELLED',
      message: 'Order cancelled',
      timestamp: order.updatedAt.toISOString(),
      isCompleted: true
    });
  }

  return timeline;
}