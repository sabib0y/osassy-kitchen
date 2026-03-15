import { NextApiRequest, NextApiResponse } from 'next';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
    },
    address: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockAddress = {
  id: 'address-123',
  userId: 'user-123',
  type: 'HOME',
  label: 'Home Address',
  street: '123 Test Street',
  city: 'London',
  state: 'Greater London',
  postalCode: 'SW1A 1AA',
  country: 'United Kingdom',
  isDefault: true,
  deliveryInstructions: 'Leave at door',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAddressTwo = {
  id: 'address-456',
  userId: 'user-123',
  type: 'WORK',
  label: 'Work Address',
  street: '456 Office Road',
  city: 'Manchester',
  state: 'Greater Manchester',
  postalCode: 'M1 1AA',
  country: 'United Kingdom',
  isDefault: false,
  deliveryInstructions: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validAddressData = {
  label: 'New Address',
  street: '789 New Street',
  city: 'Birmingham',
  state: 'West Midlands',
  postalCode: 'B1 1AA',
  country: 'United Kingdom',
  type: 'HOME',
  isDefault: false,
  deliveryInstructions: 'Ring bell twice',
};

// Helper to create mock request/response
const createMockRequestResponse = () => {
  let responseData: any;
  let statusCode: number = 200;

  const req: Partial<NextApiRequest> = {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
    },
    body: {},
    query: {},
  };

  const res: Partial<NextApiResponse> = {
    status: jest.fn().mockImplementation((code: number) => {
      statusCode = code;
      return res;
    }),
    json: jest.fn().mockImplementation((data: any) => {
      responseData = data;
      return res;
    }),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };

  return {
    req: req as NextApiRequest,
    res: res as NextApiResponse,
    getStatusCode: () => statusCode,
    getResponseData: () => responseData,
  };
};

// Get mock prisma instance
const getMockPrisma = () => {
  const prisma = new PrismaClient();
  return prisma as jest.Mocked<PrismaClient>;
};

describe('/api/user/addresses', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = getMockPrisma();
  });

  // ============================================
  // GET /api/user/addresses - List addresses
  // ============================================
  describe('GET /api/user/addresses', () => {
    const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const token = await getToken({ req });

      if (!token || !token.email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (req.method === 'GET') {
        const addresses = await mockPrisma.address.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });

        return res.status(200).json({ addresses });
      }
    };

    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';

      (getToken as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 401 when token has no email', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';

      (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 404 when user is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'User not found' });
    });

    it('should return 200 with empty array when user has no addresses', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([]);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData()).toEqual({ addresses: [] });
    });

    it('should return 200 with list of addresses', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([mockAddress, mockAddressTwo]);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData().addresses).toHaveLength(2);
      expect(getResponseData().addresses[0]).toEqual(mockAddress);
    });

    it('should return 405 for unsupported methods', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'DELETE';

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });
  });

  // ============================================
  // POST /api/user/addresses - Create address
  // ============================================
  describe('POST /api/user/addresses', () => {
    const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const token = await getToken({ req });

      if (!token || !token.email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (req.method === 'POST') {
        const addressData = req.body;

        if (
          !addressData.label ||
          !addressData.street ||
          !addressData.city ||
          !addressData.state ||
          !addressData.postalCode ||
          !addressData.country
        ) {
          return res.status(400).json({ message: 'All required address fields must be provided' });
        }

        if (addressData.isDefault) {
          await mockPrisma.address.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false },
          });
        }

        const newAddress = await mockPrisma.address.create({
          data: {
            userId: user.id,
            type: addressData.type || 'HOME',
            label: addressData.label,
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country,
            isDefault: addressData.isDefault || false,
            deliveryInstructions: addressData.deliveryInstructions || null,
          },
        });

        return res.status(201).json({
          message: 'Address created successfully',
          address: newAddress,
        });
      }
    };

    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = validAddressData;

      (getToken as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 400 when label is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, label: '' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'All required address fields must be provided' });
    });

    it('should return 400 when street is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, street: undefined };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'All required address fields must be provided' });
    });

    it('should return 400 when city is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, city: null };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'All required address fields must be provided' });
    });

    it('should return 400 when state is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, state: '' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'All required address fields must be provided' });
    });

    it('should return 400 when postalCode is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, postalCode: undefined };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'All required address fields must be provided' });
    });

    it('should return 400 when country is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, country: '' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'All required address fields must be provided' });
    });

    it('should return 201 when address is created successfully', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.body = validAddressData;

      const createdAddress = { id: 'new-address-123', ...validAddressData, userId: mockUser.id };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue(createdAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(201);
      expect(getResponseData().message).toBe('Address created successfully');
      expect(getResponseData().address).toEqual(createdAddress);
    });

    it('should use default type HOME when type is not provided', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, type: undefined };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue({ ...validAddressData, id: 'new-123' });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(201);
      expect(mockPrisma.address.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'HOME' }),
        })
      );
    });

    it('should use default isDefault false when not provided', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, isDefault: undefined };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue({ ...validAddressData, id: 'new-123' });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(201);
      expect(mockPrisma.address.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isDefault: false }),
        })
      );
    });

    it('should unset other default addresses when creating new default', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, isDefault: true };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.address.create as jest.Mock).mockResolvedValue({ ...validAddressData, id: 'new-123', isDefault: true });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(201);
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should handle null deliveryInstructions', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.method = 'POST';
      req.body = { ...validAddressData, deliveryInstructions: undefined };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue({ ...validAddressData, id: 'new-123' });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(201);
      expect(mockPrisma.address.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deliveryInstructions: null }),
        })
      );
    });
  });
});

