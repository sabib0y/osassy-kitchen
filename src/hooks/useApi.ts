/**
 * React Query hooks for API data fetching
 * Provides optimised caching, background updates, and error handling
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api-client';
import type {
  ApiResponse,
  ApiError,
  MenuItemResponse,
  MenuItemsRequest,
  OrderResponse,
  OrdersRequest,
  SubscriptionResponse,
  UserProfileResponse,
  AdminDashboardResponse,
  UserDashboardResponse,
  CreateMenuItemRequest,
  CreateOrderRequest,
  CreateSubscriptionRequest,
  UpdateMenuItemRequest,
  UpdateOrderRequest,
  UpdateProfileRequest,
  PaginatedResponse,
  MenuStatsResponse,
  OrderStatsResponse,
} from '@/lib/api-types';

// Query Keys - centralised for consistency
export const queryKeys = {
  // Auth
  session: ['session'] as const,
  
  // Menu
  menuItems: (params?: MenuItemsRequest) => ['menu-items', params] as const,
  menuItem: (id: string) => ['menu-items', id] as const,
  menuStats: ['menu-stats'] as const,
  
  // Orders
  orders: (params?: OrdersRequest) => ['orders', params] as const,
  order: (id: string) => ['orders', id] as const,
  orderStats: ['order-stats'] as const,
  userOrders: (params?: OrdersRequest) => ['user-orders', params] as const,
  
  // Subscriptions
  subscriptions: ['subscriptions'] as const,
  subscription: (id: string) => ['subscriptions', id] as const,
  userSubscriptions: ['user-subscriptions'] as const,
  
  // User
  userProfile: ['user-profile'] as const,
  
  // Admin
  adminDashboard: ['admin-dashboard'] as const,
  
  // User Dashboard
  userDashboard: ['user-dashboard'] as const,
} as const;

// Custom hook for handling API errors
export const useApiError = () => {
  const router = useRouter();
  
  return (error: ApiError) => {
    console.error('API Error:', error);
    
    // Handle authentication errors
    if (error.status === 401) {
      router.push('/login');
      return;
    }
    
    // Handle authorization errors
    if (error.status === 403) {
      router.push('/unauthorized');
      return;
    }
    
    // You can add more global error handling here
    // For example, show toast notifications
  };
};

// Default query options
const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  retry: (failureCount: number, error: any) => {
    // Don't retry on client errors
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return failureCount < 2;
  },
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const;

// MENU HOOKS

export const useMenuItems = (
  params?: MenuItemsRequest,
  options?: Omit<UseQueryOptions<ApiResponse<MenuItemResponse[]>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.menuItems(params),
    queryFn: () => apiClient.get<MenuItemResponse[]>('/menu-items', params),
    ...defaultQueryOptions,
    ...options,
  });
};

export const useMenuStats = (
  options?: Omit<UseQueryOptions<ApiResponse<MenuStatsResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.menuStats,
    queryFn: () => apiClient.get<MenuStatsResponse>('/admin/menu-items/stats'),
    enabled: session?.user && (session.user as any).role === 'ADMIN',
    ...defaultQueryOptions,
    ...options,
  });
};

// ORDERS HOOKS

export const useOrders = (
  params?: OrdersRequest,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<OrderResponse>>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => apiClient.get<PaginatedResponse<OrderResponse>>('/admin/orders', params),
    enabled: session?.user && (session.user as any).role === 'ADMIN',
    ...defaultQueryOptions,
    ...options,
  });
};

export const useUserOrders = (
  params?: OrdersRequest,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<OrderResponse>>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.userOrders(params),
    queryFn: () => apiClient.get<PaginatedResponse<OrderResponse>>('/user/orders', params),
    enabled: !!session?.user,
    ...defaultQueryOptions,
    ...options,
  });
};

export const useOrder = (
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<OrderResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => apiClient.get<OrderResponse>(`/admin/orders/${id}`),
    enabled: !!session?.user && !!id,
    ...defaultQueryOptions,
    ...options,
  });
};

// SUBSCRIPTIONS HOOKS

export const useSubscriptions = (
  options?: Omit<UseQueryOptions<ApiResponse<SubscriptionResponse[]>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: () => apiClient.get<SubscriptionResponse[]>('/admin/subscriptions'),
    enabled: session?.user && (session.user as any).role === 'ADMIN',
    ...defaultQueryOptions,
    ...options,
  });
};

export const useUserSubscriptions = (
  options?: Omit<UseQueryOptions<ApiResponse<SubscriptionResponse[]>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.userSubscriptions,
    queryFn: () => apiClient.get<SubscriptionResponse[]>('/user/subscriptions'),
    enabled: !!session?.user,
    ...defaultQueryOptions,
    ...options,
  });
};

export const useSubscription = (
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<SubscriptionResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.subscription(id),
    queryFn: () => apiClient.get<SubscriptionResponse>(`/user/subscriptions/${id}`),
    enabled: !!session?.user && !!id,
    ...defaultQueryOptions,
    ...options,
  });
};

// USER HOOKS

export const useUserProfile = (
  options?: Omit<UseQueryOptions<ApiResponse<UserProfileResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: () => apiClient.get<UserProfileResponse>('/user/profile'),
    enabled: !!session?.user,
    ...defaultQueryOptions,
    ...options,
  });
};

// DASHBOARD HOOKS

export const useAdminDashboard = (
  options?: Omit<UseQueryOptions<ApiResponse<AdminDashboardResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => apiClient.get<AdminDashboardResponse>('/admin/dashboard'),
    enabled: session?.user && (session.user as any).role === 'ADMIN',
    ...defaultQueryOptions,
    ...options,
  });
};

export const useUserDashboard = (
  options?: Omit<UseQueryOptions<ApiResponse<UserDashboardResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: queryKeys.userDashboard,
    queryFn: () => apiClient.get<UserDashboardResponse>('/user/dashboard'),
    enabled: !!session?.user,
    ...defaultQueryOptions,
    ...options,
  });
};

// MUTATION HOOKS

export const useCreateMenuItem = (
  options?: UseMutationOptions<ApiResponse<MenuItemResponse>, ApiError, CreateMenuItemRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMenuItemRequest) => 
      apiClient.post<MenuItemResponse>('/admin/menu-items', data),
    onSuccess: () => {
      // Invalidate and refetch menu items
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: queryKeys.menuStats });
    },
    ...options,
  });
};

export const useUpdateMenuItem = (
  options?: UseMutationOptions<ApiResponse<MenuItemResponse>, ApiError, UpdateMenuItemRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateMenuItemRequest) => 
      apiClient.put<MenuItemResponse>(`/admin/menu-items/${data.id}`, data),
    onSuccess: (data, variables) => {
      // Update specific item and invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItem(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: queryKeys.menuStats });
    },
    ...options,
  });
};

export const useDeleteMenuItem = (
  options?: UseMutationOptions<ApiResponse<void>, ApiError, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiClient.delete<void>(`/admin/menu-items/${id}`),
    onSuccess: () => {
      // Invalidate menu queries
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: queryKeys.menuStats });
    },
    ...options,
  });
};

export const useCreateOrder = (
  options?: UseMutationOptions<ApiResponse<OrderResponse>, ApiError, CreateOrderRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => 
      apiClient.post<OrderResponse>('/user/orders', data),
    onSuccess: () => {
      // Invalidate orders queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
    },
    ...options,
  });
};

export const useUpdateOrder = (
  options?: UseMutationOptions<ApiResponse<OrderResponse>, ApiError, { id: string } & UpdateOrderRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateOrderRequest) => 
      apiClient.put<OrderResponse>(`/admin/orders/${id}`, data),
    onSuccess: (data, variables) => {
      // Update specific order and invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.order(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
    },
    ...options,
  });
};

export const useCreateSubscription = (
  options?: UseMutationOptions<ApiResponse<any>, ApiError, CreateSubscriptionRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) => 
      apiClient.post('/subscribe', data),
    onSuccess: () => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubscriptions });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
    },
    ...options,
  });
};

export const useUpdateProfile = (
  options?: UseMutationOptions<ApiResponse<UserProfileResponse>, ApiError, UpdateProfileRequest>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => 
      apiClient.put<UserProfileResponse>('/user/profile', data),
    onSuccess: () => {
      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
    },
    ...options,
  });
};

// Utility hooks for data invalidation

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateMenuItems: () => queryClient.invalidateQueries({ queryKey: queryKeys.menuItems() }),
    invalidateOrders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders() }),
    invalidateUserOrders: () => queryClient.invalidateQueries({ queryKey: queryKeys.userOrders() }),
    invalidateSubscriptions: () => queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
    invalidateUserSubscriptions: () => queryClient.invalidateQueries({ queryKey: queryKeys.userSubscriptions }),
    invalidateProfile: () => queryClient.invalidateQueries({ queryKey: queryKeys.userProfile }),
    invalidateDashboards: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
    },
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};