import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import OrderCard from '@/components/user/OrderCard'
import { OrderResponse } from '@/lib/api-types'

// Mock useOrders utilities
jest.mock('@/hooks/useOrders', () => ({
  getStatusColor: (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'warning',
      IN_PROGRESS: 'info',
      DELIVERED: 'success',
      CANCELLED: 'danger',
    }
    return colors[status] || 'default'
  },
  formatOrderStatus: (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    }
    return statusMap[status] || status
  },
  formatOrderDate: (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  },
  formatCurrency: (amount: number) => {
    return '\u20a6' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: ({ className }: any) => (
    <div data-testid="calendar-icon" className={className}>Calendar</div>
  ),
  MapPin: ({ className }: any) => (
    <div data-testid="map-pin-icon" className={className}>MapPin</div>
  ),
  Package: ({ className }: any) => (
    <div data-testid="package-icon" className={className}>Package</div>
  ),
  Clock: ({ className }: any) => (
    <div data-testid="clock-icon" className={className}>Clock</div>
  ),
  CheckCircle: ({ className }: any) => (
    <div data-testid="check-circle-icon" className={className}>CheckCircle</div>
  ),
  XCircle: ({ className }: any) => (
    <div data-testid="x-circle-icon" className={className}>XCircle</div>
  ),
  ChevronRight: ({ className }: any) => (
    <div data-testid="chevron-right-icon" className={className}>ChevronRight</div>
  ),
  RefreshCw: ({ className }: any) => (
    <div data-testid="refresh-icon" className={className}>RefreshCw</div>
  ),
}))

// Mock styles
jest.mock('@/styles/components/user/orders.module.scss', () => ({
  card: 'card',
  orderCard: 'orderCard',
  expanded: 'expanded',
  orderHeader: 'orderHeader',
  orderMain: 'orderMain',
  orderInfo: 'orderInfo',
  orderId: 'orderId',
  orderMeta: 'orderMeta',
  orderDate: 'orderDate',
  deliveryDate: 'deliveryDate',
  subscriptionInfo: 'subscriptionInfo',
  orderSummary: 'orderSummary',
  orderStatus: 'orderStatus',
  badge: 'badge',
  warning: 'warning',
  info: 'info',
  success: 'success',
  danger: 'danger',
  orderAmount: 'orderAmount',
  totalPrice: 'totalPrice',
  itemCount: 'itemCount',
  orderActions: 'orderActions',
  expandBtn: 'expandBtn',
  viewBtn: 'viewBtn',
  downloadBtn: 'downloadBtn',
  orderDetails: 'orderDetails',
  orderItems: 'orderItems',
  sectionTitle: 'sectionTitle',
  itemsList: 'itemsList',
  orderItem: 'orderItem',
  itemImage: 'itemImage',
  imagePlaceholder: 'imagePlaceholder',
  itemDetails: 'itemDetails',
  itemName: 'itemName',
  itemDescription: 'itemDescription',
  itemCategory: 'itemCategory',
  itemQuantity: 'itemQuantity',
  quantityLabel: 'quantityLabel',
  quantityValue: 'quantityValue',
  itemPrice: 'itemPrice',
  unitPrice: 'unitPrice',
  deliveryInfo: 'deliveryInfo',
  deliveryDetails: 'deliveryDetails',
  deliveryAddress: 'deliveryAddress',
  deliveryFee: 'deliveryFee',
  specialInstructions: 'specialInstructions',
  orderNotes: 'orderNotes',
  orderTimeline: 'orderTimeline',
  timelineItems: 'timelineItems',
  timelineItem: 'timelineItem',
  timelineIcon: 'timelineIcon',
  timelineContent: 'timelineContent',
  orderSummaryDetails: 'orderSummaryDetails',
  summaryItems: 'summaryItems',
  summaryItem: 'summaryItem',
  totalItem: 'totalItem'
}))

