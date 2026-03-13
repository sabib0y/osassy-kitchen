import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

import { apiClient } from '@/lib/api-client'
import {
  useMenuItems,
  useAvailableMenuItems,
  useSearchMenuItems,
  useMenuItemsByCategory,
} from '@/hooks/useMenuItems'
import { createMockApiResponse, createMockMenuItem } from '../test-utils'
import type { ApiResponse } from '@/lib/api-types'

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = (queryClient: QueryClient) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useMenuItems hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          retryDelay: 0,
        },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('useMenuItems', () => {
    it('should fetch menu items successfully', async () => {
      const mockItems = [
        createMockMenuItem({ id: '1', name: 'Jollof Rice' }),
        createMockMenuItem({ id: '2', name: 'Fried Rice' }),
      ]
      const mockResponse = createMockApiResponse({
        menuItems: mockItems,
        total: 2,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useMenuItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {})
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].name).toBe('Jollof Rice')
    })

    it('should pass category filter correctly', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [],
        total: 0,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useMenuItems({ category: 'rice-dishes' }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          category: 'rice-dishes',
        })
      })
    })

    it('should handle search parameter', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [createMockMenuItem({ name: 'Jollof Rice' })],
        total: 1,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useMenuItems({ search: 'jollof' }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          search: 'jollof',
        })
      })
    })

    it('should handle availability filter', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [],
        total: 0,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useMenuItems({ availability: 'available' }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          availability: 'available',
        })
      })
    })

    it('should handle pagination parameters', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [],
        total: 100,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useMenuItems({ page: 2, limit: 20 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          page: 2,
          limit: 20,
        })
      })
    })

    it('should not fetch when disabled', () => {
      renderHook(() => useMenuItems({ enabled: false }), {
        wrapper: createWrapper(queryClient),
      })

      expect(mockApiClient.get).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to fetch menu items'
      mockApiClient.get.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useMenuItems({ retry: false, retryDelay: 0 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error?.message).toBe(errorMessage)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle empty response', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [],
        total: 0,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useMenuItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })

    it('should use stale time correctly', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [createMockMenuItem()],
        total: 1,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      const staleTime = 10000 // 10 seconds
      const { result } = renderHook(
        () => useMenuItems({ staleTime }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // First call
      expect(mockApiClient.get).toHaveBeenCalledTimes(1)

      // Remount the hook - should use cached data
      const { result: result2 } = renderHook(
        () => useMenuItems({ staleTime }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Should not fetch again due to stale time
      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
      expect(result2.current.data).toEqual(result.current.data)
    })

    it('should transform API response correctly', async () => {
      const mockItem = {
        id: '1',
        name: 'Test Dish',
        description: 'Test description',
        price: 1500,
        category: 'rice-dishes',
        imageUrl: 'https://example.com/image.jpg',
        available: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        subscriptionUsage: 10,
      }
      const mockResponse = createMockApiResponse({
        menuItems: [mockItem],
        total: 1,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useMenuItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const transformedItem = result.current.data?.[0]
      expect(transformedItem).toEqual({
        id: '1',
        name: 'Test Dish',
        description: 'Test description',
        price: 1500,
        category: 'rice-dishes',
        imageUrl: 'https://example.com/image.jpg',
        available: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        subscriptionUsage: 10,
      })
    })

    it('should handle null imageUrl correctly', async () => {
      const mockItem = {
        ...createMockMenuItem(),
        imageUrl: null,
      }
      const mockResponse = createMockApiResponse({
        menuItems: [mockItem],
        total: 1,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useMenuItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.[0].imageUrl).toBeUndefined()
    })

    it('should handle unsuccessful API response', async () => {
      const mockResponse = {
        success: false,
        data: null,
      }
      mockApiClient.get.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useMenuItems({ retry: false, retryDelay: 0 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error?.message).toBe('Failed to fetch menu items')
    })
  })

  describe('useAvailableMenuItems', () => {
    it('should fetch only available items', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [createMockMenuItem({ available: true })],
        total: 1,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useAvailableMenuItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          availability: 'available',
        })
      })
    })

    it('should merge options with availability filter', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [],
        total: 0,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useAvailableMenuItems({ category: 'soups' }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          availability: 'available',
          category: 'soups',
        })
      })
    })
  })

  describe('useSearchMenuItems', () => {
    it('should search menu items with search term', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [createMockMenuItem({ name: 'Jollof Rice' })],
        total: 1,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useSearchMenuItems('jollof'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          search: 'jollof',
        })
      })
    })

    it('should not search with empty search term', () => {
      renderHook(() => useSearchMenuItems(''), {
        wrapper: createWrapper(queryClient),
      })

      expect(mockApiClient.get).not.toHaveBeenCalled()
    })

    it('should merge options with search term', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [],
        total: 0,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(
        () => useSearchMenuItems('rice', { category: 'rice-dishes' }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          search: 'rice',
          category: 'rice-dishes',
        })
      })
    })

    it('should respect enabled option', () => {
      renderHook(() => useSearchMenuItems('jollof', { enabled: false }), {
        wrapper: createWrapper(queryClient),
      })

      expect(mockApiClient.get).not.toHaveBeenCalled()
    })
  })

  describe('useMenuItemsByCategory', () => {
    it('should fetch items by category', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [createMockMenuItem({ category: 'soups' })],
        total: 1,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(() => useMenuItemsByCategory('soups'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          category: 'soups',
        })
      })
    })

    it('should not fetch with empty category', () => {
      renderHook(() => useMenuItemsByCategory(''), {
        wrapper: createWrapper(queryClient),
      })

      expect(mockApiClient.get).not.toHaveBeenCalled()
    })

    it('should merge options with category', async () => {
      const mockResponse = createMockApiResponse({
        menuItems: [],
        total: 0,
      })
      mockApiClient.get.mockResolvedValue(mockResponse)

      renderHook(
        () => useMenuItemsByCategory('rice-dishes', { availability: 'available' }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', {
          category: 'rice-dishes',
          availability: 'available',
        })
      })
    })
  })

  describe('Error handling and retries', () => {
    it('should retry failed requests', async () => {
      const error = new Error('Network error')
      mockApiClient.get
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(
          createMockApiResponse({
            menuItems: [createMockMenuItem()],
            total: 1,
          })
        )

      const { result } = renderHook(() => useMenuItems(), {
        wrapper: createWrapper(
          new QueryClient({
            defaultOptions: {
              queries: { 
                retry: 2,
                retryDelay: 0,
              },
            },
          })
        ),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      }, { timeout: 5000 })

      expect(mockApiClient.get).toHaveBeenCalledTimes(3)
    })

    it('should handle console errors properly', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('API Error')
      mockApiClient.get.mockRejectedValue(error)

      const { result } = renderHook(() => useMenuItems({ retry: false, retryDelay: 0 }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching menu items:', error)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Loading states', () => {
    it('should handle loading states correctly', async () => {
      let resolve: (value: any) => void
      const promise = new Promise<ApiResponse<any>>((res) => {
        resolve = res
      })
      mockApiClient.get.mockReturnValue(promise)

      const { result } = renderHook(() => useMenuItems(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.data).toBeUndefined()

      resolve!(
        createMockApiResponse({
          menuItems: [createMockMenuItem()],
          total: 1,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isSuccess).toBe(true)
      })
    })
  })
})