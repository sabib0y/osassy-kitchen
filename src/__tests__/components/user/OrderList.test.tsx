import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderList from '@/components/user/OrderList'

// Mock useOrders hook
jest.mock('@/hooks/useOrders', () => ({
  useOrders: jest.fn(() => ({
    orders: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      total: 0,
    },
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    filters: {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    },
    updateFilters: jest.fn(),
    clearFilters: jest.fn(),
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    goToPage: jest.fn(),
    nextPage: jest.fn(),
    prevPage: jest.fn(),
    refetch: jest.fn(),
  })),
}))

// Mock OrderCard component
jest.mock('@/components/user/OrderCard', () => {
  return function MockOrderCard({ order, onViewDetails, onDownloadInvoice, isExpanded, onToggleExpand }: any) {
    return (
      <div data-testid={`order-card-${order.id}`}>
        <div data-testid="order-id">{order.id}</div>
        <div data-testid="order-status">{order.status}</div>
        <div data-testid="order-total">{order.totalAmount}</div>
        <button onClick={() => onViewDetails && onViewDetails(order.id)}>View Details</button>
        <button onClick={() => onToggleExpand && onToggleExpand(order.id)}>Toggle Expand</button>
        {isExpanded && <div data-testid="expanded-content">Expanded</div>}
      </div>
    )
  }
})

// Mock styles
jest.mock('@/styles/components/user/orders.module.scss', () => ({
  orderList: 'orderList',
  header: 'header',
  title: 'title',
  filterSection: 'filterSection',
  filterToggle: 'filterToggle',
  filterPanel: 'filterPanel',
  searchBar: 'searchBar',
  filterGroup: 'filterGroup',
  filterLabel: 'filterLabel',
  filterInput: 'filterInput',
  filterSelect: 'filterSelect',
  filterActions: 'filterActions',
  clearButton: 'clearButton',
  applyButton: 'applyButton',
  ordersGrid: 'ordersGrid',
  loadingContainer: 'loadingContainer',
  spinner: 'spinner',
  errorContainer: 'errorContainer',
  errorMessage: 'errorMessage',
  retryButton: 'retryButton',
  emptyState: 'emptyState',
  emptyIcon: 'emptyIcon',
  emptyTitle: 'emptyTitle',
  emptyMessage: 'emptyMessage',
  pagination: 'pagination',
  pageInfo: 'pageInfo',
  pageControls: 'pageControls',
  pageButton: 'pageButton',
  disabled: 'disabled',
  pageNumbers: 'pageNumbers',
  pageNumber: 'pageNumber',
  active: 'active',
  show: 'show',
}))