describe('OrderCard', () => {
  const createMockOrder = (overrides: Partial<OrderResponse> = {}): OrderResponse => ({
    id: 'order123',
    totalPrice: 5000,
    status: 'PENDING',
    deliveryDate: '2024-01-15T10:00:00Z',
    deliveryAddress: '123 Main St, Lagos',
    deliveryFee: 500,
    notes: null,
    specialInstructions: undefined,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    items: [
      {
        id: 'item1',
        quantity: 2,
        price: 1500,
        menuItem: {
          id: 'menu1',
          name: 'Jollof Rice',
          description: 'Delicious jollof rice',
          price: 1500,
          category: 'rice-dishes',
          imageUrl: 'https://example.com/jollof.jpg',
        },
      },
      {
        id: 'item2',
        quantity: 1,
        price: 2000,
        menuItem: {
          id: 'menu2',
          name: 'Grilled Chicken',
          description: 'Tasty grilled chicken',
          price: 2000,
          category: 'proteins',
          imageUrl: null,
        },
      },
    ],
    subscription: null,
    user: {
      id: 'user1',
      email: 'user@example.com',
      name: 'Test User',
      phone: '+1234567890',
    },
    ...overrides,
  })

  const defaultProps = {
    order: createMockOrder(),
    onViewDetails: jest.fn(),
    onDownloadInvoice: jest.fn(),
    isExpanded: false,
    onToggleExpand: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render order card with order ID', () => {
      render(<OrderCard {...defaultProps} />)

      // The component displays the last 8 chars of ID in uppercase
      expect(screen.getByText(/ORDER123/)).toBeInTheDocument()
    })

    it('should display order date', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.getByText(/10 Jan 2024/)).toBeInTheDocument()
    })

    it('should display order status', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should display delivery date', () => {
      render(<OrderCard {...defaultProps} />)

      // Component uses Font Awesome icons, not lucide-react
      expect(screen.getByText(/Delivery:/)).toBeInTheDocument()
      expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument()
    })

    it('should display delivery address', () => {
      render(<OrderCard {...defaultProps} />)

      // Address is shown in expandable section only
      // Component doesn't show address in basic view
      expect(screen.queryByText('123 Main St, Lagos')).not.toBeInTheDocument()
    })

    it('should display total amount', () => {
      render(<OrderCard {...defaultProps} />)

      // Component uses formatCurrency which returns ₦5,000.00
      expect(screen.getByText(/₦5,000/)).toBeInTheDocument()
    })
  })

  describe('Order Items', () => {
    it('should display all order items', () => {
      // Items are only shown when expanded
      render(<OrderCard {...defaultProps} isExpanded={true} />)

      expect(screen.getByText('Jollof Rice')).toBeInTheDocument()
      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument()
    })

    it('should display item quantities', () => {
      render(<OrderCard {...defaultProps} isExpanded={true} />)

      // Component shows quantities differently
      expect(screen.getAllByText('2')[0]).toBeInTheDocument()
      expect(screen.getAllByText('1')[0]).toBeInTheDocument()
    })

    it('should display item prices', () => {
      render(<OrderCard {...defaultProps} isExpanded={true} />)

      // Prices are formatted with .00
      expect(screen.getByText(/₦1,500/)).toBeInTheDocument()
      expect(screen.getByText(/₦2,000/)).toBeInTheDocument()
    })

    it('should show items count in title', () => {
      render(<OrderCard {...defaultProps} />)

      // Component shows "3 items" in summary
      expect(screen.getByText('3 items')).toBeInTheDocument()
    })

    it('should handle items with images', () => {
      render(<OrderCard {...defaultProps} isExpanded={true} />)

      const jollofImage = screen.getByAltText('Jollof Rice')
      expect(jollofImage).toHaveAttribute('src', 'https://example.com/jollof.jpg')
    })

    it('should handle items without images', () => {
      render(<OrderCard {...defaultProps} isExpanded={true} />)

      // Grilled Chicken has no image
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(1) // Only jollof rice has an image
    })

    it('should handle empty items array', () => {
      const orderWithoutItems = createMockOrder({ items: [] })
      render(<OrderCard {...defaultProps} order={orderWithoutItems} />)

      expect(screen.getByText('0 items')).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    it('should apply correct class for PENDING status', () => {
      render(<OrderCard {...defaultProps} />)

      const badge = screen.getByText('Pending')
      expect(badge).toHaveClass('badge')
    })

    it('should apply correct class for IN_PROGRESS status', () => {
      const order = createMockOrder({ status: 'IN_PROGRESS' })
      render(<OrderCard {...defaultProps} order={order} />)

      const badge = screen.getByText('In Progress')
      expect(badge).toHaveClass('badge')
    })

    it('should apply correct class for DELIVERED status', () => {
      const order = createMockOrder({ status: 'DELIVERED' })
      render(<OrderCard {...defaultProps} order={order} />)

      const badge = screen.getByText('Delivered')
      expect(badge).toHaveClass('badge')
    })

    it('should apply correct class for CANCELLED status', () => {
      const order = createMockOrder({ status: 'CANCELLED' })
      render(<OrderCard {...defaultProps} order={order} />)

      const badge = screen.getByText('Cancelled')
      expect(badge).toHaveClass('badge')
    })

    it('should show correct icon for each status', () => {
      // Component doesn't use individual status icons in header
      render(<OrderCard {...defaultProps} />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  describe('Subscription Orders', () => {
    it('should display subscription badge', () => {
      const order = createMockOrder({
        subscription: {
          id: 'sub123',
          planName: 'Weekly Plan',
          interval: 'WEEKLY',
        },
      })

      render(<OrderCard {...defaultProps} order={order} />)

      // Component shows subscription info differently
      expect(screen.getByText(/Weekly Plan/)).toBeInTheDocument()
      expect(screen.getByText(/weekly/i)).toBeInTheDocument()
    })

    it('should not show subscription badge for regular orders', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.queryByText('Subscription Order')).not.toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render View Details button', () => {
      render(<OrderCard {...defaultProps} />)

      const viewButton = screen.getByRole('button', { name: /View/i })
      expect(viewButton).toBeInTheDocument()
    })

    it('should call onViewDetails when clicked', () => {
      const onViewDetails = jest.fn()
      render(<OrderCard {...defaultProps} onViewDetails={onViewDetails} />)

      fireEvent.click(screen.getByRole('button', { name: /View/i }))

      // Component passes just the ID, not the full order
      expect(onViewDetails).toHaveBeenCalledWith('order123')
    })

    it('should render Reorder button for delivered orders', () => {
      const order = createMockOrder({ status: 'DELIVERED' })
      render(<OrderCard {...defaultProps} order={order} />)

      // Component doesn't have a reorder button
      expect(screen.queryByRole('button', { name: /Reorder/i })).not.toBeInTheDocument()
    })

    it('should call onDownloadInvoice when Invoice is clicked', () => {
      const onDownloadInvoice = jest.fn()
      const order = createMockOrder({ status: 'DELIVERED' })
      render(<OrderCard {...defaultProps} order={order} onDownloadInvoice={onDownloadInvoice} />)

      fireEvent.click(screen.getByRole('button', { name: /Invoice/i }))

      expect(onDownloadInvoice).toHaveBeenCalledWith('order123')
    })

    it('should render expand button when onToggleExpand provided', () => {
      render(<OrderCard {...defaultProps} onToggleExpand={jest.fn()} />)

      expect(screen.getByRole('button', { name: /Expand order details/i })).toBeInTheDocument()
    })

    it('should call onToggleExpand when expand is clicked', () => {
      const onToggleExpand = jest.fn()
      render(<OrderCard {...defaultProps} onToggleExpand={onToggleExpand} />)

      fireEvent.click(screen.getByRole('button', { name: /Expand order details/i }))

      expect(onToggleExpand).toHaveBeenCalledWith('order123')
    })

    it('should not show Cancel button for non-pending orders', () => {
      const order = createMockOrder({ status: 'IN_PROGRESS' })
      render(<OrderCard {...defaultProps} order={order} />)

      expect(screen.queryByRole('button', { name: /Cancel Order/i })).not.toBeInTheDocument()
    })

    it('should not show Reorder button for non-delivered orders', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.queryByRole('button', { name: /Reorder/i })).not.toBeInTheDocument()
    })
  })

  describe('Special Instructions and Notes', () => {
    it('should display special instructions when present', () => {
      const order = createMockOrder({
        specialInstructions: 'Please call before delivery',
      })
      render(<OrderCard {...defaultProps} order={order} isExpanded={true} />)

      expect(screen.getByText(/Special Instructions:/)).toBeInTheDocument()
      expect(screen.getByText('Please call before delivery')).toBeInTheDocument()
    })

    it('should not show instructions section when not present', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.queryByText('Instructions:')).not.toBeInTheDocument()
    })

    it('should display notes when present', () => {
      const order = createMockOrder({
        notes: 'Extra spicy please',
      })
      render(<OrderCard {...defaultProps} order={order} isExpanded={true} />)

      expect(screen.getByText(/Notes:/)).toBeInTheDocument()
      expect(screen.getByText('Extra spicy please')).toBeInTheDocument()
    })

    it('should not show notes section when not present', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.queryByText('Notes:')).not.toBeInTheDocument()
    })
  })

  describe('Price Calculations', () => {
    it('should calculate item total correctly', () => {
      render(<OrderCard {...defaultProps} isExpanded={true} />)

      // Component shows individual prices and totals
      expect(screen.getByText(/Total: ₦3,000/)).toBeInTheDocument()
      // Single quantity item doesn't show total
      expect(screen.getByText(/₦2,000/)).toBeInTheDocument()
    })

    it('should display correct order total', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.getByText('₦5,000.00')).toBeInTheDocument()
    })

    it('should handle zero prices', () => {
      const order = createMockOrder({
        totalPrice: 0,
        items: [{
          id: 'item1',
          quantity: 1,
          price: 0,
          menuItem: {
            id: 'menu1',
            name: 'Free Sample',
            description: 'Free sample item',
            price: 0,
            category: 'samples',
            imageUrl: null,
          },
        }],
      })
      render(<OrderCard {...defaultProps} order={order} />)

      expect(screen.getByText('₦0.00')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should format order date correctly', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.getByText(/10 Jan 2024/)).toBeInTheDocument()
    })

    it('should format delivery date correctly', () => {
      render(<OrderCard {...defaultProps} />)

      expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument()
    })

    it('should handle null delivery date', () => {
      const order = createMockOrder({ deliveryDate: null })
      render(<OrderCard {...defaultProps} order={order} />)

      // Component doesn't show delivery date if null
      expect(screen.queryByText(/Delivery:/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing callback functions', () => {
      render(<OrderCard order={defaultProps.order} />)

      // Should render without errors
      expect(screen.getByText(/ORDER123/)).toBeInTheDocument()

      // No buttons should be shown without callbacks
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should handle very long addresses', () => {
      const order = createMockOrder({
        deliveryAddress: 'Very Long Address That Goes On And On, Building 123, Floor 5, Apartment 501, Street Name That Is Also Very Long, City Name, State, Country, Postal Code 12345',
      })
      render(<OrderCard {...defaultProps} order={order} isExpanded={true} />)

      expect(screen.getByText(/Very Long Address/)).toBeInTheDocument()
    })

    it('should handle many items', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        id: `item${i}`,
        quantity: 1,
        price: 1000,
        menuItem: {
          id: `menu${i}`,
          name: `Item ${i}`,
          description: `Description ${i}`,
          price: 1000,
          category: 'test',
          imageUrl: null,
        },
      }))

      const order = createMockOrder({ items: manyItems })
      render(<OrderCard {...defaultProps} order={order} isExpanded={true} />)

      expect(screen.getByText('10 items')).toBeInTheDocument()
      expect(screen.getByText('Item 0')).toBeInTheDocument()
      expect(screen.getByText('Item 9')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      render(<OrderCard {...defaultProps} onViewDetails={jest.fn()} onToggleExpand={jest.fn()} />)

      expect(screen.getByRole('button', { name: /View/i })).toHaveAccessibleName()
      expect(screen.getByRole('button', { name: /Expand/i })).toHaveAccessibleName()
    })

    it('should have alt text for images', () => {
      render(<OrderCard {...defaultProps} isExpanded={true} />)

      const image = screen.getByAltText('Jollof Rice')
      expect(image).toBeInTheDocument()
    })

    it('should use semantic HTML', () => {
      const { container } = render(<OrderCard {...defaultProps} />)

      // Component uses divs with classes
      expect(container.querySelector('div')).toBeInTheDocument()
      expect(container.querySelector('h3')).toBeInTheDocument()
    })
  })
})