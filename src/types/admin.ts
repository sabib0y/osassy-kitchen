// Order Management Types
export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: {
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  totalPrice: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  deliveryAddress: string;
  specialInstructions?: string;
  deliveryFee: number;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface OrderStats {
  pending: number;
  inProgress: number;
  delivered: number;
  cancelled: number;
  revenueToday: number;
}

// Menu Management Types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  subscriptionUsage?: number;
}

export type MenuCategory = 
  | 'main-dishes' 
  | 'soups' 
  | 'rice-dishes' 
  | 'grilled' 
  | 'beverages' 
  | 'appetizers' 
  | 'desserts' 
  | 'sides';

export interface MenuItemFilters {
  search?: string;
  category?: MenuCategory | '';
  availability?: 'available' | 'unavailable' | '';
  page?: number;
  limit?: number;
}

export interface MenuStats {
  totalItems: number;
  availableItems: number;
  totalCategories: number;
  averagePrice: number;
}

export interface CreateMenuItemData {
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  available: boolean;
  image?: File;
}

export interface UpdateMenuItemData extends Partial<CreateMenuItemData> {
  id: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Bulk Operations
export interface BulkOrderUpdate {
  orderIds: string[];
  status: Order['status'];
}

export interface BulkMenuItemUpdate {
  itemIds: string[];
  available: boolean;
}

// Dashboard Types
export interface AdminDashboardData {
  orders: {
    stats: OrderStats;
    recent: Order[];
    byStatus: Record<string, { count: number }>;
  };
  menu: {
    stats: MenuStats;
    topPerforming: Array<{
      menuItemId: string;
      menuItem: { name: string };
      _sum: { quantity: number };
    }>;
  };
  revenue: {
    monthly: number;
    monthlyGrowthRate: number;
  };
  overview: {
    totalActiveSubscriptions: number;
    subscriptionGrowthRate: number;
    totalUsers: number;
    userGrowthRate: number;
  };
}
