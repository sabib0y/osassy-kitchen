import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import styles from '../../styles/components/user/dashboard.module.scss';

interface Subscription {
  id: string;
  planName: string;
  interval: 'weekly' | 'monthly';
  price: number;
  status: string;
  startDate: string;
  nextDeliveryDate?: string;
  stripeSubscriptionId?: string;
  items: Array<{
    id: string;
    quantity: number;
    menuItem: {
      id: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      category?: string;
    };
  }>;
  recentOrders?: Array<{
    id: string;
    totalPrice: number;
    deliveryDate: string;
    status: string;
    createdAt: string;
  }>;
}

const UserSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/subscriptions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'ACTIVE':
        return '#4CAF50';
      case 'canceled':
      case 'CANCELLED':
        return '#f44336';
      case 'past_due':
      case 'PAST_DUE':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Layout pageTitle="My Subscriptions - Osassy Kitchen">
        <div className={styles.dashboard}>
          <div className={styles.container}>
            <div className={styles.loading}>
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading subscriptions...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout pageTitle="My Subscriptions - Osassy Kitchen">
        <div className={styles.dashboard}>
          <div className={styles.container}>
            <div className={styles.error}>
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Error</h3>
              <p>{error}</p>
              <button onClick={fetchSubscriptions} className={styles.primaryBtn}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="My Subscriptions - Osassy Kitchen">
      <div className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>My Subscriptions</h1>
            <Link href="/subscriptions/create">
              <button className={styles.primaryBtn}>
                <i className="fas fa-plus"></i> New Subscription
              </button>
            </Link>
          </div>

          {subscriptions.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-sync-alt"></i>
              <h3>No Subscriptions Yet</h3>
              <p>Start your meal subscription journey today!</p>
              <Link href="/subscriptions/create">
                <button className={styles.primaryBtn}>Create Subscription</button>
              </Link>
            </div>
          ) : (
            <div className={styles.subscriptionsList}>
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className={styles.subscriptionCard}>
                  <div className={styles.subscriptionHeader}>
                    <div>
                      <h3>
                        {subscription.planName || `${subscription.interval === 'weekly' ? 'Weekly' : 'Monthly'} Subscription`}
                      </h3>
                      <span 
                        className={styles.status}
                        style={{ color: getStatusColor(subscription.status) }}
                      >
                        {subscription.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.amount}>
                      {formatAmount(subscription.price)}
                      <span className={styles.interval}>/{subscription.interval.toLowerCase()}</span>
                    </div>
                  </div>

                  <div className={styles.subscriptionDetails}>
                    <div className={styles.items}>
                      <h4>Items:</h4>
                      <ul>
                        {subscription.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity}x {item.menuItem.name} - {formatAmount(item.menuItem.price * item.quantity)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.dates}>
                      <p>
                        <strong>Started:</strong> {formatDate(subscription.startDate)}
                      </p>
                      {subscription.nextDeliveryDate && (
                        <p>
                          <strong>Next Delivery:</strong> {formatDate(subscription.nextDeliveryDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.actions}>
                    {(subscription.status === 'active' || subscription.status === 'ACTIVE') && (
                      <>
                        <button className={styles.secondaryBtn}>
                          <i className="fas fa-edit"></i> Manage
                        </button>
                        <button className={styles.dangerBtn}>
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </>
                    )}
                    {(subscription.status === 'canceled' || subscription.status === 'CANCELLED') && (
                      <button className={styles.primaryBtn}>
                        <i className="fas fa-redo"></i> Reactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

  return {
    props: {},
  };
};

export default UserSubscriptions;