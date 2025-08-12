// Real-time Order Tracker Component
import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { 
  EventType,
  OrderEventPayload,
  OrderStatus,
  DeliveryStatus 
} from '@/types/websocket';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Home,
  AlertCircle,
  XCircle,
  MapPin,
  Phone,
  User
} from 'lucide-react';

interface OrderTrackerProps {
  orderId: string;
  initialOrder?: Order;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  items: OrderItem[];
  totalAmount: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
  deliveryAddress?: DeliveryAddress;
  driver?: Driver;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryAddress {
  street: string;
  city: string;
  postcode: string;
  instructions?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

interface TimelineEvent {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  isCompleted: boolean;
}

export function OrderTracker({ orderId, initialOrder }: OrderTrackerProps) {
  const { 
    connected, 
    joinRoom, 
    leaveRoom, 
    onOrderUpdate 
  } = useWebSocketContext();
  
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch initial order data
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Setup WebSocket subscription
  useEffect(() => {
    if (!connected || !orderId) return;

    // Join order-specific room
    const roomName = `order:${orderId}`;
    joinRoom(roomName);

    // Subscribe to order updates
    const unsubscribe = onOrderUpdate((payload: OrderEventPayload) => {
      if (payload.orderId === orderId) {
        setOrder(prevOrder => ({
          ...prevOrder!,
          ...payload.data,
          timeline: payload.timeline || prevOrder?.timeline || [],
          updatedAt: new Date().toISOString()
        }));
        setLastUpdate(new Date());

        // Show notification for important status changes
        if (payload.data.status === OrderStatus.DELIVERED) {
          showNotification('Order Delivered!', 'Your order has been delivered successfully.');
        } else if (payload.data.status === OrderStatus.OUT_FOR_DELIVERY) {
          showNotification('Out for Delivery', 'Your order is on its way!');
        }
      }
    });

    return () => {
      leaveRoom(roomName);
      unsubscribe();
    };
  }, [connected, orderId, joinRoom, leaveRoom, onOrderUpdate]);

  // Load initial data
  useEffect(() => {
    if (!initialOrder) {
      fetchOrder();
    }
  }, [initialOrder, fetchOrder]);

  // Auto-refresh every 30 seconds if not connected to WebSocket
  useEffect(() => {
    if (!connected && order) {
      const interval = setInterval(fetchOrder, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, order, fetchOrder]);

  const showNotification = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/logo.png' });
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="w-5 h-5" />;
      case OrderStatus.CONFIRMED:
        return <CheckCircle className="w-5 h-5" />;
      case OrderStatus.PREPARING:
        return <Package className="w-5 h-5" />;
      case OrderStatus.OUT_FOR_DELIVERY:
        return <Truck className="w-5 h-5" />;
      case OrderStatus.DELIVERED:
        return <Home className="w-5 h-5" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'text-yellow-600 bg-yellow-50';
      case OrderStatus.CONFIRMED:
        return 'text-blue-600 bg-blue-50';
      case OrderStatus.PREPARING:
        return 'text-purple-600 bg-purple-50';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'text-orange-600 bg-orange-50';
      case OrderStatus.DELIVERED:
        return 'text-green-600 bg-green-50';
      case OrderStatus.CANCELLED:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressPercentage = (status: OrderStatus): number => {
    const statusProgress: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 20,
      [OrderStatus.CONFIRMED]: 40,
      [OrderStatus.PREPARING]: 60,
      [OrderStatus.OUT_FOR_DELIVERY]: 80,
      [OrderStatus.DELIVERED]: 100,
      [OrderStatus.CANCELLED]: 0
    };
    return statusProgress[status] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-8 text-gray-500">
        Order not found
      </div>
    );
  }

  const progress = getProgressPercentage(order.status);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-gray-600">
            {connected ? 'Live updates enabled' : 'Checking for updates...'}
          </span>
        </div>
        <span className="text-gray-500">
          Last updated: {format(lastUpdate, 'HH:mm:ss')}
        </span>
      </div>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
            <p className="text-gray-600 mt-1">
              Placed on {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="font-medium">{order.status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {order.estimatedDelivery && (
            <p className="text-sm text-gray-600 mt-2">
              Estimated delivery: {format(new Date(order.estimatedDelivery), 'HH:mm')}
            </p>
          )}
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
        <div className="space-y-4">
          {order.timeline.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  event.isCompleted ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {event.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                  )}
                </div>
                {index < order.timeline.length - 1 && (
                  <div className={`absolute top-10 left-5 w-0.5 h-16 -translate-x-1/2 ${
                    event.isCompleted ? 'bg-green-300' : 'bg-gray-300'
                  }`} />
                )}
              </div>
              <div className="flex-1 pb-8">
                <p className={`font-medium ${event.isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                  {event.message}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(event.timestamp), 'HH:mm, dd MMM')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Information */}
      {order.status === OrderStatus.OUT_FOR_DELIVERY && order.driver && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Delivery Driver</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{order.driver.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${order.driver.phone}`} className="text-primary hover:underline">
                    {order.driver.phone}
                  </a>
                </div>
                {order.driver.vehicleNumber && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span>{order.driver.vehicleNumber}</span>
                  </div>
                )}
              </div>
            </div>
            
            {order.deliveryAddress && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Delivery Address</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p>{order.deliveryAddress.street}</p>
                      <p>{order.deliveryAddress.city}, {order.deliveryAddress.postcode}</p>
                      {order.deliveryAddress.instructions && (
                        <p className="text-sm text-gray-600 mt-1">
                          Note: {order.deliveryAddress.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Live Map would go here */}
          {order.driver.currentLocation && (
            <div className="mt-4 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Live tracking map</span>
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <p className="font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold">Total</p>
              <p className="text-lg font-bold text-primary">£{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}