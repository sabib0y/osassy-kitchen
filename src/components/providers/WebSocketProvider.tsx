// WebSocket Provider Component
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  WSMessage,
  EventType,
  EventCategory,
  WSEventHandler,
  NotificationPayload,
  OrderEventPayload,
  SubscriptionEventPayload,
  DashboardStatsPayload,
  SystemEventPayload
} from '@/types/websocket';

// WebSocket Context Type
interface WebSocketContextType {
  // Connection state
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  error: Error | null;
  
  // Methods
  send: <T>(message: WSMessage<T>) => void;
  subscribe: (eventType: EventType | EventType[], handler: WSEventHandler) => () => void;
  unsubscribe: (eventType: EventType | EventType[], handler?: WSEventHandler) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  reconnect: () => Promise<void>;
  
  // Typed event subscriptions
  onOrderUpdate: (handler: (payload: OrderEventPayload) => void) => () => void;
  onSubscriptionUpdate: (handler: (payload: SubscriptionEventPayload) => void) => () => void;
  onNotification: (handler: (payload: NotificationPayload) => void) => () => void;
  onDashboardUpdate: (handler: (payload: DashboardStatsPayload) => void) => () => void;
  onSystemMessage: (handler: (payload: SystemEventPayload) => void) => () => void;
  
  // Recent messages
  recentNotifications: NotificationPayload[];
  clearNotifications: () => void;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Provider Props
interface WebSocketProviderProps {
  children: ReactNode;
  config?: {
    maxNotifications?: number;
    autoReconnect?: boolean;
    debug?: boolean;
  };
}

// Provider Component
export function WebSocketProvider({ 
  children, 
  config = {} 
}: WebSocketProviderProps) {
  const { data: session } = useSession();
  const {
    connected,
    connecting,
    reconnecting,
    error,
    send,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
    reconnect,
    isInitialized
  } = useWebSocket({
    reconnect: config.autoReconnect !== false,
    debug: config.debug
  });

  const [recentNotifications, setRecentNotifications] = useState<NotificationPayload[]>([]);
  const maxNotifications = config.maxNotifications || 10;

  // Auto-join user rooms when connected
  useEffect(() => {
    if (connected && session?.user?.id) {
      // Join user-specific room
      joinRoom(`user:${session.user.id}`);
      
      // Join role-based room
      if (session.user.role === 'ADMIN') {
        joinRoom('admin:all');
      }
      
      // Join global room for system messages
      joinRoom('global');
    }
  }, [connected, session, joinRoom]);

  // Handle notifications
  useEffect(() => {
    if (!isInitialized) return;

    const handleNotification = (message: WSMessage<NotificationPayload>) => {
      setRecentNotifications(prev => {
        const updated = [message.payload, ...prev];
        return updated.slice(0, maxNotifications);
      });
    };

    const unsubscribe = subscribe(EventType.NOTIFICATION_NEW, handleNotification);
    return unsubscribe;
  }, [isInitialized, subscribe, maxNotifications]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setRecentNotifications([]);
  }, []);

  // Typed event subscription helpers
  const onOrderUpdate = useCallback((handler: (payload: OrderEventPayload) => void) => {
    return subscribe(
      [
        EventType.ORDER_CREATED,
        EventType.ORDER_UPDATED,
        EventType.ORDER_STATUS_CHANGED,
        EventType.ORDER_CANCELLED,
        EventType.ORDER_DELIVERED
      ],
      (message: WSMessage<OrderEventPayload>) => handler(message.payload)
    );
  }, [subscribe]);

  const onSubscriptionUpdate = useCallback((handler: (payload: SubscriptionEventPayload) => void) => {
    return subscribe(
      [
        EventType.SUBSCRIPTION_CREATED,
        EventType.SUBSCRIPTION_UPDATED,
        EventType.SUBSCRIPTION_PAUSED,
        EventType.SUBSCRIPTION_RESUMED,
        EventType.SUBSCRIPTION_CANCELLED,
        EventType.SUBSCRIPTION_PAYMENT_FAILED,
        EventType.SUBSCRIPTION_PAYMENT_SUCCESS
      ],
      (message: WSMessage<SubscriptionEventPayload>) => handler(message.payload)
    );
  }, [subscribe]);

  const onNotification = useCallback((handler: (payload: NotificationPayload) => void) => {
    return subscribe(
      EventType.NOTIFICATION_NEW,
      (message: WSMessage<NotificationPayload>) => handler(message.payload)
    );
  }, [subscribe]);

