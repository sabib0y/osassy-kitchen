import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import handler from '@/pages/api/user/favourites';
import prisma from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth/jwt');
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    favourite: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('/api/user/favourites', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    req = {
      method: 'GET',
      query: {},
      body: {},
    };

    res = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetToken.mockResolvedValue(null);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorised',
      });
    });

    it('should allow authenticated users to access the endpoint', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      (prisma.favourite.findMany as jest.Mock).mockResolvedValue([]);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('GET /api/user/favourites', () => {
    beforeEach(() => {
      req.method = 'GET';
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);
    });

    it('should return empty array when user has no favourites', async () => {
      (prisma.favourite.findMany as jest.Mock).mockResolvedValue([]);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should return array of favourite menu item IDs', async () => {
      const mockFavourites = [
        { id: 'fav-1', userId: 'user-123', menuItemId: 'item-1', createdAt: new Date() },
        { id: 'fav-2', userId: 'user-123', menuItemId: 'item-2', createdAt: new Date() },
        { id: 'fav-3', userId: 'user-123', menuItemId: 'item-3', createdAt: new Date() },
      ];

      (prisma.favourite.findMany as jest.Mock).mockResolvedValue(mockFavourites);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(prisma.favourite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: { menuItemId: true },
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: ['item-1', 'item-2', 'item-3'],
      });
    });

    it('should handle database errors gracefully', async () => {
      (prisma.favourite.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch favourites',
      });
    });
  });

  describe('POST /api/user/favourites', () => {
    beforeEach(() => {
      req.method = 'POST';
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);
    });

    it('should add a menu item to favourites', async () => {
      req.body = { menuItemId: 'item-1' };

      const mockFavourite = {
        id: 'fav-1',
        userId: 'user-123',
        menuItemId: 'item-1',
        createdAt: new Date(),
      };

      (prisma.favourite.create as jest.Mock).mockResolvedValue(mockFavourite);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(prisma.favourite.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          menuItemId: 'item-1',
        },
      });

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { menuItemId: 'item-1' },
      });
    });

    it('should return 400 if menuItemId is missing', async () => {
      req.body = {};

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'menuItemId is required',
      });
      expect(prisma.favourite.create).not.toHaveBeenCalled();
    });

    it('should return 400 if menuItemId is invalid', async () => {
      req.body = { menuItemId: '' };

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'menuItemId is required',
      });
    });

    it('should handle duplicate favourites gracefully', async () => {
      req.body = { menuItemId: 'item-1' };

      const duplicateError = new Error('Unique constraint failed');
      (duplicateError as any).code = 'P2002';

      (prisma.favourite.create as jest.Mock).mockRejectedValue(duplicateError);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Item is already in favourites',
      });
    });

    it('should handle database errors', async () => {
      req.body = { menuItemId: 'item-1' };

      (prisma.favourite.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to add favourite',
      });
    });
  });

  describe('DELETE /api/user/favourites', () => {
    beforeEach(() => {
      req.method = 'DELETE';
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);
    });

    it('should remove a menu item from favourites', async () => {
      req.body = { menuItemId: 'item-1' };

      (prisma.favourite.delete as jest.Mock).mockResolvedValue({
        id: 'fav-1',
        userId: 'user-123',
        menuItemId: 'item-1',
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(prisma.favourite.delete).toHaveBeenCalledWith({
        where: {
          userId_menuItemId: {
            userId: 'user-123',
            menuItemId: 'item-1',
          },
        },
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { menuItemId: 'item-1' },
      });
    });

    it('should return 400 if menuItemId is missing', async () => {
      req.body = {};

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'menuItemId is required',
      });
      expect(prisma.favourite.delete).not.toHaveBeenCalled();
    });

    it('should handle non-existent favourites gracefully', async () => {
      req.body = { menuItemId: 'item-1' };

      const notFoundError = new Error('Record not found');
      (notFoundError as any).code = 'P2025';

      (prisma.favourite.delete as jest.Mock).mockRejectedValue(notFoundError);

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Favourite not found',
      });
    });

    it('should handle database errors', async () => {
      req.body = { menuItemId: 'item-1' };

      (prisma.favourite.delete as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to remove favourite',
      });
    });
  });

  describe('Unsupported HTTP methods', () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);
    });

    it('should return 405 for PUT requests', async () => {
      req.method = 'PUT';

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed',
      });
    });

    it('should return 405 for PATCH requests', async () => {
      req.method = 'PATCH';

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed',
      });
    });
  });
});
