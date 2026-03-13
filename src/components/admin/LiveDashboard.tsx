// Real-time Admin Dashboard Component
import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { 
  EventType,
  OrderEventPayload,
  DashboardStatsPayload,
  OrderStatus
} from '@/types/websocket';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  RefreshCw,
  Filter,
  Bell,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  activeUsers: number;
  usersChange: number;
  averageOrderValue: number;
  aovChange: number;
  conversionRate: number;
  conversionChange: number;
  activeSubscriptions: number;
  subscriptionsChange: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: OrderStatus;
  timestamp: string;
  items: number;
}

interface OrdersByStatus {
  pending: number;
  confirmed: number;
  preparing: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
}

interface HourlyRevenue {
  hour: string;
  revenue: number;
  orders: number;
}

export function LiveDashboard() {
  const { 
    connected, 
    joinRoom, 
    leaveRoom,
    onOrderUpdate,
    onDashboardUpdate 
  } = useWebSocketContext();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    activeUsers: 0,
    usersChange: 0,
    averageOrderValue: 0,
    aovChange: 0,
    conversionRate: 0,
    conversionChange: 0,
    activeSubscriptions: 0,
    subscriptionsChange: 0
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus>({
    pending: 0,
    confirmed: 0,
    preparing: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0
  });
  const [hourlyRevenue, setHourlyRevenue] = useState<HourlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch initial dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [metricsRes, ordersRes, statusRes, revenueRes] = await Promise.all([
        fetch('/api/admin/dashboard/metrics'),
        fetch('/api/admin/dashboard/recent-orders'),
        fetch('/api/admin/dashboard/orders-by-status'),
        fetch('/api/admin/dashboard/hourly-revenue')
      ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      if (ordersRes.ok) {
        setRecentOrders(await ordersRes.json());
      }
      if (statusRes.ok) {
        setOrdersByStatus(await statusRes.json());
      }
      if (revenueRes.ok) {
        setHourlyRevenue(await revenueRes.json());
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup WebSocket subscriptions
  useEffect(() => {
    if (!connected) return;

    // Join admin dashboard room
    joinRoom('admin:dashboard');

    // Subscribe to order updates
    const unsubscribeOrders = onOrderUpdate((payload: OrderEventPayload) => {
      // Update recent orders
      setRecentOrders(prev => {
        const newOrder: RecentOrder = {
          id: payload.orderId,
          orderNumber: payload.orderNumber || `#${payload.orderId.slice(-6)}`,
          customerName: payload.data.customerName || 'Customer',
          amount: payload.data.totalAmount || 0,
          status: payload.data.status,
          timestamp: new Date().toISOString(),
          items: payload.data.itemCount || 1
        };

        // Add to beginning and limit to 10 recent orders
        return [newOrder, ...prev.filter(o => o.id !== payload.orderId)].slice(0, 10);
      });

      // Update order status counts
      const prevStatus = payload.previousStatus;
      const newStatus = payload.data.status;
      if (prevStatus && newStatus) {
        setOrdersByStatus(prev => ({
          ...prev,
          [prevStatus.toLowerCase()]: Math.max(0, prev[prevStatus.toLowerCase() as keyof OrdersByStatus] - 1),
          [newStatus.toLowerCase()]: prev[newStatus.toLowerCase() as keyof OrdersByStatus] + 1
        }));
      }

      setLastUpdate(new Date());
      
      // Show notification for new orders
      if (payload.data.status === OrderStatus.PENDING) {
        showNotification('New Order', `Order #${payload.orderId.slice(-6)} received`);
      }
    });

    // Subscribe to dashboard updates
    const unsubscribeDashboard = onDashboardUpdate((payload: DashboardStatsPayload) => {
      setMetrics(prev => ({
        ...prev,
        ...payload.metrics
      }));
      
      if (payload.recentOrders) {
        setRecentOrders(payload.recentOrders.map(order => ({
          ...order,
          status: order.status as OrderStatus
        })));
      }
      
      if (payload.ordersByStatus) {
        setOrdersByStatus(payload.ordersByStatus);
      }
      
      if (payload.hourlyRevenue) {
        setHourlyRevenue(payload.hourlyRevenue);
      }
      
      setLastUpdate(new Date());
    });

    return () => {
      leaveRoom('admin:dashboard');
      unsubscribeOrders();
      unsubscribeDashboard();
    };
  }, [connected, joinRoom, leaveRoom, onOrderUpdate, onDashboardUpdate]);

  // Load initial data
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh
  useEffect(() => {
    if (!connected && autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, autoRefresh, fetchDashboardData]);

  const showNotification = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { 
        body: message, 
        icon: '/logo.png',
        badge: '/badge.png'
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CONFIRMED]: 'bg-red-100 text-red-800',
      [OrderStatus.PREPARING]: 'bg-purple-100 text-purple-800',
      [OrderStatus.OUT_FOR_DELIVERY]: 'bg-orange-100 text-orange-800',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, React.ReactElement> = {
      [OrderStatus.PENDING]: <Clock className="w-4 h-4" />,
      [OrderStatus.CONFIRMED]: <CheckCircle className="w-4 h-4" />,
      [OrderStatus.PREPARING]: <Package className="w-4 h-4" />,
      [OrderStatus.OUT_FOR_DELIVERY]: <Truck className="w-4 h-4" />,
      [OrderStatus.DELIVERED]: <CheckCircle className="w-4 h-4" />,
      [OrderStatus.CANCELLED]: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  // Chart data
  const revenueChartData = {
    labels: hourlyRevenue.map(h => h.hour),
    datasets: [{
      label: 'Revenue',
      data: hourlyRevenue.map(h => h.revenue),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const statusChartData = {
    labels: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    datasets: [{
      data: [
        ordersByStatus.pending,
        ordersByStatus.confirmed,
        ordersByStatus.preparing,
        ordersByStatus.outForDelivery,
        ordersByStatus.delivered,
        ordersByStatus.cancelled
      ],
      backgroundColor: [
        'rgba(251, 191, 36, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time business metrics and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg border ${autoRefresh ? 'bg-primary text-white' : 'bg-white'}`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Last Update */}
          <span className="text-sm text-gray-500">
            Updated: {format(lastUpdate, 'HH:mm:ss')}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            {metrics.revenueChange > 0 ? (
              <span className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                {metrics.revenueChange.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center text-red-600 text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                {Math.abs(metrics.revenueChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold">£{metrics.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            {metrics.ordersChange > 0 ? (
              <span className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                {metrics.ordersChange.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center text-red-600 text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                {Math.abs(metrics.ordersChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold">{metrics.totalOrders}</p>
          <p className="text-sm text-gray-600">Total Orders</p>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold">{metrics.activeUsers}</p>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            {metrics.aovChange > 0 ? (
              <span className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                {metrics.aovChange.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center text-red-600 text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                {Math.abs(metrics.aovChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold">£{metrics.averageOrderValue.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Avg Order Value</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <PieChart className="w-5 h-5 text-gray-400" />
            {metrics.conversionChange > 0 ? (
              <span className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                {metrics.conversionChange.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center text-red-600 text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                {Math.abs(metrics.conversionChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Conversion Rate</p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <Bell className="w-5 h-5 text-gray-400" />
            {metrics.subscriptionsChange > 0 ? (
              <span className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                {metrics.subscriptionsChange.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center text-red-600 text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                {Math.abs(metrics.subscriptionsChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold">{metrics.activeSubscriptions}</p>
          <p className="text-sm text-gray-600">Subscriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Hourly Revenue</h3>
          <Line 
            data={revenueChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `£${context.parsed.y.toFixed(2)}`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `£${value}`
                  }
                }
              }
            }}
            height={250}
          />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Order Status</h3>
          <Doughnut 
            data={statusChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 10,
                    font: { size: 11 }
                  }
                }
              }
            }}
            height={250}
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <button className="text-primary hover:text-primary-dark text-sm font-medium">
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.items} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    £{order.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.timestamp), 'HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}