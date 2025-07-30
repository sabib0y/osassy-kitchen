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

    // Extract query parameters for pagination and filtering
    const { page = '1', limit = '10', status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get user from database
    const user = await prisma.user.findUnique({ 
      where: { email: token.email } 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build where clause for filtering
    const whereClause: any = { userId: user.id };
    if (status && typeof status === 'string') {
      whereClause.status = status.toUpperCase();
    }

    // Fetch user's orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
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
      subscription: order.subscription ? {
        id: order.subscription.id,
        planName: order.subscription.planName,
        interval: order.subscription.interval,
      } : null,
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
  } catch (error) {
    console.error('User orders API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
    res.status(500).json({ 
      message: 'Failed to fetch orders', 
      error: errorMessage 
    });
  }
}
