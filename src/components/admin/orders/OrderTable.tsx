import React, { useState } from 'react';
import { Eye, MoreVertical, Truck, CheckCircle, X } from 'lucide-react';
import { Order } from '@/types/admin';
import StatusBadge from '../shared/StatusBadge';
import { useUpdateOrderStatus } from '@/hooks/admin/useOrders';
import { ButtonLoading } from '../shared/LoadingSpinner';

interface OrderTableProps {
  orders: Order[];
  selectedOrderIds: string[];
  onSelectionChange: (orderIds: string[]) => void;
  onViewOrder: (order: Order) => void;
  isLoading?: boolean;
}

export default function OrderTable({
  orders,
  selectedOrderIds,
  onSelectionChange,
  onViewOrder,
  isLoading = false
}: OrderTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const updateOrderMutation = useUpdateOrderStatus();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(orders.map(order => order.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedOrderIds, orderId]);
    } else {
      onSelectionChange(selectedOrderIds.filter(id => id !== orderId));
    }
  };

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderMutation.mutateAsync({ orderId, status });
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const isAllSelected = orders.length > 0 && selectedOrderIds.length === orders.length;
  const isIndeterminate = selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length;

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">There are no orders matching your current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container" style={{
      background: 'var(--card)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden'
    }}>
      <div className="overflow-x-auto">
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--primary)' }}
                />
              </th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Order #</th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Customer</th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Items</th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Date</th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Status</th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Total</th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Delivery</th>
              <th style={{ 
                padding: '0.75rem 1rem', 
                textAlign: 'left',
                color: 'var(--secondary)',
                fontWeight: '600',
                background: 'var(--muted)'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: selectedOrderIds.includes(order.id) ? 'rgba(37, 99, 235, 0.05)' : 'transparent'
                }}
                className="hover:bg-gray-50"
              >
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.id)}
                    onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <strong>#{order.id.slice(-5).toUpperCase()}</strong>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <div>
                    <div className="font-semibold">{order.user.name}</div>
                    <div className="text-sm" style={{ color: 'var(--secondary)' }}>{order.user.email}</div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <div className="text-sm">
                    {order.items.slice(0, 2).map(item => (
                      <div key={item.id}>{item.menuItem.name} x{item.quantity}</div>
                    ))}
                    {order.items.length > 2 && <div>+{order.items.length - 2} more</div>}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  {formatDate(order.createdAt).split(',')[0]}<br/>
                  <span className="text-sm" style={{ color: 'var(--secondary)' }}>
                    {formatDate(order.createdAt).split(',')[1]}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <StatusBadge status={order.status} />
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <strong>{formatCurrency(order.totalPrice)}</strong>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <div className="text-sm">
                    <div>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'TBD'}</div>
                    <div style={{ color: 'var(--secondary)' }}>{order.deliveryAddress?.city || 'Lagos'}</div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onViewOrder(order)}
                      className="btn-secondary text-xs"
                      style={{
                        background: 'var(--secondary)',
                        color: 'var(--secondary-foreground)',
                        borderRadius: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        fontWeight: '600',
                        transition: 'background 0.2s',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      View
                    </button>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'IN_PROGRESS')}
                        className="btn-primary text-xs"
                        style={{
                          background: 'var(--primary)',
                          color: 'var(--primary-foreground)',
                          borderRadius: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          fontWeight: '600',
                          transition: 'background 0.2s',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Start
                      </button>
                    )}
                      
                      {actionMenuOpen === order.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            {order.status === 'PENDING' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'IN_PROGRESS')}
                                disabled={updateOrderMutation.isPending}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                {updateOrderMutation.isPending ? (
                                  <ButtonLoading size="sm" />
                                ) : (
                                  <Truck className="w-4 h-4" />
                                )}
                                Mark In Progress
                              </button>
                            )}
                            
                            {['PENDING', 'IN_PROGRESS'].includes(order.status) && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                                disabled={updateOrderMutation.isPending}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                {updateOrderMutation.isPending ? (
                                  <ButtonLoading size="sm" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Mark Delivered
                              </button>
                            )}
                            
                            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                disabled={updateOrderMutation.isPending}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {updateOrderMutation.isPending ? (
                                  <ButtonLoading size="sm" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Click outside to close menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
}
