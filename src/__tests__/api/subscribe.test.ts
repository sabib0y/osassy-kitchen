import { NextApiRequest, NextApiResponse } from 'next';

// Mock Stripe - must be defined before jest.mock
const mockCheckoutSessionsCreate = jest.fn();
const mockCustomersCreate = jest.fn();
const mockCustomersRetrieve = jest.fn();

// Mock Prisma - must be defined before jest.mock
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();
const mockMenuItemFindMany = jest.fn();

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock Stripe
jest.mock('../../lib/stripe', () => ({
  __esModule: true,
  default: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
    customers: {
      create: (...args: unknown[]) => mockCustomersCreate(...args),
      retrieve: (...args: unknown[]) => mockCustomersRetrieve(...args),
    },
  },
}));

// Mock Prisma client - the API creates new PrismaClient() so we mock the constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    menuItem: {
      findMany: (...args: unknown[]) => mockMenuItemFindMany(...args),
    },
    $disconnect: jest.fn(),
  })),
}));

import { getToken } from 'next-auth/jwt';
import handler from '../../pages/api/subscribe';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  stripeCustomerId: null,
};

const mockUserWithStripeId = {
  ...mockUser,
  stripeCustomerId: 'cus_existing123',
};

const mockMenuItems = [
  { id: 'meal-1', name: 'Jollof Rice', price: 1500 },
  { id: 'meal-2', name: 'Egusi Soup', price: 2000 },
  { id: 'meal-3', name: 'Pepper Soup', price: 1800 },
];

const validDeliveryDetails = {
  address: '123 Lagos Street',
  city: 'Lagos',
  postcode: 'LA 12345',
  phone: '+2348012345678',
  instructions: 'Leave at gate',
  preferredDay: 'Monday',
  preferredTimeSlot: '10:00 - 12:00',
};

const validMealPlanRequest = {
  planName: 'Weekly Nigerian Feast',
  mealIds: ['meal-1', 'meal-2', 'meal-3'],
  deliveryDetails: validDeliveryDetails,
};

const validLegacyRequest = {
  items: [
    { menuItemId: 'meal-1', quantity: 2, frequency: 'weekly' as const },
    { menuItemId: 'meal-2', quantity: 1, frequency: 'biweekly' as const },
  ],
};

