/**
 * OrderList Component - Displays paginated list of orders with filters
 * Features: Status filtering, date range filtering, search, pagination
 */

import React, { useState, useMemo } from 'react';
import OrderCard from './OrderCard';
import { useOrders } from '../../hooks/useOrders';
import { OrderFilters } from '../../lib/api-types';
import styles from '../../styles/components/user/orders.module.scss';

interface OrderListProps {
  onDownloadInvoice?: (orderId: string) => void;
  className?: string;
}

const OrderList: React.FC<OrderListProps> = ({
  onDownloadInvoice,
  className,
}) => {
  // Local state for expanded orders and filters
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Use orders hook
  const {
    orders,
    pagination,
    isLoading,
    isError,
    error,
    isFetching,
    filters,
    updateFilters,
    clearFilters,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    refetch,
    isEmpty,
    totalOrders,
  } = useOrders();

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  // Handle order expansion
  const handleToggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    updateFilters({
      ...filterValues,
      status: filterValues.status as OrderFilters['status']
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    });
    clearFilters();
  };

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.status || filters.dateFrom || filters.dateTo;
  }, [filters]);

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    const halfButtons = Math.floor(maxButtons / 2);
    
    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    return buttons;
  };

  // Handle error state
  if (isError && error) {
    return (
      <div className={`${styles.orderList} ${className || ''}`}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Error Loading Orders</h3>
          <p>{error.message}</p>
          <button onClick={refetch} className={styles.retryBtn}>
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.orderList} ${className || ''}`}>
      {/* Header */}
      <div className={styles.listHeader}>
        <div className={styles.headerInfo}>
          <h2 className={styles.pageTitle}>Order History</h2>
          <span className={styles.orderCount}>
            {totalOrders > 0 ? `${totalOrders} order${totalOrders !== 1 ? 's' : ''}` : 'No orders'}
          </span>
        </div>

        {/* Filter Toggle */}
        <button
          className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="fas fa-filter"></i>
          Filters
          {hasActiveFilters && <span className={styles.filterBadge}></span>}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filtersGrid}>
            {/* Search Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="search">Search Orders</label>
              <input
                id="search"
                type="text"
                placeholder="Search by order ID or items..."
                value={filterValues.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Status Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="status">Order Status</label>
              <select
                id="status"
                value={filterValues.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className={styles.filterSelect}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="dateFrom">From Date</label>
              <input
                id="dateFrom"
                type="date"
                value={filterValues.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Date To Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="dateTo">To Date</label>
              <input
                id="dateTo"
                type="date"
                value={filterValues.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={styles.filterInput}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className={styles.filterActions}>
            <button
              onClick={applyFilters}
              className={styles.applyBtn}
              disabled={isFetching}
            >
              <i className="fas fa-search"></i>
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className={styles.clearBtn}
              disabled={!hasActiveFilters}
            >
              <i className="fas fa-times"></i>
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Active filters:</span>
          <div className={styles.filterTags}>
            {filters.search && (
              <span className={styles.filterTag}>
                Search: &quot;{filters.search}&quot;
                <button onClick={() => updateFilters({ search: '' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            {filters.status && (
              <span className={styles.filterTag}>
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <button onClick={() => updateFilters({ status: '' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className={styles.filterTag}>
                From: {new Date(filters.dateFrom).toLocaleDateString()}
                <button onClick={() => updateFilters({ dateFrom: '' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className={styles.filterTag}>
                To: {new Date(filters.dateTo).toLocaleDateString()}
                <button onClick={() => updateFilters({ dateTo: '' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className={styles.loadingState}>
          {[...Array(3)].map((_, index) => (
            <div key={index} className={styles.orderSkeleton}>
              <div className={styles.skeletonHeader}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonBadge}></div>
              </div>
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLine}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders List */}
      {!isLoading && !isEmpty && (
        <div className={styles.ordersContainer}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onDownloadInvoice={onDownloadInvoice}
              isExpanded={expandedOrders.has(order.id)}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && isEmpty && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-shopping-bag"></i>
          </div>
          <h3>No Orders Found</h3>
          <p>
            {hasActiveFilters
              ? 'No orders match your current filters. Try adjusting your search criteria.'
              : 'You haven\'t placed any orders yet. Start ordering to see your history here!'}
          </p>
          {hasActiveFilters ? (
            <button onClick={handleClearFilters} className={styles.clearFiltersBtn}>
              <i className="fas fa-times"></i>
              Clear Filters
            </button>
          ) : (
            <a href="/menu" className={styles.browseMenuBtn}>
              <i className="fas fa-utensils"></i>
              Browse Menu
            </a>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination && totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            <span>
              Showing page {currentPage} of {totalPages} 
              ({totalOrders} total order{totalOrders !== 1 ? 's' : ''})
            </span>
          </div>

          <div className={styles.paginationControls}>
            {/* Previous Button */}
            <button
              onClick={prevPage}
              disabled={!hasPrevPage || isFetching}
              className={styles.paginationBtn}
              aria-label="Previous page"
            >
              <i className="fas fa-chevron-left"></i>
              Previous
            </button>

            {/* Page Numbers */}
            <div className={styles.paginationNumbers}>
              {generatePaginationButtons().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`${styles.paginationNumber} ${
                    pageNum === currentPage ? styles.active : ''
                  }`}
                  disabled={isFetching}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextPage}
              disabled={!hasNextPage || isFetching}
              className={styles.paginationBtn}
              aria-label="Next page"
            >
              Next
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isFetching && !isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
            <span>Updating orders...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;