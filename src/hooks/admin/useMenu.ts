import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItem, MenuItemFilters, MenuStats, CreateMenuItemData, UpdateMenuItemData, BulkMenuItemUpdate, PaginatedResponse } from '@/types/admin';

// API functions
const fetchMenuItems = async (filters: MenuItemFilters): Promise<PaginatedResponse<MenuItem>> => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.availability) params.append('availability', filters.availability);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`/api/admin/menu?${params}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch menu items');
  }

  const result = await response.json();
  return result.data;
};

const fetchMenuStats = async (): Promise<MenuStats> => {
  const response = await fetch('/api/admin/menu/stats');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch menu stats');
  }

  const result = await response.json();
  return result.data;
};

const fetchMenuItem = async (id: string): Promise<MenuItem> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockItem: MenuItem = {
    id,
    name: 'Sample Menu Item',
    description: 'Sample description',
    price: 3500,
    category: 'main-dishes',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionUsage: 10
  };
  
  return mockItem;
};

const createMenuItem = async (data: CreateMenuItemData): Promise<MenuItem> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In real implementation, this would upload the image and create the menu item
  const newItem: MenuItem = {
    id: Date.now().toString(),
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    available: data.available,
    imageUrl: data.image ? URL.createObjectURL(data.image) : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionUsage: 0
  };
  
  return newItem;
};

const updateMenuItem = async (data: UpdateMenuItemData): Promise<MenuItem> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const updatedItem: MenuItem = {
    id: data.id,
    name: data.name || 'Updated Item',
    description: data.description || 'Updated description',
    price: data.price || 0,
    category: data.category || 'main-dishes',
    available: data.available ?? true,
    imageUrl: data.image ? URL.createObjectURL(data.image) : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionUsage: 5
  };
  
  return updatedItem;
};

const deleteMenuItem = async (id: string): Promise<void> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In real implementation, this would:
  // 1. Get the menu item to retrieve imagePublicId
  // 2. Delete the menu item from database
  // 3. Delete the image from Cloudinary using the imagePublicId
  
  // Example real implementation:
  // const response = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
  // if (!response.ok) throw new Error('Failed to delete menu item');
};

const toggleMenuItemAvailability = async (id: string): Promise<MenuItem> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const item: MenuItem = {
    id,
    name: 'Sample Item',
    description: 'Sample description',
    price: 3500,
    category: 'main-dishes',
    available: Math.random() > 0.5, // Random toggle for demo
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionUsage: 8
  };
  
  return item;
};

const bulkUpdateMenuItems = async (data: BulkMenuItemUpdate): Promise<void> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
};

const uploadMenuItemImage = async (file: File): Promise<{ url: string }> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In real implementation, this would upload to cloud storage
  return {
    url: URL.createObjectURL(file)
  };
};

// Query Keys
export const menuQueryKeys = {
  all: ['menu'] as const,
  items: () => [...menuQueryKeys.all, 'items'] as const,
  item: (id: string) => [...menuQueryKeys.all, 'item', id] as const,
  stats: () => [...menuQueryKeys.all, 'stats'] as const,
} as const;

// Hooks
export const useMenuItems = (filters: MenuItemFilters) => {
  return useQuery({
    queryKey: [...menuQueryKeys.items(), filters],
    queryFn: () => fetchMenuItems(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMenuStats = () => {
  return useQuery({
    queryKey: menuQueryKeys.stats(),
    queryFn: fetchMenuStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMenuItem = (id: string) => {
  return useQuery({
    queryKey: menuQueryKeys.item(id),
    queryFn: () => fetchMenuItem(id),
    enabled: !!id,
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMenuItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() });
      queryClient.setQueryData(menuQueryKeys.item(data.id), data);
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() });
    },
  });
};

export const useToggleMenuItemAvailability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleMenuItemAvailability,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() });
      queryClient.setQueryData(menuQueryKeys.item(data.id), data);
    },
  });
};

export const useBulkUpdateMenuItems = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: bulkUpdateMenuItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.stats() });
    },
  });
};

export const useUploadMenuItemImage = () => {
  return useMutation({
    mutationFn: uploadMenuItemImage,
  });
};

// Composite hook that combines all menu-related functionality
export const useMenu = (filters: MenuItemFilters) => {
  const menuItemsQuery = useMenuItems(filters);
  const menuStatsQuery = useMenuStats();
  const deleteItemMutation = useDeleteMenuItem();
  const toggleAvailabilityMutation = useToggleMenuItemAvailability();
  const bulkUpdateMutation = useBulkUpdateMenuItems();

  return {
    data: menuItemsQuery.data,
    stats: menuStatsQuery.data,
    isLoading: menuItemsQuery.isLoading || menuStatsQuery.isLoading,
    error: menuItemsQuery.error || menuStatsQuery.error,
    refetch: () => {
      menuItemsQuery.refetch();
      menuStatsQuery.refetch();
    },
    deleteItem: deleteItemMutation,
    toggleAvailability: toggleAvailabilityMutation,
    bulkUpdate: bulkUpdateMutation,
  };
};