// Helper to create test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('OrderList', () => {
  let mockUseOrders: jest.Mock

  beforeEach(() => {
    mockUseOrders = require('@/hooks/useOrders').useOrders as jest.Mock
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render order list with title', () => {
      const { container } = render(<OrderList />, { wrapper: createWrapper() })
      
      expect(container.querySelector('.orderList')).toBeInTheDocument()
    })

    it('should display orders when available', () => {
      mockUseOrders.mockReturnValue({
        orders: [
          { id: '1', status: 'PENDING', totalAmount: 5000 },
          { id: '2', status: 'DELIVERED', totalAmount: 7500 },
        ],
        pagination: { currentPage: 1, totalPages: 1, hasMore: false, total: 2 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      expect(screen.getByTestId('order-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-2')).toBeInTheDocument()
    })

    it('should display empty state when no orders', () => {
      mockUseOrders.mockReturnValue({
        orders: [],
        pagination: { currentPage: 1, totalPages: 0, hasMore: false, total: 0 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      // Component shows empty state text
      expect(screen.getByText(/No orders found/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockUseOrders.mockReturnValue({
        orders: [],
        pagination: { currentPage: 1, totalPages: 0, hasMore: false, total: 0 },
        isLoading: true,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      // Component shows loading text
      expect(screen.getByText(/Loading orders/i)).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      mockUseOrders.mockReturnValue({
        orders: [],
        pagination: { currentPage: 1, totalPages: 0, hasMore: false, total: 0 },
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch orders'),
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument()
    })

    it('should allow retry on error', () => {
      const mockRefetch = jest.fn()
      mockUseOrders.mockReturnValue({
        orders: [],
        pagination: { currentPage: 1, totalPages: 0, hasMore: false, total: 0 },
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch orders'),
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: mockRefetch,
      })

      render(<OrderList />, { wrapper: createWrapper() })

      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Filtering', () => {
    it('should toggle filter panel', () => {
      mockUseOrders.mockReturnValue({
        orders: [],
        pagination: { currentPage: 1, totalPages: 0, hasMore: false, total: 0 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      const filterToggle = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterToggle)

      // Filter panel should be visible after clicking
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('should update search filter', async () => {
      const mockUpdateFilters = jest.fn()
      mockUseOrders.mockReturnValue({
        orders: [],
        pagination: { currentPage: 1, totalPages: 0, hasMore: false, total: 0 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: mockUpdateFilters,
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      // Open filters
      const filterToggle = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterToggle)

      // Update search
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'ORD-123' } })

      // Apply filters
      const applyButton = screen.getByRole('button', { name: /apply/i })
      fireEvent.click(applyButton)

      await waitFor(() => {
        expect(mockUpdateFilters).toHaveBeenCalledWith(expect.objectContaining({ search: 'ORD-123' }))
      })
    })

    it('should clear filters', () => {
      const mockClearFilters = jest.fn()
      mockUseOrders.mockReturnValue({
        orders: [],
        pagination: { currentPage: 1, totalPages: 0, hasMore: false, total: 0 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: 'test', status: 'PENDING', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: mockClearFilters,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      // Open filters
      const filterToggle = screen.getByRole('button', { name: /filter/i })
      fireEvent.click(filterToggle)

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)

      expect(mockClearFilters).toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      mockUseOrders.mockReturnValue({
        orders: [{ id: '1', status: 'PENDING', totalAmount: 5000 }],
        pagination: { currentPage: 2, totalPages: 5, hasMore: true, total: 50 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 2,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      const { container } = render(<OrderList />, { wrapper: createWrapper() })

      expect(container.querySelector('.pagination')).toBeInTheDocument()
      expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument()
    })

    it('should navigate to next page', () => {
      const mockNextPage = jest.fn()
      mockUseOrders.mockReturnValue({
        orders: [{ id: '1', status: 'PENDING', totalAmount: 5000 }],
        pagination: { currentPage: 1, totalPages: 3, hasMore: true, total: 30 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: mockNextPage,
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      expect(mockNextPage).toHaveBeenCalled()
    })

    it('should navigate to previous page', () => {
      const mockPrevPage = jest.fn()
      mockUseOrders.mockReturnValue({
        orders: [{ id: '1', status: 'PENDING', totalAmount: 5000 }],
        pagination: { currentPage: 2, totalPages: 3, hasMore: true, total: 30 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: mockPrevPage,
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      const prevButton = screen.getByRole('button', { name: /previous/i })
      fireEvent.click(prevButton)

      expect(mockPrevPage).toHaveBeenCalled()
    })

    it('should navigate to specific page', () => {
      const mockGoToPage = jest.fn()
      mockUseOrders.mockReturnValue({
        orders: [{ id: '1', status: 'PENDING', totalAmount: 5000 }],
        pagination: { currentPage: 1, totalPages: 5, hasMore: true, total: 50 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: false,
        goToPage: mockGoToPage,
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      const page3Button = screen.getByRole('button', { name: '3' })
      fireEvent.click(page3Button)

      expect(mockGoToPage).toHaveBeenCalledWith(3)
    })
  })

  describe('Order Interaction', () => {
    it('should handle order selection', () => {
      const onOrderSelect = jest.fn()
      mockUseOrders.mockReturnValue({
        orders: [
          { id: '1', status: 'PENDING', totalAmount: 5000 },
        ],
        pagination: { currentPage: 1, totalPages: 1, hasMore: false, total: 1 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList onOrderSelect={onOrderSelect} />, { wrapper: createWrapper() })

      const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
      fireEvent.click(viewDetailsButton)

      expect(onOrderSelect).toHaveBeenCalledWith('1')
    })

    it('should toggle order expansion', () => {
      mockUseOrders.mockReturnValue({
        orders: [
          { id: '1', status: 'PENDING', totalAmount: 5000 },
        ],
        pagination: { currentPage: 1, totalPages: 1, hasMore: false, total: 1 },
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        filters: { search: '', status: '', dateFrom: '', dateTo: '' },
        updateFilters: jest.fn(),
        clearFilters: jest.fn(),
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        goToPage: jest.fn(),
        nextPage: jest.fn(),
        prevPage: jest.fn(),
        refetch: jest.fn(),
      })

      render(<OrderList />, { wrapper: createWrapper() })

      const toggleButton = screen.getByRole('button', { name: /toggle expand/i })
      
      // Initially not expanded
      expect(screen.queryByTestId('expanded-content')).not.toBeInTheDocument()
      
      // Click to expand
      fireEvent.click(toggleButton)
      
      // Should be expanded
      expect(screen.getByTestId('expanded-content')).toBeInTheDocument()
    })
  })
})