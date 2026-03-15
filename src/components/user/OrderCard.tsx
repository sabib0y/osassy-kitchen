/**
 * OrderCard Component - Displays individual order information
 * Features: Order details, item list, status badges, expandable view
 */

import React, { useState } from 'react';
import { OrderResponse } from '../../lib/api-types';
import { 
  getStatusColor, 
  formatOrderStatus, 
  formatOrderDate, 
  formatCurrency 
} from '../../hooks/useOrders';
import styles from '../../styles/components/user/orders.module.scss';

interface OrderCardProps {
  order: OrderResponse;
  onDownloadInvoice?: (orderId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onDownloadInvoice,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Handle image loading errors
  const handleImageError = (itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId));
  };

  // Calculate total items
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Get subscription info if available
  const subscriptionInfo = order.subscription;

  return (
    <div className={`${styles.orderCard} ${isExpanded ? styles.expanded : ''}`}>
      {/* Order Header */}
      <div className={styles.orderHeader}>
        <div className={styles.orderMain}>
          <div className={styles.orderInfo}>
            <h3 className={styles.orderId}>
              Order #{order.id.slice(-8).toUpperCase()}
            </h3>
            <div className={styles.orderMeta}>
              <span className={styles.orderDate}>
                <i className="fas fa-calendar-alt"></i>
                Ordered: {formatOrderDate(order.createdAt)}
              </span>
              {order.deliveryDate && (
                <span className={styles.deliveryDate}>
                  <i className="fas fa-truck"></i>
                  Delivery: {formatOrderDate(order.deliveryDate)}
                </span>
              )}
            </div>
            {subscriptionInfo && (
              <div className={styles.subscriptionInfo}>
                <i className="fas fa-sync-alt"></i>
                <span>
                  {subscriptionInfo.planName} ({subscriptionInfo.interval.toLowerCase()})
                </span>
              </div>
            )}
          </div>
          
          <div className={styles.orderSummary}>
            <div className={styles.orderStatus}>
              <span className={`${styles.badge} ${styles[getStatusColor(order.status)]}`}>
                {formatOrderStatus(order.status)}
              </span>
            </div>
            <div className={styles.orderAmount}>
              <span className={styles.totalPrice}>
                {formatCurrency(order.totalPrice)}
              </span>
              <span className={styles.itemCount}>
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.orderActions}>
          {onToggleExpand && (
            <button
              className={styles.expandBtn}
              onClick={() => onToggleExpand(order.id)}
              aria-label={isExpanded ? 'Collapse order details' : 'Expand order details'}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
          
          {onDownloadInvoice && order.status === 'DELIVERED' && (
            <button
              className={styles.downloadBtn}
              onClick={() => onDownloadInvoice(order.id)}
              aria-label="Download invoice"
            >
              <i className="fas fa-download"></i>
              Invoice
            </button>
          )}
        </div>
      </div>

      {/* Expandable Order Details */}
      {isExpanded && (
        <div className={styles.orderDetails}>
          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className={styles.orderItems}>
              <h4 className={styles.sectionTitle}>
                <i className="fas fa-utensils"></i>
                Order Items
              </h4>
              <div className={styles.itemsList}>
                {order.items.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <div className={styles.itemImage}>
                      {item.menuItem.imageUrl && !imageErrors.has(item.id) ? (
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          onError={() => handleImageError(item.id)}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <i className="fas fa-utensils"></i>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.itemDetails}>
                      <h5 className={styles.itemName}>{item.menuItem.name}</h5>
                      <p className={styles.itemDescription}>
                        {item.menuItem.description}
                      </p>
                      <div className={styles.itemCategory}>
                        <i className="fas fa-tag"></i>
                        {item.menuItem.category}
                      </div>
                    </div>
                    
                    <div className={styles.itemQuantity}>
                      <span className={styles.quantityLabel}>Qty</span>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                    </div>
                    
                    <div className={styles.itemPrice}>
                      <span className={styles.unitPrice}>
                        {formatCurrency(item.price)}
                      </span>
                      {item.quantity > 1 && (
                        <span className={styles.totalPrice}>
                          Total: {formatCurrency(item.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className={styles.deliveryInfo}>
            <h4 className={styles.sectionTitle}>
              <i className="fas fa-map-marker-alt"></i>
              Delivery Information
            </h4>
            <div className={styles.deliveryDetails}>
              {order.deliveryAddress && (
                <div className={styles.deliveryAddress}>
                  <strong>Address:</strong>
                  <span>{order.deliveryAddress}</span>
                </div>
              )}
              
              {order.deliveryFee !== undefined && (
                <div className={styles.deliveryFee}>
                  <strong>Delivery Fee:</strong>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              
              {order.specialInstructions && (
                <div className={styles.specialInstructions}>
                  <strong>Special Instructions:</strong>
                  <span>{order.specialInstructions}</span>
                </div>
              )}
              
              {order.notes && (
                <div className={styles.orderNotes}>
                  <strong>Notes:</strong>
                  <span>{order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className={styles.orderTimeline}>
            <h4 className={styles.sectionTitle}>
              <i className="fas fa-clock"></i>
              Order Timeline
            </h4>
            <div className={styles.timelineItems}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <i className="fas fa-plus"></i>
                </div>
                <div className={styles.timelineContent}>
                  <strong>Order Placed</strong>
                  <span>{formatOrderDate(order.createdAt)}</span>
                </div>
              </div>
              
              {order.status !== 'PENDING' && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>
                    <i className="fas fa-cog"></i>
                  </div>
                  <div className={styles.timelineContent}>
                    <strong>In Progress</strong>
                    <span>Processing your order</span>
                  </div>
                </div>
              )}
              
              {order.status === 'DELIVERED' && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>
                    <i className="fas fa-check"></i>
                  </div>
                  <div className={styles.timelineContent}>
                    <strong>Delivered</strong>
                    <span>{order.deliveryDate ? formatOrderDate(order.deliveryDate) : 'Completed'}</span>
                  </div>
                </div>
              )}
              
              {order.status === 'CANCELLED' && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>
                    <i className="fas fa-times"></i>
                  </div>
                  <div className={styles.timelineContent}>
                    <strong>Cancelled</strong>
                    <span>Order was cancelled</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.orderSummaryDetails}>
            <h4 className={styles.sectionTitle}>
              <i className="fas fa-receipt"></i>
              Order Summary
            </h4>
            <div className={styles.summaryItems}>
              <div className={styles.summaryItem}>
                <span>Subtotal</span>
                <span>{formatCurrency(order.totalPrice - (order.deliveryFee || 0))}</span>
              </div>
              
              {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                <div className={styles.summaryItem}>
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              
              <div className={`${styles.summaryItem} ${styles.totalItem}`}>
                <span><strong>Total</strong></span>
                <span><strong>{formatCurrency(order.totalPrice)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;