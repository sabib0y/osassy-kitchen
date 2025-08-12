import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const token = await getToken({ req });
    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check admin role
    const user = await prisma.user.findUnique({ 
      where: { email: token.email } 
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    // Fetch recent orders
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        orderItems: {
          select: {
            id: true
          }
        }
      }
    });

    // Transform to the expected format
    const recentOrders = orders.map(order => ({
      id: order.id,
      orderNumber: `#${order.id.slice(-6)}`,
      customerName: order.user.name || order.user.email || 'Customer',
      amount: order.totalPrice,
      status: order.status,
      timestamp: order.createdAt.toISOString(),
      items: order.orderItems.length
    }));

    res.status(200).json(recentOrders);
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}