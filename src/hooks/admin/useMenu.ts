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
  const response = await fetch(`/api/admin/menu/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch menu item');
  }

  const result = await response.json();
  return result.data;
};

const createMenuItem = async (data: CreateMenuItemData): Promise<MenuItem> => {
  const response = await fetch('/api/admin/menu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create menu item');
  }

  const result = await response.json();
  return result.data;
};

const updateMenuItem = async (data: UpdateMenuItemData): Promise<MenuItem> => {
  const { id, ...updateData } = data;

  const response = await fetch(`/api/admin/menu/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update menu item');
  }

  const result = await response.json();
  return result.data;
};

const deleteMenuItem = async (id: string): Promise<void> => {
  const response = await fetch(`/api/admin/menu/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete menu item');
  }
};

const toggleMenuItemAvailability = async (id: string): Promise<MenuItem> => {
  const response = await fetch(`/api/admin/menu/${id}`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle menu item availability');
  }

  const result = await response.json();
  return result.data;
};

const bulkUpdateMenuItems = async (data: BulkMenuItemUpdate): Promise<void> => {
  const response = await fetch('/api/admin/menu/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to bulk update menu items');
  }
};

const uploadMenuItemImage = async (file: File): Promise<{ url: string; publicId: string; thumbnailUrl?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  const result = await response.json();
  return result.data;
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
