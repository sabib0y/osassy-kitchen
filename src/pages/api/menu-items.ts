import { NextApiRequest, NextApiResponse } from 'next';
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
    // Extract query parameters for filtering
    const { category, search } = req.query;

    // Build where clause for filtering
    const whereClause: any = {
      available: true, // Only return available items to customers
    };
    
    if (category && typeof category === 'string' && category !== 'all') {
      whereClause.category = { contains: category, mode: 'insensitive' };
    }

    // Add search functionality
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch available menu items
    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ 
      menuItems,
      total: menuItems.length
    });
  } catch (error) {
    console.error('Menu items API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ 
      message: 'Failed to fetch menu items', 
      error: errorMessage 
    });
  }
}