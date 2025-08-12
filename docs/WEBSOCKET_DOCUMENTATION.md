# WebSocket Infrastructure Documentation

## Overview

The WebSocket infrastructure provides real-time, bidirectional communication for Osassy's Kitchen application. It enables instant updates for orders, subscriptions, notifications, and dashboard analytics.

## Architecture

### Components

1. **WebSocket Server** (`lib/websocket.ts`)
   - Manages Socket.IO server instance
   - Handles authentication and authorization
   - Room management for targeted messaging
   - Message queuing for offline users
   - Metrics collection and monitoring

2. **API Endpoint** (`pages/api/socket.ts`)
   - Initializes WebSocket server
   - Attaches to Next.js HTTP server
   - Handles WebSocket upgrade requests

3. **React Hook** (`hooks/useWebSocket.ts`)
   - Client-side WebSocket connection management
   - Event subscription/unsubscription
   - Automatic reconnection logic
   - Message buffering when disconnected

4. **Provider Component** (`components/providers/WebSocketProvider.tsx`)
   - React Context for WebSocket state
   - Typed event handlers
   - Notification management
   - Connection status indicators

5. **Type Definitions** (`types/websocket.ts`)
   - Comprehensive TypeScript types
   - Event enumerations
   - Type guards for runtime validation

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (USER/ADMIN)
- Automatic session integration with NextAuth

### Room Management
- User-specific rooms: `user:{userId}`
- Admin rooms: `admin:all`
- Order rooms: `order:{orderId}`
- Subscription rooms: `subscription:{subscriptionId}`
- Global broadcast room: `global`

### Event System

#### Event Categories
- `ORDER` - Order lifecycle events
- `SUBSCRIPTION` - Subscription management events
- `NOTIFICATION` - User notifications
- `SYSTEM` - System-wide messages
- `ADMIN` - Admin-specific events
- `USER` - User profile updates

#### Event Types
```typescript
// Order Events
ORDER_CREATED
ORDER_UPDATED
ORDER_STATUS_CHANGED
ORDER_CANCELLED
ORDER_DELIVERED

// Subscription Events
SUBSCRIPTION_CREATED
SUBSCRIPTION_UPDATED
SUBSCRIPTION_PAUSED
SUBSCRIPTION_RESUMED
SUBSCRIPTION_CANCELLED
SUBSCRIPTION_PAYMENT_FAILED
SUBSCRIPTION_PAYMENT_SUCCESS

// Notification Events
NOTIFICATION_NEW
NOTIFICATION_READ
NOTIFICATION_DISMISSED

// Dashboard Events
DASHBOARD_STATS_UPDATE
DASHBOARD_ORDER_UPDATE
DASHBOARD_REVENUE_UPDATE
```

### Message Queuing
- Offline message storage
- Automatic delivery on reconnection
- Queue size limits (100 messages)
- Priority-based message handling

### Reconnection Strategy
- Exponential backoff
- Configurable retry attempts
- Automatic room rejoin
- Message buffer flushing

### Metrics & Monitoring
- Connection statistics
- Message throughput
- Error tracking
- Room membership tracking
- Latency measurement

## Usage Examples

### Basic Setup

1. **Add WebSocket Provider to _app.tsx**
```typescript
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider>
      <WebSocketProvider config={{ debug: true }}>
        <Component {...pageProps} />
      </WebSocketProvider>
    </SessionProvider>
  );
}
```

2. **Use in Components**
```typescript
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function OrderDashboard() {
  const { connected, onOrderUpdate } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = onOrderUpdate((payload) => {
      console.log('Order updated:', payload);
      // Update UI
    });

    return unsubscribe;
  }, [onOrderUpdate]);

  return (
    <div>
      Status: {connected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### Sending Messages

```typescript
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { EventType, EventCategory } from '@/types/websocket';

function AdminBroadcast() {
  const { send } = useWebSocketContext();

  const broadcastMessage = () => {
    send({
      id: `msg-${Date.now()}`,
      type: EventType.ADMIN_BROADCAST,
      category: EventCategory.ADMIN,
      payload: {
        message: 'System maintenance scheduled',
        type: 'warning'
      },
      timestamp: new Date().toISOString()
    });
  };

  return <button onClick={broadcastMessage}>Broadcast</button>;
}
```

### Subscribing to Events

```typescript
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function SubscriptionManager() {
  const { onSubscriptionUpdate } = useWebSocketContext();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const unsubscribe = onSubscriptionUpdate((payload) => {
      if (payload.status === 'CANCELLED') {
        setSubscriptions(prev => 
          prev.filter(s => s.id !== payload.subscriptionId)
        );
      }
    });

    return unsubscribe;
  }, [onSubscriptionUpdate]);
}
```

### Room Management

```typescript
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

