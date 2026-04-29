// WebSocketProvider Tests
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import {
  WebSocketProvider,
  useWebSocketContext,
  useOptionalWebSocketContext,
  NotificationToast,
} from '@/components/providers/WebSocketProvider';
import { useSession } from 'next-auth/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { EventType, EventCategory, NotificationPayload, WSMessage } from '@/types/websocket';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/hooks/useWebSocket');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

// Helper to create a mock notification payload
const createMockNotification = (overrides: Partial<NotificationPayload> = {}): NotificationPayload => ({
  id: `notif-${Date.now()}-${Math.random()}`,
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'info',
  timestamp: new Date().toISOString(),
  ...overrides,
});

// Helper to create a WSMessage wrapping a notification
const createNotificationMessage = (
  notification: NotificationPayload
): WSMessage<NotificationPayload> => ({
  id: `msg-${notification.id}`,
  type: EventType.NOTIFICATION_NEW,
  category: EventCategory.NOTIFICATION,
  payload: notification,
  timestamp: notification.timestamp,
});

// Test component that consumes the context
function TestConsumer() {
  const ctx = useWebSocketContext();
  return (
    <div>
      <span data-testid="connected">{String(ctx.connected)}</span>
      <span data-testid="connecting">{String(ctx.connecting)}</span>
      <span data-testid="reconnecting">{String(ctx.reconnecting)}</span>
      <span data-testid="error">{ctx.error ? ctx.error.message : 'none'}</span>
      <span data-testid="notification-count">{ctx.recentNotifications.length}</span>
      {ctx.recentNotifications.map((n) => (
        <span key={n.id} data-testid={`notif-${n.id}`}>
          {n.title}
        </span>
      ))}
      <button data-testid="clear-btn" onClick={ctx.clearNotifications}>
        Clear
      </button>
    </div>
  );
}

// Test component for optional context hook
function OptionalConsumer() {
  const ctx = useOptionalWebSocketContext();
  return (
    <div>
      <span data-testid="has-context">{String(ctx !== null)}</span>
    </div>
  );
}

