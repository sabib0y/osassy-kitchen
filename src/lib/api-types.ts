/**
 * API Types for Osassy's Kitchen
 * Centralised TypeScript definitions for all API requests and responses
 */

// Base API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token?: string;
}

// Menu Types
export interface MenuItemResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  subscriptionUsage?: number;
}

export interface MenuItemsRequest {
  category?: string;
  search?: string;
  availability?: 'available' | 'unavailable' | '';
  page?: number;
  limit?: number;
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {
  id: string;
}

export interface MenuStatsResponse {
  totalItems: number;
  availableItems: number;
  totalCategories: number;
  averagePrice: number;
}

// Order Types
export interface OrderItemResponse {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    category: string;
  };
}

export interface OrderResponse {
  id: string;
  totalPrice: number;
  deliveryDate: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryAddress: string;
  deliveryFee: number;
  specialInstructions?: string;
  subscription?: {
    id: string;
    planName: string;
    interval: 'WEEKLY' | 'MONTHLY';
  } | null;
  items: OrderItemResponse[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface OrdersRequest {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateOrderRequest {
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  deliveryDate?: string;
  specialInstructions?: string;
  deliveryAddress: string;
}

export interface UpdateOrderRequest {
  status?: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  deliveryDate?: string;
  specialInstructions?: string;
}

export interface OrderStatsResponse {
  pending: number;
  inProgress: number;
  delivered: number;
  cancelled: number;
  revenueToday: number;
}

// Subscription Types
export interface SubscriptionItemResponse {
  id: string;
  quantity: number;
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    category: string;
  };
}

export interface SubscriptionResponse {
  id: string;
  planName: string;
  interval: 'WEEKLY' | 'MONTHLY';
  price: number;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: string;
  nextDeliveryDate: string | null;
  stripeSubscriptionId?: string;
  items: SubscriptionItemResponse[];
  recentOrders: OrderResponse[];
}

export interface CreateSubscriptionRequest {
  planName: string;
  interval: 'WEEKLY' | 'MONTHLY';
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  startDate?: string;
  specialInstructions?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface UpdateSubscriptionRequest {
  planName?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  items?: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

// User Types
export interface UserProfileResponse {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

// Dashboard Types
export interface UserDashboardResponse {
  stats: {
    activeSubscriptions: number;
    totalOrders: number;
    upcomingDeliveries: number;
    totalSpent: number;
  };
  recentOrders: OrderResponse[];
  activeSubscriptions: SubscriptionResponse[];
}

export interface AdminDashboardResponse {
  orders: {
    stats: OrderStatsResponse;
    recent: OrderResponse[];
    byStatus: Record<string, { count: number }>;
  };
  menu: {
    stats: MenuStatsResponse;
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

// Bulk Operations
export interface BulkOrderUpdateRequest {
  orderIds: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
}

export interface BulkMenuItemUpdateRequest {
  itemIds: string[];
  available: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ValidationError extends ApiError {
  fields: Record<string, string[]>;
}

// Filter Types
export interface OrderFilters {
  search?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' | '';
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export interface MenuItemFilters {
  search?: string;
  category?: string;
  availability?: 'available' | 'unavailable' | '';
  priceMin?: number;
  priceMax?: number;
}

export interface SubscriptionFilters {
  search?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | '';
  interval?: 'WEEKLY' | 'MONTHLY' | '';
}

// HTTP Method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retry?: boolean | number;
}