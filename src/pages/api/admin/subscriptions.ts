import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      return handleGetSubscriptions(req, res);
    } else if (req.method === 'PATCH') {
      return handleUpdateSubscription(req, res);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ 
      message: 'Internal server error', 
      error: errorMessage 
    });
  }
}

async function handleGetSubscriptions(req: NextApiRequest, res: NextApiResponse) {
  // Extract query parameters for pagination and filtering
  const { 
    page = '1', 
    limit = '20', 
    status, 
    userId, 
    interval,
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
  
  if (interval && typeof interval === 'string') {
    whereClause.interval = interval.toUpperCase();
  }

  // Add search functionality
  if (search && typeof search === 'string') {
    whereClause.OR = [
      { planName: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Fetch subscriptions with user and subscription items data
  const [subscriptions, totalCount] = await Promise.all([
    prisma.subscription.findMany({
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
          select: {
            id: true,
            status: true,
            deliveryDate: true,
            totalPrice: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3, // Last 3 orders for each subscription
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    }),
    prisma.subscription.count({ where: whereClause })
  ]);

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
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    user: subscription.user,
    items: subscription.subscriptionItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      menuItem: item.menuItem
    })),
    recentOrders: subscription.orders
  }));

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({ 
    subscriptions: transformedSubscriptions,
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

async function handleUpdateSubscription(req: NextApiRequest, res: NextApiResponse) {
  const { subscriptionId } = req.query;
  const { status, nextDeliveryDate, planName } = req.body;

  if (!subscriptionId || typeof subscriptionId !== 'string') {
    return res.status(400).json({ message: 'Subscription ID is required' });
  }

  // Validate status if provided
  const validStatuses = ['ACTIVE', 'CANCELLED', 'PAUSED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: 'Invalid status', 
      validStatuses 
    });
  }

  // Build update data
  const updateData: any = { updatedAt: new Date() };
  
  if (status) updateData.status = status;
  if (nextDeliveryDate) updateData.nextDeliveryDate = new Date(nextDeliveryDate);
  if (planName) updateData.planName = planName;

  // Update the subscription
  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
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
      subscriptionItems: {
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

  res.status(200).json({ 
    message: 'Subscription updated successfully',
    subscription: updatedSubscription 
  });
}
