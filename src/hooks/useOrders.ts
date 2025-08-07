/**
 * useOrders Hook - Handles order data fetching with React Query
 * Provides orders list with pagination, filtering, and caching
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { api } from '../lib/api-client';
import type { 
  OrderResponse, 
  PaginationMeta,
  OrderFilters 
} from '../lib/api-types';

// Response type for orders API
export interface OrdersResponse {
  orders: OrderResponse[];
  pagination: PaginationMeta;
}

// Hook options interface
interface UseOrdersOptions {
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: Partial<OrderFilters>;
  enabled?: boolean;
  retry?: number | boolean | ((failureCount: number, error: any) => boolean);
  retryDelay?: number | ((attemptIndex: number) => number);
}

// Hook return type
interface UseOrdersReturn {
  // Data
  orders: OrderResponse[];
  pagination: PaginationMeta | null;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  
  // Filter controls
  filters: OrderFilters;
  updateFilters: (newFilters: Partial<OrderFilters>) => void;
  clearFilters: () => void;
  
  // Pagination controls
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Utilities
  refetch: () => void;
  isEmpty: boolean;
  totalOrders: number;
}

// Default filters
const DEFAULT_FILTERS: OrderFilters = {
  search: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

export const useOrders = (options: UseOrdersOptions = {}): UseOrdersReturn => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialFilters = {},
    enabled = true,
    retry = (failureCount: number, error: any) => {
      // Don't retry for authentication errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  } = options;

  // State management
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState<OrderFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Generate query key with current parameters
  const queryKey = useMemo(() => [
    'user-orders',
    currentPage,
    initialLimit,
    filters
  ], [currentPage, initialLimit, filters]);

  // Build query parameters
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: initialLimit,
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
  }), [currentPage, initialLimit, filters]);

  // React Query configuration
  const queryOptions: UseQueryOptions<OrdersResponse> = {
    queryKey,
    queryFn: async (): Promise<OrdersResponse> => {
      try {
        const response = await api.get<OrdersResponse>('/user/orders', queryParams);
        if (!response.data) {
          throw new Error('No data received from server');
        }
        return response.data;
      } catch (error: any) {
        // Handle specific error cases
        if (error.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (error.status === 403) {
          throw new Error('Access denied. You do not have permission to view orders.');
        }
        if (error.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error(error.message || 'Failed to fetch orders');
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    retry,
    retryDelay,
  };

  // Execute query
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    isFetching, 
    refetch 
  } = useQuery(queryOptions);

  // Extract data with fallbacks
  const orders = data?.orders || [];
  const pagination = data?.pagination || null;

  // Filter management functions
  const updateFilters = (newFilters: Partial<OrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  // Pagination utilities
  const totalPages = pagination?.totalPages || 0;
  const hasNextPage = pagination?.hasNextPage || false;
  const hasPrevPage = pagination?.hasPrevPage || false;
  const totalOrders = pagination?.totalCount || 0;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Computed values
  const isEmpty = !isLoading && orders.length === 0;

  return {
    // Data
    orders,
    pagination,
    
    // Loading states
    isLoading,
    isError,
    error: error as Error | null,
    isFetching,
    
    // Filter controls
    filters,
    updateFilters,
    clearFilters,
    
    // Pagination controls
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    
    // Utilities
    refetch,
    isEmpty,
    totalOrders,
  };
};

// Export utility functions for status formatting
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'DELIVERED':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'CANCELLED':
      return 'danger';
    case 'PENDING':
      return 'info';
    default:
      return 'secondary';
  }
};

export const formatOrderStatus = (status: string): string => {
  return status.replace('_', ' ');
};

export const formatOrderDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

export default useOrders;