import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { OrderStats } from '@/types/admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderStats | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    // Calculate start of today for revenue calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch order counts by status and today's revenue in parallel
    const [
      pendingCount,
      inProgressCount,
      deliveredCount,
      cancelledCount,
      todayRevenue,
    ] = await Promise.all([
      prisma.order.count({
        where: { status: 'PENDING' }
      }),
      prisma.order.count({
        where: { status: 'IN_PROGRESS' }
      }),
      prisma.order.count({
        where: { status: 'DELIVERED' }
      }),
      prisma.order.count({
        where: { status: 'CANCELLED' }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { in: ['DELIVERED', 'IN_PROGRESS', 'PENDING'] }
        },
        _sum: { totalPrice: true }
      }),
    ]);

    const stats: OrderStats = {
      pending: pendingCount,
      inProgress: inProgressCount,
      delivered: deliveredCount,
      cancelled: cancelledCount,
      revenueToday: Number(todayRevenue._sum.totalPrice || 0),
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Order stats API error:', error);

    return res.status(500).json({
      message: 'Failed to fetch order statistics'
    });
  }
}
