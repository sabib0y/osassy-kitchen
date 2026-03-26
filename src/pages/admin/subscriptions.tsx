import React, { useState, useCallback } from 'react';
import { Search, Users, PauseCircle, XCircle, PlayCircle, Calendar, RefreshCw } from 'lucide-react';
import {
  useSubscriptions,
  useUpdateSubscriptionStatus,
  SubscriptionFilters
} from '@/hooks/admin/useSubscriptions';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import { PageLoading } from '@/components/admin/shared/LoadingSpinner';
import { PageError } from '@/components/admin/shared/ErrorMessage';
import styles from '@/styles/components/admin/subscriptions.module.scss';

type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

const intervalLabels: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
};

export default function SubscriptionsPage() {
  const [filters, setFilters] = useState<SubscriptionFilters>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');

  const {
    data: subscriptionsData,
    isLoading,
    error,
    refetch
  } = useSubscriptions(filters);

  const updateStatusMutation = useUpdateSubscriptionStatus();

  const handleSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  }, [searchInput]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? undefined : status,
      page: 1
    }));
  }, []);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleUpdateStatus = async (subscriptionId: string, newStatus: SubscriptionStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ subscriptionId, status: newStatus });
    } catch (error) {
      console.error('Failed to update subscription status:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (isLoading && !subscriptionsData) {
    return (
      <AdminLayout title="Subscription Management">
        <PageLoading text="Loading subscriptions..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Subscription Management">
        <PageError message="Failed to load subscriptions" onRetry={() => refetch()} />
      </AdminLayout>
    );
  }

  const subscriptions = subscriptionsData?.subscriptions || [];
  const pagination = subscriptionsData?.pagination;

  // Calculate stats from current data
  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const pausedCount = subscriptions.filter(s => s.status === 'PAUSED').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'CANCELLED').length;

  return (
    <AdminLayout
      title="Subscription Management"
      description="Manage customer subscriptions"
    >
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Subscription Management</h1>
          <p className={styles.pageDescription}>Manage customer subscriptions</p>
        </div>
        <button
          onClick={() => refetch()}
          className={`${styles.refreshBtn} ${isLoading ? styles.loading : ''}`}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statsCard}>
          <div className={`${styles.statsIcon} ${styles.active}`}>
            <Users size={24} />
          </div>
          <div className={styles.statsContent}>
            <div className={styles.statsLabel}>Active Subscriptions</div>
            <div className={styles.statsValue}>{activeCount}</div>
          </div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsIcon} ${styles.paused}`}>
            <PauseCircle size={24} />
          </div>
          <div className={styles.statsContent}>
            <div className={styles.statsLabel}>Paused Subscriptions</div>
            <div className={styles.statsValue}>{pausedCount}</div>
          </div>
        </div>
        <div className={styles.statsCard}>
          <div className={`${styles.statsIcon} ${styles.cancelled}`}>
            <XCircle size={24} />
          </div>
          <div className={styles.statsContent}>
            <div className={styles.statsLabel}>Cancelled Subscriptions</div>
            <div className={styles.statsValue}>{cancelledCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className={styles.searchInput}
            />
          </div>

          {/* Status Filter Buttons */}
          <div className={styles.statusFilters}>
            {(['ACTIVE', 'PAUSED', 'CANCELLED'] as SubscriptionStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`${styles.statusBtn} ${filters.status === status ? styles.active : ''}`}
              >
                {status === 'ACTIVE' ? 'Active' : status === 'PAUSED' ? 'Paused' : 'Cancelled'}
              </button>
            ))}
          </div>

          {/* Search Button */}
          <button onClick={handleSearch} className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Interval</th>
                <th>Price</th>
                <th>Status</th>
                <th>Next Delivery</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>
                      <div className={styles.customerCell}>
                        <div className={styles.avatar}>
                          {getInitials(subscription.user.name, subscription.user.email)}
                        </div>
                        <div className={styles.customerInfo}>
                          <span className={styles.customerName}>
                            {subscription.user.name || 'N/A'}
                          </span>
                          <span className={styles.customerEmail}>
                            {subscription.user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.planCell}>{subscription.planName}</td>
                    <td className={styles.intervalCell}>
                      {intervalLabels[subscription.interval] || subscription.interval}
                    </td>
                    <td className={styles.priceCell}>{formatPrice(subscription.price)}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          subscription.status === 'ACTIVE'
                            ? styles.active
                            : subscription.status === 'PAUSED'
                            ? styles.paused
                            : styles.cancelled
                        }`}
                      >
                        {subscription.status === 'ACTIVE'
                          ? 'Active'
                          : subscription.status === 'PAUSED'
                          ? 'Paused'
                          : 'Cancelled'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.deliveryCell}>
                        <Calendar size={14} />
                        {formatDate(subscription.nextDeliveryDate)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        {subscription.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription.id, 'PAUSED')}
                            disabled={updateStatusMutation.isPending}
                            title="Pause Subscription"
                            className={`${styles.actionBtn} ${styles.pause}`}
                          >
                            <PauseCircle size={16} />
                          </button>
                        )}
                        {subscription.status === 'PAUSED' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription.id, 'ACTIVE')}
                            disabled={updateStatusMutation.isPending}
                            title="Resume Subscription"
                            className={`${styles.actionBtn} ${styles.resume}`}
                          >
                            <PlayCircle size={16} />
                          </button>
                        )}
                        {subscription.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription.id, 'CANCELLED')}
                            disabled={updateStatusMutation.isPending}
                            title="Cancel Subscription"
                            className={`${styles.actionBtn} ${styles.cancel}`}
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationNav}>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className={styles.pageBtn}
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                const current = pagination.currentPage;
                return page === 1 || page === pagination.totalPages ||
                       (page >= current - 2 && page <= current + 2);
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className={styles.pageEllipsis}>...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    disabled={isLoading}
                    className={`${styles.pageBtn} ${page === pagination.currentPage ? styles.active : ''}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))
            }

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>

          <div className={styles.paginationInfo}>
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
