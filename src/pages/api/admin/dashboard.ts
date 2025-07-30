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

    // Calculate date ranges for analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get comprehensive dashboard statistics
    const [
      totalUsers,
      totalActiveSubscriptions,
      totalOrders,
      totalMenuItems,
      recentUsers,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      ordersByStatus,
      subscriptionsByStatus,
      topMenuItems,
      recentOrders,
      subscriptionTrends,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.menuItem.count({ where: { available: true } }),
      
      // New users in last 30 days
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // Revenue calculations (last 30 days)
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['DELIVERED', 'IN_PROGRESS'] }
        },
        _sum: { totalPrice: true }
      }),
      
      // Revenue calculations (last 7 days)
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: sevenDaysAgo },
          status: { in: ['DELIVERED', 'IN_PROGRESS'] }
        },
        _sum: { totalPrice: true }
      }),
      
      // Revenue calculations (last 24 hours)
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: yesterday },
          status: { in: ['DELIVERED', 'IN_PROGRESS'] }
        },
        _sum: { totalPrice: true }
      }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { totalPrice: true }
      }),
      
      // Subscriptions by status
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Top menu items (by order frequency in last 30 days)
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: { createdAt: { gte: thirtyDaysAgo } }
        },
        _count: { menuItemId: true },
        _sum: { quantity: true },
        orderBy: { _count: { menuItemId: 'desc' } },
        take: 10
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          orderItems: {
            include: {
              menuItem: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      }),
      
      // Subscription trends (weekly data for last 8 weeks)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', "createdAt") as week,
          COUNT(*) as count,
          status
        FROM "Subscription" 
        WHERE "createdAt" >= ${new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('week', "createdAt"), status
        ORDER BY week DESC
      `,
    ]);

    // Get menu item details for top items
    const topMenuItemIds = topMenuItems.map(item => item.menuItemId);
    const menuItemDetails = await prisma.menuItem.findMany({
      where: { id: { in: topMenuItemIds } },
      select: { id: true, name: true, category: true, price: true }
    });

    // Combine top menu items with their details
    const enrichedTopMenuItems = topMenuItems.map(item => {
      const details = menuItemDetails.find(detail => detail.id === item.menuItemId);
      return {
        ...item,
        menuItem: details
      };
    });

    // Transform recent orders for frontend
    const transformedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      totalPrice: order.totalPrice,
      status: order.status,
      deliveryDate: order.deliveryDate,
      createdAt: order.createdAt,
      user: order.user,
      itemCount: order.orderItems.length,
      items: order.orderItems.map(item => item.menuItem.name).join(', ')
    }));

    // Calculate growth rates
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // For growth calculations, we'd need historical data
    // For now, we'll provide placeholder calculations
    const dashboardData = {
      overview: {
        totalUsers,
        totalActiveSubscriptions,
        totalOrders,
        totalMenuItems,
        recentUsers,
        userGrowthRate: 0, // Would need historical data
        subscriptionGrowthRate: 0, // Would need historical data
      },
      revenue: {
        monthly: monthlyRevenue._sum.totalPrice || 0,
        weekly: weeklyRevenue._sum.totalPrice || 0,
        daily: dailyRevenue._sum.totalPrice || 0,
        monthlyGrowthRate: 0, // Would need historical comparison
        weeklyGrowthRate: 0, // Would need historical comparison
      },
      orders: {
        byStatus: ordersByStatus.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count.status,
            revenue: item._sum.totalPrice || 0
          };
          return acc;
        }, {} as Record<string, { count: number; revenue: number }>),
        recent: transformedRecentOrders,
      },
      subscriptions: {
        byStatus: subscriptionsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        trends: subscriptionTrends,
      },
      menuItems: {
        topPerforming: enrichedTopMenuItems,
        totalAvailable: totalMenuItems,
      },
      analytics: {
        averageOrderValue: totalOrders > 0 
          ? (monthlyRevenue._sum.totalPrice || 0) / totalOrders 
          : 0,
        subscriptionConversionRate: totalUsers > 0 
          ? (totalActiveSubscriptions / totalUsers) * 100 
          : 0,
      }
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Admin dashboard API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    res.status(500).json({ 
      message: 'Failed to fetch dashboard data', 
      error: errorMessage 
    });
  }
}
