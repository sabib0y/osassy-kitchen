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

// Enhanced Address Types
export interface Address {
  id: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  deliveryInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Preferences Types
export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: {
    orderConfirmation: boolean;
    orderStatusUpdates: boolean;
    deliveryReminders: boolean;
    subscriptionUpdates: boolean;
    promotionsAndOffers: boolean;
    newsletter: boolean;
  };
  smsNotifications: {
    orderConfirmation: boolean;
    deliveryReminders: boolean;
    orderStatusUpdates: boolean;
  };
  pushNotifications: {
    orderConfirmation: boolean;
    orderStatusUpdates: boolean;
    deliveryReminders: boolean;
    promotions: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Enhanced User Profile Types
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  addresses: Address[];
  notificationPreferences: NotificationPreferences;
  // Backward compatibility with old address format
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  createdAt?: string;
  emailVerified?: boolean;
}

// Payment Method Types
export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding?: string;
  };
  billingDetails?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: {
      city?: string | null;
      country?: string | null;
      line1?: string | null;
      line2?: string | null;
      postalCode?: string | null;
      state?: string | null;
    } | null;
  };
  isDefault: boolean;
  createdAt: number;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId?: string | null;
}

// Form validation types
export interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

export interface ProfileFormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export interface AddressFormData {
  type: Address['type'];
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  deliveryInstructions: string;
}

export interface AddressFormErrors {
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
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