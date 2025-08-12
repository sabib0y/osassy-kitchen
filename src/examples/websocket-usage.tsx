// WebSocket Usage Examples
import React, { useEffect, useState } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { 
  EventType, 
  EventCategory,
  OrderEventPayload,
  SubscriptionEventPayload,
  NotificationPayload,
  DashboardStatsPayload
} from '@/types/websocket';

// Example 1: Real-time Order Tracking Component
export function OrderTracker({ orderId }: { orderId: string }) {
  const { connected, joinRoom, leaveRoom, onOrderUpdate } = useWebSocketContext();
  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Join order-specific room
    joinRoom(`order:${orderId}`);

    // Subscribe to order updates
    const unsubscribe = onOrderUpdate((payload: OrderEventPayload) => {
      if (payload.orderId === orderId) {
        setOrderStatus(payload.status);
        setLastUpdate(new Date());
        
        // Show notification
        if (payload.status === 'DELIVERED') {
          alert(`Order ${orderId} has been delivered!`);
        }
      }
    });

    // Cleanup
    return () => {
      leaveRoom(`order:${orderId}`);
      unsubscribe();
    };
  }, [orderId, joinRoom, leaveRoom, onOrderUpdate]);

  return (
    <div className="order-tracker">
      <h3>Order #{orderId}</h3>
      <p>Status: {orderStatus}</p>
      <p>Connection: {connected ? '🟢 Live' : '🔴 Offline'}</p>
      {lastUpdate && (
        <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
      )}
    </div>
  );
}

// Example 2: Admin Dashboard with Live Stats
export function AdminDashboard() {
  const { connected, onDashboardUpdate, joinRoom } = useWebSocketContext();
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    activeUsers: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    // Join admin room
    joinRoom('admin:all');

    // Subscribe to dashboard updates
    const unsubscribe = onDashboardUpdate((payload: DashboardStatsPayload) => {
      if (payload.type === 'orders') {
        setStats(prev => ({
          ...prev,
          totalOrders: payload.stats.total || prev.totalOrders,
          pendingOrders: payload.stats.pending || prev.pendingOrders
        }));
      } else if (payload.type === 'revenue') {
        setStats(prev => ({
          ...prev,
          revenue: payload.stats.total || prev.revenue
        }));
      }
    });

    return unsubscribe;
  }, [onDashboardUpdate, joinRoom]);

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard {connected && '(Live)'}</h2>
      <div className="stats-grid">
        <div>Total Orders: {stats.totalOrders}</div>
        <div>Pending Orders: {stats.pendingOrders}</div>
        <div>Revenue: £{stats.revenue}</div>
        <div>Active Users: {stats.activeUsers}</div>
      </div>
    </div>
  );
}

