import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';
import { MenuItem, UpdateMenuItemData } from '@/types/admin';

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

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Menu item ID is required',
      });
    }

    if (req.method === 'GET') {
      // Get single menu item
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              subscriptionItems: true,
            },
          },
        },
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: transformMenuItem(menuItem),
      });
    }

    if (req.method === 'PUT') {
      // Update menu item
      const data: UpdateMenuItemData = req.body;

      // Check if menu item exists
      const existingItem = await prisma.menuItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found',
        });
      }

      // If name is being changed, check for uniqueness
      if (data.name && data.name !== existingItem.name) {
        const duplicateName = await prisma.menuItem.findUnique({
          where: { name: data.name },
        });

        if (duplicateName) {
          return res.status(400).json({
            success: false,
            error: 'Menu item with this name already exists',
          });
        }
      }

      // If image is being changed, delete the old one from Cloudinary
      if (data.imagePublicId !== existingItem.imagePublicId && existingItem.imagePublicId) {
        try {
          await deleteImage(existingItem.imagePublicId);
        } catch (error) {
          console.error('Failed to delete old image from Cloudinary:', error);
          // Continue with update even if image deletion fails
        }
      }

      // Update menu item
      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description && { description: data.description }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.category && { category: data.category }),
          ...(data.available !== undefined && { available: data.available }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.imagePublicId !== undefined && { imagePublicId: data.imagePublicId }),
          ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        },
        include: {
          _count: {
            select: {
              subscriptionItems: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: transformMenuItem(updatedItem),
      });
    }

    if (req.method === 'DELETE') {
      // Delete menu item
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              subscriptionItems: true,
              orderItems: true,
            },
          },
        },
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found',
        });
      }

      // Check if menu item is in use
      const isInUse = menuItem._count.subscriptionItems > 0 || menuItem._count.orderItems > 0;
      if (isInUse) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete menu item that is currently in use in subscriptions or orders',
        });
      }

      // Delete image from Cloudinary if it exists
      if (menuItem.imagePublicId) {
        try {
          await deleteImage(menuItem.imagePublicId);
        } catch (error) {
          console.error('Failed to delete image from Cloudinary:', error);
          // Continue with deletion even if image deletion fails
        }
      }

      // Delete menu item from database
      await prisma.menuItem.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully',
      });
    }

    if (req.method === 'PATCH') {
      // Toggle availability
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found',
        });
      }

      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: {
          available: !menuItem.available,
        },
        include: {
          _count: {
            select: {
              subscriptionItems: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: transformMenuItem(updatedItem),
      });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'PATCH']);
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