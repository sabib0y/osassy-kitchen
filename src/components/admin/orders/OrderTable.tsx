import React from 'react';
import { Eye } from 'lucide-react';
import { Order } from '@/types/admin';
import { useUpdateOrderStatus } from '@/hooks/admin/useOrders';
import styles from '@/styles/components/admin/orders.module.scss';

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
}: OrderTableProps) {
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
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return styles.pending;
      case 'IN_PROGRESS':
        return styles.inProgress;
      case 'DELIVERED':
        return styles.delivered;
      case 'CANCELLED':
        return styles.cancelled;
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const isAllSelected = orders.length > 0 && selectedOrderIds.length === orders.length;
  const isIndeterminate = selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length;

  if (orders.length === 0) {
    return (
      <div className={styles.tableCard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Eye size={32} />
          </div>
          <h3 className={styles.emptyTitle}>No orders found</h3>
          <p className={styles.emptyText}>There are no orders matching your current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className={styles.checkbox}
                />
              </th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const dateInfo = formatDate(order.createdAt);
              return (
                <tr
                  key={order.id}
                  className={selectedOrderIds.includes(order.id) ? styles.selected : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                      className={styles.checkbox}
                    />
                  </td>
                  <td>
                    <span className={styles.orderNumber}>
                      #{order.id.slice(-5).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className={styles.customerCell}>
                      <div className={styles.avatar}>
                        {getInitials(order.user.name, order.user.email)}
                      </div>
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>{order.user.name || 'N/A'}</span>
                        <span className={styles.customerEmail}>{order.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.itemsCell}>
                      {order.items.slice(0, 2).map(item => (
                        <div key={item.id}>{item.menuItem.name} x{item.quantity}</div>
                      ))}
                      {order.items.length > 2 && (
                        <div className={styles.itemMore}>+{order.items.length - 2} more</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.dateCell}>
                      <div className={styles.dateMain}>{dateInfo.date}</div>
                      <div className={styles.dateTime}>{dateInfo.time}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.totalCell}>{formatCurrency(order.totalPrice)}</span>
                  </td>
                  <td>
                    <div className={styles.deliveryCell}>
                      <div className={styles.deliveryDate}>
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                      </div>
                      <div className={styles.deliveryLocation}>Lagos</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        onClick={() => onViewOrder(order)}
                        className={`${styles.actionBtn} ${styles.view}`}
                      >
                        View
                      </button>
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'IN_PROGRESS')}
                          disabled={updateOrderMutation.isPending}
                          className={`${styles.actionBtn} ${styles.start}`}
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
