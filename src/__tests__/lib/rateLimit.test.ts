/**
 * Tests for Rate Limiting Utility
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
  createRateLimiter,
  signupRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  apiRateLimiter,
  rateLimitStore,
  RateLimitResult,
} from '@/lib/rateLimit';

// Mock request factory
function createMockRequest(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    url: '/api/auth/signup',
    ...overrides,
  } as NextApiRequest;
}

// Mock response factory
function createMockResponse(): NextApiResponse & {
  headers: Record<string, string | number>;
  statusCode: number;
  responseData: unknown;
} {
  const headers: Record<string, string | number> = {};
  let statusCode = 200;
  let responseData: unknown = null;

  const res = {
    headers,
    statusCode,
    responseData,
    setHeader: jest.fn((name: string, value: string | number) => {
      headers[name] = value;
      return res;
    }),
    status: jest.fn((code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((data: unknown) => {
      responseData = data;
      res.responseData = data;
      return res;
    }),
  } as unknown as NextApiResponse & {
    headers: Record<string, string | number>;
    statusCode: number;
    responseData: unknown;
  };

  return res;
}

describe('Rate Limiting Utility', () => {
  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
  });

  describe('createRateLimiter', () => {
    it('should allow requests within the limit', () => {
      const limiter = createRateLimiter({
        limit: 3,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest();
      const res = createMockResponse();

      const result1 = limiter(req, res);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = limiter(req, res);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = limiter(req, res);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests when limit is exceeded', () => {
      const limiter = createRateLimiter({
        limit: 2,
        windowMs: 60 * 1000,
        message: 'Rate limit exceeded',
      });

      const req = createMockRequest();
      const res = createMockResponse();

      // Use up the limit
      limiter(req, res);
      limiter(req, res);

      // This request should be blocked
      const result = limiter(req, res);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(res.statusCode).toBe(429);
      expect(res.responseData).toMatchObject({
        success: false,
        error: 'Rate limit exceeded',
      });
    });

    it('should set correct rate limit headers', () => {
      const limiter = createRateLimiter({
        limit: 5,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest();
      const res = createMockResponse();

      limiter(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number)
      );
    });

    it('should set Retry-After header when limit exceeded', () => {
      const limiter = createRateLimiter({
        limit: 1,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest();
      const res = createMockResponse();

      // Use up the limit
      limiter(req, res);

      // Blocked request
      limiter(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(Number)
      );
    });

    it('should track different IPs separately', () => {
      const limiter = createRateLimiter({
        limit: 2,
        windowMs: 60 * 1000,
      });

      const req1 = createMockRequest({
        socket: { remoteAddress: '192.168.1.1' } as any,
      });
      const req2 = createMockRequest({
        socket: { remoteAddress: '192.168.1.2' } as any,
      });
      const res = createMockResponse();

      // Use up limit for IP 1
      limiter(req1, res);
      limiter(req1, res);

      // IP 2 should still have requests available
      const result = limiter(req2, res);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should use x-forwarded-for header for IP detection', () => {
      const limiter = createRateLimiter({
        limit: 2,
        windowMs: 60 * 1000,
      });

      const req1 = createMockRequest({
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });
      const req2 = createMockRequest({
        headers: { 'x-forwarded-for': '10.0.0.2' },
      });
      const res = createMockResponse();

      // Use up limit for forwarded IP 1
      limiter(req1, res);
      limiter(req1, res);

      // Forwarded IP 2 should still have requests available
      const result = limiter(req2, res);
      expect(result.success).toBe(true);
    });

    it('should handle comma-separated x-forwarded-for header', () => {
      const limiter = createRateLimiter({
        limit: 2,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest({
        headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3' },
      });
      const res = createMockResponse();

      // Should use first IP (10.0.0.1)
      limiter(req, res);
      limiter(req, res);

      const result = limiter(req, res);
      expect(result.success).toBe(false);
    });

    it('should use custom key generator when provided', () => {
      const limiter = createRateLimiter({
        limit: 2,
        windowMs: 60 * 1000,
        keyGenerator: (req) => `custom:${req.headers['x-api-key'] ?? 'none'}`,
      });

      const req1 = createMockRequest({
        headers: { 'x-api-key': 'key-1' },
      });
      const req2 = createMockRequest({
        headers: { 'x-api-key': 'key-2' },
      });
      const res = createMockResponse();

      // Use up limit for key-1
      limiter(req1, res);
      limiter(req1, res);
      const result1 = limiter(req1, res);
      expect(result1.success).toBe(false);

      // key-2 should still have requests available
      const result2 = limiter(req2, res);
      expect(result2.success).toBe(true);
    });

    it('should reset after window expires', async () => {
      jest.useFakeTimers();

      const limiter = createRateLimiter({
        limit: 1,
        windowMs: 1000, // 1 second
      });

      const req = createMockRequest();
      const res = createMockResponse();

      // Use up the limit
      limiter(req, res);
      const blocked = limiter(req, res);
      expect(blocked.success).toBe(false);

      // Advance time past the window
      jest.advanceTimersByTime(1100);

      // Should be allowed again
      const allowed = limiter(req, res);
      expect(allowed.success).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Pre-configured rate limiters', () => {
    describe('signupRateLimiter', () => {
      it('should allow 5 signup attempts per hour', () => {
        const req = createMockRequest();
        const res = createMockResponse();

        for (let i = 0; i < 5; i++) {
          const result = signupRateLimiter(req, res);
          expect(result.success).toBe(true);
        }

        const blocked = signupRateLimiter(req, res);
        expect(blocked.success).toBe(false);
        expect(res.responseData).toMatchObject({
          error: 'Too many signup attempts. Please try again in an hour.',
        });
      });
    });

    describe('loginRateLimiter', () => {
      it('should allow 10 login attempts per 15 minutes', () => {
        const req = createMockRequest({ url: '/api/auth/login' });
        const res = createMockResponse();

        for (let i = 0; i < 10; i++) {
          const result = loginRateLimiter(req, res);
          expect(result.success).toBe(true);
        }

        const blocked = loginRateLimiter(req, res);
        expect(blocked.success).toBe(false);
        expect(res.responseData).toMatchObject({
          error: 'Too many login attempts. Please try again in 15 minutes.',
        });
      });
    });

    describe('passwordResetRateLimiter', () => {
      it('should allow 3 password reset attempts per hour', () => {
        const req = createMockRequest({ url: '/api/auth/password-reset' });
        const res = createMockResponse();

        for (let i = 0; i < 3; i++) {
          const result = passwordResetRateLimiter(req, res);
          expect(result.success).toBe(true);
        }

        const blocked = passwordResetRateLimiter(req, res);
        expect(blocked.success).toBe(false);
        expect(res.responseData).toMatchObject({
          error: 'Too many password reset attempts. Please try again in an hour.',
        });
      });
    });

    describe('apiRateLimiter', () => {
      it('should allow 100 API requests per minute', () => {
        const req = createMockRequest({ url: '/api/menu' });
        const res = createMockResponse();

        for (let i = 0; i < 100; i++) {
          const result = apiRateLimiter(req, res);
          expect(result.success).toBe(true);
        }

        const blocked = apiRateLimiter(req, res);
        expect(blocked.success).toBe(false);
      });
    });
  });

  describe('RateLimitStore', () => {
    it('should clear all entries', () => {
      const limiter = createRateLimiter({
        limit: 1,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest();
      const res = createMockResponse();

      // Use up the limit
      limiter(req, res);
      const blocked = limiter(req, res);
      expect(blocked.success).toBe(false);

      // Clear the store
      rateLimitStore.clear();

      // Should be allowed again
      const allowed = limiter(req, res);
      expect(allowed.success).toBe(true);
    });
  });

  describe('IP detection edge cases', () => {
    it('should handle x-real-ip header (Vercel)', () => {
      const limiter = createRateLimiter({
        limit: 1,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest({
        headers: { 'x-real-ip': '10.0.0.99' },
      });
      const res = createMockResponse();

      limiter(req, res);
      const blocked = limiter(req, res);
      expect(blocked.success).toBe(false);
    });

    it('should handle cf-connecting-ip header (Cloudflare)', () => {
      const limiter = createRateLimiter({
        limit: 1,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest({
        headers: { 'cf-connecting-ip': '10.0.0.88' },
      });
      const res = createMockResponse();

      limiter(req, res);
      const blocked = limiter(req, res);
      expect(blocked.success).toBe(false);
    });

    it('should fallback to unknown when no IP available', () => {
      const limiter = createRateLimiter({
        limit: 1,
        windowMs: 60 * 1000,
      });

      const req = createMockRequest({
        socket: undefined as any,
        headers: {},
      });
      const res = createMockResponse();

      limiter(req, res);
      const blocked = limiter(req, res);
      expect(blocked.success).toBe(false);
    });
  });
});
