import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import { broadcastOrderUpdate, getWebSocketServer } from '@/lib/websocket';
import { EventType, EventCategory, OrderStatus } from '@/types/websocket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the user from the JWT token
    const token = await getToken({ req });
    
    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user from database and check admin role
    const user = await prisma.user.findUnique({ 
      where: { email: token.email } 
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    if (req.method === 'GET') {
      return handleGetOrders(req, res);
    } else if (req.method === 'PATCH') {
      return handleUpdateOrder(req, res);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin orders API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ 
      message: 'Internal server error', 
      error: errorMessage 
    });
  }
}

async function handleGetOrders(req: NextApiRequest, res: NextApiResponse) {
  // Extract query parameters for pagination and filtering
  const { 
    page = '1', 
    limit = '20', 
    status, 
    userId, 
    startDate, 
    endDate,
    search 
  } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const whereClause: any = {};
  
  if (status && typeof status === 'string') {
    whereClause.status = status.toUpperCase();
  }
  
  if (userId && typeof userId === 'string') {
    whereClause.userId = userId;
  }
  
  if (startDate && typeof startDate === 'string') {
    whereClause.deliveryDate = { ...whereClause.deliveryDate, gte: new Date(startDate) };
  }
  
  if (endDate && typeof endDate === 'string') {
    whereClause.deliveryDate = { ...whereClause.deliveryDate, lte: new Date(endDate) };
  }

  // Add search functionality
  if (search && typeof search === 'string') {
    whereClause.OR = [
      { notes: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Fetch orders with user and order items data
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
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
                category: true,
              }
            }
          }
        },
        subscription: {
          select: {
            id: true,
            planName: true,
            interval: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    }),
    prisma.order.count({ where: whereClause })
  ]);

  // Transform the data for frontend consumption
  const transformedOrders = orders.map(order => ({
    id: order.id,
    totalPrice: order.totalPrice,
    deliveryDate: order.deliveryDate,
    status: order.status,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user: order.user,
    subscription: order.subscription,
    items: order.orderItems.map(orderItem => ({
      id: orderItem.id,
      quantity: orderItem.quantity,
      price: orderItem.price,
      menuItem: orderItem.menuItem
    }))
  }));

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({ 
    orders: transformedOrders,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
      limit: limitNum,
    }
  });
}

async function handleUpdateOrder(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;
  const { status, notes, deliveryDate } = req.body;

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  // Get the previous order state for comparison
  const previousOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true }
  });

  if (!previousOrder) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Validate status if provided
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: 'Invalid status', 
      validStatuses 
    });
  }

  // Build update data
  const updateData: any = { updatedAt: new Date() };
  
  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);

  // Update the order
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
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
  });

  // Broadcast order update via WebSocket
  try {
    const wsServer = getWebSocketServer({
      jwtSecret: process.env.NEXTAUTH_SECRET || ''
    });

    // Determine event type based on status change
    let eventType = EventType.ORDER_UPDATED;
    if (status) {
      switch (status) {
        case 'DELIVERED':
          eventType = EventType.ORDER_DELIVERED;
          break;
        case 'CANCELLED':
          eventType = EventType.ORDER_CANCELLED;
          break;
        case 'IN_PROGRESS':
          eventType = EventType.ORDER_STATUS_CHANGED;
          break;
      }
    }

    // Broadcast the update
    broadcastOrderUpdate(orderId, {
      orderId,
      orderNumber: `#${orderId.slice(-6)}`,
      data: {
        status: updatedOrder.status as OrderStatus,
        customerName: updatedOrder.user.name || 'Customer',
        totalAmount: updatedOrder.totalPrice,
        itemCount: updatedOrder.orderItems.length,
        deliveryDate: updatedOrder.deliveryDate,
        notes: updatedOrder.notes
      },
      previousStatus: previousOrder.status as OrderStatus,
      timestamp: new Date().toISOString(),
      timeline: [
        {
          id: `timeline-${Date.now()}`,
          status: updatedOrder.status,
          message: `Order ${status ? `status changed to ${status}` : 'updated'}`,
          timestamp: new Date().toISOString(),
          isCompleted: true
        }
      ]
    });

    // Send notification to the user
    if (status && updatedOrder.user.id) {
      wsServer.sendToUser(updatedOrder.user.id, {
        id: `notification-${Date.now()}`,
        type: EventType.NOTIFICATION_NEW,
        category: EventCategory.NOTIFICATION,
        payload: {
          id: `notif-${Date.now()}`,
          type: status === 'CANCELLED' ? 'error' : 'info',
          title: 'Order Update',
          message: `Your order #${orderId.slice(-6)} has been ${status.toLowerCase()}`,
          actionUrl: `/orders/${orderId}`,
          actionText: 'View Order',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to broadcast order update:', error);
    // Continue even if WebSocket broadcast fails
  }

  res.status(200).json({ 
    message: 'Order updated successfully',
    order: updatedOrder 
  });
}
