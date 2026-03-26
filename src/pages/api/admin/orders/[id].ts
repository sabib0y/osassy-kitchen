import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the user from the JWT token
    const token = await getToken({ req });

    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    // Get user from database and check admin role
    const user = await prisma.user.findUnique({
      where: { email: token.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    if (req.method === 'GET') {
      return handleGetOrder(id, res);
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      return handleUpdateOrder(id, req, res);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin order API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message: 'Internal server error', error: errorMessage });
  }
}

async function handleGetOrder(orderId: string, res: NextApiResponse) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Transform for frontend
  const transformedOrder = {
    id: order.id,
    totalPrice: Number(order.totalPrice),
    deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString() : null,
    status: order.status,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    user: order.user,
    subscription: order.subscription,
    items: order.orderItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      menuItem: item.menuItem
    }))
  };

  return res.status(200).json(transformedOrder);
}

async function handleUpdateOrder(orderId: string, req: NextApiRequest, res: NextApiResponse) {
  const { status, notes, deliveryDate } = req.body;

  // Validate status if provided
  const validStatuses = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);

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
    }
  });

  // Transform for frontend
  const transformedOrder = {
    id: updatedOrder.id,
    totalPrice: Number(updatedOrder.totalPrice),
    deliveryDate: updatedOrder.deliveryDate ? updatedOrder.deliveryDate.toISOString() : null,
    status: updatedOrder.status,
    notes: updatedOrder.notes,
    createdAt: updatedOrder.createdAt.toISOString(),
    updatedAt: updatedOrder.updatedAt.toISOString(),
    user: updatedOrder.user,
    subscription: updatedOrder.subscription,
    items: updatedOrder.orderItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      menuItem: item.menuItem
    }))
  };

  return res.status(200).json(transformedOrder);
}
