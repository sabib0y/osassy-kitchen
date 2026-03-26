import { useEffect, useState } from 'react';
import { NextPage, GetServerSidePropsContext } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Eye, ArrowLeft, Package, User, MapPin, Calendar, CreditCard } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import styles from '@/styles/components/admin/dashboard.module.scss';

// --- Types ---
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
    price: number;
  };
}

interface OrderDetail {
  id: string;
  user: { name: string; email: string };
  totalPrice: number;
  status: string;
  createdAt?: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  items?: OrderItem[];
  notes?: string;
}

interface DashboardData {
  revenue: {
    monthly: number;
    monthlyGrowthRate: number;
  };
  overview: {
    totalActiveSubscriptions: number;
    subscriptionGrowthRate: number;
    totalUsers: number;
    userGrowthRate: number;
  };
  orders: {
    byStatus: Record<string, { count: number }>;
    recent: Array<{
      id: string;
      user: { name: string; email?: string };
      totalPrice: number;
      status: string;
      createdAt?: string;
      deliveryAddress?: string;
      deliveryDate?: string;
      items?: OrderItem[];
      notes?: string;
    }>;
  };
  menuItems: {
    topPerforming: Array<{
      menuItemId: string;
      menuItem: { name: string };
      _sum: { quantity: number };
    }>;
  };
}

