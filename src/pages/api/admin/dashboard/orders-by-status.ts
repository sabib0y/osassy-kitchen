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

    // Get order counts by status
    const [pending, confirmed, preparing, delivered, cancelled] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } })
    ]);

    res.status(200).json({
      pending,
      confirmed,
      preparing,
      outForDelivery: 0, // Not in current schema, would need to be added
      delivered,
      cancelled
    });
  } catch (error) {
    console.error('Orders by status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}