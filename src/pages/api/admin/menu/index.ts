import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';
import { MenuItem, CreateMenuItemData, PaginatedResponse } from '@/types/admin';

// Helper function to transform Prisma MenuItem to API MenuItem
const transformMenuItem = (item: any): MenuItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  category: item.category,
  imageUrl: item.imageUrl,
  imagePublicId: item.imagePublicId,
  thumbnailUrl: item.thumbnailUrl,
  available: item.available,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  subscriptionUsage: item._count?.subscriptionItems || 0,
});

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
      // Get menu items with filters and pagination
      const {
        search,
        category,
        availability,
        page = '1',
        limit = '12'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category && category !== '') {
        where.category = category;
      }

      if (availability && availability !== '') {
        where.available = availability === 'available';
      }

      // Get total count
      const total = await prisma.menuItem.count({ where });

      // Get menu items
      const items = await prisma.menuItem.findMany({
        where,
        include: {
          _count: {
            select: {
              subscriptionItems: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      });

      const response: PaginatedResponse<MenuItem> = {
        data: items.map(transformMenuItem),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      };

      return res.status(200).json({
        success: true,
        data: response,
      });
    }

    if (req.method === 'POST') {
      // Create new menu item
      const data: CreateMenuItemData = req.body;

      // Validate required fields
      if (!data.name || !data.description || !data.price || !data.category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description, price, category',
        });
      }

      // Check if menu item name already exists
      const existingItem = await prisma.menuItem.findUnique({
        where: { name: data.name },
      });

      if (existingItem) {
        return res.status(400).json({
          success: false,
          error: 'Menu item with this name already exists',
        });
      }

      // Create menu item
      const menuItem = await prisma.menuItem.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          available: data.available ?? true,
          imageUrl: data.imageUrl,
          imagePublicId: data.imagePublicId,
          thumbnailUrl: data.thumbnailUrl,
        },
        include: {
          _count: {
            select: {
              subscriptionItems: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: transformMenuItem(menuItem),
      });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error('Menu API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}