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
      return handleGetMenuItems(req, res);
    } else if (req.method === 'POST') {
      return handleCreateMenuItem(req, res);
    } else if (req.method === 'PATCH') {
      return handleUpdateMenuItem(req, res);
    } else if (req.method === 'DELETE') {
      return handleDeleteMenuItem(req, res);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin menu items API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ 
      message: 'Internal server error', 
      error: errorMessage 
    });
  }
}

async function handleGetMenuItems(req: NextApiRequest, res: NextApiResponse) {
  // Extract query parameters for pagination and filtering
  const { 
    page = '1', 
    limit = '20', 
    category, 
    available,
    search 
  } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const whereClause: any = {};
  
  if (category && typeof category === 'string') {
    whereClause.category = { contains: category, mode: 'insensitive' };
  }
  
  if (available !== undefined) {
    whereClause.available = available === 'true';
  }

  // Add search functionality
  if (search && typeof search === 'string') {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Fetch menu items with usage statistics
  const [menuItems, totalCount] = await Promise.all([
    prisma.menuItem.findMany({
      where: whereClause,
      include: {
        subscriptionItems: {
          include: {
            subscription: {
              select: {
                status: true,
              }
            }
          }
        },
        orderItems: {
          select: {
            quantity: true,
            order: {
              select: {
                status: true,
                createdAt: true,
              }
            }
          }
        },
        _count: {
          select: {
            subscriptionItems: true,
            orderItems: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    }),
    prisma.menuItem.count({ where: whereClause })
  ]);

  // Transform the data to include usage statistics
  const transformedMenuItems = menuItems.map(item => {
    const activeSubscriptions = item.subscriptionItems.filter(
      sub => sub.subscription.status === 'ACTIVE'
    ).length;

    const totalOrders = item.orderItems.length;
    const recentOrders = item.orderItems.filter(orderItem => {
      const orderDate = new Date(orderItem.order.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= thirtyDaysAgo;
    }).length;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
      available: item.available,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      statistics: {
        activeSubscriptions,
        totalOrders,
        recentOrders,
        totalSubscriptionItems: item._count.subscriptionItems,
        totalOrderItems: item._count.orderItems,
      }
    };
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({ 
    menuItems: transformedMenuItems,
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

async function handleCreateMenuItem(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, price, imageUrl, category, available = true } = req.body;

  // Validate required fields
  if (!name || !description || price === undefined || !category) {
    return res.status(400).json({ 
      message: 'Missing required fields: name, description, price, category' 
    });
  }

  // Validate price is a positive number
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ 
      message: 'Price must be a positive number' 
    });
  }

  // Check if menu item with same name already exists
  const existingItem = await prisma.menuItem.findUnique({
    where: { name }
  });

  if (existingItem) {
    return res.status(400).json({ 
      message: 'Menu item with this name already exists' 
    });
  }

  // Create the menu item
  const menuItem = await prisma.menuItem.create({
    data: {
      name,
      description,
      price,
      imageUrl: imageUrl || null,
      category,
      available,
    },
  });

  res.status(201).json({ 
    message: 'Menu item created successfully',
    menuItem 
  });
}

async function handleUpdateMenuItem(req: NextApiRequest, res: NextApiResponse) {
  const { menuItemId } = req.query;
  const { name, description, price, imageUrl, category, available } = req.body;

  if (!menuItemId || typeof menuItemId !== 'string') {
    return res.status(400).json({ message: 'Menu item ID is required' });
  }

  // Validate price if provided
  if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
    return res.status(400).json({ 
      message: 'Price must be a positive number' 
    });
  }

  // Check if menu item exists
  const existingItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId }
  });

  if (!existingItem) {
    return res.status(404).json({ message: 'Menu item not found' });
  }

  // If name is being updated, check for conflicts
  if (name && name !== existingItem.name) {
    const nameConflict = await prisma.menuItem.findUnique({
      where: { name }
    });

    if (nameConflict) {
      return res.status(400).json({ 
        message: 'Menu item with this name already exists' 
      });
    }
  }

  // Build update data
  const updateData: any = { updatedAt: new Date() };
  
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (category) updateData.category = category;
  if (available !== undefined) updateData.available = available;

  // Update the menu item
  const updatedMenuItem = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: updateData,
  });

  res.status(200).json({ 
    message: 'Menu item updated successfully',
    menuItem: updatedMenuItem 
  });
}

async function handleDeleteMenuItem(req: NextApiRequest, res: NextApiResponse) {
  const { menuItemId } = req.query;

  if (!menuItemId || typeof menuItemId !== 'string') {
    return res.status(400).json({ message: 'Menu item ID is required' });
  }

  // Check if menu item exists
  const existingItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: {
      subscriptionItems: {
        include: {
          subscription: {
            select: { status: true }
          }
        }
      },
      orderItems: true,
    }
  });

  if (!existingItem) {
    return res.status(404).json({ message: 'Menu item not found' });
  }

  // Check if item is used in active subscriptions
  const activeSubscriptions = existingItem.subscriptionItems.filter(
    item => item.subscription.status === 'ACTIVE'
  );

  if (activeSubscriptions.length > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete menu item that is part of active subscriptions',
      activeSubscriptionsCount: activeSubscriptions.length
    });
  }

  // Soft delete by setting available to false instead of hard delete
  // This preserves historical order data
  const updatedMenuItem = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: { 
      available: false,
      updatedAt: new Date(),
    },
  });

  res.status(200).json({ 
    message: 'Menu item deactivated successfully (soft delete)',
    menuItem: updatedMenuItem 
  });
}
