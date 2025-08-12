import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

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

    // Get date ranges
    const today = new Date();
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);
    const lastMonth = subDays(today, 30);

    // Fetch current metrics
    const [
      todayRevenue,
      yesterdayRevenue,
      todayOrders,
      yesterdayOrders,
      activeUsers,
      activeSubscriptions,
      recentOrders
    ] = await Promise.all([
      // Today's revenue
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfDay(today),
            lte: endOfDay(today)
          },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalPrice: true }
      }),
      
      // Yesterday's revenue
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfDay(yesterday),
            lte: endOfDay(yesterday)
          },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalPrice: true }
      }),
      
      // Today's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay(today),
            lte: endOfDay(today)
          }
        }
      }),
      
      // Yesterday's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay(yesterday),
            lte: endOfDay(yesterday)
          }
        }
      }),
      
      // Active users (users who ordered in last 30 days)
      prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: { gte: lastMonth }
            }
          }
        }
      }),
      
      // Active subscriptions
      prisma.subscription.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      
      // Recent orders for average calculation
      prisma.order.findMany({
        where: {
          createdAt: { gte: lastWeek },
          status: { not: 'CANCELLED' }
        },
        select: { totalPrice: true }
      })
    ]);

    // Calculate metrics
    const totalRevenue = todayRevenue._sum.totalPrice || 0;
    const previousRevenue = yesterdayRevenue._sum.totalPrice || 0;
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const totalOrders = todayOrders;
    const previousOrders = yesterdayOrders;
    const ordersChange = previousOrders > 0 
      ? ((totalOrders - previousOrders) / previousOrders) * 100 
      : 0;

    // Calculate average order value
    const averageOrderValue = recentOrders.length > 0
      ? recentOrders.reduce((sum, order) => sum + order.totalPrice, 0) / recentOrders.length
      : 0;

    // Calculate conversion rate (simplified - orders / active users)
    const conversionRate = activeUsers > 0 ? (totalOrders / activeUsers) * 100 : 0;

    // Get previous period metrics for comparison
    const previousActiveUsers = await prisma.user.count({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: subDays(today, 60),
              lte: lastMonth
            }
          }
        }
      }
    });

    const usersChange = previousActiveUsers > 0
      ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100
      : 0;

    const previousSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: lastWeek }
      }
    });

    const subscriptionsChange = previousSubscriptions > 0
      ? ((activeSubscriptions - previousSubscriptions) / previousSubscriptions) * 100
      : 0;

    res.status(200).json({
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      activeUsers,
      usersChange,
      averageOrderValue,
      aovChange: 0, // Would need historical data to calculate
      conversionRate,
      conversionChange: 0, // Would need historical data to calculate
      activeSubscriptions,
      subscriptionsChange
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}