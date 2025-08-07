// User Dashboard Types
import { MenuItem } from './admin';

// Subscription Types
export interface SubscriptionItem {
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

export interface SubscriptionOrder {
  id: string;
  totalPrice: number;
  deliveryDate: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
  }>;
}

export interface Subscription {
  id: string;
  planName: string;
  interval: 'WEEKLY' | 'MONTHLY';
  price: number;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: string;
  nextDeliveryDate: string | null;
  stripeSubscriptionId?: string;
  items: SubscriptionItem[];
  recentOrders: SubscriptionOrder[];
}

// Order Types
export interface OrderItem {
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

export interface Order {
  id: string;
  totalPrice: number;
  deliveryDate: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    planName: string;
    interval: 'WEEKLY' | 'MONTHLY';
  } | null;
  items: OrderItem[];
}

// Dashboard Stats
export interface DashboardStats {
  activeSubscriptions: number;
  totalOrders: number;
  upcomingDeliveries: number;
  totalSpent: number;
}

// API Response Types
export interface SubscriptionsResponse {
  subscriptions: Subscription[];
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

// User Profile Types
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
}

// Subscription Creation Types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  [dishId: string]: CartItem;
}

export interface SubscriptionFormData {
  selectedItems: CartItem[];
  billingInterval: 'WEEKLY' | 'MONTHLY';
  planName?: string;
  startDate?: string;
  deliveryTime?: string;
  specialInstructions?: string;
}

export interface FilterState {
  category: 'all' | 'rice' | 'soup' | 'protein';
  searchTerm: string;
}

// API Types for Create Subscription
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