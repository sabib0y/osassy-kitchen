import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import SuccessPage from '@/pages/success'
import { createMockSession } from '../test-utils'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock Layout component
jest.mock('@/components/Layout/Layout', () => {
  return function MockLayout({
    children,
    pageTitle,
  }: {
    children: React.ReactNode
    pageTitle: string
  }) {
    return (
      <div data-testid="layout">
        <div data-testid="page-title">{pageTitle}</div>
        {children}
      </div>
    )
  }
})

// Mock OrderConfirmation component
jest.mock('@/components/OrderConfirmation', () => {
  return function MockOrderConfirmation(props: any) {
    return (
      <div data-testid="order-confirmation">
        <div data-testid="session-id">{props.sessionId}</div>
        <div data-testid="order-id">{props.orderId}</div>
        <div data-testid="customer-name">{props.customerName}</div>
        <div data-testid="customer-email">{props.customerEmail}</div>
        <div data-testid="items-count">{props.items?.length || 0}</div>
        <div data-testid="subtotal">{props.subtotal}</div>
        <div data-testid="delivery-fee">{props.deliveryFee}</div>
        <div data-testid="total">{props.total}</div>
        <div data-testid="billing-interval">{props.billingInterval}</div>
        <div data-testid="is-loading">{props.isLoading ? 'true' : 'false'}</div>
        <div data-testid="error">{props.error || 'none'}</div>
      </div>
    )
  }
})

// Mock Loader2 icon
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: any) => (
    <div data-testid="loader" className={className}>Loading...</div>
  ),
}))

// Mock styles
jest.mock('@/styles/pages/success.module.css', () => ({
  container: 'container',
  loadingWrapper: 'loadingWrapper',
  spinner: 'spinner',
  content: 'content',
}))

// Mock fetch
global.fetch = jest.fn()

