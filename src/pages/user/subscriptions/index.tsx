import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import UserLayout from '../../../components/user/UserLayout';
import { SubscriptionResponse } from '../../../lib/api-types';
import styles from '../../../styles/components/user/subscriptions.module.scss';

interface SubscriptionListPageProps {}

const SubscriptionListPage: React.FC<SubscriptionListPageProps> = () => {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/subscriptions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return { className: 'active', icon: '✓', label: 'Active' };
      case 'PAUSED':
        return { className: 'paused', icon: '⏸️', label: 'Paused' };
      case 'CANCELLED':
        return { className: 'cancelled', icon: '❌', label: 'Cancelled' };
      default:
        return { className: 'unknown', icon: '❓', label: status };
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    if (filter === 'all') return true;
    return subscription.status.toLowerCase() === filter;
  });

  const getFilterCounts = () => {
    return {
      all: subscriptions.length,
      active: subscriptions.filter(s => s.status.toLowerCase() === 'active').length,
      paused: subscriptions.filter(s => s.status.toLowerCase() === 'paused').length,
      cancelled: subscriptions.filter(s => s.status.toLowerCase() === 'cancelled').length,
    };
  };

  const filterCounts = getFilterCounts();

  const handleQuickAction = async (subscriptionId: string, action: 'pause' | 'resume') => {
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

      // Refresh subscriptions list
      await fetchSubscriptions();
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      alert(`Failed to ${action} subscription. Please try again.`);
    }
  };

  if (loading) {
    return (
      <UserLayout pageTitle="My Subscriptions - Osassy's Kitchen" activeTab="subscriptions">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your subscriptions...</p>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout pageTitle="My Subscriptions - Osassy's Kitchen" activeTab="subscriptions">
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Failed to Load Subscriptions</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchSubscriptions} className={styles.retryButton}>
            <i className="fas fa-retry"></i>
            Try Again
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <>
      <Head>
        <title>My Subscriptions - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Manage your meal subscriptions at Osassy&apos;s Kitchen" />
      </Head>

      <UserLayout pageTitle="My Subscriptions" activeTab="subscriptions">
        <div className={styles.subscriptionsPage}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1>My Subscriptions</h1>
              <p>Manage your meal delivery subscriptions</p>
            </div>
            <div className={styles.headerActions}>
              <Link href="/subscriptions/create" className={styles.createButton}>
                <i className="fas fa-plus"></i>
                New Subscription
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'paused', label: 'Paused' },
              { key: 'cancelled', label: 'Cancelled' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`${styles.filterTab} ${filter === key ? styles.active : ''}`}
              >
                {label}
                <span className={styles.count}>
                  {filterCounts[key as keyof typeof filterCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          {filteredSubscriptions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                {subscriptions.length === 0 ? '🍽️' : '📝'}
              </div>
              <h3>
                {subscriptions.length === 0 
                  ? 'No Subscriptions Yet' 
                  : `No ${filter === 'all' ? '' : filter} subscriptions`
                }
              </h3>
              <p>
                {subscriptions.length === 0
                  ? 'Start your meal subscription journey today!'
                  : `You don't have any ${filter} subscriptions at the moment.`
                }
              </p>
              {subscriptions.length === 0 && (
                <Link href="/subscriptions/create" className={styles.createButton}>
                  <i className="fas fa-plus"></i>
                  Create Your First Subscription
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.subscriptionGrid}>
              {filteredSubscriptions.map((subscription) => {
                const statusConfig = getStatusConfig(subscription.status);
                const totalItems = subscription.items.reduce((sum, item) => sum + item.quantity, 0);
                
                return (
                  <div key={subscription.id} className={styles.subscriptionCard}>
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.planInfo}>
                        <h3 className={styles.planName}>{subscription.planName}</h3>
                        <div className={`${styles.statusBadge} ${styles[statusConfig.className]}`}>
                          <span className={styles.statusIcon}>{statusConfig.icon}</span>
                          {statusConfig.label}
                        </div>
                      </div>
                      <div className={styles.pricing}>
                        <span className={styles.price}>{formatCurrency(subscription.price)}</span>
                        <span className={styles.interval}>/{subscription.interval.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className={styles.cardContent}>
                      <div className={styles.itemsSummary}>
                        <span className={styles.itemCount}>
                          {totalItems} item{totalItems !== 1 ? 's' : ''}
                        </span>
                        <div className={styles.itemPreview}>
                          {subscription.items.slice(0, 2).map(item => (
                            <span key={item.id} className={styles.itemTag}>
                              {item.quantity}x {item.menuItem.name}
                            </span>
                          ))}
                          {subscription.items.length > 2 && (
                            <span className={styles.moreItems}>
                              +{subscription.items.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.deliveryInfo}>
                        <div className={styles.infoRow}>
                          <i className="fas fa-calendar"></i>
                          <span>Started {formatDate(subscription.startDate)}</span>
                        </div>
                        {subscription.nextDeliveryDate && subscription.status === 'ACTIVE' && (
                          <div className={styles.infoRow}>
                            <i className="fas fa-truck"></i>
                            <span>Next delivery {formatDate(subscription.nextDeliveryDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className={styles.cardActions}>
                      <Link 
                        href={`/user/subscriptions/${subscription.id}`} 
                        className={styles.manageButton}
                      >
                        <i className="fas fa-edit"></i>
                        Manage
                      </Link>
                      
                      {subscription.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleQuickAction(subscription.id, 'pause')}
                          className={styles.pauseButton}
                        >
                          <i className="fas fa-pause"></i>
                          Pause
                        </button>
                      )}
                      
                      {subscription.status === 'PAUSED' && (
                        <button
                          onClick={() => handleQuickAction(subscription.id, 'resume')}
                          className={styles.resumeButton}
                        >
                          <i className="fas fa-play"></i>
                          Resume
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary Footer */}
          {filteredSubscriptions.length > 0 && (
            <div className={styles.summaryFooter}>
              <div className={styles.summaryStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{filterCounts.active}</span>
                  <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{filterCounts.paused}</span>
                  <span className={styles.statLabel}>Paused</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {formatCurrency(
                      subscriptions
                        .filter(s => s.status === 'ACTIVE')
                        .reduce((sum, s) => sum + s.price, 0)
                    )}
                  </span>
                  <span className={styles.statLabel}>Monthly spend</span>
                </div>
              </div>
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

  return {
    props: {},
  };
};

export default SubscriptionListPage;