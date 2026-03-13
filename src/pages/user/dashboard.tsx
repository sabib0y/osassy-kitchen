import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import UserLayout from '../../components/user/UserLayout';
import styles from '../../styles/components/user/dashboard.module.scss';
import { 
  Subscription, 
  Order, 
  DashboardStats,
  SubscriptionsResponse,
  OrdersResponse
} from '../../types/user';


interface UserDashboardProps {}

const UserDashboard: React.FC<UserDashboardProps> = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeSubscriptions: 0,
    totalOrders: 0,
    upcomingDeliveries: 0,
    totalSpent: 0
  });


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch subscriptions
      const subRes = await fetch('/api/user/subscriptions');
      if (!subRes.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      const subData: SubscriptionsResponse = await subRes.json();
      setSubscriptions(subData.subscriptions || []);
      
      // Calculate subscription stats
      const activeCount = subData.subscriptions?.filter((s) => s.status === 'ACTIVE').length || 0;
      setStats(prev => ({ ...prev, activeSubscriptions: activeCount }));

      // Fetch orders
      const orderRes = await fetch('/api/user/orders');
      if (!orderRes.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const orderData: OrdersResponse = await orderRes.json();
      setOrders(orderData.orders || []);
      
      // Calculate order stats
      const upcoming = orderData.orders?.filter((o) => 
        o.status === 'PENDING' || o.status === 'IN_PROGRESS'
      ).length || 0;
      
      const totalSpent = orderData.orders?.reduce((sum, o) => 
        sum + (o.totalPrice || 0), 0
      ) || 0;
      
      setStats(prev => ({ 
        ...prev, 
        totalOrders: orderData.orders?.length || 0,
        upcomingDeliveries: upcoming,
        totalSpent
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
      case 'DELIVERED':
        return 'success';
      case 'PAUSED':
      case 'IN_PROGRESS':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      case 'PENDING':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `£${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <UserLayout pageTitle="Dashboard Overview - Osassy's Kitchen" activeTab="overview">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout pageTitle="Dashboard Overview - Osassy's Kitchen" activeTab="overview">
        <div className={styles.errorContainer}>
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className={styles.primaryBtn}>
            Try Again
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Overview - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Manage your meal subscriptions and orders at Osassy&apos;s Kitchen" />
      </Head>

      <UserLayout pageTitle="Dashboard Overview" activeTab="overview">
        <div className={styles.dashboardPage}>
          {/* User Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.profileInfo}>
              <div className={styles.userAvatar}>
                <i className="fas fa-user-circle" aria-hidden="true"></i>
              </div>
              <div className={styles.userDetails}>
                <h2>{session?.user?.name || 'Welcome'}</h2>
                <p>{session?.user?.email}</p>
                <span className={styles.memberSince}>Member since {new Date().getFullYear()}</span>
              </div>
            </div>
            <div className={styles.quickActions}>
              <Link href="/subscriptions/create" className={styles.createButton}>
                <i className="fas fa-plus"></i>
                New Subscription
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="fas fa-sync-alt"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{stats.activeSubscriptions}</h3>
                <p>Active Subscriptions</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="fas fa-shopping-bag"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{stats.totalOrders}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="fas fa-truck"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{stats.upcomingDeliveries}</h3>
                <p>Upcoming Deliveries</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="fas fa-wallet"></i>
              </div>
              <div className={styles.statContent}>
                <h3>{formatCurrency(stats.totalSpent)}</h3>
                <p>Total Spent</p>
              </div>
            </div>
          </div>

          {/* Active Subscriptions */}
          {subscriptions.filter(s => s.status === 'ACTIVE').length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Active Subscriptions</h2>
                <Link href="/user/subscriptions" className={styles.viewAllBtn}>
                  View All <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className={styles.subscriptionGrid}>
                {subscriptions.filter(s => s.status === 'ACTIVE').map(subscription => (
                  <div key={subscription.id} className={styles.subscriptionCard}>
                    <div className={styles.subscriptionHeader}>
                      <h3>{subscription.planName}</h3>
                      <span className={`${styles.badge} ${styles[getStatusColor(subscription.status)]}`}>
                        {subscription.status}
                      </span>
                    </div>
                    <div className={styles.subscriptionDetails}>
                      <p className={styles.interval}>
                        <i className="fas fa-calendar"></i>
                        {subscription.interval === 'WEEKLY' ? 'Weekly' : 'Monthly'} Delivery
                      </p>
                      <p className={styles.price}>
                        <i className="fas fa-tag"></i>
                        {formatCurrency(subscription.price)}
                      </p>
                      {subscription.nextDeliveryDate && (
                        <p className={styles.nextDelivery}>
                          <i className="fas fa-truck"></i>
                          Next: {formatDate(subscription.nextDeliveryDate)}
                        </p>
                      )}
                    </div>
                    <div className={styles.subscriptionItems}>
                      <h4>Items ({subscription.items.length})</h4>
                      <ul>
                        {subscription.items.slice(0, 3).map(item => (
                          <li key={item.id}>
                            {item.quantity}x {item.menuItem.name}
                          </li>
                        ))}
                        {subscription.items.length > 3 && (
                          <li>+{subscription.items.length - 3} more items</li>
                        )}
                      </ul>
                    </div>
                    <Link href="/user/subscriptions" className={styles.manageBtn}>
                      Manage Subscription
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Orders</h2>
                <Link href="/user/orders" className={styles.viewAllBtn}>
                  View All <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              <div className={styles.orderList}>
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className={styles.orderItem}>
                    <div className={styles.orderInfo}>
                      <h4>Order #{order.id.slice(-8)}</h4>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                    <div className={styles.orderStatus}>
                      <span className={`${styles.badge} ${styles[getStatusColor(order.status)]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={styles.orderPrice}>
                      {formatCurrency(order.totalPrice)}
                    </div>
                    <Link href={`/user/orders/${order.id}`}>
                      <button className={styles.viewBtn}>View Details</button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {subscriptions.length === 0 && orders.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🍽️</div>
              <h3>Welcome to Your Dashboard!</h3>
              <p>Start your meal subscription journey today</p>
              <Link href="/subscriptions/create" className={styles.createButton}>
                <i className="fas fa-plus"></i>
                Create Your First Subscription
              </Link>
            </div>
          )}
        </div>
      </UserLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Optionally check for user role
  if (session.user?.role === 'ADMIN') {
    return {
      redirect: {
        destination: '/admin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default UserDashboard;