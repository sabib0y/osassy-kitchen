import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

import { apiClient } from '@/lib/api-client'
import {
  useMenuItems,
  useMenuStats,
  useOrders,
  useUserOrders,
  useOrder,
  useSubscriptions,
  useUserSubscriptions,
  useSubscription,
  useUserProfile,
  useAdminDashboard,
  useUserDashboard,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useCreateOrder,
  useUpdateOrder,
  useCreateSubscription,
  useUpdateProfile,
  useApiError,
  useInvalidateQueries,
  queryKeys,
} from '@/hooks/useApi'
import { createMockApiResponse, createMockMenuItem, createMockOrder, createMockUser } from '../test-utils'
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

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

const createWrapper = (queryClient: QueryClient) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useApi hooks', () => {
  let queryClient: QueryClient
  let mockPush: jest.Mock
  let mockRouter: any

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    mockPush = jest.fn()
    mockRouter = {
      push: mockPush,
      query: {},
      pathname: '/',
      asPath: '/',
      route: '/',
    }
    mockUseRouter.mockReturnValue(mockRouter)

    jest.clearAllMocks()
  })

  describe('Query Keys', () => {
    it('should generate correct query keys', () => {
      expect(queryKeys.menuItems()).toEqual(['menu-items', undefined])
      expect(queryKeys.menuItems({ category: 'main' })).toEqual(['menu-items', { category: 'main' }])
      expect(queryKeys.menuItem('1')).toEqual(['menu-items', '1'])
      expect(queryKeys.orders({ status: 'PENDING' })).toEqual(['orders', { status: 'PENDING' }])
      expect(queryKeys.userProfile).toEqual(['user-profile'])
    })
  })

  describe('useApiError', () => {
    it('should redirect to login on 401 error', () => {
      const { result } = renderHook(() => useApiError(), {
        wrapper: createWrapper(queryClient),
      })

      const error = { message: 'Unauthorized', status: 401 }
      result.current(error)

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should redirect to unauthorized on 403 error', () => {
      const { result } = renderHook(() => useApiError(), {
        wrapper: createWrapper(queryClient),
      })

      const error = { message: 'Forbidden', status: 403 }
      result.current(error)

      expect(mockPush).toHaveBeenCalledWith('/unauthorized')
    })

    it('should not redirect on other errors', () => {
      const { result } = renderHook(() => useApiError(), {
        wrapper: createWrapper(queryClient),
      })

      const error = { message: 'Server Error', status: 500 }
      result.current(error)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Menu Hooks', () => {
    describe('useMenuItems', () => {
      it('should fetch menu items successfully', async () => {
        const mockItems = [createMockMenuItem()]
        const mockResponse = createMockApiResponse(mockItems)
        mockApiClient.get.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useMenuItems(), {
          wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', undefined)
        expect(result.current.data).toEqual(mockResponse)
      })

      it('should pass parameters correctly', async () => {
        const params = { category: 'main', search: 'test' }
        const mockResponse = createMockApiResponse([])
        mockApiClient.get.mockResolvedValue(mockResponse)

        renderHook(() => useMenuItems(params), {
          wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
          expect(mockApiClient.get).toHaveBeenCalledWith('/menu-items', params)
        })
      })
    })

    describe('useMenuStats', () => {
      it('should fetch menu stats when user is admin', async () => {
        mockUseSession.mockReturnValue({
          data: { user: { role: 'ADMIN' }, expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const mockStats = { totalItems: 10, availableItems: 8, totalCategories: 3, averagePrice: 12.5 }
        const mockResponse = createMockApiResponse(mockStats)
        mockApiClient.get.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useMenuStats(), {
          wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.get).toHaveBeenCalledWith('/admin/menu-items/stats')
      })

      it('should not fetch when user is not admin', async () => {
        mockUseSession.mockReturnValue({
          data: { user: { role: 'USER' }, expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const { result } = renderHook(() => useMenuStats(), {
          wrapper: createWrapper(queryClient),
        })

        expect(result.current.isPending).toBe(true)
        expect(mockApiClient.get).not.toHaveBeenCalled()
      })
    })
  })

  describe('Order Hooks', () => {
    describe('useOrders', () => {
      it('should fetch orders when user is admin', async () => {
        mockUseSession.mockReturnValue({
          data: { user: { role: 'ADMIN' }, expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const mockOrders = { data: [createMockOrder()], pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false, hasPrevPage: false, limit: 10 } }
        const mockResponse = createMockApiResponse(mockOrders)
        mockApiClient.get.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useOrders(), {
          wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.get).toHaveBeenCalledWith('/admin/orders', undefined)
      })

      it('should not fetch when user is not admin', async () => {
        mockUseSession.mockReturnValue({
          data: { user: { role: 'USER' }, expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const { result } = renderHook(() => useOrders(), {
          wrapper: createWrapper(queryClient),
        })

        expect(result.current.isPending).toBe(true)
        expect(mockApiClient.get).not.toHaveBeenCalled()
      })
    })

    describe('useUserOrders', () => {
      it('should fetch user orders when authenticated', async () => {
        mockUseSession.mockReturnValue({
          data: { user: createMockUser(), expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const mockOrders = { data: [createMockOrder()], pagination: { currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false, hasPrevPage: false, limit: 10 } }
        const mockResponse = createMockApiResponse(mockOrders)
        mockApiClient.get.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useUserOrders(), {
          wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.get).toHaveBeenCalledWith('/user/orders', undefined)
      })

      it('should not fetch when not authenticated', async () => {
        mockUseSession.mockReturnValue({
          data: null,
          status: 'unauthenticated',
        } as any)

        const { result } = renderHook(() => useUserOrders(), {
          wrapper: createWrapper(queryClient),
        })

        expect(result.current.isPending).toBe(true)
        expect(mockApiClient.get).not.toHaveBeenCalled()
      })
    })

    describe('useOrder', () => {
      it('should fetch specific order when authenticated and ID provided', async () => {
        mockUseSession.mockReturnValue({
          data: { user: createMockUser(), expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const mockOrder = createMockOrder({ id: '123' })
        const mockResponse = createMockApiResponse(mockOrder)
        mockApiClient.get.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useOrder('123'), {
          wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.get).toHaveBeenCalledWith('/admin/orders/123')
      })

      it('should not fetch when ID is empty', async () => {
        mockUseSession.mockReturnValue({
          data: { user: createMockUser(), expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const { result } = renderHook(() => useOrder(''), {
          wrapper: createWrapper(queryClient),
        })

        expect(result.current.isPending).toBe(true)
        expect(mockApiClient.get).not.toHaveBeenCalled()
      })
    })
  })

  describe('Profile Hooks', () => {
    describe('useUserProfile', () => {
      it('should fetch user profile when authenticated', async () => {
        mockUseSession.mockReturnValue({
          data: { user: createMockUser(), expires: '2024-12-31' },
          status: 'authenticated',
        } as any)

        const mockProfile = createMockUser()
        const mockResponse = createMockApiResponse(mockProfile)
        mockApiClient.get.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useUserProfile(), {
          wrapper: createWrapper(queryClient),
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.get).toHaveBeenCalledWith('/user/profile')
      })

      it('should not fetch when not authenticated', async () => {
        mockUseSession.mockReturnValue({
          data: null,
          status: 'unauthenticated',
        } as any)

        const { result } = renderHook(() => useUserProfile(), {
          wrapper: createWrapper(queryClient),
        })

        expect(result.current.isPending).toBe(true)
        expect(mockApiClient.get).not.toHaveBeenCalled()
      })
    })
  })

  describe('Mutation Hooks', () => {
    describe('useCreateMenuItem', () => {
      it('should create menu item and invalidate cache', async () => {
        const mockMenuItem = createMockMenuItem()
        const mockResponse = createMockApiResponse(mockMenuItem)
        mockApiClient.post.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useCreateMenuItem(), {
          wrapper: createWrapper(queryClient),
        })

        const newItemData = {
          name: 'New Dish',
          description: 'New delicious dish',
          price: 20.99,
          category: 'Main Course',
          available: true,
        }

        result.current.mutate(newItemData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.post).toHaveBeenCalledWith('/admin/menu-items', newItemData)
      })
    })

    describe('useUpdateMenuItem', () => {
      it('should update menu item and invalidate cache', async () => {
        const mockMenuItem = createMockMenuItem({ id: '123' })
        const mockResponse = createMockApiResponse(mockMenuItem)
        mockApiClient.put.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useUpdateMenuItem(), {
          wrapper: createWrapper(queryClient),
        })

        const updateData = {
          id: '123',
          name: 'Updated Dish',
          price: 22.99,
        }

        result.current.mutate(updateData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.put).toHaveBeenCalledWith('/admin/menu-items/123', updateData)
      })
    })

    describe('useDeleteMenuItem', () => {
      it('should delete menu item and invalidate cache', async () => {
        const mockResponse = createMockApiResponse(null)
        mockApiClient.delete.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useDeleteMenuItem(), {
          wrapper: createWrapper(queryClient),
        })

        result.current.mutate('123')

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.delete).toHaveBeenCalledWith('/admin/menu-items/123')
      })
    })

    describe('useCreateOrder', () => {
      it('should create order and invalidate cache', async () => {
        const mockOrder = createMockOrder()
        const mockResponse = createMockApiResponse(mockOrder)
        mockApiClient.post.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useCreateOrder(), {
          wrapper: createWrapper(queryClient),
        })

        const orderData = {
          items: [{ menuItemId: '1', quantity: 2 }],
          deliveryAddress: '123 Test St',
        }

        result.current.mutate(orderData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.post).toHaveBeenCalledWith('/user/orders', orderData)
      })
    })

    describe('useUpdateOrder', () => {
      it('should update order and invalidate cache', async () => {
        const mockOrder = createMockOrder({ id: '123' })
        const mockResponse = createMockApiResponse(mockOrder)
        mockApiClient.put.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useUpdateOrder(), {
          wrapper: createWrapper(queryClient),
        })

        const updateData = {
          id: '123',
          status: 'IN_PROGRESS' as const,
        }

        result.current.mutate(updateData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.put).toHaveBeenCalledWith('/admin/orders/123', { status: 'IN_PROGRESS' })
      })
    })

    describe('useUpdateProfile', () => {
      it('should update profile and invalidate cache', async () => {
        const mockProfile = createMockUser()
        const mockResponse = createMockApiResponse(mockProfile)
        mockApiClient.put.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useUpdateProfile(), {
          wrapper: createWrapper(queryClient),
        })

        const profileData = {
          name: 'Updated Name',
          phone: '+9876543210',
        }

        result.current.mutate(profileData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockApiClient.put).toHaveBeenCalledWith('/user/profile', profileData)
      })
    })
  })

  describe('useInvalidateQueries', () => {
    it('should provide invalidation functions', () => {
      const { result } = renderHook(() => useInvalidateQueries(), {
        wrapper: createWrapper(queryClient),
      })

      expect(typeof result.current.invalidateMenuItems).toBe('function')
      expect(typeof result.current.invalidateOrders).toBe('function')
      expect(typeof result.current.invalidateUserOrders).toBe('function')
      expect(typeof result.current.invalidateSubscriptions).toBe('function')
      expect(typeof result.current.invalidateUserSubscriptions).toBe('function')
      expect(typeof result.current.invalidateProfile).toBe('function')
      expect(typeof result.current.invalidateDashboards).toBe('function')
      expect(typeof result.current.invalidateAll).toBe('function')
    })
  })

  describe('Loading and Error States', () => {
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
      expect(result.current.isError).toBe(false)

      resolve!(createMockApiResponse([]))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isSuccess).toBe(true)
      })
    })

    it('should handle error states correctly', async () => {
      const error = { message: 'API Error', status: 400 }
      mockApiClient.get.mockRejectedValue(error)

      const { result } = renderHook(() => useMenuItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      }, { timeout: 3000 })

      expect(result.current.error).toEqual(error)
    })
  })
})