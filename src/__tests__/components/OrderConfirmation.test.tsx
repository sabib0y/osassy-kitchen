import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import OrderConfirmation from '@/components/OrderConfirmation'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock next/link
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: any) => (
      <a href={href}>{children}</a>
    ),
  }
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className }: any) => (
    <div data-testid="check-circle" className={className}>CheckCircle</div>
  ),
  Package: ({ className, 'data-testid': dataTestId, ...props }: any) => (
    <div data-testid={dataTestId || "package"} className={className} {...props}>Package</div>
  ),
  Calendar: ({ className }: any) => (
    <div data-testid="calendar" className={className}>Calendar</div>
  ),
  CreditCard: ({ className }: any) => (
    <div data-testid="credit-card" className={className}>CreditCard</div>
  ),
  MapPin: ({ className }: any) => (
    <div data-testid="map-pin" className={className}>MapPin</div>
  ),
  Clock: ({ className }: any) => (
    <div data-testid="clock" className={className}>Clock</div>
  ),
  Truck: ({ className }: any) => (
    <div data-testid="truck" className={className}>Truck</div>
  ),
  ChevronRight: ({ className }: any) => (
    <div data-testid="chevron-right" className={className}>ChevronRight</div>
  ),
  Home: ({ className }: any) => (
    <div data-testid="home-icon" className={className}>Home</div>
  ),
  ShoppingBag: ({ className }: any) => (
    <div data-testid="shopping-bag" className={className}>ShoppingBag</div>
  ),
  Receipt: ({ className }: any) => (
    <div data-testid="receipt" className={className}>Receipt</div>
  ),
  Loader2: ({ className }: any) => (
    <div data-testid="loader" className={className}>Loading...</div>
  ),
  AlertCircle: ({ className }: any) => (
    <div data-testid="alert-circle" className={className}>AlertCircle</div>
  ),
}))

// Mock styles
jest.mock('@/styles/components/order-confirmation.module.css', () => ({
  container: 'container',
  successHeader: 'successHeader',
  successIcon: 'successIcon',
  successIconWrapper: 'successIconWrapper',
  title: 'title',
  subtitle: 'subtitle',
  orderId: 'orderId',
  orderDetails: 'orderDetails',
  section: 'section',
  sectionHeader: 'sectionHeader',
  sectionTitle: 'sectionTitle',
  sectionIcon: 'sectionIcon',
  itemsList: 'itemsList',
  orderItem: 'orderItem',
  itemImage: 'itemImage',
  placeholder: 'placeholder',
  itemDetails: 'itemDetails',
  itemInfo: 'itemInfo',
  itemName: 'itemName',
  itemQuantity: 'itemQuantity',
  itemPrice: 'itemPrice',
  summary: 'summary',
  summaryRow: 'summaryRow',
  summaryLabel: 'summaryLabel',
  summaryValue: 'summaryValue',
  summaryTotal: 'summaryTotal',
  totalLabel: 'totalLabel',
  totalValue: 'totalValue',
  infoGrid: 'infoGrid',
  infoCard: 'infoCard',
  infoItem: 'infoItem',
  infoLabel: 'infoLabel',
  infoValue: 'infoValue',
  cardHeader: 'cardHeader',
  cardIcon: 'cardIcon',
  cardTitle: 'cardTitle',
  buttons: 'buttons',
  actions: 'actions',
  primaryButton: 'primaryButton',
  secondaryButton: 'secondaryButton',
  buttonIcon: 'buttonIcon',
  loadingContainer: 'loadingContainer',
  loading: 'loading',
  loadingSpinner: 'loadingSpinner',
  loadingText: 'loadingText',
  errorContainer: 'errorContainer',
  error: 'error',
  errorIcon: 'errorIcon',
  errorMessage: 'errorMessage',
  errorTitle: 'errorTitle',
  errorText: 'errorText',
  spinner: 'spinner',
  nextDeliveryHighlight: 'nextDeliveryHighlight',
  deliveryDate: 'deliveryDate',
  deliveryIcon: 'deliveryIcon',
  badge: 'badge',
}))

