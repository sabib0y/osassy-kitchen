import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Mock dependencies before importing the handler
jest.mock('micro', () => ({
  buffer: jest.fn().mockResolvedValue(Buffer.from('mock-body')),
}));

jest.mock('../../../lib/stripe', () => ({
  __esModule: true,
  default: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscriptionItem: {
      createMany: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    orderItem: {
      createMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

import handler from '../../../pages/api/webhooks/stripe';
import stripe from '../../../lib/stripe';
import { PrismaClient } from '@prisma/client';

const mockStripe = stripe as jest.Mocked<typeof stripe>;
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('/api/webhooks/stripe', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let responseData: any;
  let statusCode: number;

  // Fixed date for consistent testing
  const mockDate = new Date('2024-01-15T10:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Reset response tracking
    responseData = {};
    statusCode = 200;

    // Mock request object
    req = {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
    } as Partial<NextApiRequest>;

    // Mock response object
    res = {
      status: jest.fn().mockImplementation((code: number) => {
        statusCode = code;
        return res;
      }),
      json: jest.fn().mockImplementation((data: any) => {
        responseData = data;
        return res;
      }),
      send: jest.fn().mockImplementation((data: any) => {
        responseData = data;
        return res;
      }),
    } as any;

    // Set environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  describe('HTTP Method Validation', () => {
    it('should return 405 for non-POST requests', async () => {
      req.method = 'GET';

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusCode).toBe(405);
      expect(responseData).toEqual({ error: 'Method not allowed' });
    });
  });

  describe('Webhook Secret Validation', () => {
    it('should return 500 when webhook secret is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusCode).toBe(500);
      expect(responseData).toEqual({ error: 'Webhook secret not configured' });
    });
  });

  describe('Signature Verification', () => {
    it('should return 400 when signature verification fails', async () => {
      (mockStripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusCode).toBe(400);
      expect(responseData).toContain('Webhook Error: Invalid signature');
    });
  });

  describe('checkout.session.completed Event', () => {
    const mockUserId = 'user-123';
    const mockMenuItems = [
      { id: 'menu-1', name: 'Jollof Rice', price: 15.99 },
      { id: 'menu-2', name: 'Egusi Soup', price: 18.50 },
    ];
    const mockItems = [
      { menuItemId: 'menu-1', quantity: 2 },
      { menuItemId: 'menu-2', quantity: 1 },
    ];
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_test_123',
      subscription: 'sub_test_123',
      amount_total: 5048, // £50.48 in pence
      metadata: {
        userId: mockUserId,
        items: JSON.stringify(mockItems),
      },
    };
    const mockSubscription = {
      id: 'subscription-db-id',
      userId: mockUserId,
      stripeSubscriptionId: 'sub_test_123',
      planName: 'Custom Meal Plan',
      interval: 'WEEKLY',
      price: 50.48,
      status: 'ACTIVE',
    };
    const mockOrder = {
      id: 'order-db-id',
      userId: mockUserId,
      subscriptionId: 'subscription-db-id',
      totalPrice: 50.48,
      status: 'PENDING',
    };

    beforeEach(() => {
      (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: mockSession },
      });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId });
      (mockPrisma.subscription.create as jest.Mock).mockResolvedValue(mockSubscription);
      (mockPrisma.subscriptionItem.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);
      (mockPrisma.order.create as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.orderItem.createMany as jest.Mock).mockResolvedValue({ count: 2 });
    });

    describe('Order Creation', () => {
      it('should create Order with correct totalPrice calculated from menu items', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        // Verify order was created with calculated total: (15.99 * 2) + (18.50 * 1) = 50.48
        expect(mockPrisma.order.create).toHaveBeenCalled();
        const orderCreateCall = (mockPrisma.order.create as jest.Mock).mock.calls[0][0];
        expect(orderCreateCall.data.totalPrice).toBeCloseTo(50.48, 2);
        expect(statusCode).toBe(200);
        expect(responseData).toEqual({ received: true });
      });

      it('should create OrderItems for each subscription item', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.orderItem.createMany).toHaveBeenCalledWith({
          data: [
            {
              orderId: 'order-db-id',
              menuItemId: 'menu-1',
              quantity: 2,
              price: 15.99,
            },
            {
              orderId: 'order-db-id',
              menuItemId: 'menu-2',
              quantity: 1,
              price: 18.50,
            },
          ],
        });
      });

      it('should link Order to the created subscription', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.order.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            subscriptionId: 'subscription-db-id',
          }),
        });
      });

      it('should set Order status to PENDING', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.order.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        });
      });

      it('should set deliveryDate to 7 days from now', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        const expectedDeliveryDate = new Date(mockDate);
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

        expect(mockPrisma.order.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            deliveryDate: expectedDeliveryDate,
          }),
        });
      });

      it('should include notes referencing the subscription plan', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.order.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            notes: 'Initial order from subscription: Custom Meal Plan',
          }),
        });
      });
    });

    describe('Metadata Handling', () => {
      it('should extract userId from session metadata', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: mockUserId },
        });
        expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: mockUserId,
          }),
        });
      });

      it('should parse items JSON from metadata correctly', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
          where: {
            id: { in: ['menu-1', 'menu-2'] },
          },
        });
      });

      it('should return 400 when userId is missing from metadata', async () => {
        const sessionWithoutUserId = {
          ...mockSession,
          metadata: { items: JSON.stringify(mockItems) },
        };
        (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: sessionWithoutUserId },
        });

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(400);
        expect(responseData).toEqual({ error: 'Missing required metadata' });
      });

      it('should return 400 when items is missing from metadata', async () => {
        const sessionWithoutItems = {
          ...mockSession,
          metadata: { userId: mockUserId },
        };
        (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: sessionWithoutItems },
        });

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(400);
        expect(responseData).toEqual({ error: 'Missing required metadata' });
      });

      it('should return 400 when metadata is null', async () => {
        const sessionWithNullMetadata = {
          ...mockSession,
          metadata: null,
        };
        (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: sessionWithNullMetadata },
        });

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(400);
        expect(responseData).toEqual({ error: 'Missing required metadata' });
      });
    });

    describe('Price Calculation', () => {
      it('should correctly calculate totalPrice from menuItem prices x quantities', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        // (15.99 * 2) + (18.50 * 1) = 31.98 + 18.50 = 50.48
        expect(mockPrisma.order.create).toHaveBeenCalled();
        const orderCreateCall = (mockPrisma.order.create as jest.Mock).mock.calls[0][0];
        expect(orderCreateCall.data.totalPrice).toBeCloseTo(50.48, 2);
      });

      it('should handle multiple items with different prices', async () => {
        const multipleItems = [
          { menuItemId: 'menu-1', quantity: 3 },
          { menuItemId: 'menu-2', quantity: 2 },
          { menuItemId: 'menu-3', quantity: 1 },
        ];
        const multipleMenuItems = [
          { id: 'menu-1', name: 'Jollof Rice', price: 10.00 },
          { id: 'menu-2', name: 'Egusi Soup', price: 12.50 },
          { id: 'menu-3', name: 'Suya', price: 8.00 },
        ];
        const multiSession = {
          ...mockSession,
          metadata: {
            userId: mockUserId,
            items: JSON.stringify(multipleItems),
          },
        };

        (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: multiSession },
        });
        (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(multipleMenuItems);

        await handler(req as NextApiRequest, res as NextApiResponse);

        // (10.00 * 3) + (12.50 * 2) + (8.00 * 1) = 30 + 25 + 8 = 63
        expect(mockPrisma.order.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            totalPrice: 63.00,
          }),
        });
      });

      it('should handle single item correctly', async () => {
        const singleItem = [{ menuItemId: 'menu-1', quantity: 1 }];
        const singleMenuItems = [{ id: 'menu-1', name: 'Jollof Rice', price: 15.99 }];
        const singleSession = {
          ...mockSession,
          metadata: {
            userId: mockUserId,
            items: JSON.stringify(singleItem),
          },
        };

        (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: singleSession },
        });
        (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(singleMenuItems);

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.order.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            totalPrice: 15.99,
          }),
        });
      });
    });

    describe('Error Handling', () => {
      it('should return 400 when user is not found', async () => {
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(400);
        expect(responseData).toEqual({ error: 'User not found' });
      });

      it('should handle missing menu items gracefully with price of 0', async () => {
        // Return only one menu item when two are expected
        const partialMenuItems = [{ id: 'menu-1', name: 'Jollof Rice', price: 15.99 }];
        (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(partialMenuItems);

        await handler(req as NextApiRequest, res as NextApiResponse);

        // Only menu-1 price should be counted: 15.99 * 2 = 31.98
        // menu-2 should use price 0
        expect(mockPrisma.order.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            totalPrice: 31.98, // (15.99 * 2) + (0 * 1)
          }),
        });
      });

      it('should handle Prisma subscription creation error', async () => {
        (mockPrisma.subscription.create as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        );

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(500);
        expect(responseData).toEqual({ error: 'Webhook processing failed' });
      });

      it('should handle Prisma order creation error', async () => {
        (mockPrisma.order.create as jest.Mock).mockRejectedValue(
          new Error('Order creation failed')
        );

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(500);
        expect(responseData).toEqual({ error: 'Webhook processing failed' });
      });

      it('should handle Prisma orderItem creation error', async () => {
        (mockPrisma.orderItem.createMany as jest.Mock).mockRejectedValue(
          new Error('OrderItem creation failed')
        );

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(500);
        expect(responseData).toEqual({ error: 'Webhook processing failed' });
      });

      it('should handle invalid JSON in items metadata', async () => {
        const invalidJsonSession = {
          ...mockSession,
          metadata: {
            userId: mockUserId,
            items: 'not-valid-json',
          },
        };
        (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: invalidJsonSession },
        });

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(statusCode).toBe(500);
        expect(responseData).toEqual({ error: 'Webhook processing failed' });
      });
    });

    describe('Subscription Creation', () => {
      it('should create subscription with correct data', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
          data: {
            userId: mockUserId,
            stripeSubscriptionId: 'sub_test_123',
            planName: 'Custom Meal Plan',
            interval: 'WEEKLY',
            price: 50.48,
            status: 'ACTIVE',
            nextDeliveryDate: expect.any(Date),
          },
        });
      });

      it('should create subscription items', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.subscriptionItem.createMany).toHaveBeenCalledWith({
          data: [
            { subscriptionId: 'subscription-db-id', menuItemId: 'menu-1', quantity: 2 },
            { subscriptionId: 'subscription-db-id', menuItemId: 'menu-2', quantity: 1 },
          ],
        });
      });

      it('should not create subscription items when items array is empty', async () => {
        const emptyItemsSession = {
          ...mockSession,
          metadata: {
            userId: mockUserId,
            items: JSON.stringify([]),
          },
        };
        (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
          type: 'checkout.session.completed',
          data: { object: emptyItemsSession },
        });

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockPrisma.subscriptionItem.createMany).not.toHaveBeenCalled();
      });
    });
  });

  describe('Unhandled Event Types', () => {
    it('should return 200 for unhandled event types', async () => {
      (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'payment_intent.created',
        data: { object: {} },
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(statusCode).toBe(200);
      expect(responseData).toEqual({ received: true });
    });
  });
});