// Example 3: Notification Center
export function NotificationCenter() {
  const { recentNotifications, clearNotifications } = useWebSocketContext();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="notification-center">
      <button onClick={() => setShowNotifications(!showNotifications)}>
        🔔 Notifications ({recentNotifications.length})
      </button>
      
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <button onClick={clearNotifications}>Clear All</button>
          </div>
          
          {recentNotifications.length === 0 ? (
            <p>No new notifications</p>
          ) : (
            recentNotifications.map((notif: NotificationPayload) => (
              <div key={notif.id} className={`notification ${notif.type}`}>
                <strong>{notif.title}</strong>
                <p>{notif.message}</p>
                {notif.actionUrl && (
                  <a href={notif.actionUrl}>{notif.actionText || 'View'}</a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Example 4: Subscription Monitor
export function SubscriptionMonitor({ userId }: { userId: string }) {
  const { onSubscriptionUpdate } = useWebSocketContext();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onSubscriptionUpdate((payload: SubscriptionEventPayload) => {
      if (payload.userId === userId) {
        // Update subscription list
        setSubscriptions(prev => {
          const index = prev.findIndex(s => s.id === payload.subscriptionId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: payload.status };
            return updated;
          }
          return prev;
        });

        // Show alerts for important events
        if (payload.status === 'PAYMENT_FAILED') {
          setAlerts(prev => [...prev, `Payment failed for ${payload.planName}`]);
        } else if (payload.status === 'CANCELLED') {
          setAlerts(prev => [...prev, `${payload.planName} has been cancelled`]);
        }
      }
    });

    return unsubscribe;
  }, [userId, onSubscriptionUpdate]);

  return (
    <div className="subscription-monitor">
      <h3>Your Subscriptions</h3>
      
      {alerts.length > 0 && (
        <div className="alerts">
          {alerts.map((alert, i) => (
            <div key={i} className="alert">⚠️ {alert}</div>
          ))}
        </div>
      )}
      
      <div className="subscription-list">
        {subscriptions.map(sub => (
          <div key={sub.id} className="subscription-item">
            <span>{sub.planName}</span>
            <span className={`status ${sub.status.toLowerCase()}`}>
              {sub.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example 5: Admin Broadcast Tool
export function AdminBroadcastTool() {
  const { send, connected } = useWebSocketContext();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'error'>('info');

  const broadcastMessage = () => {
    if (!message.trim()) return;

    send({
      id: `broadcast-${Date.now()}`,
      type: EventType.ADMIN_BROADCAST,
      category: EventCategory.ADMIN,
      payload: {
        message,
        type,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      metadata: {
        priority: type === 'error' ? 'urgent' : 'normal'
      }
    });

    setMessage('');
  };

  return (
    <div className="admin-broadcast">
      <h3>Broadcast Message</h3>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message to broadcast..."
        disabled={!connected}
      />
      <select value={type} onChange={(e) => setType(e.target.value as any)}>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
      </select>
      <button onClick={broadcastMessage} disabled={!connected || !message}>
        Send Broadcast
      </button>
    </div>
  );
}

// Example 6: Connection Status Component
export function ConnectionStatus() {
  const { connected, connecting, reconnecting, error } = useWebSocketContext();

  const getStatusText = () => {
    if (connecting) return 'Connecting...';
    if (reconnecting) return 'Reconnecting...';
    if (connected) return 'Connected';
    if (error) return `Error: ${error.message}`;
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (connected) return '#10b981';
    if (connecting || reconnecting) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px'
    }}>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        animation: (connecting || reconnecting) ? 'pulse 1s infinite' : undefined
      }} />
      <span>{getStatusText()}</span>
    </div>
  );
}

// Example 7: Custom Event Handler
export function CustomEventHandler() {
  const { subscribe, send } = useWebSocketContext();
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to multiple event types
    const unsubscribe = subscribe(
      [
        EventType.ORDER_CREATED,
        EventType.ORDER_UPDATED,
        EventType.SUBSCRIPTION_CREATED,
        EventType.NOTIFICATION_NEW
      ],
      (message) => {
        const logEntry = `[${new Date().toLocaleTimeString()}] ${message.type}: ${JSON.stringify(message.payload)}`;
        setEventLog(prev => [logEntry, ...prev].slice(0, 50)); // Keep last 50 events
      }
    );

    return unsubscribe;
  }, [subscribe]);

  const sendTestEvent = () => {
    send({
      id: `test-${Date.now()}`,
      type: EventType.NOTIFICATION_NEW,
      category: EventCategory.NOTIFICATION,
      payload: {
        id: `notif-${Date.now()}`,
        title: 'Test Notification',
        message: 'This is a test notification from the custom event handler',
        type: 'info'
      },
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="event-handler">
      <h3>Event Log</h3>
      <button onClick={sendTestEvent}>Send Test Event</button>
      <div style={{ 
        height: '300px', 
        overflowY: 'auto', 
        backgroundColor: '#1f2937',
        color: '#10b981',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {eventLog.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}

// Example 8: Server-Side API Route with WebSocket
export async function exampleApiRoute(req: any, res: any) {
  // This would be in pages/api/orders/[id]/update.ts
  
  const { orderId } = req.query;
  const { status, notes } = req.body;

  try {
    // Update order in database
    const order = await updateOrderInDatabase(orderId, { status, notes });

    // Import WebSocket utilities
    const { broadcastOrderUpdate, sendNotificationToUser } = await import('@/lib/websocket');

    // Broadcast order update
    broadcastOrderUpdate(orderId, {
      orderId,
      userId: order.userId,
      status: order.status,
      totalPrice: order.totalPrice,
      previousStatus: order.previousStatus,
      updatedBy: req.session.user.id
    });

    // Send notification to user
    sendNotificationToUser(order.userId, {
      id: `notif-${Date.now()}`,
      title: 'Order Update',
      message: `Your order #${orderId} status changed to ${status}`,
      type: 'info',
      actionUrl: `/orders/${orderId}`,
      actionText: 'View Order',
      priority: status === 'DELIVERED' ? 'high' : 'normal'
    });

    // Send response
    res.status(200).json({
      success: true,
      order,
      message: 'Order updated and notifications sent'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
}

// Helper function (mock)
async function updateOrderInDatabase(orderId: string, updates: any) {
  // Mock database update
  return {
    id: orderId,
    userId: 'user-123',
    status: updates.status,
    totalPrice: 50,
    previousStatus: 'PENDING',
    ...updates
  };
}