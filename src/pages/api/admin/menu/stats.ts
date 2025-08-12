import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { MenuStats } from '@/types/admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Admin access required',
      });
    }

    if (req.method === 'GET') {
      // Get menu statistics
      const [
        totalItems,
        availableItems,
        categories,
        averagePriceResult
      ] = await Promise.all([
        // Total menu items
        prisma.menuItem.count(),
        
        // Available menu items
        prisma.menuItem.count({
          where: { available: true }
        }),
        
        // Distinct categories
        prisma.menuItem.findMany({
          select: { category: true },
          distinct: ['category']
        }),
        
        // Average price
        prisma.menuItem.aggregate({
          _avg: { price: true }
        })
      ]);

      const stats: MenuStats = {
        totalItems,
        availableItems,
        totalCategories: categories.length,
        averagePrice: averagePriceResult._avg.price || 0,
      };

      return res.status(200).json({
        success: true,
        data: stats,
      });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error('Menu stats API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}