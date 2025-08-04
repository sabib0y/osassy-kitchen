import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItem, MenuItemFilters, MenuStats, CreateMenuItemData, UpdateMenuItemData, BulkMenuItemUpdate, PaginatedResponse } from '@/types/admin';

// API functions (mock implementations - replace with actual API calls)
const fetchMenuItems = async (filters: MenuItemFilters): Promise<PaginatedResponse<MenuItem>> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockItems: MenuItem[] = [
    {
      id: '1',
      name: 'Jollof Rice',
      description: 'Delicious Nigerian jollof rice with vegetables and spices',
      price: 3500,
      category: 'rice-dishes',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=200&fit=crop',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionUsage: 15
    },
    {
      id: '2',
      name: 'Egusi Soup',
      description: 'Traditional Nigerian soup made with ground melon seeds',
      price: 4200,
      category: 'soups',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionUsage: 8
    },
    {
      id: '3',
      name: 'Grilled Chicken',
      description: 'Perfectly grilled chicken with Nigerian spices',
      price: 5000,
      category: 'grilled',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=200&fit=crop',
      available: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionUsage: 12
    },
    {
      id: '4',
      name: 'Pounded Yam',
      description: 'Smooth and stretchy pounded yam, perfect with soups',
      price: 2800,
      category: 'sides',
      imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=200&fit=crop',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionUsage: 6
    },
    {
      id: '5',
      name: 'Nkwobi',
      description: 'Spicy cow foot delicacy with palm wine and utazi leaves',
      price: 6500,
      category: 'appetizers',
      imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=200&fit=crop',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionUsage: 4
    },
    {
      id: '6',
      name: 'Chapman',
      description: 'Refreshing Nigerian cocktail drink with fruits',
      price: 1800,
      category: 'beverages',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=200&fit=crop',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionUsage: 9
    }
  ];

  // Apply filters
  let filteredItems = mockItems;
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.category) {
    filteredItems = filteredItems.filter(item => item.category === filters.category);
  }
  
  if (filters.availability) {
    const isAvailable = filters.availability === 'available';
    filteredItems = filteredItems.filter(item => item.available === isAvailable);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / limit)
    }
  };
};

const fetchMenuStats = async (): Promise<MenuStats> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    totalItems: 48,
    availableItems: 42,
    totalCategories: 8,
    averagePrice: 4200
  };
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
