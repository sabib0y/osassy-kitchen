/**
 * Hook for fetching and managing menu items
 * Uses React Query for caching, loading states, and error handling
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { MenuItemResponse, MenuItemsRequest } from '@/lib/api-types';
import { MenuItem } from '@/types/admin';

// Response type from the menu-items API
interface MenuItemsApiResponse {
  menuItems: MenuItemResponse[];
  total: number;
}

// Convert API response to our MenuItem type
const transformMenuItem = (item: MenuItemResponse): MenuItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  category: item.category as MenuItem['category'],
  imageUrl: item.imageUrl || undefined,
  available: item.available,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  subscriptionUsage: item.subscriptionUsage,
});

/**
 * Fetch menu items from the API
 */
const fetchMenuItems = async (params?: MenuItemsRequest): Promise<MenuItem[]> => {
  try {
    const response = await apiClient.get<MenuItemsApiResponse>('/menu-items', params);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch menu items');
    }

    // Transform the response data to match our MenuItem type
    return response.data.menuItems.map(transformMenuItem);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

/**
 * Hook configuration options
 */
interface UseMenuItemsOptions extends MenuItemsRequest {
  enabled?: boolean;
  onSuccess?: (data: MenuItem[]) => void;
  onError?: (error: Error) => void;
  refetchInterval?: number | false;
  staleTime?: number;
  retry?: number | false;
  retryDelay?: number | ((attemptIndex: number) => number);
}

/**
 * React Query hook for fetching menu items
 * 
 * @param options - Query options including filters and React Query options
 * @returns Query result with menu items data, loading state, and error handling
 * 
 * @example
 * ```tsx
 * const { data: menuItems, isLoading, error } = useMenuItems({
 *   category: 'rice-dishes',
 *   search: 'jollof',
 *   enabled: true
 * });
 * ```
 */
export const useMenuItems = (options: UseMenuItemsOptions = {}) => {
  const {
    category,
    search,
    availability,
    page,
    limit,
    enabled = true,
    onSuccess,
    onError,
    refetchInterval = false,
    staleTime = 1000 * 60 * 5, // 5 minutes default
    retry = 2,
    retryDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  } = options;

  // Build query key with all parameters for proper caching
  const queryKey = [
    'menuItems',
    {
      category: category || 'all',
      search: search || '',
      availability: availability || '',
      page: page || 1,
      limit: limit || 50,
    },
  ] as const;

  const queryOptions: UseQueryOptions<MenuItem[], Error> = {
    queryKey,
    queryFn: () => fetchMenuItems({
      category,
      search,
      availability,
      page,
      limit,
    }),
    enabled,
    staleTime,
    refetchInterval,
    retry,
    retryDelay,
  };

  // Note: React Query v5 removed onSuccess/onError from useQuery
  // Callbacks should be handled in the component using the query result

  return useQuery(queryOptions);
};

/**
 * Hook for fetching all available menu items (commonly used)
 */
export const useAvailableMenuItems = (options?: Omit<UseMenuItemsOptions, 'availability'>) => {
  return useMenuItems({
    ...options,
    availability: 'available',
  });
};

/**
 * Hook for searching menu items
 */
export const useSearchMenuItems = (searchTerm: string, options?: Omit<UseMenuItemsOptions, 'search'>) => {
  return useMenuItems({
    ...options,
    search: searchTerm,
    enabled: (options?.enabled !== false) && searchTerm.length > 0,
  });
};

/**
 * Hook for fetching menu items by category
 */
export const useMenuItemsByCategory = (
  category: string,
  options?: Omit<UseMenuItemsOptions, 'category'>
) => {
  return useMenuItems({
    ...options,
    category,
    enabled: (options?.enabled !== false) && !!category,
  });
};

// Re-export types for convenience
export type { MenuItem, MenuItemsRequest, UseMenuItemsOptions };