// Mock Stripe.js before any imports
import { 
  mockLoadStripe,
  setupSuccessfulStripeLoad,
  setupFailedStripeLoad,
  setupRedirectToCheckoutSuccess,
  setupRedirectToCheckoutFailure,
  resetStripeMocks 
} from '../__mocks__/stripe'

// Mock the Stripe module
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: mockLoadStripe,
}))

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Import functions directly after mocks are set up
import { 
  getStripe, 
  resetStripePromise,
  createCheckoutSession,
  redirectToCheckout,
  createPaymentIntent,
  isStripeError,
  getStripeErrorMessage,
  getStripeConfig,
  formatStripeAmount,
  toStripeAmount 
} from '@/lib/stripe-client'

describe('stripe-client', () => {
  let originalEnv: any

  beforeEach(() => {
    // Clear all mocks including our custom Stripe mocks
    jest.clearAllMocks()
    resetStripeMocks()
    
    // Save original environment
    originalEnv = process.env
    
    // Set test environment variables
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789'
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    
    // Reset the stripe singleton for next test
    jest.doMock('@/lib/stripe-client', () => {
      const originalModule = jest.requireActual('@/lib/stripe-client')
      // Force reset the singleton
      originalModule.resetStripePromise()
      return originalModule
    })
  })

  describe('getStripe', () => {
    it('should load Stripe with publishable key', async () => {
      const mockStripe = setupSuccessfulStripeLoad()
      resetStripePromise()
      
      const stripe = await getStripe()

      expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123456789')
      expect(stripe).toBe(mockStripe)
    })

    it('should reuse the same Stripe instance', async () => {
      const mockStripe = setupSuccessfulStripeLoad()
      const { getStripe, resetStripePromise } = await import('@/lib/stripe-client')
      resetStripePromise()
      
      const stripe1 = await getStripe()
      const stripe2 = await getStripe()

      expect(mockLoadStripe).toHaveBeenCalledTimes(1)
      expect(stripe1).toBe(stripe2)
    })

    it('should throw error when publishable key is missing', async () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

      const { getStripe, resetStripePromise } = await import('@/lib/stripe-client')
      resetStripePromise()

      await expect(getStripe()).rejects.toThrow('Stripe publishable key is not configured')
    })

    it('should handle null response from loadStripe', async () => {
      setupFailedStripeLoad()

      const { getStripe, resetStripePromise } = await import('@/lib/stripe-client')
      resetStripePromise()
      const stripe = await getStripe()

      expect(stripe).toBeNull()
    })
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockResponse = { sessionId: 'cs_test_123' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const params = {
        priceId: 'price_123',
        items: [{ menuItemId: 'item_1', quantity: 2 }],
        successUrl: '/success',
        cancelUrl: '/cancel',
      }

      const result = await createCheckoutSession(params)

      expect(mockFetch).toHaveBeenCalledWith('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_123',
          items: [{ menuItemId: 'item_1', quantity: 2 }],
          successUrl: '/success',
          cancelUrl: '/cancel',
        }),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle empty items array', async () => {
      const mockResponse = { sessionId: 'cs_test_123' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const { createCheckoutSession } = await import('@/lib/stripe-client')

      const params = { priceId: 'price_123' }
      await createCheckoutSession(params)

      expect(mockFetch).toHaveBeenCalledWith('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_123',
          items: [],
          successUrl: undefined,
          cancelUrl: undefined,
        }),
      })
    })

    it('should throw error on failed response', async () => {
      const errorResponse = { message: 'Invalid price ID' }
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      } as Response)

      const { createCheckoutSession } = await import('@/lib/stripe-client')

      const params = { priceId: 'invalid_price' }

      await expect(createCheckoutSession(params)).rejects.toThrow('Invalid price ID')
    })

    it('should throw generic error when no error message provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      const { createCheckoutSession } = await import('@/lib/stripe-client')

      const params = { priceId: 'price_123' }

      await expect(createCheckoutSession(params)).rejects.toThrow('Failed to create checkout session')
    })
  })

  describe('redirectToCheckout', () => {
    it('should redirect to checkout successfully', async () => {
      const mockStripe = setupRedirectToCheckoutSuccess()

      resetStripePromise()
      await redirectToCheckout('cs_test_123')

      expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({ sessionId: 'cs_test_123' })
    })

    it('should throw error when Stripe fails to load', async () => {
      setupFailedStripeLoad()

      resetStripePromise()
      await expect(redirectToCheckout('cs_test_123')).rejects.toThrow('Failed to load Stripe')
    })

    it('should throw error when redirect fails', async () => {
      const mockStripe = setupRedirectToCheckoutFailure('Redirect failed')

      resetStripePromise()
      await expect(redirectToCheckout('cs_test_123')).rejects.toThrow('Redirect failed')
    })

    it('should throw generic error when no error message provided', async () => {
      const mockStripe = setupRedirectToCheckoutFailure('')

      resetStripePromise()
      await expect(redirectToCheckout('cs_test_123')).rejects.toThrow('Failed to redirect to checkout')
    })
  })

  describe('createPaymentIntent', () => {
    it('should create payment intent with default parameters', async () => {
      const mockResponse = { clientSecret: 'pi_test_123_secret' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const { createPaymentIntent } = await import('@/lib/stripe-client')

      const params = { amount: 5000 }
      const result = await createPaymentIntent(params)

      expect(mockFetch).toHaveBeenCalledWith('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000,
          currency: 'gbp',
          metadata: {},
        }),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should create payment intent with custom parameters', async () => {
      const mockResponse = { clientSecret: 'pi_test_123_secret' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const { createPaymentIntent } = await import('@/lib/stripe-client')

      const params = {
        amount: 10000,
        currency: 'gbp',
        metadata: { orderId: 'order_123' },
      }

      await createPaymentIntent(params)

      expect(mockFetch).toHaveBeenCalledWith('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 10000,
          currency: 'gbp',
          metadata: { orderId: 'order_123' },
        }),
      })
    })

    it('should throw error on failed response', async () => {
      const errorResponse = { message: 'Invalid amount' }
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      } as Response)

      const { createPaymentIntent } = await import('@/lib/stripe-client')

      const params = { amount: -100 }

      await expect(createPaymentIntent(params)).rejects.toThrow('Invalid amount')
    })
  })

  describe('isStripeError', () => {
    it('should identify Stripe errors correctly', async () => {
      const stripeError = { type: 'card_error', message: 'Card declined' }
      const regularError = new Error('Regular error')
      const nullValue = null
      const stringValue = 'error string'
      
      expect(isStripeError(stripeError)).toBe(true)
      expect(isStripeError(regularError)).toBe(false)
      expect(isStripeError(nullValue)).toBe(false)
      expect(isStripeError(stringValue)).toBe(false)
    })
  })

  describe('getStripeErrorMessage', () => {
    it('should return appropriate message for card_error', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'card_error', message: 'Your card was declined.' }
      expect(getStripeErrorMessage(error as any)).toBe('Your card was declined.')
    })

    it('should return default message for card_error without message', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'card_error' }
      expect(getStripeErrorMessage(error as any)).toBe('Your card was declined.')
    })

    it('should return appropriate message for validation_error', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'validation_error', message: 'Invalid card number.' }
      expect(getStripeErrorMessage(error as any)).toBe('Invalid card number.')
    })

    it('should return generic message for api_error', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'api_error' }
      expect(getStripeErrorMessage(error as any)).toBe('An error occurred with our payment system. Please try again.')
    })

    it('should return appropriate message for authentication_error', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'authentication_error' }
      expect(getStripeErrorMessage(error as any)).toBe('Authentication with payment provider failed.')
    })

    it('should return appropriate message for rate_limit_error', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'rate_limit_error' }
      expect(getStripeErrorMessage(error as any)).toBe('Too many requests. Please wait and try again.')
    })

    it('should return default message for unknown error types', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'unknown_error', message: 'Something went wrong' }
      expect(getStripeErrorMessage(error as any)).toBe('Something went wrong')
    })

    it('should return generic default message when no message provided', async () => {
      const { getStripeErrorMessage } = await import('@/lib/stripe-client')

      const error = { type: 'unknown_error' }
      expect(getStripeErrorMessage(error as any)).toBe('An unexpected error occurred.')
    })
  })

  describe('getStripeConfig', () => {
    it('should return config with test mode in development', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'

      const { getStripeConfig } = await import('@/lib/stripe-client')
      const config = getStripeConfig()

      expect(config).toEqual({
        publishableKey: 'pk_test_123',
        isProduction: false,
        isTestMode: true,
      })
    })

    it('should return config with production mode', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_live_123'

      const { getStripeConfig } = await import('@/lib/stripe-client')
      const config = getStripeConfig()

      expect(config).toEqual({
        publishableKey: 'pk_live_123',
        isProduction: true,
        isTestMode: false,
      })
    })

    it('should detect test mode even in production with test key', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'

      const { getStripeConfig } = await import('@/lib/stripe-client')
      const config = getStripeConfig()

      expect(config).toEqual({
        publishableKey: 'pk_test_123',
        isProduction: true,
        isTestMode: true,
      })
    })

    it('should handle missing publishable key', async () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

      const { getStripeConfig } = await import('@/lib/stripe-client')
      const config = getStripeConfig()

      expect(config).toEqual({
        publishableKey: undefined,
        isProduction: false,
        isTestMode: true,
      })
    })
  })

  describe('formatStripeAmount', () => {
    it('should format GBP amounts correctly', async () => {
      const { formatStripeAmount } = await import('@/lib/stripe-client')

      expect(formatStripeAmount(5000, 'gbp')).toBe('£50.00')
      expect(formatStripeAmount(12500, 'gbp')).toBe('£125.00')
      expect(formatStripeAmount(0, 'gbp')).toBe('£0.00')
    })

    it('should format other currencies with fallback', async () => {
      const { formatStripeAmount } = await import('@/lib/stripe-client')

      // Test that other currencies use the Intl formatter fallback
      const result = formatStripeAmount(5000, 'eur')
      expect(result).toContain('50') // Should contain the amount
    })

    it('should use GBP as default currency', async () => {
      const { formatStripeAmount } = await import('@/lib/stripe-client')

      expect(formatStripeAmount(5000)).toBe('£50.00')
    })

    it('should handle case-insensitive currency codes', async () => {
      const { formatStripeAmount } = await import('@/lib/stripe-client')

      expect(formatStripeAmount(5000, 'GBP')).toBe('£50.00')
      expect(formatStripeAmount(5000, 'gbp')).toBe('£50.00')
    })
  })

  describe('toStripeAmount', () => {
    it('should convert amounts to kobo/cents correctly', async () => {
      const { toStripeAmount } = await import('@/lib/stripe-client')

      expect(toStripeAmount(50.00)).toBe(5000)
      expect(toStripeAmount(125.50)).toBe(12550)
      expect(toStripeAmount(0)).toBe(0)
      expect(toStripeAmount(1.23)).toBe(123)
    })

    it('should handle decimal precision correctly', async () => {
      const { toStripeAmount } = await import('@/lib/stripe-client')

      expect(toStripeAmount(12.345)).toBe(1235) // Rounded to nearest cent
      expect(toStripeAmount(12.344)).toBe(1234)
    })

    it('should handle negative amounts', async () => {
      const { toStripeAmount } = await import('@/lib/stripe-client')

      expect(toStripeAmount(-50.00)).toBe(-5000)
    })
  })
})