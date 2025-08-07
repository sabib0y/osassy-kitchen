import { renderHook, act, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { useStripeCheckout, useStripePaymentIntent, useStripe, useStripeSubscription } from '@/hooks/useStripe'
import { useStripeContext } from '@/components/StripeProvider'
import {
  createCheckoutSession,
  redirectToCheckout,
  createPaymentIntent,
  isStripeError,
  getStripeErrorMessage,
  toStripeAmount,
} from '@/lib/stripe-client'

// Mock dependencies
jest.mock('@/components/StripeProvider')
jest.mock('@/lib/stripe-client')

const mockUseStripeContext = useStripeContext as jest.MockedFunction<typeof useStripeContext>
const mockCreateCheckoutSession = createCheckoutSession as jest.MockedFunction<typeof createCheckoutSession>
const mockRedirectToCheckout = redirectToCheckout as jest.MockedFunction<typeof redirectToCheckout>
const mockCreatePaymentIntent = createPaymentIntent as jest.MockedFunction<typeof createPaymentIntent>
const mockIsStripeError = isStripeError as jest.MockedFunction<typeof isStripeError>
const mockGetStripeErrorMessage = getStripeErrorMessage as jest.MockedFunction<typeof getStripeErrorMessage>
const mockToStripeAmount = toStripeAmount as jest.MockedFunction<typeof toStripeAmount>

describe('Stripe Hooks', () => {
  let mockStripe: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockStripe = {
      confirmCardPayment: jest.fn(),
      createPaymentMethod: jest.fn(),
    }

    // Default mock for useStripeContext
    mockUseStripeContext.mockReturnValue({
      stripe: mockStripe,
      isLoading: false,
      error: null,
      config: {
        publishableKey: 'pk_test_123',
        isProduction: false,
        isTestMode: true,
      },
    })

    // Mock toStripeAmount to convert amounts to kobo/cents
    mockToStripeAmount.mockImplementation((amount: number) => Math.round(amount * 100))
  })

  describe('useStripeCheckout', () => {
    it('should initialise with correct default state', () => {
      const { result } = renderHook(() => useStripeCheckout())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.createAndRedirectToCheckout).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })

    it('should handle successful checkout flow', async () => {
      const onSuccess = jest.fn()
      const onError = jest.fn()
      
      mockCreateCheckoutSession.mockResolvedValue({ sessionId: 'cs_test_123' })
      mockRedirectToCheckout.mockResolvedValue()

      const { result } = renderHook(() => useStripeCheckout({ 
        onSuccess,
        onError,
        successUrl: '/success',
        cancelUrl: '/cancel'
      }))

      const checkoutParams = {
        priceId: 'price_123',
        items: [{ menuItemId: 'item_1', quantity: 2 }],
      }

      await act(async () => {
        await result.current.createAndRedirectToCheckout(checkoutParams)
      })

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_123',
        items: [{ menuItemId: 'item_1', quantity: 2 }],
        successUrl: '/success',
        cancelUrl: '/cancel',
      })
      expect(mockRedirectToCheckout).toHaveBeenCalledWith('cs_test_123')
      expect(onSuccess).toHaveBeenCalledWith('cs_test_123')
      expect(onError).not.toHaveBeenCalled()
      expect(result.current.error).toBe(null)
    })

    it('should handle checkout session creation error', async () => {
      const onSuccess = jest.fn()
      const onError = jest.fn()
      
      mockCreateCheckoutSession.mockRejectedValue(new Error('Invalid price ID'))

      const { result } = renderHook(() => useStripeCheckout({ onSuccess, onError }))

      await act(async () => {
        await result.current.createAndRedirectToCheckout({
          priceId: 'invalid_price',
        })
      })

      expect(result.current.error).toBe('Invalid price ID')
      expect(onError).toHaveBeenCalledWith('Invalid price ID')
      expect(onSuccess).not.toHaveBeenCalled()
      expect(mockRedirectToCheckout).not.toHaveBeenCalled()
    })

    it('should handle redirect error', async () => {
      const onError = jest.fn()
      
      mockCreateCheckoutSession.mockResolvedValue({ sessionId: 'cs_test_123' })
      mockRedirectToCheckout.mockRejectedValue(new Error('Redirect failed'))

      const { result } = renderHook(() => useStripeCheckout({ onError }))

      await act(async () => {
        await result.current.createAndRedirectToCheckout({
          priceId: 'price_123',
        })
      })

      expect(result.current.error).toBe('Redirect failed')
      expect(onError).toHaveBeenCalledWith('Redirect failed')
    })

    it('should handle non-Error exceptions', async () => {
      const onError = jest.fn()
      
      mockCreateCheckoutSession.mockRejectedValue('String error')

      const { result } = renderHook(() => useStripeCheckout({ onError }))

      await act(async () => {
        await result.current.createAndRedirectToCheckout({
          priceId: 'price_123',
        })
      })

      expect(result.current.error).toBe('An error occurred during checkout')
      expect(onError).toHaveBeenCalledWith('An error occurred during checkout')
    })

    it('should return early when Stripe is not available', async () => {
      mockUseStripeContext.mockReturnValue({
        stripe: null,
        isLoading: false,
        error: null,
        config: { publishableKey: 'pk_test_123', isProduction: false, isTestMode: true },
      })

      const { result } = renderHook(() => useStripeCheckout())

      await act(async () => {
        await result.current.createAndRedirectToCheckout({
          priceId: 'price_123',
        })
      })

      expect(result.current.error).toBe('Stripe is not available')
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    })

    it('should return early when there is a Stripe error', async () => {
      mockUseStripeContext.mockReturnValue({
        stripe: mockStripe,
        isLoading: false,
        error: 'Stripe initialization failed',
        config: { publishableKey: 'pk_test_123', isProduction: false, isTestMode: true },
      })

      const { result } = renderHook(() => useStripeCheckout())

      await act(async () => {
        await result.current.createAndRedirectToCheckout({
          priceId: 'price_123',
        })
      })

      expect(result.current.error).toBe('Stripe initialization failed')
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useStripeCheckout())

      // Set an error first
      act(() => {
        result.current.createAndRedirectToCheckout({ priceId: '' })
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })

    it('should combine loading states', () => {
      mockUseStripeContext.mockReturnValue({
        stripe: null,
        isLoading: true,
        error: null,
        config: { publishableKey: 'pk_test_123', isProduction: false, isTestMode: true },
      })

      const { result } = renderHook(() => useStripeCheckout())

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useStripePaymentIntent', () => {
    it('should initialise with correct default state', () => {
      const { result } = renderHook(() => useStripePaymentIntent())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.paymentIntent).toBe(null)
      expect(typeof result.current.createPayment).toBe('function')
      expect(typeof result.current.confirmPayment).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })

    it('should create payment intent successfully', async () => {
      mockCreatePaymentIntent.mockResolvedValue({ clientSecret: 'pi_test_123_secret' })

      const { result } = renderHook(() => useStripePaymentIntent())

      let clientSecret: string | null = null
      await act(async () => {
        clientSecret = await result.current.createPayment({
          amount: 50.00,
          currency: 'gbp',
          metadata: { orderId: 'order_123' },
        })
      })

      expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
        amount: 5000, // Converted to kobo
        currency: 'gbp',
        metadata: { orderId: 'order_123' },
      })
      expect(clientSecret).toBe('pi_test_123_secret')
      expect(result.current.error).toBe(null)
    })

    it('should use default currency when not provided', async () => {
      mockCreatePaymentIntent.mockResolvedValue({ clientSecret: 'pi_test_123_secret' })

      const { result } = renderHook(() => useStripePaymentIntent())

      await act(async () => {
        await result.current.createPayment({ amount: 25.50 })
      })

      expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
        amount: 2550,
        currency: 'gbp',
        metadata: undefined,
      })
    })

    it('should handle payment intent creation error', async () => {
      const onError = jest.fn()
      mockCreatePaymentIntent.mockRejectedValue(new Error('Invalid amount'))

      const { result } = renderHook(() => useStripePaymentIntent({ onError }))

      let clientSecret: string | null = null
      await act(async () => {
        clientSecret = await result.current.createPayment({ amount: -10 })
      })

      expect(clientSecret).toBe(null)
      expect(result.current.error).toBe('Invalid amount')
      expect(onError).toHaveBeenCalledWith('Invalid amount')
    })

    it('should confirm payment successfully', async () => {
      const onSuccess = jest.fn()
      const mockPaymentIntent = { id: 'pi_test_123', status: 'succeeded' }
      
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: null,
        paymentIntent: mockPaymentIntent,
      })

      const { result } = renderHook(() => useStripePaymentIntent({ onSuccess }))

      let success: boolean = false
      await act(async () => {
        success = await result.current.confirmPayment(
          'pi_test_123_secret',
          { id: 'pm_test_123' }
        )
      })

      expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith(
        'pi_test_123_secret',
        { payment_method: { id: 'pm_test_123' } }
      )
      expect(success).toBe(true)
      expect(result.current.paymentIntent).toBe(mockPaymentIntent)
      expect(onSuccess).toHaveBeenCalledWith(mockPaymentIntent)
    })

    it('should handle Stripe payment error', async () => {
      const onError = jest.fn()
      const stripeError = { type: 'card_error', message: 'Card declined' }
      
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: stripeError,
        paymentIntent: null,
      })
      mockIsStripeError.mockReturnValue(true)
      mockGetStripeErrorMessage.mockReturnValue('Card declined')

      const { result } = renderHook(() => useStripePaymentIntent({ onError }))

      let success: boolean = true
      await act(async () => {
        success = await result.current.confirmPayment(
          'pi_test_123_secret',
          { id: 'pm_test_123' }
        )
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Card declined')
      expect(onError).toHaveBeenCalledWith('Card declined')
    })

    it('should handle non-Stripe payment error', async () => {
      const onError = jest.fn()
      const genericError = { message: 'Network error' }
      
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: genericError,
        paymentIntent: null,
      })
      mockIsStripeError.mockReturnValue(false)

      const { result } = renderHook(() => useStripePaymentIntent({ onError }))

      let success: boolean = true
      await act(async () => {
        success = await result.current.confirmPayment(
          'pi_test_123_secret',
          { id: 'pm_test_123' }
        )
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Network error')
      expect(onError).toHaveBeenCalledWith('Network error')
    })

    it('should handle exception during payment confirmation', async () => {
      const onError = jest.fn()
      mockStripe.confirmCardPayment.mockRejectedValue(new Error('Connection failed'))

      const { result } = renderHook(() => useStripePaymentIntent({ onError }))

      let success: boolean = true
      await act(async () => {
        success = await result.current.confirmPayment(
          'pi_test_123_secret',
          { id: 'pm_test_123' }
        )
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Connection failed')
      expect(onError).toHaveBeenCalledWith('Connection failed')
    })
  })

  describe('useStripe', () => {
    it('should return Stripe context and utilities', () => {
      const { result } = renderHook(() => useStripe())

      expect(result.current.stripe).toBe(mockStripe)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.config).toEqual({
        publishableKey: 'pk_test_123',
        isProduction: false,
        isTestMode: true,
      })
      expect(result.current.isReady).toBe(true)
      expect(result.current.isTestMode).toBe(true)
      expect(typeof result.current.formatAmount).toBe('function')
      expect(typeof result.current.toStripeAmount).toBe('function')
      expect(typeof result.current.getConfig).toBe('function')
    })

    it('should indicate not ready when Stripe is loading', () => {
      mockUseStripeContext.mockReturnValue({
        stripe: null,
        isLoading: true,
        error: null,
        config: { publishableKey: 'pk_test_123', isProduction: false, isTestMode: true },
      })

      const { result } = renderHook(() => useStripe())

      expect(result.current.isReady).toBe(false)
    })

    it('should indicate not ready when there is an error', () => {
      mockUseStripeContext.mockReturnValue({
        stripe: null,
        isLoading: false,
        error: 'Initialization failed',
        config: { publishableKey: 'pk_test_123', isProduction: false, isTestMode: true },
      })

      const { result } = renderHook(() => useStripe())

      expect(result.current.isReady).toBe(false)
    })

    it('should provide default config when config is undefined', () => {
      mockUseStripeContext.mockReturnValue({
        stripe: mockStripe,
        isLoading: false,
        error: null,
        config: undefined as any,
      })

      const { result } = renderHook(() => useStripe())

      expect(result.current.config).toEqual({
        publishableKey: undefined,
        isProduction: false,
        isTestMode: true,
      })
      expect(result.current.isTestMode).toBe(false) // Because config is undefined
    })

    it('should detect live mode correctly', () => {
      mockUseStripeContext.mockReturnValue({
        stripe: mockStripe,
        isLoading: false,
        error: null,
        config: {
          publishableKey: 'pk_live_123',
          isProduction: true,
          isTestMode: false,
        },
      })

      const { result } = renderHook(() => useStripe())

      expect(result.current.isTestMode).toBe(false)
    })
  })

  describe('useStripeSubscription', () => {
    beforeEach(() => {
      mockCreateCheckoutSession.mockResolvedValue({ sessionId: 'cs_test_123' })
      mockRedirectToCheckout.mockResolvedValue()
    })

    it('should create subscription with weekly interval', async () => {
      const { result } = renderHook(() => useStripeSubscription())

      await act(async () => {
        await result.current.createSubscription({
          priceId: 'custom_price',
          items: [{ menuItemId: 'item_1', quantity: 1 }],
          billingInterval: 'WEEKLY',
        })
      })

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_1RtHViQcnp5UiDwRGeiN3oy0', // Weekly price ID
        items: [{ menuItemId: 'item_1', quantity: 1 }],
        successUrl: undefined,
        cancelUrl: undefined,
      })
    })

    it('should create subscription with monthly interval', async () => {
      const { result } = renderHook(() => useStripeSubscription())

      await act(async () => {
        await result.current.createSubscription({
          priceId: 'custom_price',
          items: [{ menuItemId: 'item_1', quantity: 2 }],
          billingInterval: 'MONTHLY',
        })
      })

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_1RtHViQcnp5UiDwRQ8S4gxgG', // Monthly price ID
        items: [{ menuItemId: 'item_1', quantity: 2 }],
        successUrl: undefined,
        cancelUrl: undefined,
      })
    })

    it('should fallback to provided price ID for unknown intervals', async () => {
      const { result } = renderHook(() => useStripeSubscription())

      await act(async () => {
        await result.current.createSubscription({
          priceId: 'price_custom_123',
          items: [{ menuItemId: 'item_1', quantity: 1 }],
          billingInterval: 'YEARLY' as any, // Unknown interval
        })
      })

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_custom_123', // Uses fallback price ID
        items: [{ menuItemId: 'item_1', quantity: 1 }],
        successUrl: undefined,
        cancelUrl: undefined,
      })
    })

    it('should inherit all checkout hook properties and methods', () => {
      const { result } = renderHook(() => useStripeSubscription())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.createAndRedirectToCheckout).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.createSubscription).toBe('function')
    })
  })
})