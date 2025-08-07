import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupSuccessfulStripeLoad, setupRedirectToCheckoutSuccess } from '../__mocks__/stripe'
import { StripeProvider } from '@/components/StripeProvider'

// Mock the stripe client
jest.mock('@/lib/stripe-client')
import * as stripeClient from '@/lib/stripe-client'

// Mock a simple checkout button component for testing
const MockCheckoutButton: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const handleCheckout = async () => {
    try {
      await stripeClient.redirectToCheckout(sessionId)
    } catch (error) {
      console.error('Checkout failed:', error)
    }
  }

  return (
    <button onClick={handleCheckout} data-testid="checkout-button">
      Complete Checkout
    </button>
  )
}

describe('Stripe Checkout Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock getStripeConfig
    ;(stripeClient.getStripeConfig as jest.Mock).mockReturnValue({
      publishableKey: 'pk_test_integration123',
      isProduction: false,
      isTestMode: true,
    })
  })

  it('should complete end-to-end checkout flow', async () => {
    const user = userEvent.setup()
    
    // Set up successful Stripe loading and checkout
    const mockStripe = setupRedirectToCheckoutSuccess()
    
    // Mock createCheckoutSession
    ;(stripeClient.createCheckoutSession as jest.Mock).mockResolvedValue({
      sessionId: 'cs_test_integration123'
    })

    render(
      <StripeProvider>
        <div>
          <h1>Checkout Integration Test</h1>
          <MockCheckoutButton sessionId="cs_test_integration123" />
        </div>
      </StripeProvider>
    )

    // Wait for Stripe to initialize
    await waitFor(() => {
      expect(screen.queryByText('Loading payment system...')).not.toBeInTheDocument()
    })

    // Find and click checkout button
    const checkoutButton = screen.getByTestId('checkout-button')
    expect(checkoutButton).toBeInTheDocument()

    // Click the checkout button
    await user.click(checkoutButton)

    // Verify Stripe redirect was called correctly
    await waitFor(() => {
      expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({
        sessionId: 'cs_test_integration123'
      })
    })
  })

  it('should handle checkout session creation and redirect', async () => {
    const mockStripe = setupSuccessfulStripeLoad()
    
    // Mock createCheckoutSession
    ;(stripeClient.createCheckoutSession as jest.Mock).mockResolvedValue({
      sessionId: 'cs_test_created123'
    })

    // Mock redirectToCheckout
    ;(stripeClient.redirectToCheckout as jest.Mock).mockResolvedValue(undefined)

    const TestCheckoutFlow = () => {
      const handleFullCheckout = async () => {
        // Simulate creating a session and then redirecting
        const session = await stripeClient.createCheckoutSession({
          priceId: 'price_test_123',
          items: [{ menuItemId: 'menu_1', quantity: 2 }],
          successUrl: '/success',
          cancelUrl: '/cancel'
        })
        
        await stripeClient.redirectToCheckout(session.sessionId)
      }

      return (
        <button onClick={handleFullCheckout} data-testid="full-checkout">
          Create Session & Checkout
        </button>
      )
    }

    render(
      <StripeProvider>
        <TestCheckoutFlow />
      </StripeProvider>
    )

    // Wait for Stripe to load
    await waitFor(() => {
      expect(screen.queryByText('Loading payment system...')).not.toBeInTheDocument()
    })

    const checkoutButton = screen.getByTestId('full-checkout')
    await userEvent.click(checkoutButton)

    // Verify the full flow
    await waitFor(() => {
      expect(stripeClient.createCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_test_123',
        items: [{ menuItemId: 'menu_1', quantity: 2 }],
        successUrl: '/success',
        cancelUrl: '/cancel'
      })
      expect(stripeClient.redirectToCheckout).toHaveBeenCalledWith('cs_test_created123')
    })
  })

  it('should handle error states in checkout flow', async () => {
    setupSuccessfulStripeLoad()
    
    // Mock createCheckoutSession to fail
    ;(stripeClient.createCheckoutSession as jest.Mock).mockRejectedValue(
      new Error('Payment processing unavailable')
    )

    const ErrorCheckoutTest = () => {
      const [error, setError] = React.useState<string | null>(null)

      const handleErrorCheckout = async () => {
        try {
          await stripeClient.createCheckoutSession({
            priceId: 'price_invalid',
            items: []
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }

      return (
        <div>
          <button onClick={handleErrorCheckout} data-testid="error-checkout">
            Trigger Error Checkout
          </button>
          {error && <div data-testid="checkout-error">{error}</div>}
        </div>
      )
    }

    render(
      <StripeProvider>
        <ErrorCheckoutTest />
      </StripeProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading payment system...')).not.toBeInTheDocument()
    })

    const errorButton = screen.getByTestId('error-checkout')
    await userEvent.click(errorButton)

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByTestId('checkout-error')).toHaveTextContent('Payment processing unavailable')
    })
  })
})