describe('OrderConfirmation', () => {
  let mockPush: jest.Mock
  let mockRouter: any

  beforeEach(() => {
    mockPush = jest.fn()
    mockRouter = {
      push: mockPush,
      pathname: '/success',
      query: {},
      asPath: '/success',
      route: '/success',
    }
    mockUseRouter.mockReturnValue(mockRouter)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    const defaultProps = {
      orderId: 'ORD-123456',
      sessionId: 'session_123',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [
        {
          id: '1',
          name: 'Jollof Rice',
          quantity: 2,
          price: 1500,
          imageUrl: 'https://example.com/jollof.jpg',
        },
      ],
      subtotal: 3000,
      deliveryFee: 500,
      total: 3500,
      billingInterval: 'WEEKLY' as const,
      nextDeliveryDate: new Date('2024-02-01'),
      paymentMethod: {
        brand: 'Visa',
        last4: '4242',
      },
      deliveryAddress: {
        line1: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        postal_code: '100001',
        country: 'Nigeria',
      },
    }

    it('should render success confirmation', () => {
      render(<OrderConfirmation {...defaultProps} />)

      expect(screen.getByTestId('check-circle')).toBeInTheDocument()
      expect(screen.getByText('Order Confirmed!')).toBeInTheDocument()
      expect(screen.getByText(/Thank you, John Doe!/)).toBeInTheDocument()
    })

    it('should display order ID', () => {
      render(<OrderConfirmation {...defaultProps} />)

      expect(screen.getByText(/Order #ORD-123456/)).toBeInTheDocument()
    })

    it('should display order items', () => {
      render(<OrderConfirmation {...defaultProps} />)

      expect(screen.getByText('Jollof Rice')).toBeInTheDocument()
      expect(screen.getByText(/Qty: 2/)).toBeInTheDocument()
      expect(screen.getAllByText('₦3,000.00').length).toBeGreaterThan(0)
    })

    it('should display order summary', () => {
      render(<OrderConfirmation {...defaultProps} />)

      expect(screen.getByText('Order Summary')).toBeInTheDocument()
      expect(screen.getByText('Subtotal:')).toBeInTheDocument()
      expect(screen.getAllByText('₦3,000.00')[0]).toBeInTheDocument()
      expect(screen.getByText('Delivery Fee:')).toBeInTheDocument()
      expect(screen.getByText('₦500.00')).toBeInTheDocument()
      expect(screen.getByText(/Total per/)).toBeInTheDocument()
      expect(screen.getByText('₦3,500.00')).toBeInTheDocument()
    })

    it('should display next delivery date', () => {
      render(<OrderConfirmation {...defaultProps} />)

      expect(screen.getByText(/Next Delivery/)).toBeInTheDocument()
      expect(screen.getAllByText(/February 1, 2024/).length).toBeGreaterThan(0)
    })

    it('should display payment method', () => {
      render(<OrderConfirmation {...defaultProps} />)

      expect(screen.getByText('Payment Method')).toBeInTheDocument()
      expect(screen.getByText(/Visa ending in 4242/)).toBeInTheDocument()
    })

    it('should display delivery address', () => {
      render(<OrderConfirmation {...defaultProps} />)

      expect(screen.getByText(/Delivery Address/)).toBeInTheDocument()
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument()
      expect(screen.getByText(/Lagos, Lagos/)).toBeInTheDocument()
    })

    it('should display navigation buttons', () => {
      render(<OrderConfirmation {...defaultProps} />)

      const dashboardLink = screen.getByText('Go to Dashboard').closest('a')
      const ordersLink = screen.getByText('View My Orders').closest('a')
      
      expect(dashboardLink).toHaveAttribute('href', '/user/dashboard')
      expect(ordersLink).toHaveAttribute('href', '/user/orders')
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner', () => {
      render(<OrderConfirmation isLoading={true} />)

      expect(screen.getByTestId('loader')).toBeInTheDocument()
      expect(screen.getByText('Processing your order...')).toBeInTheDocument()
    })

    it('should not display order details when loading', () => {
      render(<OrderConfirmation isLoading={true} customerName="John Doe" />)

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Order Confirmed!')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message', () => {
      render(<OrderConfirmation error="Payment failed" />)

      expect(screen.getByTestId('alert-circle')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Payment failed')).toBeInTheDocument()
    })

    it('should show retry button on error', () => {
      render(<OrderConfirmation error="Payment failed" />)

      const retryButton = screen.getByRole('button', { name: /Try Again/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should navigate back on retry', () => {
      render(<OrderConfirmation error="Payment failed" />)

      const retryButton = screen.getByRole('button', { name: /Try Again/i })
      fireEvent.click(retryButton)

      expect(mockPush).toHaveBeenCalledWith('/subscriptions/create')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing optional props', () => {
      render(<OrderConfirmation />)

      expect(screen.getByText('Order Confirmed!')).toBeInTheDocument()
      expect(screen.getByText(/Thank you for your order!/)).toBeInTheDocument()
    })

    it('should handle empty items array', () => {
      render(<OrderConfirmation items={[]} />)

      expect(screen.queryByText('Order Items')).toBeInTheDocument()
    })

    it('should handle missing payment method', () => {
      render(<OrderConfirmation paymentMethod={undefined} />)

      expect(screen.getByText('Payment Method')).toBeInTheDocument()
      expect(screen.getByText('Card payment')).toBeInTheDocument()
    })

    it('should handle missing delivery address', () => {
      render(<OrderConfirmation deliveryAddress={undefined} />)

      expect(screen.getByText(/Delivery Address/)).toBeInTheDocument()
      expect(screen.getByText('Address will be confirmed')).toBeInTheDocument()
    })

    it('should format currency correctly', () => {
      render(
        <OrderConfirmation
          subtotal={10000.5}
          deliveryFee={1500}
          total={11500.5}
        />
      )

      expect(screen.getByText('₦10,000.50')).toBeInTheDocument()
      expect(screen.getByText('₦1,500.00')).toBeInTheDocument()
      expect(screen.getByText('₦11,500.50')).toBeInTheDocument()
    })

    it('should handle monthly billing interval', () => {
      render(
        <OrderConfirmation
          billingInterval="MONTHLY"
          nextDeliveryDate={new Date('2024-03-01')}
        />
      )

      expect(screen.getByText(/Monthly Subscription/)).toBeInTheDocument()
    })

    it('should handle weekly billing interval', () => {
      render(
        <OrderConfirmation
          billingInterval="WEEKLY"
          nextDeliveryDate={new Date('2024-02-07')}
        />
      )

      expect(screen.getByText(/Weekly Subscription/)).toBeInTheDocument()
    })
  })

  describe('Item Display', () => {
    it('should display multiple items', () => {
      const items = [
        {
          id: '1',
          name: 'Jollof Rice',
          quantity: 2,
          price: 1500,
        },
        {
          id: '2',
          name: 'Fried Rice',
          quantity: 1,
          price: 1800,
        },
        {
          id: '3',
          name: 'Plantain',
          quantity: 3,
          price: 500,
        },
      ]

      render(<OrderConfirmation items={items} />)

      expect(screen.getByText('Jollof Rice')).toBeInTheDocument()
      expect(screen.getByText('Fried Rice')).toBeInTheDocument()
      expect(screen.getByText('Plantain')).toBeInTheDocument()
    })

    it('should display item images when available', () => {
      const items = [
        {
          id: '1',
          name: 'Jollof Rice',
          quantity: 1,
          price: 1500,
          imageUrl: 'https://example.com/jollof.jpg',
        },
      ]

      render(<OrderConfirmation items={items} />)

      const image = screen.getByAltText('Jollof Rice')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/jollof.jpg')
    })

    it('should display placeholder when image is missing', () => {
      const items = [
        {
          id: '1',
          name: 'Jollof Rice',
          quantity: 1,
          price: 1500,
        },
      ]

      render(<OrderConfirmation items={items} />)

      expect(screen.getByTestId('item-placeholder')).toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('should navigate to dashboard when button is clicked', () => {
      render(<OrderConfirmation />)

      const dashboardLink = screen.getByText('Go to Dashboard').closest('a')
      expect(dashboardLink).toHaveAttribute('href', '/user/dashboard')
    })

    it('should navigate to orders page when button is clicked', () => {
      render(<OrderConfirmation />)

      const ordersLink = screen.getByText('View My Orders').closest('a')
      expect(ordersLink).toHaveAttribute('href', '/user/orders')
    })
  })
})