  const onDashboardUpdate = useCallback((handler: (payload: DashboardStatsPayload) => void) => {
    return subscribe(
      [
        EventType.DASHBOARD_STATS_UPDATE,
        EventType.DASHBOARD_ORDER_UPDATE,
        EventType.DASHBOARD_REVENUE_UPDATE
      ],
      (message: WSMessage<DashboardStatsPayload>) => handler(message.payload)
    );
  }, [subscribe]);

  const onSystemMessage = useCallback((handler: (payload: SystemEventPayload) => void) => {
    return subscribe(
      [
        EventType.SYSTEM_MAINTENANCE,
        EventType.SYSTEM_UPDATE,
        EventType.SYSTEM_BROADCAST
      ],
      (message: WSMessage<SystemEventPayload>) => handler(message.payload)
    );
  }, [subscribe]);

  // Context value
  const value: WebSocketContextType = {
    // Connection state
    connected,
    connecting,
    reconnecting,
    error: error ?? null,

    // Methods
    send,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
    reconnect,
    
    // Typed subscriptions
    onOrderUpdate,
    onSubscriptionUpdate,
    onNotification,
    onDashboardUpdate,
    onSystemMessage,
    
    // Notifications
    recentNotifications,
    clearNotifications
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
      {/* Connection status indicator for development */}
      {config.debug && (
        <ConnectionStatusIndicator
          connected={connected}
          connecting={connecting}
          reconnecting={reconnecting}
          error={error ?? null}
        />
      )}
    </WebSocketContext.Provider>
  );
}

// Hook to use WebSocket context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

// Safe hook that returns null when outside provider (useful during SSR or unauthenticated pages)
export function useOptionalWebSocketContext() {
  return useContext(WebSocketContext);
}

// Connection Status Indicator Component (for development)
function ConnectionStatusIndicator({
  connected,
  connecting,
  reconnecting,
  error
}: {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  error: Error | null;
}) {
  const getStatus = () => {
    if (connecting) return { text: 'Connecting...', color: 'orange' };
    if (reconnecting) return { text: 'Reconnecting...', color: 'orange' };
    if (connected) return { text: 'Connected', color: 'green' };
    if (error) return { text: 'Error', color: 'red' };
    return { text: 'Disconnected', color: 'gray' };
  };

  const status = getStatus();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        padding: '8px 16px',
        backgroundColor: 'white',
        border: `2px solid ${status.color}`,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 9999,
        fontSize: 12,
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: status.color,
          animation: connecting || reconnecting ? 'pulse 1s infinite' : undefined
        }}
      />
      <span>WebSocket: {status.text}</span>
      {error && (
        <span style={{ color: 'red', marginLeft: 8 }}>
          ({error.message})
        </span>
      )}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Notification Toast Component
export function NotificationToast() {
  const context = useOptionalWebSocketContext();
  if (!context) return null;
  const { recentNotifications, clearNotifications } = context;
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationPayload[]>([]);

  useEffect(() => {
    // Show new notifications
    const newNotifications = recentNotifications.filter(
      n => !visibleNotifications.find(v => v.id === n.id)
    );
    
    if (newNotifications.length > 0) {
      setVisibleNotifications(prev => [...newNotifications, ...prev].slice(0, 3));
      
      // Auto-hide after 5 seconds
      const timers = newNotifications.map(n => 
        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter(v => v.id !== n.id));
        }, 5000)
      );
      
      return () => timers.forEach(clearTimeout);
    }
  }, [recentNotifications]);

  const getNotificationStyle = (type: NotificationPayload['type']) => {
    switch (type) {
      case 'success': return { backgroundColor: '#10b981', color: 'white' };
      case 'error': return { backgroundColor: '#ef4444', color: 'white' };
      case 'warning': return { backgroundColor: '#f59e0b', color: 'white' };
      default: return { backgroundColor: '#3b82f6', color: 'white' };
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      {visibleNotifications.map(notification => (
        <div
          key={notification.id}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: 300,
            maxWidth: 400,
            animation: 'slideIn 0.3s ease-out',
            ...getNotificationStyle(notification.type)
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {notification.title}
          </div>
          <div style={{ fontSize: 14 }}>
            {notification.message}
          </div>
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              style={{
                display: 'inline-block',
                marginTop: 8,
                color: 'inherit',
                textDecoration: 'underline',
                fontSize: 14
              }}
            >
              {notification.actionText || 'View'}
            </a>
          )}
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}