// Helper to create mock request/response
const createMockRequestResponse = () => {
  let responseData: unknown;
  let statusCode = 200;

  const req: Partial<NextApiRequest> = {
    method: 'POST',
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
    json: jest.fn().mockImplementation((data: unknown) => {
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
    getResponseData: () => responseData as Record<string, unknown>,
  };
};

describe('/api/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set environment variables
    process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY = 'price_monthly123';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;
    delete process.env.NEXTAUTH_URL;
  });

  // ============================================
  // Method validation tests
  // ============================================
  describe('HTTP method validation', () => {
    it('should return 405 for GET requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'GET';

      await handler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });

    it('should return 405 for PUT requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PUT';

      await handler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });

    it('should return 405 for DELETE requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'DELETE';

      await handler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });

    it('should return 405 for PATCH requests', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.method = 'PATCH';

      await handler(req, res);

      expect(getStatusCode()).toBe(405);
      expect(getResponseData()).toEqual({ message: 'Method not allowed' });
    });
  });

  // ============================================
  // Authentication tests
  // ============================================
  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      (getToken as jest.Mock).mockResolvedValue(null);

      await handler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });

    it('should return 401 when token has no email', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      (getToken as jest.Mock).mockResolvedValue({ sub: 'user-123' });

      await handler(req, res);

      expect(getStatusCode()).toBe(401);
      expect(getResponseData()).toEqual({ message: 'Unauthorized' });
    });
  });

  // ============================================
  // Meal plan builder validation tests
  // ============================================
  describe('Meal plan builder validation', () => {
    it('should return 400 when planName is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = {
        mealIds: ['meal-1', 'meal-2'],
        deliveryDetails: validDeliveryDetails,
      };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await handler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Missing required meal plan fields' });
    });

    it('should return 400 when mealIds is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = {
        planName: 'Weekly Plan',
        deliveryDetails: validDeliveryDetails,
      };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await handler(req, res);

      // Without mealIds, it falls through to legacy validation
      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Missing required fields' });
    });

    it('should return 400 when mealIds is an empty array', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = {
        planName: 'Weekly Plan',
        mealIds: [],
        deliveryDetails: validDeliveryDetails,
      };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await handler(req, res);

      // Empty mealIds falls through to legacy validation
      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Missing required fields' });
    });

    it('should return 400 when deliveryDetails is missing', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = {
        planName: 'Weekly Plan',
        mealIds: ['meal-1', 'meal-2'],
      };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await handler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Missing required meal plan fields' });
    });
  });

  // ============================================
  // Legacy subscription validation tests
  // ============================================
  describe('Legacy subscription validation', () => {
    it('should return 400 when items is missing in legacy flow', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = {};

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await handler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Missing required fields' });
    });

    it('should return 400 when items is an empty array in legacy flow', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = { items: [] };

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await handler(req, res);

      expect(getStatusCode()).toBe(400);
      expect(getResponseData()).toEqual({ message: 'Missing required fields' });
    });
  });

  // ============================================
  // User lookup tests
  // ============================================
  describe('User lookup', () => {
    it('should return 404 when user is not found in database', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      mockMenuItemFindMany.mockResolvedValue(mockMenuItems);
      mockUserFindUnique.mockResolvedValue(null);

      await handler(req, res);

      expect(getStatusCode()).toBe(404);
      expect(getResponseData()).toEqual({ message: 'User not found' });
    });
  });

  // ============================================
  // Successful checkout session creation tests
  // ============================================
  describe('Successful checkout session creation', () => {
    const mockCheckoutSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/session123',
    };

    beforeEach(() => {
      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      mockMenuItemFindMany.mockResolvedValue(mockMenuItems);
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockUserUpdate.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new123' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
      mockCheckoutSessionsCreate.mockResolvedValue(mockCheckoutSession);
    });

    it('should create checkout session with valid meal plan data', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData()).toEqual({
        sessionId: 'cs_test123',
        checkoutUrl: 'https://checkout.stripe.com/session123',
      });
    });

    it('should create new Stripe customer when user has no stripeCustomerId', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { stripeCustomerId: 'cus_new123' },
      });
    });

    it('should use existing Stripe customer when user has stripeCustomerId', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      mockUserFindUnique.mockResolvedValue(mockUserWithStripeId);
      mockCustomersRetrieve.mockResolvedValue({ id: 'cus_existing123' });

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCustomersRetrieve).toHaveBeenCalledWith('cus_existing123');
      expect(mockCustomersCreate).not.toHaveBeenCalled();
    });

    it('should create new Stripe customer when existing customer not found in Stripe', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      mockUserFindUnique.mockResolvedValue(mockUserWithStripeId);
      mockCustomersRetrieve.mockRejectedValue({ code: 'resource_missing' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new456' });

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCustomersCreate).toHaveBeenCalled();
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { stripeCustomerId: 'cus_new456' },
      });
    });
  });

  // ============================================
  // Metadata tests
  // ============================================
  describe('Stripe metadata', () => {
    const mockCheckoutSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/session123',
    };

    beforeEach(() => {
      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      mockMenuItemFindMany.mockResolvedValue(mockMenuItems);
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockUserUpdate.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new123' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
      mockCheckoutSessionsCreate.mockResolvedValue(mockCheckoutSession);
    });

    it('should pass all delivery details as metadata to Stripe', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user-123',
            planName: 'Weekly Nigerian Feast',
            deliveryAddress: '123 Lagos Street',
            deliveryCity: 'Lagos',
            deliveryPostcode: 'LA 12345',
            deliveryPhone: '+2348012345678',
            deliveryInstructions: 'Leave at gate',
            deliveryPreferredDay: 'Monday',
            deliveryPreferredTimeSlot: '10:00 - 12:00',
          }),
        })
      );
    });

    it('should include items in metadata as JSON string', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      const items = JSON.parse(callArgs.metadata.items);

      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({ menuItemId: 'meal-1', quantity: 1, frequency: 'weekly' });
    });

    it('should calculate monthly total correctly for meal plan', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      // (1500 + 2000 + 1800) * 4 weeks = 21200
      expect(callArgs.metadata.monthlyTotal).toBe('21200');
    });

    it('should include subscription_data with same metadata', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            metadata: expect.objectContaining({
              userId: 'user-123',
              planName: 'Weekly Nigerian Feast',
              deliveryAddress: '123 Lagos Street',
            }),
          }),
        })
      );
    });

    it('should handle missing optional delivery instructions', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = {
        ...validMealPlanRequest,
        deliveryDetails: {
          ...validDeliveryDetails,
          instructions: undefined,
        },
      };

      await handler(req, res);

      expect(getStatusCode()).toBe(200);

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      expect(callArgs.metadata.deliveryInstructions).toBe('');
    });
  });

  // ============================================
  // Checkout session configuration tests
  // ============================================
  describe('Checkout session configuration', () => {
    const mockCheckoutSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/session123',
    };

    beforeEach(() => {
      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      mockMenuItemFindMany.mockResolvedValue(mockMenuItems);
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockUserUpdate.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new123' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
      mockCheckoutSessionsCreate.mockResolvedValue(mockCheckoutSession);
    });

    it('should use default success and cancel URLs when not provided', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'http://localhost:3000/cancel',
        })
      );
    });

    it('should use custom success and cancel URLs when provided', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = {
        ...validMealPlanRequest,
        successUrl: 'https://custom.com/success',
        cancelUrl: 'https://custom.com/cancel',
      };

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://custom.com/success',
          cancel_url: 'https://custom.com/cancel',
        })
      );
    });

    it('should set mode to subscription', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
        })
      );
    });

    it('should enable promotion codes', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          allow_promotion_codes: true,
        })
      );
    });

    it('should require billing address collection', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          billing_address_collection: 'required',
        })
      );
    });

    it('should set payment method types to card', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
        })
      );
    });
  });

  // ============================================
  // Error handling tests
  // ============================================
  describe('Error handling', () => {
    beforeEach(() => {
      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      mockMenuItemFindMany.mockResolvedValue(mockMenuItems);
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockUserUpdate.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new123' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
    });

    it('should return 500 when Stripe checkout session creation fails', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      mockCheckoutSessionsCreate.mockRejectedValue(new Error('Stripe API error'));

      await handler(req, res);

      expect(getStatusCode()).toBe(500);
      expect(getResponseData()).toEqual({
        message: 'Failed to create checkout session',
        error: 'Stripe API error',
      });
    });

    it('should return 500 when Stripe customer creation fails', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      mockCustomersCreate.mockRejectedValue(new Error('Customer creation failed'));

      await handler(req, res);

      expect(getStatusCode()).toBe(500);
      expect(getResponseData()).toEqual({
        message: 'Failed to create checkout session',
        error: 'Customer creation failed',
      });
    });

    it('should return 500 when Stripe customer retrieval fails with non-resource_missing error', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      mockUserFindUnique.mockResolvedValue(mockUserWithStripeId);
      mockCustomersRetrieve.mockRejectedValue(new Error('Stripe connection error'));

      await handler(req, res);

      expect(getStatusCode()).toBe(500);
      expect(getResponseData()).toEqual({
        message: 'Failed to create checkout session',
        error: 'Stripe connection error',
      });
    });

    it('should return 500 when Stripe price ID is not configured', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      delete process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

      await handler(req, res);

      expect(getStatusCode()).toBe(500);
      expect(getResponseData()).toEqual({ message: 'Stripe price ID not configured' });
    });

    it('should handle database errors gracefully', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      mockMenuItemFindMany.mockRejectedValue(new Error('Database connection failed'));

      await handler(req, res);

      expect(getStatusCode()).toBe(500);
      expect(getResponseData()).toEqual({
        message: 'Failed to create checkout session',
        error: 'Database connection failed',
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validMealPlanRequest;

      mockCheckoutSessionsCreate.mockRejectedValue('Unknown error string');

      await handler(req, res);

      expect(getStatusCode()).toBe(500);
      expect(getResponseData()).toEqual({
        message: 'Failed to create checkout session',
        error: 'Failed to create checkout session',
      });
    });
  });

  // ============================================
  // Legacy subscription flow tests
  // ============================================
  describe('Legacy subscription flow', () => {
    const mockCheckoutSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/session123',
    };

    beforeEach(() => {
      (getToken as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
      mockMenuItemFindMany.mockResolvedValue(mockMenuItems);
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockUserUpdate.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new123' });
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
      mockCheckoutSessionsCreate.mockResolvedValue(mockCheckoutSession);
    });

    it('should create checkout session with valid legacy items', async () => {
      const { req, res, getStatusCode, getResponseData } = createMockRequestResponse();
      req.body = validLegacyRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(getResponseData()).toEqual({
        sessionId: 'cs_test123',
        checkoutUrl: 'https://checkout.stripe.com/session123',
      });
    });

    it('should calculate monthly total correctly for legacy items with different frequencies', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validLegacyRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      // meal-1: 1500 * 2 * 4 (weekly) = 12000
      // meal-2: 2000 * 1 * 2 (biweekly) = 4000
      // Total: 16000
      expect(callArgs.metadata.monthlyTotal).toBe('16000');
    });

    it('should use default frequency when not specified in legacy items', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = {
        items: [
          { menuItemId: 'meal-1', quantity: 1 }, // No frequency - should default to weekly
        ],
      };

      await handler(req, res);

      expect(getStatusCode()).toBe(200);

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      // 1500 * 1 * 4 (weekly default) = 6000
      expect(callArgs.metadata.monthlyTotal).toBe('6000');
    });

    it('should use custom planName "Custom Subscription" for legacy flow', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = validLegacyRequest;

      await handler(req, res);

      expect(getStatusCode()).toBe(200);

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      expect(callArgs.metadata.planName).toBe('Custom Subscription');
    });

    it('should use provided priceId when specified', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = {
        ...validLegacyRequest,
        priceId: 'price_custom123',
      };

      await handler(req, res);

      expect(getStatusCode()).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_custom123', quantity: 1 }],
        })
      );
    });

    it('should handle missing menu items gracefully', async () => {
      const { req, res, getStatusCode } = createMockRequestResponse();
      req.body = {
        items: [
          { menuItemId: 'non-existent', quantity: 1, frequency: 'weekly' as const },
        ],
      };

      // Return empty array - menu item not found
      mockMenuItemFindMany.mockResolvedValue([]);

      await handler(req, res);

      expect(getStatusCode()).toBe(200);

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
      expect(callArgs.metadata.monthlyTotal).toBe('0');
    });
  });
});
