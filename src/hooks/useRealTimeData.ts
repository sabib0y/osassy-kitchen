// Real-time Data Synchronization Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { 
  EventType, 
  WSMessage,
  OrderEventPayload,
  SubscriptionEventPayload,
  NotificationPayload
} from '@/types/websocket';

interface UseRealTimeDataOptions<T> {
  // Initial data
  initialData?: T;
  
  // Events to listen for
  events?: EventType[];
  
  // Room to join (optional)
  room?: string;
  
  // Transform function for incoming data
  transform?: (data: any) => T;
  
  // Merge strategy for updates
  merge?: (current: T, update: Partial<T>) => T;
  
  // Auto-fetch on mount
  autoFetch?: boolean;
  
  // Fetch URL
  fetchUrl?: string;
  
  // Polling interval (fallback when WebSocket is disconnected)
  pollingInterval?: number;
  
  // Cache key for persistence
  cacheKey?: string;
  
  // Cache TTL in milliseconds
  cacheTTL?: number;
}

interface RealTimeDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  isLive: boolean;
  isStale: boolean;
}

export function useRealTimeData<T = any>(
  options: UseRealTimeDataOptions<T>
): RealTimeDataState<T> & {
  refetch: () => Promise<void>;
  update: (data: Partial<T>) => void;
  reset: () => void;
} {
  const {
    initialData = null,
    events = [],
    room,
    transform = (data) => data,
    merge = (current, update) => ({ ...current, ...update } as T),
    autoFetch = true,
    fetchUrl,
    pollingInterval = 30000,
    cacheKey,
    cacheTTL = 300000 // 5 minutes
  } = options;

  const { 
    connected, 
    subscribe, 
    unsubscribe, 
    joinRoom, 
    leaveRoom 
  } = useWebSocketContext();

  const [state, setState] = useState<RealTimeDataState<T>>({
    data: initialData,
    loading: autoFetch && !initialData,
    error: null,
    lastUpdate: null,
    isLive: false,
    isStale: false
  });

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Load from cache
  const loadFromCache = useCallback(() => {
    if (!cacheKey) return null;
    
    try {
      const cached = localStorage.getItem(`rtd_${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < cacheTTL) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to load from cache:', error);
    }
    
    return null;
  }, [cacheKey, cacheTTL]);

  // Save to cache
  const saveToCache = useCallback((data: T) => {
    if (!cacheKey || !data) return;
    
    try {
      localStorage.setItem(`rtd_${cacheKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }, [cacheKey]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!fetchUrl) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      const rawData = await response.json();
      const transformedData = transform(rawData);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          data: transformedData,
          loading: false,
          lastUpdate: new Date(),
          isStale: false
        }));
        
        saveToCache(transformedData);
      }
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error
        }));
      }
    }
  }, [fetchUrl, transform, saveToCache]);

  // Handle WebSocket message
  const handleMessage = useCallback((message: WSMessage) => {
    if (!mountedRef.current) return;
    
    const update = transform(message.payload);
    
    setState(prev => ({
      ...prev,
      data: prev.data ? merge(prev.data, update as Partial<T>) : update,
      lastUpdate: new Date(),
      isStale: false
    }));
    
    // Update cache
    if (state.data) {
      saveToCache(merge(state.data, update as Partial<T>));
    }
  }, [transform, merge, saveToCache, state.data]);

  // Setup WebSocket subscriptions
  useEffect(() => {
    if (!connected || events.length === 0) return;
    
    // Join room if specified
    if (room) {
      joinRoom(room);
    }
    
    // Subscribe to events
    const unsubscribeFn = subscribe(events, handleMessage);
    
    // Mark as live
    setState(prev => ({ ...prev, isLive: true }));
    
    return () => {
      unsubscribeFn();
      if (room) {
        leaveRoom(room);
      }
      setState(prev => ({ ...prev, isLive: false }));
    };
  }, [connected, events, room, joinRoom, leaveRoom, subscribe, handleMessage]);

  // Setup polling fallback
  useEffect(() => {
    if (connected || !fetchUrl || !pollingInterval) return;
    
    // Start polling when disconnected
    pollingTimerRef.current = setInterval(() => {
      fetchData();
    }, pollingInterval);
    
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [connected, fetchUrl, pollingInterval, fetchData]);

  // Check staleness
  useEffect(() => {
    if (!state.lastUpdate || !cacheTTL) return;
    
    const checkStaleness = () => {
      const age = Date.now() - state.lastUpdate!.getTime();
      if (age > cacheTTL) {
        setState(prev => ({ ...prev, isStale: true }));
      }
    };
    
    cacheTimerRef.current = setInterval(checkStaleness, 60000); // Check every minute
    
    return () => {
      if (cacheTimerRef.current) {
        clearInterval(cacheTimerRef.current);
      }
    };
  }, [state.lastUpdate, cacheTTL]);

  // Initial load
  useEffect(() => {
    if (!autoFetch) return;
    
    // Try to load from cache first
    const cached = loadFromCache();
    if (cached) {
      setState(prev => ({
        ...prev,
        data: cached,
        loading: false
      }));
    }
    
    // Fetch fresh data
    if (fetchUrl) {
      fetchData();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Public methods
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const update = useCallback((data: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: prev.data ? merge(prev.data, data) : (data as T),
      lastUpdate: new Date(),
      isStale: false
    }));
    
    if (state.data) {
      saveToCache(merge(state.data, data));
    }
  }, [merge, saveToCache, state.data]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      lastUpdate: null,
      isLive: false,
      isStale: false
    });
    
    if (cacheKey) {
      localStorage.removeItem(`rtd_${cacheKey}`);
    }
  }, [initialData, cacheKey]);

  return {
    ...state,
    refetch,
    update,
    reset
  };
}

