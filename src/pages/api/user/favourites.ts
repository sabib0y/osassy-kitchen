import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Authenticate user
  const token = await getToken({ req });
  if (!token || !token.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorised',
    });
  }

  const userId = token.sub;

  try {
    switch (req.method) {
      case 'GET':
        return await getFavourites(userId, res);
      case 'POST':
        return await addFavourite(userId, req, res);
      case 'DELETE':
        return await removeFavourite(userId, req, res);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('Favourites API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * GET /api/user/favourites
 * Fetches all favourite menu item IDs for the authenticated user
 */
async function getFavourites(userId: string, res: NextApiResponse) {
  try {
    const favourites = await prisma.favourite.findMany({
      where: { userId },
      select: { menuItemId: true },
    });

    // Extract just the menu item IDs
    const menuItemIds = favourites.map((fav) => fav.menuItemId);

    return res.status(200).json({
      success: true,
      data: menuItemIds,
    });
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch favourites',
    });
  }
}

/**
 * POST /api/user/favourites
 * Adds a menu item to user's favourites
 */
async function addFavourite(
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { menuItemId } = req.body;

  // Validate input
  if (!menuItemId || typeof menuItemId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'menuItemId is required',
    });
  }

  try {
    await prisma.favourite.create({
      data: {
        userId,
        menuItemId,
      },
    });

    return res.status(201).json({
      success: true,
      data: { menuItemId },
    });
  } catch (error: any) {
    // Handle unique constraint violation (duplicate favourite)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Item is already in favourites',
      });
    }

    console.error('Error adding favourite:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add favourite',
    });
  }
}

/**
 * DELETE /api/user/favourites
 * Removes a menu item from user's favourites
 */
async function removeFavourite(
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { menuItemId } = req.body;

  // Validate input
  if (!menuItemId || typeof menuItemId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'menuItemId is required',
    });
  }

  try {
    await prisma.favourite.delete({
      where: {
        userId_menuItemId: {
          userId,
          menuItemId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: { menuItemId },
    });
  } catch (error: any) {
    // Handle record not found
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Favourite not found',
      });
    }

    console.error('Error removing favourite:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove favourite',
    });
  }
}
