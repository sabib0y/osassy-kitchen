import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { startOfDay, endOfDay, format } from 'date-fns';

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

    // Get today's orders
    const today = new Date();
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today)
        },
        status: { not: 'CANCELLED' }
      },
      select: {
        totalPrice: true,
        createdAt: true
      }
    });

    // Group by hour
    const hourlyData: { [hour: string]: { revenue: number; orders: number } } = {};
    
    // Initialize all hours with 0
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      hourlyData[hour] = { revenue: 0, orders: 0 };
    }

    // Aggregate order data by hour
    orders.forEach(order => {
      const hour = format(order.createdAt, 'HH:00');
      if (!hourlyData[hour]) {
        hourlyData[hour] = { revenue: 0, orders: 0 };
      }
      hourlyData[hour].revenue += order.totalPrice;
      hourlyData[hour].orders += 1;
    });

    // Convert to array format
    const hourlyRevenue = Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour,
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    res.status(200).json(hourlyRevenue);
  } catch (error) {
    console.error('Hourly revenue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}