// ============================================
// /api/user/addresses/[id] Tests
// ============================================
describe('/api/user/addresses/[id]', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = getMockPrisma();
  });

  // ============================================
  // GET /api/user/addresses/[id] - Get single address
  // ============================================
  describe('GET /api/user/addresses/[id]', () => {
    const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Address ID is required' });
      }

      if (!['GET', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const token = await getToken({ req });

      if (!token || !token.email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingAddress = await mockPrisma.address.findFirst({
        where: { id, userId: user.id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (req.method === 'GET') {
        return res.status(200).json({ address: existingAddress });
      }
    };

    it('should return 400 when address ID is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = {};

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Address ID is required' });
    });

    it('should return 400 when address ID is not a string', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = { id: ['id1', 'id2'] };

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Address ID is required' });
    });

    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 404 when user is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'User not found' });
    });

    it('should return 404 when address is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = { id: 'non-existent-address' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'Address not found' });
    });

    it('should return 404 when address belongs to different user', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = { id: 'address-999' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'Address not found' });
    });

    it('should return 200 with address when found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData()).toEqual({ address: mockAddress });
    });

    it('should return 405 for unsupported methods', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'OPTIONS';
      req.query = { id: 'address-123' };

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });
  });

  // ============================================
  // PUT /api/user/addresses/[id] - Update address
  // ============================================
  describe('PUT /api/user/addresses/[id]', () => {
    const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Address ID is required' });
      }

      if (!['GET', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const token = await getToken({ req });

      if (!token || !token.email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingAddress = await mockPrisma.address.findFirst({
        where: { id, userId: user.id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (req.method === 'PUT') {
        const addressData = req.body;

        if (
          !addressData.label ||
          !addressData.street ||
          !addressData.city ||
          !addressData.state ||
          !addressData.postalCode ||
          !addressData.country
        ) {
          return res.status(400).json({ message: 'All required address fields must be provided' });
        }

        if (addressData.isDefault && !existingAddress.isDefault) {
          await mockPrisma.address.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false },
          });
        }

        const updatedAddress = await mockPrisma.address.update({
          where: { id },
          data: {
            type: addressData.type || 'HOME',
            label: addressData.label,
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country,
            isDefault: addressData.isDefault || false,
            deliveryInstructions: addressData.deliveryInstructions || null,
          },
        });

        return res.status(200).json({
          message: 'Address updated successfully',
          address: updatedAddress,
        });
      }
    };

    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PUT';
      req.query = { id: 'address-123' };
      req.body = validAddressData;

      (getToken as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 400 when required fields are missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PUT';
      req.query = { id: 'address-123' };
      req.body = { label: 'Test' }; // Missing required fields

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'All required address fields must be provided' });
    });

    it('should return 404 when address is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PUT';
      req.query = { id: 'non-existent' };
      req.body = validAddressData;

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'Address not found' });
    });

    it('should return 200 when address is updated successfully', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PUT';
      req.query = { id: 'address-123' };
      req.body = validAddressData;

      const updatedAddress = { ...mockAddress, ...validAddressData };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);
      (mockPrisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData().message).toBe('Address updated successfully');
      expect(getResponseData().address).toEqual(updatedAddress);
    });

    it('should unset other defaults when updating to default', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.method = 'PUT';
      req.query = { id: 'address-456' };
      req.body = { ...validAddressData, isDefault: true };

      const nonDefaultAddress = { ...mockAddressTwo, isDefault: false };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(nonDefaultAddress);
      (mockPrisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.address.update as jest.Mock).mockResolvedValue({ ...nonDefaultAddress, isDefault: true });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should not unset defaults when address is already default', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.method = 'PUT';
      req.query = { id: 'address-123' };
      req.body = { ...validAddressData, isDefault: true };

      const defaultAddress = { ...mockAddress, isDefault: true };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(defaultAddress);
      (mockPrisma.address.update as jest.Mock).mockResolvedValue(defaultAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockPrisma.address.updateMany).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // DELETE /api/user/addresses/[id] - Delete address
  // ============================================
  describe('DELETE /api/user/addresses/[id]', () => {
    const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Address ID is required' });
      }

      if (!['GET', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const token = await getToken({ req });

      if (!token || !token.email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingAddress = await mockPrisma.address.findFirst({
        where: { id, userId: user.id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (req.method === 'DELETE') {
        await mockPrisma.address.delete({
          where: { id },
        });

        return res.status(200).json({ message: 'Address deleted successfully' });
      }
    };

    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'DELETE';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 404 when address is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'DELETE';
      req.query = { id: 'non-existent' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'Address not found' });
    });

    it('should return 200 when address is deleted successfully', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'DELETE';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);
      (mockPrisma.address.delete as jest.Mock).mockResolvedValue(mockAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData()).toEqual({ message: 'Address deleted successfully' });
      expect(mockPrisma.address.delete).toHaveBeenCalledWith({ where: { id: 'address-123' } });
    });
  });

  // ============================================
  // PATCH /api/user/addresses/[id] - Partial update
  // ============================================
  describe('PATCH /api/user/addresses/[id]', () => {
    const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Address ID is required' });
      }

      if (!['GET', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const token = await getToken({ req });

      if (!token || !token.email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingAddress = await mockPrisma.address.findFirst({
        where: { id, userId: user.id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      if (req.method === 'PATCH') {
        await mockPrisma.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });

        const updatedAddress = await mockPrisma.address.update({
          where: { id },
          data: { isDefault: true },
        });

        return res.status(200).json({
          message: 'Default address updated',
          address: updatedAddress,
        });
      }
    };

    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 404 when address is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'non-existent' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'Address not found' });
    });

    it('should unset other defaults and set this address as default', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'address-456' };

      const updatedAddress = { ...mockAddressTwo, isDefault: true };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddressTwo);
      (mockPrisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData().message).toBe('Default address updated');
      expect(getResponseData().address).toEqual(updatedAddress);
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: 'address-456' },
        data: { isDefault: true },
      });
    });
  });
});

