/**
 * Rate Limiting Utility for Osassy's Kitchen API
 *
 * In-memory rate limiter using Map-based storage.
 * Can be upgraded to Redis for production multi-instance deployments.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Configuration options for rate limiting
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom message to return when rate limit is exceeded */
  message?: string;
  /** Custom key generator function (defaults to IP-based) */
  keyGenerator?: (req: NextApiRequest) => string;
  /** Whether to skip failed requests (non-2xx responses) */
  skipFailedRequests?: boolean;
  /** Whether to skip successful requests (2xx responses) */
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Result returned by the rate limiter
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit data
 * Uses a Map with automatic cleanup of expired entries
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Get or create a rate limit entry for a key
   */
  get(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime <= now) {
      // Create new entry if none exists or if window has expired
      const newEntry: RateLimitEntry = {
        count: 0,
        resetTime: now + windowMs,
      };
      this.store.set(key, newEntry);
      return newEntry;
    }

    return entry;
  }

  /**
   * Increment the count for a key
   */
  increment(key: string): void {
    const entry = this.store.get(key);
    if (entry) {
      entry.count += 1;
    }
  }

  /**
   * Remove expired entries from the store
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, entry] = entries[i];
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Stop the cleanup interval (useful for testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global store instance (survives hot reloads in development)
declare global {
  // eslint-disable-next-line no-var
  var rateLimitStore: RateLimitStore | undefined;
}

const rateLimitStore = global.rateLimitStore ?? new RateLimitStore();

if (process.env.NODE_ENV !== 'production') {
  global.rateLimitStore = rateLimitStore;
}

/**
 * Extract client IP address from request
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 */
function getClientIp(req: NextApiRequest): string {
  // Check for forwarded headers (proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first IP
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0];
    return ips.trim();
  }

  // Vercel-specific header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Cloudflare-specific header
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  // Fallback to socket address
  return req.socket?.remoteAddress ?? 'unknown';
}

/**
 * Default key generator using IP address and endpoint path
 */
function defaultKeyGenerator(req: NextApiRequest): string {
  const ip = getClientIp(req);
  const path = req.url?.split('?')[0] ?? '';
  return `${ip}:${path}`;
}

/**
 * Create a rate limiter with the given configuration
 *
 * @param config - Rate limiting configuration
 * @returns A function that checks and enforces rate limits
 *
 * @example
 * ```typescript
 * const signupLimiter = createRateLimiter({
 *   limit: 5,
 *   windowMs: 60 * 60 * 1000, // 1 hour
 *   message: 'Too many signup attempts. Please try again later.',
 * });
 *
 * // In your API handler:
 * const result = signupLimiter(req, res);
 * if (!result.success) {
 *   return; // Response already sent
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    limit,
    windowMs,
    message = 'Too many requests. Please try again later.',
    keyGenerator = defaultKeyGenerator,
  } = config;

  return function rateLimiter(
    req: NextApiRequest,
    res: NextApiResponse
  ): RateLimitResult {
    const key = keyGenerator(req);
    const entry = rateLimitStore.get(key, windowMs);

    // Calculate remaining requests
    const remaining = Math.max(0, limit - entry.count - 1);
    const resetTime = entry.resetTime;

    // Set rate limit headers
    (res as any).setHeader('X-RateLimit-Limit', limit);
    (res as any).setHeader('X-RateLimit-Remaining', remaining);
    (res as any).setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    // Check if limit exceeded
    if (entry.count >= limit) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      (res as any).setHeader('Retry-After', Math.max(0, retryAfter));

      (res as any).status(429).json({
        success: false,
        error: message,
        retryAfter: Math.max(0, retryAfter),
      });

      return {
        success: false,
        limit,
        remaining: 0,
        resetTime,
      };
    }

    // Increment the counter
    rateLimitStore.increment(key);

    return {
      success: true,
      limit,
      remaining,
      resetTime,
    };
  };
}

/**
 * Pre-configured rate limiter for signup endpoint
 * Allows 5 attempts per IP per hour
 */
export const signupRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many signup attempts. Please try again in an hour.',
  keyGenerator: (req) => {
    // Use IP only for signup (not path-specific)
    return `signup:${getClientIp(req)}`;
  },
});

/**
 * Pre-configured rate limiter for login endpoint
 * Allows 10 attempts per IP per 15 minutes
 */
export const loginRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => {
    return `login:${getClientIp(req)}`;
  },
});

/**
 * Pre-configured rate limiter for password reset endpoint
 * Allows 3 attempts per IP per hour
 */
export const passwordResetRateLimiter = createRateLimiter({
  limit: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many password reset attempts. Please try again in an hour.',
  keyGenerator: (req) => {
    return `password-reset:${getClientIp(req)}`;
  },
});

/**
 * Generic API rate limiter
 * Allows 100 requests per IP per minute
 */
export const apiRateLimiter = createRateLimiter({
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests. Please slow down.',
});

// Export the store for testing purposes
export { rateLimitStore };
