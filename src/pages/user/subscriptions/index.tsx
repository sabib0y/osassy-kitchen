import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import UserLayout from '../../../components/user/UserLayout';
import SubscriptionTabs from '../../../components/subscription/SubscriptionTabs';
import { SubscriptionResponse } from '../../../lib/api-types';
import styles from '../../../styles/components/user/subscriptions.module.scss';

interface SubscriptionListPageProps {}

const SubscriptionListPage: React.FC<SubscriptionListPageProps> = () => {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'paused'>('active');

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


  // Filter subscriptions by status (exclude cancelled)
  const activeSubscriptions = subscriptions.filter(
    subscription => subscription.status.toUpperCase() === 'ACTIVE'
  );
  const pausedSubscriptions = subscriptions.filter(
    subscription => subscription.status.toUpperCase() === 'PAUSED'
  );
  const filteredSubscriptions = filter === 'active' ? activeSubscriptions : pausedSubscriptions;

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
          {/* Subscription Navigation Tabs */}
          <SubscriptionTabs activeTab="list" />

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              onClick={() => setFilter('active')}
              className={`${styles.filterTab} ${filter === 'active' ? styles.active : ''}`}
            >
              Active
              <span className={styles.count}>{activeSubscriptions.length}</span>
            </button>
            <button
              onClick={() => setFilter('paused')}
              className={`${styles.filterTab} ${filter === 'paused' ? styles.active : ''}`}
            >
              Paused
              <span className={styles.count}>{pausedSubscriptions.length}</span>
            </button>
          </div>

          {/* Content */}
          {filteredSubscriptions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>{filter === 'active' ? '🍽️' : '⏸️'}</div>
              <h3>{filter === 'active' ? 'No Active Subscriptions' : 'No Paused Subscriptions'}</h3>
              <p>
                {filter === 'active'
                  ? 'Start your meal subscription journey today!'
                  : 'You don\'t have any paused subscriptions.'}
              </p>
              {filter === 'active' && (
                <Link href="/subscriptions/create" className={styles.createButton}>
                  <i className="fas fa-plus"></i>
                  Create Your First Subscription
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.subscriptionGrid}>
              {filteredSubscriptions.map((subscription) => {
                const totalItems = (subscription.items || []).reduce((sum, item) => sum + item.quantity, 0);
                const isActive = subscription.status.toUpperCase() === 'ACTIVE';

                return (
                  <div key={subscription.id} className={styles.subscriptionCard}>
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.planInfo}>
                        <h3 className={styles.planName}>{subscription.planName}</h3>
                        <div className={`${styles.statusBadge} ${isActive ? styles.active : styles.paused}`}>
                          <span className={styles.statusIcon}>{isActive ? '✓' : '⏸️'}</span>
                          {isActive ? 'Active' : 'Paused'}
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
                          {(subscription.items || []).slice(0, 2).map(item => (
                            <span key={item.id} className={styles.itemTag}>
                              {item.quantity}x {item.menuItem.name}
                            </span>
                          ))}
                          {(subscription.items || []).length > 2 && (
                            <span className={styles.moreItems}>
                              +{(subscription.items || []).length - 2} more
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

                      {isActive ? (
                        <button
                          onClick={() => handleQuickAction(subscription.id, 'pause')}
                          className={styles.pauseButton}
                        >
                          <i className="fas fa-pause"></i>
                          Pause
                        </button>
                      ) : (
                        <Link
                          href={`/user/subscriptions/${subscription.id}/resume`}
                          className={styles.resumeButton}
                        >
                          <i className="fas fa-play"></i>
                          Resume
                        </Link>
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
                  <span className={styles.statValue}>{activeSubscriptions.length}</span>
                  <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{pausedSubscriptions.length}</span>
                  <span className={styles.statLabel}>Paused</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {formatCurrency(
                      activeSubscriptions.reduce((sum, s) => sum + s.price, 0)
                    )}
                  </span>
                  <span className={styles.statLabel}>Weekly spend</span>
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