import React, { useState, useCallback } from 'react';
import { Download, Plus, RefreshCw } from 'lucide-react';
import { useOrders, useExportOrders } from '@/hooks/admin/useOrders';
import { Order, OrderFilters as OrderFiltersType } from '@/types/admin';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import OrderStats from '@/components/admin/orders/OrderStats';
import OrderFilters from '@/components/admin/orders/OrderFilters';
import BulkActions from '@/components/admin/orders/BulkActions';
import OrderTable from '@/components/admin/orders/OrderTable';
import OrderModal from '@/components/admin/orders/OrderModal';
import { PageLoading, ButtonLoading } from '@/components/admin/shared/LoadingSpinner';
import { PageError } from '@/components/admin/shared/ErrorMessage';
import styles from '@/styles/components/admin/orders.module.scss';

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFiltersType>({
    page: 1,
    limit: 20,
  });
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: ordersData,
    isLoading,
    error,
    refetch
  } = useOrders(filters);

  const exportMutation = useExportOrders();

  const handleFiltersChange = useCallback((newFilters: OrderFiltersType) => {
    setFilters(newFilters);
    setSelectedOrderIds([]); // Clear selection when filters change
  }, []);

  const handleApplyFilters = useCallback(() => {
    // Reset to first page when applying new filters
    setFilters(prev => ({ ...prev, page: 1 }));
    refetch();
  }, [refetch]);

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync(filters);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleBulkSuccess = () => {
    refetch();
  };

  if (isLoading && !ordersData) {
    return (
      <AdminLayout title="Order Management">
        <PageLoading text="Loading orders..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Order Management">
        <PageError message="Failed to load orders" onRetry={() => refetch()} />
      </AdminLayout>
    );
  }

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination;

  return (
    <AdminLayout
      title="Order Management"
      description="Manage and track all customer orders"
    >
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Order Management</h1>
          <p className={styles.pageDescription}>Manage all customer orders and deliveries</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => refetch()}
            className={styles.exportBtn}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending || orders.length === 0}
            className={styles.exportBtn}
          >
            {exportMutation.isPending ? (
              <ButtonLoading size="sm" />
            ) : (
              <Download size={16} />
            )}
            Export
          </button>
          <button className={styles.newOrderBtn}>
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      {/* Order Statistics */}
      <OrderStats />

      {/* Filters */}
      <OrderFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        isLoading={isLoading}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedOrderIds={selectedOrderIds}
        onClearSelection={() => setSelectedOrderIds([])}
        onSuccess={handleBulkSuccess}
      />

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        selectedOrderIds={selectedOrderIds}
        onSelectionChange={setSelectedOrderIds}
        onViewOrder={handleViewOrder}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationNav}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className={styles.pageBtn}
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                const current = pagination.page;
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
                    className={`${styles.pageBtn} ${page === pagination.page ? styles.active : ''}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))
            }

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>

          <div className={styles.paginationInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </AdminLayout>
  );
}