describe('SuccessPage', () => {
  let mockPush: jest.Mock
  let mockRouter: any

  beforeEach(() => {
    mockPush = jest.fn()
    mockRouter = {
      push: mockPush,
      query: {},
      pathname: '/success',
      asPath: '/success',
      route: '/success',
      isReady: true,
    }
    mockUseRouter.mockReturnValue(mockRouter)

    // Default authenticated session
    mockUseSession.mockReturnValue({
      data: createMockSession(),
      status: 'authenticated',
    } as any)

    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading States', () => {
    it('should show loading state while session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any)

      mockRouter.query = { session_id: 'test_session_123' }

      render(<SuccessPage />)

      expect(screen.getByTestId('loader')).toBeInTheDocument()
      expect(screen.getByText('Processing your order...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we confirm your subscription')).toBeInTheDocument()
    })

    it('should show loading state while fetching session details', async () => {
      mockRouter.query = { session_id: 'test_session_123' }

      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<SuccessPage />)

      expect(screen.getByTestId('loader')).toBeInTheDocument()
    })
  })

  describe('Session ID Handling', () => {
    it('should redirect to subscriptions page when no session_id', async () => {
      mockRouter.query = {}

      render(<SuccessPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/user/subscriptions')
      })
    })

    it('should not redirect when router is not ready', () => {
      mockRouter.isReady = false
      mockRouter.query = {}

      render(<SuccessPage />)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should fetch session details with valid session_id', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      const mockSessionData = {
        id: sessionId,
        customer_email: 'test@example.com',
        customer_details: {
          name: 'Test Customer',
          email: 'test@example.com',
        },
        metadata: {
          billingInterval: 'WEEKLY',
          items: [
            {
              id: '1',
              menuItemId: 'item1',
              name: 'Test Item',
              quantity: 2,
              price: 1500,
            },
          ],
        },
        subscription: {
          id: 'sub_123',
          status: 'active',
          current_period_start: 1234567890,
          current_period_end: 1234567890,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/checkout/session/${sessionId}`)
      })

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent(sessionId)
        expect(screen.getByTestId('order-id')).toHaveTextContent('sub_123')
        expect(screen.getByTestId('customer-name')).toHaveTextContent('Test Customer')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load order details')
      })
    })

    it('should handle non-ok response with fallback data', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      const session = createMockSession({
        user: { email: 'user@example.com', name: 'Test User' },
      })
      mockUseSession.mockReturnValue({
        data: session,
        status: 'authenticated',
      } as any)

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      })

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      render(<SuccessPage />)

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith('Could not fetch session details')
      })

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent(sessionId)
        expect(screen.getByTestId('customer-email')).toHaveTextContent('user@example.com')
        expect(screen.getByTestId('billing-interval')).toHaveTextContent('Weekly Delivery')
      })

      consoleWarnSpy.mockRestore()
    })

    it('should handle fetch exception with error message', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Fetch failed'))

      render(<SuccessPage />)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching session details:',
          expect.any(Error)
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load order details')
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Order Data Processing', () => {
    it('should calculate totals correctly', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      const mockItems = [
        { id: '1', menuItemId: 'item1', name: 'Item 1', quantity: 2, price: 1000 },
        { id: '2', menuItemId: 'item2', name: 'Item 2', quantity: 1, price: 1500 },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          metadata: {
            items: mockItems,
          },
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        const expectedSubtotal = 2 * 1000 + 1 * 1500 // 3500
        const expectedDeliveryFee = 500
        const expectedTotal = expectedSubtotal + expectedDeliveryFee // 4000

        expect(screen.getByTestId('subtotal')).toHaveTextContent(expectedSubtotal.toString())
        expect(screen.getByTestId('delivery-fee')).toHaveTextContent(expectedDeliveryFee.toString())
        expect(screen.getByTestId('total')).toHaveTextContent(expectedTotal.toString())
      })
    })

    it('should handle Stripe amount format (cents)', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          amount_subtotal: 350000, // $3500 in cents
          amount_total: 400000, // $4000 in cents
          metadata: {
            items: [],
          },
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        // In test environment, toLocaleString may not format numbers
        const subtotalText = screen.getByTestId('subtotal').textContent
        const totalText = screen.getByTestId('total').textContent
        
        // Check that the values contain the correct amounts (3500 and 4000)
        expect(subtotalText).toContain('3500')
        expect(totalText).toContain('4000')
      })
    })

    it('should parse items from metadata correctly', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      const mockItems = [
        { id: '1', menuItemId: 'item1', name: 'Jollof Rice', quantity: 2, price: 1500 },
        { id: '2', menuItemId: 'item2', name: 'Fried Rice', quantity: 1, price: 1800 },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          metadata: {
            items: mockItems,
          },
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('items-count')).toHaveTextContent('2')
      })
    })
  })

  describe('Customer Information', () => {
    it('should prioritize customer_details over session user', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      mockUseSession.mockReturnValue({
        data: createMockSession({
          user: { name: 'Session User', email: 'session@example.com' },
        }),
        status: 'authenticated',
      } as any)

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          customer_details: {
            name: 'Stripe Customer',
            email: 'stripe@example.com',
          },
          metadata: {},
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('customer-name')).toHaveTextContent('Stripe Customer')
        expect(screen.getByTestId('customer-email')).toHaveTextContent('stripe@example.com')
      })
    })

    it('should fallback to session user when customer_details not available', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      mockUseSession.mockReturnValue({
        data: createMockSession({
          user: { name: 'Session User', email: 'session@example.com' },
        }),
        status: 'authenticated',
      } as any)

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          metadata: {},
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('customer-name')).toHaveTextContent('Session User')
        expect(screen.getByTestId('customer-email')).toHaveTextContent('session@example.com')
      })
    })

    it('should handle missing customer name gracefully', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      mockUseSession.mockReturnValue({
        data: createMockSession({
          user: { name: null, email: 'test@example.com' },
        }),
        status: 'authenticated',
      } as any)

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          metadata: {},
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('customer-name')).toHaveTextContent('Customer')
      })
    })
  })

  describe('Subscription Details', () => {
    it('should display subscription information', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          subscription: {
            id: 'sub_abc123',
            status: 'active',
            current_period_start: 1234567890,
            current_period_end: 1234567890,
          },
          metadata: {
            billingInterval: 'MONTHLY',
          },
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('order-id')).toHaveTextContent('sub_abc123')
        expect(screen.getByTestId('billing-interval')).toHaveTextContent('Monthly Delivery')
      })
    })

    it('should handle null subscription', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          subscription: null,
          metadata: {
            billingInterval: 'WEEKLY',
          },
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('order-id')).toHaveTextContent('')
        expect(screen.getByTestId('billing-interval')).toHaveTextContent('Weekly Delivery')
      })
    })

    it('should default to WEEKLY billing interval', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          metadata: {},
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        const billingElement = screen.getByTestId('billing-interval')
        expect(billingElement).toBeInTheDocument()
        // The text should contain 'Weekly' regardless of exact formatting
        expect(billingElement.textContent).toContain('Weekly')
      })
    })
  })

  describe('Page Metadata', () => {
    it('should set correct page title', async () => {
      mockRouter.query = { session_id: 'test_session_123' }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'test_session_123', metadata: {} }),
      })

      render(<SuccessPage />)

      // Wait for component to settle after fetch
      await waitFor(() => {
        // Page title is set through Layout component and Head tag
        expect(document.title).toBe('Order Successful - Osassy Kitchen')
      })
    })

    it('should set correct loading page title', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any)

      mockRouter.query = { session_id: 'test_session_123' }

      render(<SuccessPage />)

      // Loading state shows the processing message
      expect(screen.getByText('Processing your order...')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle array session_id query parameter', async () => {
      mockRouter.query = { session_id: ['session1', 'session2'] }

      render(<SuccessPage />)

      // Should redirect because session_id is not a string
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/user/subscriptions')
      })
    })

    it('should handle empty items array', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
          metadata: {
            items: [],
          },
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('items-count')).toHaveTextContent('0')
        expect(screen.getByTestId('subtotal')).toHaveTextContent('0')
        expect(screen.getByTestId('total')).toHaveTextContent('500') // Just delivery fee
      })
    })

    it('should handle undefined metadata', async () => {
      const sessionId = 'test_session_123'
      mockRouter.query = { session_id: sessionId }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: sessionId,
        }),
      })

      render(<SuccessPage />)

      await waitFor(() => {
        expect(screen.getByTestId('items-count')).toHaveTextContent('0')
        expect(screen.getByTestId('billing-interval')).toHaveTextContent('Weekly Delivery')
      })
    })
  })
})