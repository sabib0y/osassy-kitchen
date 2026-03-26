import React, { useState, useCallback } from 'react';
import { Search, Users, PauseCircle, XCircle, PlayCircle, Calendar, RefreshCw } from 'lucide-react';
import {
  useSubscriptions,
  useUpdateSubscriptionStatus,
  Subscription,
  SubscriptionFilters
} from '@/hooks/admin/useSubscriptions';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import StatsCard from '@/components/admin/shared/StatsCard';
import { PageLoading } from '@/components/admin/shared/LoadingSpinner';
import { PageError } from '@/components/admin/shared/ErrorMessage';

type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

const statusConfig: Record<SubscriptionStatus, { label: string; colour: string; bgColour: string }> = {
  ACTIVE: { label: 'Active', colour: 'var(--secondary-foreground)', bgColour: 'var(--secondary)' },
  PAUSED: { label: 'Paused', colour: 'var(--accent-foreground)', bgColour: 'var(--accent)' },
  CANCELLED: { label: 'Cancelled', colour: 'var(--destructive-foreground)', bgColour: 'var(--destructive)' },
};

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
            Subscription Management
          </h1>
          <p className="mt-1" style={{ color: 'var(--secondary)' }}>
            View and manage all customer subscriptions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2"
          style={{
            background: 'var(--secondary)',
            color: 'var(--secondary-foreground)',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Active Subscriptions"
          value={pagination?.totalCount ?
            subscriptions.filter(s => s.status === 'ACTIVE').length +
            (filters.status === 'ACTIVE' ? 0 : activeCount) : activeCount}
          icon={Users}
        />
        <StatsCard
          title="Paused Subscriptions"
          value={pausedCount}
          icon={PauseCircle}
        />
        <StatsCard
          title="Cancelled Subscriptions"
          value={cancelledCount}
          icon={XCircle}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: 'var(--secondary)' }}
              />
              <input
                type="text"
                placeholder="Search by name, email, or plan..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-2">
            {(['ACTIVE', 'PAUSED', 'CANCELLED'] as SubscriptionStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                style={{
                  background: filters.status === status ? statusConfig[status].bgColour : 'transparent',
                  color: filters.status === status ? statusConfig[status].colour : 'var(--text)',
                  border: `1px solid ${filters.status === status ? statusConfig[status].bgColour : 'var(--border)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {statusConfig[status].label}
              </button>
            ))}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Customer</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Plan</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Interval</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Price</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Status</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Next Delivery</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: 'var(--secondary)' }}>
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text)' }}>
                          {subscription.user.name || 'N/A'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                          {subscription.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                      {subscription.planName}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                      {intervalLabels[subscription.interval] || subscription.interval}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                      {formatPrice(subscription.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={{
                          background: statusConfig[subscription.status].bgColour,
                          color: statusConfig[subscription.status].colour,
                          borderRadius: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'inline-block',
                        }}
                      >
                        {statusConfig[subscription.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        <Calendar size={14} style={{ color: 'var(--secondary)' }} />
                        {formatDate(subscription.nextDeliveryDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {subscription.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription.id, 'PAUSED')}
                            disabled={updateStatusMutation.isPending}
                            title="Pause Subscription"
                            style={{
                              background: 'var(--accent)',
                              color: 'var(--accent-foreground)',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem',
                              cursor: updateStatusMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: updateStatusMutation.isPending ? 0.5 : 1,
                            }}
                          >
                            <PauseCircle size={16} />
                          </button>
                        )}
                        {subscription.status === 'PAUSED' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription.id, 'ACTIVE')}
                            disabled={updateStatusMutation.isPending}
                            title="Resume Subscription"
                            style={{
                              background: 'var(--secondary)',
                              color: 'var(--secondary-foreground)',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem',
                              cursor: updateStatusMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: updateStatusMutation.isPending ? 0.5 : 1,
                            }}
                          >
                            <PlayCircle size={16} />
                          </button>
                        )}
                        {subscription.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateStatus(subscription.id, 'CANCELLED')}
                            disabled={updateStatusMutation.isPending}
                            title="Cancel Subscription"
                            style={{
                              background: 'var(--destructive)',
                              color: 'var(--destructive-foreground)',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem',
                              cursor: updateStatusMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: updateStatusMutation.isPending ? 0.5 : 1,
                            }}
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
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.currentPage;
                  return page === 1 || page === pagination.totalPages ||
                         (page >= current - 2 && page <= current + 2);
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      disabled={isLoading}
                      className="px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: page === pagination.currentPage ? 'var(--primary)' : 'white',
                        color: page === pagination.currentPage ? 'var(--primary-foreground)' : 'var(--secondary)',
                        border: page === pagination.currentPage ? 'none' : '1px solid var(--border)',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