function OrderTracking({ orderId }) {
  const { joinRoom, leaveRoom } = useWebSocketContext();

  useEffect(() => {
    // Join order-specific room
    joinRoom(`order:${orderId}`);

    return () => {
      // Leave room on unmount
      leaveRoom(`order:${orderId}`);
    };
  }, [orderId, joinRoom, leaveRoom]);
}
```

### Server-Side Broadcasting

```typescript
import { 
  broadcastOrderUpdate, 
  broadcastSubscriptionUpdate,
  sendNotificationToUser,
  broadcastSystemMessage 
} from '@/lib/websocket';

// In API routes
export default async function handler(req, res) {
  // Update order in database
  const order = await updateOrder(orderId, updates);

  // Broadcast update to relevant rooms
  broadcastOrderUpdate(orderId, {
    orderId,
    userId: order.userId,
    status: order.status,
    totalPrice: order.totalPrice
  });

  // Send notification to user
  sendNotificationToUser(order.userId, {
    id: `notif-${Date.now()}`,
    title: 'Order Updated',
    message: `Your order #${orderId} is now ${order.status}`,
    type: 'info',
    actionUrl: `/orders/${orderId}`
  });

  res.json({ success: true });
}
```

## Security Considerations

### Authentication
- JWT tokens validated on connection
- Token refresh handled automatically
- Session expiry enforced

### Authorization
- Role-based room access
- User isolation (can't access other users' rooms)
- Admin privileges for system-wide access

### Data Protection
- Message validation
- Payload sanitization
- Rate limiting support
- Connection limits per user

### Best Practices
1. Always validate message payloads
2. Use typed event handlers
3. Implement error boundaries
4. Clean up subscriptions on unmount
5. Handle reconnection gracefully
6. Monitor WebSocket metrics

## Configuration

### Environment Variables
```env
NEXTAUTH_SECRET=your-jwt-secret
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Client Configuration
```typescript
const config = {
  reconnect: true,              // Enable auto-reconnect
  reconnectAttempts: 5,         // Max reconnection attempts
  reconnectInterval: 3000,      // Initial reconnect delay (ms)
  pingInterval: 30000,          // Ping interval (ms)
  pongTimeout: 10000,          // Pong timeout (ms)
  debug: true,                 // Enable debug logging
  maxNotifications: 10         // Max notifications to store
};
```

### Server Configuration
```typescript
const wsServer = getWebSocketServer({
  jwtSecret: process.env.NEXTAUTH_SECRET,
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  maxPayloadSize: 1e6 // 1MB
});
```

## Testing

### Unit Tests
```bash
npm test src/__tests__/lib/websocket.test.ts
npm test src/__tests__/hooks/useWebSocket.test.tsx
```

### Integration Testing
```typescript
import { WebSocketServer } from '@/lib/websocket';
import { createMockSocket } from '@/test-utils';

describe('WebSocket Integration', () => {
  it('should handle order updates', async () => {
    const wsServer = new WebSocketServer({ jwtSecret: 'test' });
    const socket = createMockSocket();
    
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check JWT secret configuration
   - Verify /api/socket endpoint is accessible
   - Check CORS settings

2. **Messages Not Received**
   - Verify room membership
   - Check event type subscriptions
   - Validate message format

3. **Reconnection Issues**
   - Check network connectivity
   - Verify token validity
   - Review reconnection config

### Debug Mode
Enable debug mode for detailed logging:
```typescript
<WebSocketProvider config={{ debug: true }}>
```

### Monitoring
Access WebSocket metrics:
```typescript
const { state } = useWebSocketContext();
console.log('WebSocket State:', state);
```

## Performance Optimization

### Message Batching
```typescript
// Batch multiple updates
const updates = [];
updates.forEach(update => {
  wsServer.broadcast(update, { saveToQueue: false });
});
```

### Room Optimization
- Use specific rooms instead of global broadcasts
- Clean up unused rooms
- Limit room membership

### Connection Pooling
- Reuse connections across components
- Use single provider at app level
- Implement connection sharing

## Future Enhancements

1. **Binary Protocol Support**
   - File uploads
   - Image streaming
   - Binary data transmission

2. **Advanced Features**
   - Presence system
   - Typing indicators
   - Read receipts
   - Message history

3. **Scaling**
   - Redis adapter for multi-server
   - Horizontal scaling support
   - Load balancing

4. **Analytics**
   - Event tracking
   - Performance metrics
   - User behavior analysis

## Integration Points

### Chunk-013 Integration
The WebSocket infrastructure is ready for integration with:
- Real-time order tracking
- Live dashboard updates
- Instant notifications
- Admin broadcasting
- Subscription monitoring

### API Integration
All API endpoints can leverage WebSocket broadcasting:
```typescript
// In any API route
import { broadcastOrderUpdate } from '@/lib/websocket';

// After database update
broadcastOrderUpdate(orderId, payload);
```

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review test files for examples
3. Enable debug mode for detailed logs
4. Monitor WebSocket metrics