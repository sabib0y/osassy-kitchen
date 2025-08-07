import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

import { api } from '@/lib/api-client'
import useOrders, { getStatusColor, formatOrderStatus, formatOrderDate, formatCurrency } from '@/hooks/useOrders'
import { createMockApiResponse, createMockOrder } from '../test-utils'

// Mock the api client
jest.mock('@/lib/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))
const mockApi = api as jest.Mocked<typeof api>

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOrders hook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Basic Functionality', () => {
    it('should fetch orders successfully', async () => {
      const mockOrders = [
        createMockOrder({ id: '1' }),
        createMockOrder({ id: '2' }),
      ]
      const mockResponse = {
        orders: mockOrders,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockApi.get).toHaveBeenCalledWith('/user/orders', {
        page: 1,
        limit: 10,
      })
      expect(result.current.orders).toHaveLength(2)
      expect(result.current.totalOrders).toBe(2)
    })

    it('should handle empty orders list', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.orders).toEqual([])
      expect(result.current.isEmpty).toBe(true)
      expect(result.current.totalOrders).toBe(0)
    })
  })

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      const mockResponse = {
        orders: [createMockOrder()],
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalCount: 50,
          hasNextPage: true,
          hasPrevPage: true,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders({ initialPage: 2 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.currentPage).toBe(2)
      expect(result.current.totalPages).toBe(5)
      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.hasPrevPage).toBe(true)
    })

    it('should navigate to next page', async () => {
      const mockResponse1 = {
        orders: [createMockOrder({ id: '1' })],
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 30,
          hasNextPage: true,
          hasPrevPage: false,
          limit: 10,
        },
      }

      const mockResponse2 = {
        orders: [createMockOrder({ id: '2' })],
        pagination: {
          currentPage: 2,
          totalPages: 3,
          totalCount: 30,
          hasNextPage: true,
          hasPrevPage: true,
          limit: 10,
        },
      }

      mockApi.get
        .mockResolvedValueOnce(createMockApiResponse(mockResponse1))
        .mockResolvedValueOnce(createMockApiResponse(mockResponse2))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.currentPage).toBe(1)

      act(() => {
        result.current.nextPage()
      })

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2)
      })

      expect(mockApi.get).toHaveBeenCalledWith('/user/orders', {
        page: 2,
        limit: 10,
      })
    })

    it('should navigate to previous page', async () => {
      const mockResponse = {
        orders: [createMockOrder()],
        pagination: {
          currentPage: 2,
          totalPages: 3,
          totalCount: 30,
          hasNextPage: true,
          hasPrevPage: true,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders({ initialPage: 2 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.prevPage()
      })

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1)
      })
    })

    it('should go to specific page', async () => {
      const mockResponse = {
        orders: [createMockOrder()],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalCount: 50,
          hasNextPage: true,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.goToPage(3)
      })

      await waitFor(() => {
        expect(result.current.currentPage).toBe(3)
      })
    })

    it('should not navigate beyond boundaries', async () => {
      const mockResponse = {
        orders: [createMockOrder()],
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 30,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Try to go beyond last page
      act(() => {
        result.current.goToPage(5)
      })

      expect(result.current.currentPage).toBe(1) // Should stay at 1

      // Try to go before first page
      act(() => {
        result.current.goToPage(0)
      })

      expect(result.current.currentPage).toBe(1) // Should stay at 1
    })

    it('should not call nextPage when on last page', async () => {
      const mockResponse = {
        orders: [createMockOrder()],
        pagination: {
          currentPage: 3,
          totalPages: 3,
          totalCount: 30,
          hasNextPage: false,
          hasPrevPage: true,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders({ initialPage: 3 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const currentPage = result.current.currentPage

      act(() => {
        result.current.nextPage()
      })

      expect(result.current.currentPage).toBe(currentPage) // Should not change
    })

    it('should not call prevPage when on first page', async () => {
      const mockResponse = {
        orders: [createMockOrder()],
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 30,
          hasNextPage: true,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.prevPage()
      })

      expect(result.current.currentPage).toBe(1) // Should stay at 1
    })
  })

  describe('Filtering', () => {
    it('should apply search filter', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateFilters({ search: 'jollof' })
      })

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/user/orders', {
          page: 1,
          limit: 10,
          search: 'jollof',
        })
      })
    })

    it('should apply status filter', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateFilters({ status: 'DELIVERED' })
      })

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/user/orders', {
          page: 1,
          limit: 10,
          status: 'DELIVERED',
        })
      })
    })

    it('should apply date filters', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateFilters({
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
        })
      })

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/user/orders', {
          page: 1,
          limit: 10,
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
        })
      })
    })

    it('should reset to page 1 when filters change', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 3,
          totalPages: 5,
          totalCount: 50,
          hasNextPage: true,
          hasPrevPage: true,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders({ initialPage: 3 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.currentPage).toBe(3)

      act(() => {
        result.current.updateFilters({ search: 'test' })
      })

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1)
      })
    })

    it('should clear all filters', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(
        () => useOrders({
          initialFilters: { search: 'test', status: 'PENDING' },
        }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.filters.search).toBe('test')
      expect(result.current.filters.status).toBe('PENDING')

      act(() => {
        result.current.clearFilters()
      })

      await waitFor(() => {
        expect(result.current.filters.search).toBe('')
        expect(result.current.filters.status).toBe('')
        expect(result.current.currentPage).toBe(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle 401 authentication error', async () => {
      const error = { status: 401 }
      mockApi.get.mockRejectedValue(error)

      const { result } = renderHook(() => useOrders({ retry: false }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error?.message).toBe('Authentication required. Please log in.')
    })

    it('should handle 403 forbidden error', async () => {
      const error = { status: 403 }
      mockApi.get.mockRejectedValue(error)

      const { result } = renderHook(() => useOrders({ retry: false }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error?.message).toBe('Access denied. You do not have permission to view orders.')
    })

    it('should handle 5xx server errors', async () => {
      const error = { status: 500 }
      mockApi.get.mockRejectedValue(error)

      const { result } = renderHook(() => useOrders({ retry: false }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error?.message).toBe('Server error. Please try again later.')
    })

    it('should handle generic errors', async () => {
      const error = { message: 'Network error' }
      mockApi.get.mockRejectedValue(error)

      const { result } = renderHook(() => useOrders({ retry: false }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error?.message).toBe('Network error')
    })

    it('should handle no data from server', async () => {
      mockApi.get.mockResolvedValue({ data: null })

      const { result } = renderHook(() => useOrders({ retry: false }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error?.message).toBe('No data received from server')
    })

    it('should not retry on authentication errors', async () => {
      const error = { status: 401 }
      mockApi.get.mockRejectedValue(error)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { 
            retry: (failureCount, error: any) => {
              if (error?.status === 401 || error?.status === 403) {
                return false
              }
              return failureCount < 3
            },
          },
        },
      })

      renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(1) // Should not retry
      })
    })
  })

  describe('Loading States', () => {
    it('should handle loading state correctly', async () => {
      let resolve: (value: any) => void
      const promise = new Promise((res) => {
        resolve = res
      })
      mockApi.get.mockReturnValue(promise)

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)

      resolve!(createMockApiResponse({
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isFetching).toBe(false)
      })
    })
  })

  describe('Refetch', () => {
    it('should refetch data on demand', async () => {
      const mockResponse = {
        orders: [createMockOrder()],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockApi.get).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Custom Options', () => {
    it('should use custom initial limit', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 20,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      renderHook(() => useOrders({ initialLimit: 20 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/user/orders', {
          page: 1,
          limit: 20,
        })
      })
    })

    it('should use initial filters', async () => {
      const mockResponse = {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
        },
      }

      mockApi.get.mockResolvedValue(createMockApiResponse(mockResponse))

      renderHook(
        () => useOrders({
          initialFilters: {
            status: 'PENDING',
            dateFrom: '2024-01-01',
          },
        }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/user/orders', {
          page: 1,
          limit: 10,
          status: 'PENDING',
          dateFrom: '2024-01-01',
        })
      })
    })

    it('should respect enabled option', () => {
      renderHook(() => useOrders({ enabled: false }), {
        wrapper: createWrapper(queryClient),
      })

      expect(mockApi.get).not.toHaveBeenCalled()
    })
  })

  describe('Utility Functions', () => {
    describe('getStatusColor', () => {
      it('should return correct colors for status', () => {
        expect(getStatusColor('DELIVERED')).toBe('success')
        expect(getStatusColor('IN_PROGRESS')).toBe('warning')
        expect(getStatusColor('CANCELLED')).toBe('danger')
        expect(getStatusColor('PENDING')).toBe('info')
        expect(getStatusColor('UNKNOWN')).toBe('secondary')
      })
    })

    describe('formatOrderStatus', () => {
      it('should format status correctly', () => {
        expect(formatOrderStatus('IN_PROGRESS')).toBe('IN PROGRESS')
        expect(formatOrderStatus('DELIVERED')).toBe('DELIVERED')
        expect(formatOrderStatus('PENDING')).toBe('PENDING')
      })
    })

    describe('formatOrderDate', () => {
      it('should format date correctly', () => {
        expect(formatOrderDate('2024-01-15T10:30:00Z')).toMatch(/15 Jan 2024/)
        expect(formatOrderDate(null)).toBe('N/A')
        expect(formatOrderDate('')).toBe('N/A')
      })
    })

    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(formatCurrency(1000)).toBe('₦1,000')
        expect(formatCurrency(1500.50)).toBe('₦1,500.5')
        expect(formatCurrency(0)).toBe('₦0')
      })
    })
  })
})