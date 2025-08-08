import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import styles from '../../styles/components/user/dashboard.module.scss';
import { 
  Subscription, 
  Order, 
  DashboardStats,
  SubscriptionsResponse,
  OrdersResponse,
  UserProfile
} from '../../types/user';

type TabType = 'overview' | 'subscriptions' | 'orders' | 'profile' | 'payments';

const UserDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

  // Profile form state
  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: null,
    addresses: [],
    notificationPreferences: {
      id: '',
      userId: '',
      emailNotifications: {
        orderConfirmation: true,
        orderStatusUpdates: true,
        deliveryReminders: true,
        subscriptionUpdates: true,
        promotionsAndOffers: false,
        newsletter: false
      },
      smsNotifications: {
        orderConfirmation: false,
        deliveryReminders: false,
        orderStatusUpdates: false
      },
      pushNotifications: {
        orderConfirmation: false,
        orderStatusUpdates: false,
        deliveryReminders: false,
        promotions: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      fetchDashboardData();
      // Set initial profile data from session
      setProfileData(prev => ({
        ...prev,
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        address: null
      }));
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch subscriptions
      const subRes = await fetch('/api/user/subscriptions');
      if (!subRes.ok) {
        if (subRes.status === 401) {
          router.push('/login');
          return;
        }
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
        if (orderRes.status === 401) {
          router.push('/login');
          return;
        }
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

  const handleSubscriptionAction = async (subscriptionId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} subscription`);
      }

      // Refresh data
      await fetchDashboardData();
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${action} subscription`);
    }
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setProfileLoading(false);
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

  if (status === 'loading' || loading) {
    return (
      <Layout pageTitle="Dashboard - Lums Kitchen">
        <div className={styles.dashboard}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout pageTitle="Dashboard - Lums Kitchen">
        <div className={styles.dashboard}>
          <div className={styles.errorContainer}>
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Dashboard</h3>
            <p>{error}</p>
            <button onClick={fetchDashboardData} className={styles.primaryBtn}>
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Dashboard - Lums Kitchen">
      <div className={styles.dashboard}>
        <div className={styles.container}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarContent}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  <i className="fas fa-user-circle"></i>
                </div>
                <h3>{session?.user?.name || 'Welcome'}</h3>
                <p>{session?.user?.email}</p>
              </div>
              <nav className={styles.sidebarNav}>
                <button
                  className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-home"></i>
                  <span>Overview</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeTab === 'subscriptions' ? styles.active : ''}`}
                  onClick={() => setActiveTab('subscriptions')}
                >
                  <i className="fas fa-sync-alt"></i>
                  <span>Subscriptions</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <i className="fas fa-shopping-bag"></i>
                  <span>Orders</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fas fa-user"></i>
                  <span>Profile</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeTab === 'payments' ? styles.active : ''}`}
                  onClick={() => setActiveTab('payments')}
                >
                  <i className="fas fa-credit-card"></i>
                  <span>Payments</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'subscriptions' && 'My Subscriptions'}
                {activeTab === 'orders' && 'Order History'}
                {activeTab === 'profile' && 'My Profile'}
                {activeTab === 'payments' && 'Payment Methods'}
              </h1>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className={styles.overview}>
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
                    <h2 className={styles.sectionTitle}>Active Subscriptions</h2>
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
                          <button 
                            className={styles.manageBtn}
                            onClick={() => setActiveTab('subscriptions')}
                          >
                            Manage Subscription
                          </button>
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
                      <button 
                        className={styles.viewAllBtn}
                        onClick={() => setActiveTab('orders')}
                      >
                        View All <i className="fas fa-arrow-right"></i>
                      </button>
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
                    <i className="fas fa-shopping-cart"></i>
                    <h3>Welcome to Your Dashboard!</h3>
                    <p>Start your meal subscription journey today</p>
                    <Link href="/menu">
                      <button className={styles.primaryBtn}>Browse Menu</button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className={styles.subscriptions}>
                {subscriptions.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="fas fa-sync-alt"></i>
                    <h3>No Subscriptions Yet</h3>
                    <p>Start your meal subscription journey today!</p>
                    <Link href="/subscriptions">
                      <button className={styles.primaryBtn}>Browse Plans</button>
                    </Link>
                  </div>
                ) : (
                  <div className={styles.subscriptionList}>
                    {subscriptions.map(subscription => (
                      <div key={subscription.id} className={styles.subscriptionDetail}>
                        <div className={styles.subscriptionMain}>
                          <div className={styles.subscriptionInfo}>
                            <h3>{subscription.planName}</h3>
                            <div className={styles.subscriptionMeta}>
                              <span className={`${styles.badge} ${styles[getStatusColor(subscription.status)]}`}>
                                {subscription.status}
                              </span>
                              <span className={styles.interval}>
                                {subscription.interval === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                              </span>
                              <span className={styles.price}>{formatCurrency(subscription.price)}</span>
                            </div>
                            <div className={styles.subscriptionDates}>
                              <p>Started: {formatDate(subscription.startDate)}</p>
                              {subscription.nextDeliveryDate && (
                                <p>Next Delivery: {formatDate(subscription.nextDeliveryDate)}</p>
                              )}
                            </div>
                          </div>
                          <div className={styles.subscriptionActions}>
                            {subscription.status === 'ACTIVE' && (
                              <>
                                <button 
                                  className={styles.secondaryBtn}
                                  onClick={() => handleSubscriptionAction(subscription.id, 'pause')}
                                >
                                  <i className="fas fa-pause"></i> Pause
                                </button>
                                <Link href={`/subscriptions/${subscription.id}/edit`}>
                                  <button className={styles.primaryBtn}>
                                    <i className="fas fa-edit"></i> Modify
                                  </button>
                                </Link>
                              </>
                            )}
                            {subscription.status === 'PAUSED' && (
                              <button 
                                className={styles.primaryBtn}
                                onClick={() => handleSubscriptionAction(subscription.id, 'resume')}
                              >
                                <i className="fas fa-play"></i> Resume
                              </button>
                            )}
                            {subscription.status !== 'CANCELLED' && (
                              <button 
                                className={styles.dangerBtn}
                                onClick={() => {
                                  if (confirm('Are you sure you want to cancel this subscription?')) {
                                    handleSubscriptionAction(subscription.id, 'cancel');
                                  }
                                }}
                              >
                                <i className="fas fa-times"></i> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                        <div className={styles.subscriptionItemsList}>
                          <h4>Subscription Items ({subscription.items.length})</h4>
                          <div className={styles.itemsGrid}>
                            {subscription.items.map(item => (
                              <div key={item.id} className={styles.itemCard}>
                                {item.menuItem.imageUrl && (
                                  <div className={styles.itemImage}>
                                    <img src={item.menuItem.imageUrl} alt={item.menuItem.name} />
                                  </div>
                                )}
                                <div className={styles.itemDetails}>
                                  <h5>{item.menuItem.name}</h5>
                                  <p className={styles.itemDescription}>{item.menuItem.description}</p>
                                  <div className={styles.itemMeta}>
                                    <span className={styles.itemQuantity}>Qty: {item.quantity}</span>
                                    <span className={styles.itemPrice}>{formatCurrency(item.menuItem.price)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {subscription.recentOrders.length > 0 && (
                          <div className={styles.recentOrders}>
                            <h4>Recent Orders</h4>
                            <div className={styles.miniOrderList}>
                              {subscription.recentOrders.slice(0, 3).map(order => (
                                <div key={order.id} className={styles.miniOrderItem}>
                                  <span>{formatDate(order.createdAt)}</span>
                                  <span className={`${styles.badge} ${styles[getStatusColor(order.status)]}`}>
                                    {order.status}
                                  </span>
                                  <span>{formatCurrency(order.totalPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className={styles.orders}>
                {orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="fas fa-shopping-bag"></i>
                    <h3>No Orders Yet</h3>
                    <p>Your order history will appear here</p>
                    <Link href="/menu">
                      <button className={styles.primaryBtn}>Start Ordering</button>
                    </Link>
                  </div>
                ) : (
                  <div className={styles.orderTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Delivery Date</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>#{order.id.slice(-8)}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{formatDate(order.deliveryDate)}</td>
                            <td>{order.items?.length || 0} items</td>
                            <td>{formatCurrency(order.totalPrice)}</td>
                            <td>
                              <span className={`${styles.badge} ${styles[getStatusColor(order.status)]}`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <Link href={`/user/orders/${order.id}`}>
                                <button className={styles.linkBtn}>View</button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className={styles.profile}>
                <div className={styles.profileCard}>
                  <h3>Personal Information</h3>
                  {profileMessage && (
                    <div className={`${styles.alert} ${styles[profileMessage.type]}`}>
                      {profileMessage.text}
                    </div>
                  )}
                  <form className={styles.profileForm} onSubmit={handleProfileSubmit}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name">Full Name</label>
                      <input 
                        id="name"
                        type="text" 
                        placeholder="Enter your name"
                        value={profileData.name || ''}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email Address</label>
                      <input 
                        id="email"
                        type="email" 
                        placeholder="Enter your email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        required
                        disabled
                      />
                      <small>Email cannot be changed</small>
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="phone">Phone Number</label>
                      <input 
                        id="phone"
                        type="tel" 
                        placeholder="Enter your phone number"
                        value={profileData.phone || ''}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="address">Delivery Address</label>
                      <textarea 
                        id="address"
                        placeholder="Enter your delivery address" 
                        rows={3}
                        value={profileData.address?.street || ''}
                        onChange={(e) => setProfileData({
                          ...profileData, 
                          address: { ...profileData.address, street: e.target.value }
                        })}
                      ></textarea>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="city">City</label>
                        <input 
                          id="city"
                          type="text" 
                          placeholder="City"
                          value={profileData.address?.city || ''}
                          onChange={(e) => setProfileData({
                            ...profileData, 
                            address: { ...profileData.address, city: e.target.value }
                          })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="state">State</label>
                        <input 
                          id="state"
                          type="text" 
                          placeholder="State"
                          value={profileData.address?.state || ''}
                          onChange={(e) => setProfileData({
                            ...profileData, 
                            address: { ...profileData.address, state: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className={styles.primaryBtn}
                      disabled={profileLoading}
                    >
                      {profileLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </form>
                </div>
                <div className={styles.profileCard}>
                  <h3>Account Security</h3>
                  <div className={styles.securitySection}>
                    <p>Keep your account secure by regularly updating your password.</p>
                    <Link href="/user/change-password">
                      <button className={styles.secondaryBtn}>
                        <i className="fas fa-lock"></i> Change Password
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className={styles.payments}>
                <div className={styles.paymentCard}>
                  <h3>Payment Methods</h3>
                  <div className={styles.paymentInfo}>
                    <i className="fas fa-credit-card"></i>
                    <p>Payment methods are securely managed through Stripe during checkout.</p>
                    <p>Your payment information is encrypted and never stored on our servers.</p>
                  </div>
                  <div className={styles.paymentActions}>
                    <Link href="/subscriptions">
                      <button className={styles.primaryBtn}>
                        <i className="fas fa-plus"></i> Add Payment Method
                      </button>
                    </Link>
                  </div>
                </div>
                <div className={styles.paymentCard}>
                  <h3>Billing History</h3>
                  <div className={styles.billingList}>
                    {orders.filter(o => o.status === 'DELIVERED').slice(0, 5).map(order => (
                      <div key={order.id} className={styles.billingItem}>
                        <div className={styles.billingInfo}>
                          <h4>Order #{order.id.slice(-8)}</h4>
                          <p>{formatDate(order.createdAt)}</p>
                        </div>
                        <div className={styles.billingAmount}>
                          {formatCurrency(order.totalPrice)}
                        </div>
                        <Link href={`/user/invoices/${order.id}`}>
                          <button className={styles.linkBtn}>
                            <i className="fas fa-download"></i> Invoice
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
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