describe('WebSocketProvider', () => {
  // Capture subscribe handlers so we can simulate events
  let subscribedHandlers: Map<string, Function>;
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;
  let mockJoinRoom: jest.Mock;
  let mockLeaveRoom: jest.Mock;
  let mockSend: jest.Mock;
  let mockReconnect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    subscribedHandlers = new Map();

    mockSubscribe = jest.fn().mockImplementation(
      (eventType: EventType | EventType[], handler: Function) => {
        const types = Array.isArray(eventType) ? eventType : [eventType];
        types.forEach((t) => subscribedHandlers.set(t, handler));
        return () => {
          types.forEach((t) => subscribedHandlers.delete(t));
        };
      }
    );
    mockUnsubscribe = jest.fn();
    mockJoinRoom = jest.fn();
    mockLeaveRoom = jest.fn();
    mockSend = jest.fn();
    mockReconnect = jest.fn();

    mockUseWebSocket.mockReturnValue({
      connected: false,
      connecting: false,
      reconnecting: false,
      error: null,
      isInitialized: false,
      send: mockSend,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
      reconnect: mockReconnect,
      state: {
        connected: false,
        connecting: false,
        reconnecting: false,
        error: null,
        reconnectAttempts: 0,
        rooms: new Set(),
        messageQueue: [],
      },
      client: null,
    });

    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'USER' },
        expires: '2099-01-01',
      },
      status: 'authenticated',
      update: jest.fn(),
    } as any);
  });

  describe('Context creation', () => {
    it('should provide context to children', () => {
      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByTestId('connected')).toHaveTextContent('false');
      expect(screen.getByTestId('connecting')).toHaveTextContent('false');
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    });

    it('should expose connection state from useWebSocket', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        connected: true,
        connecting: false,
        reconnecting: false,
        error: null,
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByTestId('connected')).toHaveTextContent('true');
    });

    it('should expose error state', () => {
      const testError = new Error('Connection lost');
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        error: testError,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByTestId('error')).toHaveTextContent('Connection lost');
    });
  });

  describe('Auto-join rooms', () => {
    it('should join user room and global room when connected', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        connected: true,
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(mockJoinRoom).toHaveBeenCalledWith('user:user-1');
      expect(mockJoinRoom).toHaveBeenCalledWith('global');
      expect(mockJoinRoom).not.toHaveBeenCalledWith('admin:all');
    });

    it('should join admin room for admin users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
          expires: '2099-01-01',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as any);

      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        connected: true,
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(mockJoinRoom).toHaveBeenCalledWith('user:admin-1');
      expect(mockJoinRoom).toHaveBeenCalledWith('admin:all');
      expect(mockJoinRoom).toHaveBeenCalledWith('global');
    });

    it('should not join rooms when disconnected', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        connected: false,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(mockJoinRoom).not.toHaveBeenCalled();
    });

    it('should not join rooms without a session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as any);

      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        connected: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(mockJoinRoom).not.toHaveBeenCalled();
    });
  });

  describe('Notification tracking', () => {
    it('should subscribe to NOTIFICATION_NEW when initialised', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        EventType.NOTIFICATION_NEW,
        expect.any(Function)
      );
    });

    it('should not subscribe when not initialised', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: false,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      // subscribe is called 0 times for NOTIFICATION_NEW
      const notifCalls = mockSubscribe.mock.calls.filter(
        (call: any[]) => call[0] === EventType.NOTIFICATION_NEW
      );
      expect(notifCalls).toHaveLength(0);
    });

    it('should add incoming notifications to recentNotifications', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      const notification = createMockNotification({ id: 'n1', title: 'Order Shipped' });
      const message = createNotificationMessage(notification);

      // Simulate the provider receiving a notification
      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW);
      expect(handler).toBeDefined();

      act(() => {
        handler!(message);
      });

      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      expect(screen.getByTestId('notif-n1')).toHaveTextContent('Order Shipped');
    });

    it('should prepend new notifications (newest first)', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        handler(createNotificationMessage(createMockNotification({ id: 'n1', title: 'First' })));
      });
      act(() => {
        handler(createNotificationMessage(createMockNotification({ id: 'n2', title: 'Second' })));
      });

      const items = screen.getAllByTestId(/^notif-/);
      expect(items[0]).toHaveTextContent('Second');
      expect(items[1]).toHaveTextContent('First');
    });

    it('should cap notifications at maxNotifications (default 10)', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        for (let i = 0; i < 12; i++) {
          handler(
            createNotificationMessage(
              createMockNotification({ id: `n${i}`, title: `Notification ${i}` })
            )
          );
        }
      });

      expect(screen.getByTestId('notification-count')).toHaveTextContent('10');
    });

    it('should respect custom maxNotifications config', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider config={{ maxNotifications: 3 }}>
          <TestConsumer />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        for (let i = 0; i < 5; i++) {
          handler(
            createNotificationMessage(
              createMockNotification({ id: `n${i}`, title: `Notification ${i}` })
            )
          );
        }
      });

      expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
    });

    it('should clear all notifications when clearNotifications is called', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        handler(createNotificationMessage(createMockNotification({ id: 'n1' })));
        handler(createNotificationMessage(createMockNotification({ id: 'n2' })));
      });

      expect(screen.getByTestId('notification-count')).toHaveTextContent('2');

      act(() => {
        screen.getByTestId('clear-btn').click();
      });

      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    });
  });

  describe('Typed subscription helpers', () => {
    it('should provide onOrderUpdate that subscribes to all order events', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      function OrderConsumer() {
        const ctx = useWebSocketContext();
        React.useEffect(() => {
          const unsub = ctx.onOrderUpdate(() => {});
          return unsub;
        }, [ctx]);
        return <div>order consumer</div>;
      }

      render(
        <WebSocketProvider>
          <OrderConsumer />
        </WebSocketProvider>
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        [
          EventType.ORDER_CREATED,
          EventType.ORDER_UPDATED,
          EventType.ORDER_STATUS_CHANGED,
          EventType.ORDER_CANCELLED,
          EventType.ORDER_DELIVERED,
        ],
        expect.any(Function)
      );
    });

    it('should provide onSubscriptionUpdate that subscribes to all subscription events', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      function SubConsumer() {
        const ctx = useWebSocketContext();
        React.useEffect(() => {
          const unsub = ctx.onSubscriptionUpdate(() => {});
          return unsub;
        }, [ctx]);
        return <div>sub consumer</div>;
      }

      render(
        <WebSocketProvider>
          <SubConsumer />
        </WebSocketProvider>
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        [
          EventType.SUBSCRIPTION_CREATED,
          EventType.SUBSCRIPTION_UPDATED,
          EventType.SUBSCRIPTION_PAUSED,
          EventType.SUBSCRIPTION_RESUMED,
          EventType.SUBSCRIPTION_CANCELLED,
          EventType.SUBSCRIPTION_PAYMENT_FAILED,
          EventType.SUBSCRIPTION_PAYMENT_SUCCESS,
        ],
        expect.any(Function)
      );
    });

    it('should provide onNotification that subscribes to NOTIFICATION_NEW', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      function NotifConsumer() {
        const ctx = useWebSocketContext();
        React.useEffect(() => {
          const unsub = ctx.onNotification(() => {});
          return unsub;
        }, [ctx]);
        return <div>notif consumer</div>;
      }

      render(
        <WebSocketProvider>
          <NotifConsumer />
        </WebSocketProvider>
      );

      // Should have at least 2 calls for NOTIFICATION_NEW:
      // one from the provider itself, one from the consumer
      const notifCalls = mockSubscribe.mock.calls.filter(
        (call: any[]) => call[0] === EventType.NOTIFICATION_NEW
      );
      expect(notifCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('should provide onDashboardUpdate that subscribes to dashboard events', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      function DashConsumer() {
        const ctx = useWebSocketContext();
        React.useEffect(() => {
          const unsub = ctx.onDashboardUpdate(() => {});
          return unsub;
        }, [ctx]);
        return <div>dash consumer</div>;
      }

      render(
        <WebSocketProvider>
          <DashConsumer />
        </WebSocketProvider>
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        [
          EventType.DASHBOARD_STATS_UPDATE,
          EventType.DASHBOARD_ORDER_UPDATE,
          EventType.DASHBOARD_REVENUE_UPDATE,
        ],
        expect.any(Function)
      );
    });

    it('should provide onSystemMessage that subscribes to system events', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      function SysConsumer() {
        const ctx = useWebSocketContext();
        React.useEffect(() => {
          const unsub = ctx.onSystemMessage(() => {});
          return unsub;
        }, [ctx]);
        return <div>sys consumer</div>;
      }

      render(
        <WebSocketProvider>
          <SysConsumer />
        </WebSocketProvider>
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        [
          EventType.SYSTEM_MAINTENANCE,
          EventType.SYSTEM_UPDATE,
          EventType.SYSTEM_BROADCAST,
        ],
        expect.any(Function)
      );
    });
  });

  describe('useWebSocketContext hook', () => {
    it('should throw when used outside provider', () => {
      // Suppress console.error for expected error
      const spy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useWebSocketContext must be used within WebSocketProvider');

      spy.mockRestore();
    });
  });

  describe('useOptionalWebSocketContext hook', () => {
    it('should return null when used outside provider', () => {
      render(<OptionalConsumer />);

      expect(screen.getByTestId('has-context')).toHaveTextContent('false');
    });

    it('should return context when used inside provider', () => {
      render(
        <WebSocketProvider>
          <OptionalConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByTestId('has-context')).toHaveTextContent('true');
    });
  });

  describe('ConnectionStatusIndicator (debug mode)', () => {
    it('should not show status indicator by default', () => {
      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.queryByText(/WebSocket:/)).not.toBeInTheDocument();
    });

    it('should show status indicator when debug is enabled', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        connected: true,
      });

      render(
        <WebSocketProvider config={{ debug: true }}>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByText('WebSocket: Connected')).toBeInTheDocument();
    });

    it('should show connecting state in debug mode', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        connecting: true,
      });

      render(
        <WebSocketProvider config={{ debug: true }}>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByText('WebSocket: Connecting...')).toBeInTheDocument();
    });

    it('should show reconnecting state in debug mode', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        reconnecting: true,
      });

      render(
        <WebSocketProvider config={{ debug: true }}>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByText('WebSocket: Reconnecting...')).toBeInTheDocument();
    });

    it('should show error state in debug mode', () => {
      const testError = new Error('Socket timed out');
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        error: testError,
      });

      render(
        <WebSocketProvider config={{ debug: true }}>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByText('WebSocket: Error')).toBeInTheDocument();
      expect(screen.getByText('(Socket timed out)')).toBeInTheDocument();
    });

    it('should show disconnected state in debug mode', () => {
      render(
        <WebSocketProvider config={{ debug: true }}>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(screen.getByText('WebSocket: Disconnected')).toBeInTheDocument();
    });
  });

  describe('NotificationToast', () => {
    it('should render nothing when outside provider', () => {
      const { container } = render(<NotificationToast />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when there are no notifications', () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      const { container } = render(
        <WebSocketProvider>
          <NotificationToast />
        </WebSocketProvider>
      );

      // NotificationToast renders null when no visible notifications
      // The provider wrapper is there but toast content should be absent
      expect(screen.queryByText('Test Notification')).not.toBeInTheDocument();
    });

    it('should display notification titles and messages', async () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <NotificationToast />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        handler(
          createNotificationMessage(
            createMockNotification({
              id: 'toast-1',
              title: 'Delivery Update',
              message: 'Your order is on its way',
              type: 'success',
            })
          )
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Delivery Update')).toBeInTheDocument();
        expect(screen.getByText('Your order is on its way')).toBeInTheDocument();
      });
    });

    it('should show action link when actionUrl is provided', async () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <NotificationToast />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        handler(
          createNotificationMessage(
            createMockNotification({
              id: 'toast-action',
              title: 'New Order',
              message: 'You have a new order',
              actionUrl: '/user/orders/123',
              actionText: 'View Order',
            })
          )
        );
      });

      await waitFor(() => {
        const link = screen.getByText('View Order');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/user/orders/123');
      });
    });

    it('should default action text to "View" when actionText is not provided', async () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <NotificationToast />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        handler(
          createNotificationMessage(
            createMockNotification({
              id: 'toast-default-text',
              title: 'Update',
              message: 'Something happened',
              actionUrl: '/somewhere',
            })
          )
        );
      });

      await waitFor(() => {
        expect(screen.getByText('View')).toBeInTheDocument();
      });
    });

    it('should show at most 3 toast notifications', async () => {
      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <NotificationToast />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        for (let i = 0; i < 5; i++) {
          handler(
            createNotificationMessage(
              createMockNotification({
                id: `toast-${i}`,
                title: `Toast ${i}`,
                message: `Message ${i}`,
              })
            )
          );
        }
      });

      await waitFor(() => {
        // NotificationToast limits visible to 3
        const toastTitles = screen.getAllByText(/^Toast \d$/);
        expect(toastTitles.length).toBeLessThanOrEqual(3);
      });
    });

    it('should auto-hide notifications after 5 seconds', async () => {
      jest.useFakeTimers();

      mockUseWebSocket.mockReturnValue({
        ...mockUseWebSocket(),
        isInitialized: true,
      });

      render(
        <WebSocketProvider>
          <NotificationToast />
        </WebSocketProvider>
      );

      const handler = subscribedHandlers.get(EventType.NOTIFICATION_NEW)!;

      act(() => {
        handler(
          createNotificationMessage(
            createMockNotification({
              id: 'toast-auto-hide',
              title: 'Disappearing Toast',
              message: 'I will vanish',
            })
          )
        );
      });

      expect(screen.getByText('Disappearing Toast')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5100);
      });

      await waitFor(() => {
        expect(screen.queryByText('Disappearing Toast')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});