// Specialized hooks for common use cases

export function useRealTimeOrders(userId?: string) {
  return useRealTimeData<OrderEventPayload[]>({
    events: [
      EventType.ORDER_CREATED,
      EventType.ORDER_UPDATED,
      EventType.ORDER_STATUS_CHANGED,
      EventType.ORDER_DELIVERED,
      EventType.ORDER_CANCELLED
    ],
    room: userId ? `user:${userId}` : 'admin:all',
    fetchUrl: userId ? `/api/users/${userId}/orders` : '/api/admin/orders',
    cacheKey: `orders_${userId || 'admin'}`,
    initialData: [],
    merge: (current, update) => {
      // Add or update order in the list
      const order = update as unknown as OrderEventPayload;
      const existing = current.findIndex(o => o.orderId === order.orderId);
      
      if (existing >= 0) {
        const updated = [...current];
        updated[existing] = { ...updated[existing], ...order };
        return updated;
      }
      
      return [order, ...current];
    }
  });
}

export function useRealTimeSubscription(subscriptionId: string) {
  return useRealTimeData<SubscriptionEventPayload>({
    events: [
      EventType.SUBSCRIPTION_UPDATED,
      EventType.SUBSCRIPTION_PAUSED,
      EventType.SUBSCRIPTION_RESUMED,
      EventType.SUBSCRIPTION_CANCELLED,
      EventType.SUBSCRIPTION_PAYMENT_SUCCESS,
      EventType.SUBSCRIPTION_PAYMENT_FAILED
    ],
    room: `subscription:${subscriptionId}`,
    fetchUrl: `/api/subscriptions/${subscriptionId}`,
    cacheKey: `subscription_${subscriptionId}`
  });
}

export function useRealTimeNotifications(userId: string, maxItems = 20) {
  return useRealTimeData<NotificationPayload[]>({
    events: [EventType.NOTIFICATION_NEW],
    room: `user:${userId}`,
    fetchUrl: `/api/users/${userId}/notifications`,
    cacheKey: `notifications_${userId}`,
    initialData: [],
    merge: (current, update) => {
      const notification = update as unknown as NotificationPayload;
      return [notification, ...current].slice(0, maxItems);
    }
  });
}

export function useRealTimeDashboard() {
  return useRealTimeData({
    events: [
      EventType.DASHBOARD_STATS_UPDATE,
      EventType.DASHBOARD_ORDER_UPDATE,
      EventType.DASHBOARD_REVENUE_UPDATE
    ],
    room: 'admin:dashboard',
    fetchUrl: '/api/admin/dashboard',
    cacheKey: 'admin_dashboard',
    pollingInterval: 60000 // Poll every minute when disconnected
  });
}

// Optimistic update hook
export function useOptimisticUpdate<T>(
  realTimeData: RealTimeDataState<T> & { update: (data: Partial<T>) => void }
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);
  
  const executeUpdate = useCallback(async (
    updateFn: () => Promise<T>,
    optimisticValue: Partial<T>
  ) => {
    // Apply optimistic update
    setOptimisticData(prev => 
      prev ? { ...prev, ...optimisticValue } : optimisticValue as T
    );
    setIsPending(true);
    
    try {
      // Execute actual update
      const result = await updateFn();
      
      // Update real data
      realTimeData.update(result as Partial<T>);
      
      // Clear optimistic data
      setOptimisticData(null);
      setIsPending(false);
      
      return result;
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticData(null);
      setIsPending(false);
      throw error;
    }
  }, [realTimeData]);
  
  return {
    data: optimisticData || realTimeData.data,
    isPending,
    executeUpdate
  };
}