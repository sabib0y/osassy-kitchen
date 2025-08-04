import React, { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
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
      {/* Order Statistics */}
      <OrderStats />

      {/* Filters */}
      <OrderFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        isLoading={isLoading}
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {pagination && (
            <p className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} orders
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending || orders.length === 0}
            className="btn-secondary flex items-center gap-2"
            style={{
              background: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontWeight: '600',
              transition: 'background 0.2s',
              border: 'none',
              cursor: exportMutation.isPending || orders.length === 0 ? 'not-allowed' : 'pointer',
              opacity: exportMutation.isPending || orders.length === 0 ? 0.5 : 1
            }}
          >
            {exportMutation.isPending ? (
              <ButtonLoading size="sm" />
            ) : (
              <Download size={16} />
            )}
            Export
          </button>
        </div>
      </div>

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
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.page;
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
                        background: page === pagination.page ? 'var(--primary)' : 'white',
                        color: page === pagination.page ? 'var(--primary-foreground)' : 'var(--secondary)',
                        border: page === pagination.page ? 'none' : '1px solid var(--border)',
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
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="text-sm text-gray-700">
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
