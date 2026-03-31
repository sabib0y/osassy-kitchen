import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

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
    const currentUser = await prisma.user.findUnique({
      where: { email: token.email }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    if (req.method === 'GET') {
      return handleGetUsers(req, res);
    } else if (req.method === 'PATCH') {
      return handleUpdateUserRole(req, res, currentUser.id);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin users API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      message: 'Internal server error',
      error: errorMessage
    });
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
  // Extract query parameters for pagination and filtering
  const {
    page = '1',
    limit = '20',
    role,
    search
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const whereClause: Record<string, unknown> = {};

  if (role && typeof role === 'string' && role !== 'ALL') {
    whereClause.role = role.toUpperCase();
  }

  // Add search functionality
  if (search && typeof search === 'string') {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Calculate date for "new users" (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch users and stats in parallel
  const [users, totalCount, adminCount, newUsersCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
        _count: {
          select: {
            orders: true,
            subscriptions: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum,
    }),
    prisma.user.count({ where: whereClause }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
    stats: {
      totalUsers: totalCount,
      adminCount,
      newUsersCount,
    }
  });
}

async function handleUpdateUserRole(
  req: NextApiRequest,
  res: NextApiResponse,
  currentUserId: string
) {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ message: 'User ID and role are required' });
  }

  // Validate role
  if (!['USER', 'ADMIN'].includes(role.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid role. Must be USER or ADMIN' });
  }

  // Prevent users from changing their own role
  if (userId === currentUserId) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  // Check if target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Update the user's role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: role.toUpperCase() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  });

  res.status(200).json({
    message: 'User role updated successfully',
    user: updatedUser
  });
}