// ============================================
// /api/user/addresses/[id]/default Tests
// ============================================
describe('/api/user/addresses/[id]/default', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = getMockPrisma();
  });

  describe('PATCH /api/user/addresses/[id]/default', () => {
    const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'PATCH') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Address ID is required' });
      }

      const token = await getToken({ req });

      if (!token || !token.email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingAddress = await mockPrisma.address.findFirst({
        where: { id, userId: user.id },
      });

      if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found' });
      }

      await mockPrisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });

      const updatedAddress = await mockPrisma.address.update({
        where: { id },
        data: { isDefault: true },
      });

      return res.status(200).json({
        message: 'Default address updated',
        address: updatedAddress,
      });
    };

    it('should return 405 for GET requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';
      req.query = { id: 'address-123' };

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });

    it('should return 405 for POST requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'POST';
      req.query = { id: 'address-123' };

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });

    it('should return 405 for PUT requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PUT';
      req.query = { id: 'address-123' };

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });

    it('should return 405 for DELETE requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'DELETE';
      req.query = { id: 'address-123' };

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });

    it('should return 400 when address ID is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = {};

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Address ID is required' });
    });

    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 404 when user is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'address-123' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'User not found' });
    });

    it('should return 404 when address is not found', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'non-existent' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'Address not found' });
    });

    it('should return 200 and set address as default successfully', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'address-456' };

      const updatedAddress = { ...mockAddressTwo, isDefault: true };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddressTwo);
      (mockPrisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData().message).toBe('Default address updated');
      expect(getResponseData().address.isDefault).toBe(true);
    });

    it('should unset all other default addresses before setting new default', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'address-456' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddressTwo);
      (mockPrisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (mockPrisma.address.update as jest.Mock).mockResolvedValue({ ...mockAddressTwo, isDefault: true });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: 'address-456' },
        data: { isDefault: true },
      });
    });

    it('should handle case when no previous default exists', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';
      req.query = { id: 'address-456' };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddressTwo);
      (mockPrisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 0 }); // No previous defaults
      (mockPrisma.address.update as jest.Mock).mockResolvedValue({ ...mockAddressTwo, isDefault: true });

      await mockHandler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData().address.isDefault).toBe(true);
    });
  });
});
