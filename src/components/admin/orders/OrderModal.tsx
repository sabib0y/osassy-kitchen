import React from 'react';
import { ArrowLeft, MapPin, Clock, User, Phone, Mail, Package, CreditCard } from 'lucide-react';
import { Order } from '@/types/admin';
import StatusBadge from '../shared/StatusBadge';
import { useUpdateOrderStatus } from '@/hooks/admin/useOrders';
import { ButtonLoading } from '../shared/LoadingSpinner';
import styles from './OrderModal.module.scss';

interface OrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderModal({ order, isOpen, onClose }: OrderModalProps) {
  const updateOrderMutation = useUpdateOrderStatus();

  if (!isOpen || !order) return null;

  const handleStatusUpdate = async (status: Order['status']) => {
    try {
      await updateOrderMutation.mutateAsync({ orderId: order.id, status });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '£0.00';
    return `£${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  };

  const getNextStatusOptions = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'PENDING':
        return [
          { value: 'IN_PROGRESS', label: 'Start Processing', variant: 'primary' as const },
          { value: 'DELIVERED', label: 'Mark Delivered', variant: 'success' as const },
          { value: 'CANCELLED', label: 'Cancel Order', variant: 'danger' as const },
        ];
      case 'IN_PROGRESS':
        return [
          { value: 'DELIVERED', label: 'Mark Delivered', variant: 'success' as const },
          { value: 'CANCELLED', label: 'Cancel Order', variant: 'danger' as const },
        ];
      case 'DELIVERED':
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const statusOptions = getNextStatusOptions(order.status);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onClose}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div className={styles.headerInfo}>
            <h2 className={styles.orderId}>Order #{order.id.slice(-5).toUpperCase()}</h2>
            <StatusBadge status={order.status} size="md" />
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Order Date */}
          <div className={styles.section}>
            <p className={styles.orderDate}>
              <Clock size={14} />
              Placed {formatDate(order.createdAt)}
            </p>
          </div>

          {/* Customer Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <User size={16} />
              Customer
            </h3>
            <div className={styles.sectionContent}>
              <p className={styles.customerName}>{order.user.name}</p>
              <p className={styles.customerDetail}>
                <Mail size={14} />
                {order.user.email}
              </p>
              {order.user.phone && (
                <p className={styles.customerDetail}>
                  <Phone size={14} />
                  {order.user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MapPin size={16} />
              Delivery
            </h3>
            <div className={styles.sectionContent}>
              <p className={styles.address}>{order.deliveryAddress}</p>
              {order.deliveryDate && (
                <p className={styles.deliveryDate}>
                  <Clock size={14} />
                  {formatDate(order.deliveryDate)}
                </p>
              )}
              {order.specialInstructions && (
                <div className={styles.instructions}>
                  <span className={styles.instructionsLabel}>Notes:</span>
                  <p>{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Package size={16} />
              Items ({Array.isArray(order.items) ? order.items.length : 0})
            </h3>
            <div className={styles.itemsList}>
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.menuItem?.name || 'Item'}</span>
                      <span className={styles.itemQty}>
                        {formatCurrency(item.menuItem?.price)} × {item.quantity}
                      </span>
                    </div>
                    <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
                  </div>
                ))
              ) : (
                <p className={styles.noItems}>No item details available</p>
              )}
            </div>
          </div>

          {/* Order Total */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <CreditCard size={16} />
              Payment
            </h3>
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency((order.totalPrice || 0) - (order.deliveryFee || 0))}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Delivery</span>
                <span>{formatCurrency(order.deliveryFee || 0)}</span>
              </div>
              <div className={styles.totalRowFinal}>
                <span>Total</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Timeline</h3>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} data-status="complete" />
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>Order Placed</span>
                  <span className={styles.timelineDate}>{formatDate(order.createdAt)}</span>
                </div>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} data-status="current" />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineLabel}>Status Updated</span>
                    <span className={styles.timelineDate}>{formatDate(order.updatedAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Status Actions */}
        {statusOptions.length > 0 && (
          <div className={styles.footer}>
            <p className={styles.footerLabel}>Update Status</p>
            <div className={styles.actions}>
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusUpdate(option.value as Order['status'])}
                  disabled={updateOrderMutation.isPending}
                  className={`${styles.actionBtn} ${styles[option.variant]}`}
                >
                  {updateOrderMutation.isPending ? <ButtonLoading size="sm" /> : null}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
