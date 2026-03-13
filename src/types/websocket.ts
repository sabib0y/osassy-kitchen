// WebSocket Event Types and Definitions

// Order Status
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// Delivery Status
export enum DeliveryStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DISPATCHED = 'DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}

// Event Categories
export enum EventCategory {
  ORDER = 'order',
  SUBSCRIPTION = 'subscription',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
  ADMIN = 'admin',
  USER = 'user'
}

// Event Types
export enum EventType {
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_DELIVERED = 'order.delivered',
  
  // Subscription Events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_PAUSED = 'subscription.paused',
  SUBSCRIPTION_RESUMED = 'subscription.resumed',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription.payment_failed',
  SUBSCRIPTION_PAYMENT_SUCCESS = 'subscription.payment_success',
  
  // Notification Events
  NOTIFICATION_NEW = 'notification.new',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_DISMISSED = 'notification.dismissed',
  
  // System Events
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_UPDATE = 'system.update',
  SYSTEM_BROADCAST = 'system.broadcast',
  
  // Connection Events
  CONNECTION_ESTABLISHED = 'connection.established',
  CONNECTION_ERROR = 'connection.error',
  CONNECTION_CLOSED = 'connection.closed',
  CONNECTION_RECONNECT = 'connection.reconnect',
  
  // Admin Events
  ADMIN_BROADCAST = 'admin.broadcast',
  ADMIN_USER_UPDATE = 'admin.user_update',
  ADMIN_STATS_UPDATE = 'admin.stats_update',
  
  // User Events
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_PAYMENT_METHOD_ADDED = 'user.payment_method_added',
  USER_ADDRESS_UPDATED = 'user.address_updated',
  
  // Real-time Dashboard Events
  DASHBOARD_STATS_UPDATE = 'dashboard.stats_update',
  DASHBOARD_ORDER_UPDATE = 'dashboard.order_update',
  DASHBOARD_REVENUE_UPDATE = 'dashboard.revenue_update'
}

// Room/Channel Types
export enum RoomType {
  USER = 'user',
  ADMIN = 'admin',
  ORDER = 'order',
  SUBSCRIPTION = 'subscription',
  GLOBAL = 'global'
}

// WebSocket Message Structure
export interface WSMessage<T = any> {
  id: string;
  type: EventType;
  category: EventCategory;
  payload: T;
  timestamp: string;
  metadata?: {
    userId?: string;
    orderId?: string;
    subscriptionId?: string;
    room?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    retryCount?: number;
    timestamp?: string;
  };
}

// Event Payload Types
export interface OrderEventPayload {
  orderId: string;
  orderNumber?: string;
  userId?: string;
  data: {
    status: OrderStatus;
    customerName?: string;
    totalAmount?: number;
    itemCount?: number;
    deliveryDate?: string | Date | null;
    notes?: string | null;
  };
  previousStatus?: OrderStatus;
  timeline?: Array<{
    id: string;
    status: string;
    message: string;
    timestamp: string;
    isCompleted: boolean;
  }>;
  timestamp: string;
  updatedBy?: string;
}