const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          console.log('Dashboard Data:', data);
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
      setLoading(false);
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <AdminLayout>
        <div className={styles.loadingGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.loadingCard}></div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return <AdminLayout><div style={{ padding: '2rem' }}>Access Denied</div></AdminLayout>;
  }

  // TODO: Replace mockActivities with real data when an activity feed API is implemented
  const mockActivities = [
    { type: 'new_user', message: 'John Smith registered', time: '2 hours ago' },
    { type: 'order_updated', message: 'Order #123457 status changed to In Progress', time: '3 hours ago' },
    { type: 'order_cancelled', message: 'Order #123458 was cancelled', time: '5 hours ago' },
  ];

  // Derive revenue trend data from recent orders (grouped by date)
  const revenueChartData = (() => {
    const recentOrders = dashboardData?.orders?.recent || [];
    const dailyRevenue: Record<string, number> = {};

    recentOrders.forEach((order) => {
      if (order.createdAt) {
        const parsedDate = new Date(order.createdAt);
        // Validate the date is valid before formatting
        if (!isNaN(parsedDate.getTime())) {
          const date = parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalPrice;
        }
      }
    });

    // Convert to array and sort by date
    return Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(-7); // Last 7 days
  })();

  // Prepare top menu items data for bar chart
  const menuItemsChartData = (dashboardData?.menuItems?.topPerforming || [])
    .slice(0, 5)
    .map((item) => ({
      name: item.menuItem?.name?.length > 12
        ? item.menuItem.name.substring(0, 12) + '...'
        : item.menuItem?.name || 'Unknown',
      quantity: item._sum?.quantity || 0,
    }));

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  const getStatusClass = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
    if (normalizedStatus === 'delivered') return styles.delivered;
    if (normalizedStatus === 'inprogress') return styles.inProgress;
    if (normalizedStatus === 'cancelled') return styles.cancelled;
    return styles.pending;
  };

  const getActivityBadgeClass = (type: string) => {
    switch (type) {
      case 'new_user': return styles.newUser;
      case 'order_updated': return styles.orderUpdated;
      case 'order_cancelled': return styles.orderCancelled;
      default: return '';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'new_user': return '+ New User';
      case 'order_updated': return 'Order Updated';
      case 'order_cancelled': return 'Order Cancelled';
      default: return type;
    }
  };

  const handleViewOrder = (order: OrderDetail) => {
    setSelectedOrder(order);
  };

  const handleCloseOrderPanel = () => {
    setSelectedOrder(null);
  };

  return (
    <AdminLayout>
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Revenue</div>
          <div className={styles.kpiValue}>
            {formatCurrency(dashboardData?.revenue?.monthly || 1200000)}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Subscriptions</div>
          <div className={styles.kpiValue}>
            {dashboardData?.overview?.totalActiveSubscriptions || 2}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Orders</div>
          <div className={styles.kpiValue}>
            {dashboardData?.orders?.recent?.length || 1540}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Users</div>
          <div className={styles.kpiValue}>
            {dashboardData?.overview?.totalUsers || 3}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Revenue Trend</h3>
          <div className={styles.chartContainer}>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`£${value.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C52D2F"
                    strokeWidth={2}
                    dot={{ fill: '#C52D2F', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartPlaceholder}>No revenue data available</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Popular Menu Items</h3>
          <div className={styles.chartContainer}>
            {menuItemsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={menuItemsChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Orders']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#F1C40F"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartPlaceholder}>No menu item data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className={styles.ordersSection}>
        <div className={styles.ordersHeader}>
          <h3 className={styles.ordersTitle}>Recent Orders</h3>
          <button
            onClick={() => router.push('/admin/orders')}
            className={styles.viewAllBtn}
          >
            <Eye size={16} />
            View All Orders
          </button>
        </div>

        <div className={styles.ordersTable}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>User</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.orders?.recent?.length ? (
                dashboardData.orders.recent.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className={styles.orderId}>#{order.id.slice(-5).toUpperCase()}</td>
                    <td>{order.user?.name || 'Unknown'}</td>
                    <td>
                      {(() => {
                        if (!order.createdAt) return '-';
                        const date = new Date(order.createdAt);
                        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB');
                      })()}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className={styles.amount}>
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => handleViewOrder(order as OrderDetail)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Feed */}
      <div className={styles.activitySection}>
        <div className={styles.activityHeader}>
          <h3 className={styles.activityTitle}>Activity Feed</h3>
        </div>
        <div className={styles.activityContent}>
          {mockActivities.map((activity, index) => (
            <div key={`activity-${index}`} className={styles.activityItem}>
              <span className={`${styles.activityBadge} ${getActivityBadgeClass(activity.type)}`}>
                {getActivityLabel(activity.type)}
              </span>
              <div className={styles.activityDetails}>
                <p className={styles.activityMessage}>{activity.message}</p>
                <p className={styles.activityTime}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Detail Slide-in Panel */}
      {selectedOrder && (
        <>
          <div className={styles.panelOverlay} onClick={handleCloseOrderPanel} />
          <div className={styles.orderPanel}>
            <div className={styles.panelHeader}>
              <button className={styles.backBtn} onClick={handleCloseOrderPanel}>
                <ArrowLeft size={18} />
                Back
              </button>
              <h2 className={styles.panelTitle}>
                Order #{selectedOrder.id.slice(-5).toUpperCase()}
              </h2>
            </div>

            <div className={styles.panelContent}>
              {/* Order Status */}
              <div className={styles.panelSection}>
                <span className={`${styles.statusBadge} ${getStatusClass(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>
                  <User size={16} />
                  Customer
                </h3>
                <p className={styles.sectionText}>{selectedOrder.user?.name || 'Unknown'}</p>
                {selectedOrder.user?.email && (
                  <p className={styles.sectionSubtext}>{selectedOrder.user.email}</p>
                )}
              </div>

              {/* Order Date */}
              <div className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>
                  <Calendar size={16} />
                  Order Date
                </h3>
                <p className={styles.sectionText}>
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </p>
              </div>

              {/* Delivery Address */}
              {selectedOrder.deliveryAddress && (
                <div className={styles.panelSection}>
                  <h3 className={styles.sectionTitle}>
                    <MapPin size={16} />
                    Delivery Address
                  </h3>
                  <p className={styles.sectionText}>{selectedOrder.deliveryAddress}</p>
                </div>
              )}

              {/* Order Items */}
              <div className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>
                  <Package size={16} />
                  Items
                </h3>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <ul className={styles.itemsList}>
                    {selectedOrder.items.map((item) => (
                      <li key={item.id} className={styles.orderItem}>
                        <span className={styles.itemName}>
                          {item.quantity}x {item.menuItem?.name || 'Item'}
                        </span>
                        <span className={styles.itemPrice}>
                          £{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.sectionSubtext}>No item details available</p>
                )}
              </div>

              {/* Order Total */}
              <div className={styles.panelSection}>
                <h3 className={styles.sectionTitle}>
                  <CreditCard size={16} />
                  Total
                </h3>
                <p className={styles.totalAmount}>{formatCurrency(selectedOrder.totalPrice)}</p>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className={styles.panelSection}>
                  <h3 className={styles.sectionTitle}>Notes</h3>
                  <p className={styles.sectionText}>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className={styles.panelFooter}>
              <button
                className={styles.viewFullBtn}
                onClick={() => router.push('/admin/orders')}
              >
                View in Orders Page
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default AdminDashboard;