export interface SubscriptionEventPayload {
  subscriptionId: string;
  userId: string;
  data: {
    status: string;
    planName?: string;
    interval?: 'WEEKLY' | 'MONTHLY';
    price?: number;
    nextDeliveryDate?: string | Date | null;
    pauseStartDate?: string;
    pauseEndDate?: string;
  };
  eventType?: EventType;
  previousStatus?: string;
  reason?: string;
  timestamp: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  timestamp: string;
  expiresAt?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SystemEventPayload {
  message: string;
  type: 'info' | 'warning' | 'error' | 'maintenance';
  duration?: number;
  scheduledAt?: string;
  affectedServices?: string[];
}

export interface DashboardStatsPayload {
  type?: 'orders' | 'revenue' | 'subscriptions' | 'users';
  metrics?: {
    totalRevenue?: number;
    revenueChange?: number;
    totalOrders?: number;
    ordersChange?: number;
    activeUsers?: number;
    usersChange?: number;
    averageOrderValue?: number;
    aovChange?: number;
    conversionRate?: number;
    conversionChange?: number;
    activeSubscriptions?: number;
    subscriptionsChange?: number;
  };
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    amount: number;
    status: string;
    timestamp: string;
    items: number;
  }>;
  ordersByStatus?: {
    pending: number;
    confirmed: number;
    preparing: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
  hourlyRevenue?: Array<{
    hour: string;
    revenue: number;
    orders: number;
  }>;
  stats?: Record<string, any>;
  period?: string;
  comparison?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

// WebSocket Connection Configuration
export interface WSConfig {
  url?: string;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  pingInterval?: number;
  pongTimeout?: number;
  debug?: boolean;
  auth?: {
    token?: string;
    userId?: string;
    role?: string;
  };
}

// WebSocket Connection State
export interface WSState {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  error?: Error | null;
  reconnectAttempts: number;
  lastPing?: Date;
  lastPong?: Date;
  rooms: Set<string>;
  messageQueue: WSMessage[];
}

// WebSocket Client Interface
export interface IWebSocketClient {
  connect(): Promise<void>;
  disconnect(): void;
  send<T>(message: WSMessage<T>): void;
  subscribe(eventType: EventType | EventType[], handler: WSEventHandler): () => void;
  unsubscribe(eventType: EventType | EventType[], handler?: WSEventHandler): void;
  joinRoom(room: string): void;
  leaveRoom(room: string): void;
  getState(): WSState;
  on(event: string, handler: Function): void;
  off(event: string, handler?: Function): void;
}

// Event Handler Type
export type WSEventHandler<T = any> = (message: WSMessage<T>) => void;

// Room Management
export interface Room {
  id: string;
  type: RoomType;
  members: Set<string>;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// WebSocket Server Types
export interface WSServerClient {
  id: string;
  userId?: string;
  role?: string;
  rooms: Set<string>;
  socket: any; // Socket.IO or WS instance
  connectedAt: Date;
  lastActivity: Date;
}

// Broadcast Options
export interface BroadcastOptions {
  rooms?: string[];
  excludeClients?: string[];
  includeClients?: string[];
  saveToQueue?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  retryOnFail?: boolean;
  ttl?: number; // Time to live in seconds
}

// Authentication Payload
export interface WSAuthPayload {
  token: string;
  userId?: string;
  deviceId?: string;
  timestamp: number;
}

// Subscription Management
export interface WSSubscription {
  id: string;
  eventTypes: EventType[];
  handler: WSEventHandler;
  filter?: (message: WSMessage) => boolean;
  createdAt: Date;
}

// Error Types
export enum WSErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTH_FAILED = 'AUTH_FAILED',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface WSError extends Error {
  type: WSErrorType;
  code?: string;
  details?: any;
  retryable?: boolean;
}

// Metrics and Analytics
export interface WSMetrics {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  reconnections: number;
  averageLatency: number;
  uptime: number;
  roomStats: Map<string, {
    members: number;
    messages: number;
  }>;
}

// Type Guards
export function isOrderEvent(message: WSMessage): message is WSMessage<OrderEventPayload> {
  return message.category === EventCategory.ORDER;
}

export function isSubscriptionEvent(message: WSMessage): message is WSMessage<SubscriptionEventPayload> {
  return message.category === EventCategory.SUBSCRIPTION;
}

export function isNotificationEvent(message: WSMessage): message is WSMessage<NotificationPayload> {
  return message.category === EventCategory.NOTIFICATION;
}

export function isSystemEvent(message: WSMessage): message is WSMessage<SystemEventPayload> {
  return message.category === EventCategory.SYSTEM;
}

export function isDashboardEvent(message: WSMessage): message is WSMessage<DashboardStatsPayload> {
  return message.type === EventType.DASHBOARD_STATS_UPDATE;
}