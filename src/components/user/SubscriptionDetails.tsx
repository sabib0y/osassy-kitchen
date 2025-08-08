import React, { useState } from 'react';
import { SubscriptionResponse } from '../../lib/api-types';
import styles from '../../styles/components/user/subscription-details.module.scss';

interface SubscriptionDetailsProps {
  subscription: SubscriptionResponse;
}

const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({ subscription }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'history' | 'billing'>('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return { className: 'active', icon: '✓', color: '#4CAF50' };
      case 'PAUSED':
        return { className: 'paused', icon: '⏸️', color: '#FF9800' };
      case 'CANCELLED':
        return { className: 'cancelled', icon: '❌', color: '#f44336' };
      default:
        return { className: 'unknown', icon: '❓', color: '#9E9E9E' };
    }
  };

  const getTotalItems = () => {
    return subscription.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getNextDeliveryInfo = () => {
    if (!subscription.nextDeliveryDate || subscription.status !== 'ACTIVE') {
      return null;
    }

    const nextDelivery = new Date(subscription.nextDeliveryDate);
    const today = new Date();
    const diffTime = nextDelivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', className: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Today', className: 'today' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', className: 'soon' };
    } else if (diffDays <= 7) {
      return { text: `In ${diffDays} days`, className: 'soon' };
    } else {
      return { text: `In ${diffDays} days`, className: 'later' };
    }
  };

  const statusConfig = getStatusConfig(subscription.status);
  const nextDeliveryInfo = getNextDeliveryInfo();

  const renderOverviewTab = () => (
    <div className={styles.overviewContent}>
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardContent}>
            <h4>Subscription Plan</h4>
            <p className={styles.cardValue}>{subscription.planName}</p>
            <p className={styles.cardSubtext}>{subscription.interval} delivery</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>💰</div>
          <div className={styles.cardContent}>
            <h4>Price</h4>
            <p className={styles.cardValue}>{formatCurrency(subscription.price)}</p>
            <p className={styles.cardSubtext}>Per {subscription.interval.toLowerCase()}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>🍽️</div>
          <div className={styles.cardContent}>
            <h4>Items</h4>
            <p className={styles.cardValue}>{getTotalItems()}</p>
            <p className={styles.cardSubtext}>Total items per delivery</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📅</div>
          <div className={styles.cardContent}>
            <h4>Started</h4>
            <p className={styles.cardValue}>{formatDateShort(subscription.startDate)}</p>
            <p className={styles.cardSubtext}>Subscription started</p>
          </div>
        </div>
      </div>

      {nextDeliveryInfo && (
        <div className={styles.nextDelivery}>
          <div className={styles.nextDeliveryHeader}>
            <h3>Next Delivery</h3>
            <span className={`${styles.deliveryBadge} ${styles[nextDeliveryInfo.className]}`}>
              {nextDeliveryInfo.text}
            </span>
          </div>
          <p className={styles.deliveryDate}>
            {formatDate(subscription.nextDeliveryDate!)}
          </p>
          <div className={styles.deliveryItems}>
            <h4>You'll receive:</h4>
            <ul>
              {subscription.items.map(item => (
                <li key={item.id}>
                  {item.quantity}x {item.menuItem.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {subscription.status === 'PAUSED' && (
        <div className={styles.pausedNotice}>
          <div className={styles.pausedIcon}>⏸️</div>
          <div className={styles.pausedContent}>
            <h4>Subscription Paused</h4>
            <p>Your subscription is currently paused. No orders will be generated until you resume it.</p>
          </div>
        </div>
      )}

      {subscription.status === 'CANCELLED' && (
        <div className={styles.cancelledNotice}>
          <div className={styles.cancelledIcon}>❌</div>
          <div className={styles.cancelledContent}>
            <h4>Subscription Cancelled</h4>
            <p>This subscription has been cancelled. No further orders will be generated.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderItemsTab = () => (
    <div className={styles.itemsContent}>
      <div className={styles.itemsHeader}>
        <h3>Subscription Items</h3>
        <p>Items included in each delivery</p>
      </div>
      
      <div className={styles.itemsList}>
        {subscription.items.map(item => (
          <div key={item.id} className={styles.itemCard}>
            {item.menuItem.imageUrl && (
              <div className={styles.itemImage}>
                <img src={item.menuItem.imageUrl} alt={item.menuItem.name} />
              </div>
            )}
            <div className={styles.itemDetails}>
              <h4>{item.menuItem.name}</h4>
              <p className={styles.itemDescription}>
                {item.menuItem.description}
              </p>
              <div className={styles.itemMeta}>
                <span className={styles.category}>{item.menuItem.category}</span>
                <span className={styles.price}>{formatCurrency(item.menuItem.price)}</span>
              </div>
            </div>
            <div className={styles.itemQuantity}>
              <div className={styles.quantityBadge}>
                {item.quantity}x
              </div>
              <div className={styles.totalPrice}>
                {formatCurrency(item.menuItem.price * item.quantity)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.itemsTotal}>
        <div className={styles.totalRow}>
          <span>Total per delivery:</span>
          <span className={styles.totalAmount}>
            {formatCurrency(subscription.price)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className={styles.historyContent}>
      <div className={styles.historyHeader}>
        <h3>Order History</h3>
        <p>Recent orders from this subscription</p>
      </div>
      
      {subscription.recentOrders && subscription.recentOrders.length > 0 ? (
        <div className={styles.ordersList}>
          {subscription.recentOrders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <h4>Order #{order.id.slice(-8)}</h4>
                  <p className={styles.orderDate}>
                    {formatDate(order.deliveryDate || order.createdAt)}
                  </p>
                </div>
                <div className={styles.orderStatus}>
                  <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                    {order.status}
                  </span>
                  <span className={styles.orderTotal}>
                    {formatCurrency(order.totalPrice)}
                  </span>
                </div>
              </div>
              
              {order.items && order.items.length > 0 && (
                <div className={styles.orderItems}>
                  {order.items.map(item => (
                    <div key={item.id} className={styles.orderItem}>
                      <span>{item.quantity}x {item.menuItem.name}</span>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noHistory}>
          <div className={styles.noHistoryIcon}>📦</div>
          <h4>No Orders Yet</h4>
          <p>Orders from this subscription will appear here once they're generated.</p>
        </div>
      )}
    </div>
  );

  const renderBillingTab = () => (
    <div className={styles.billingContent}>
      <div className={styles.billingHeader}>
        <h3>Billing Information</h3>
        <p>Subscription billing details and history</p>
      </div>
      
      <div className={styles.billingCards}>
        <div className={styles.billingCard}>
          <div className={styles.billingCardHeader}>
            <h4>Current Plan</h4>
            <span className={`${styles.statusBadge} ${styles[statusConfig.className]}`}>
              {statusConfig.icon} {subscription.status}
            </span>
          </div>
          <div className={styles.billingDetails}>
            <div className={styles.billingRow}>
              <span>Plan:</span>
              <span>{subscription.planName}</span>
            </div>
            <div className={styles.billingRow}>
              <span>Billing cycle:</span>
              <span>{subscription.interval}</span>
            </div>
            <div className={styles.billingRow}>
              <span>Amount:</span>
              <span className={styles.amount}>{formatCurrency(subscription.price)}</span>
            </div>
            <div className={styles.billingRow}>
              <span>Start date:</span>
              <span>{formatDateShort(subscription.startDate)}</span>
            </div>
            {subscription.nextDeliveryDate && subscription.status === 'ACTIVE' && (
              <div className={styles.billingRow}>
                <span>Next billing:</span>
                <span>{formatDateShort(subscription.nextDeliveryDate)}</span>
              </div>
            )}
          </div>
        </div>

        {subscription.stripeSubscriptionId && (
          <div className={styles.billingCard}>
            <h4>Payment Method</h4>
            <div className={styles.paymentInfo}>
              <p>Payment is processed securely through Stripe</p>
              <p className={styles.stripeId}>
                ID: {subscription.stripeSubscriptionId.slice(-8)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.subscriptionDetails}>
      {/* Subscription Header */}
      <div className={styles.detailsHeader}>
        <div className={styles.statusInfo}>
          <div className={styles.statusIndicator}>
            <div 
              className={styles.statusDot} 
              style={{ backgroundColor: statusConfig.color }}
            />
            <span className={styles.statusText}>{subscription.status}</span>
          </div>
          <div className={styles.subscriptionMeta}>
            <span className={styles.interval}>{subscription.interval} delivery</span>
            <span className={styles.separator}>•</span>
            <span className={styles.price}>{formatCurrency(subscription.price)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'items', label: 'Items', icon: '🍽️' },
            { key: 'history', label: 'History', icon: '📋' },
            { key: 'billing', label: 'Billing', icon: '💳' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'items' && renderItemsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'billing' && renderBillingTab()}
      </div>
    </div>
  );
};

export default SubscriptionDetails;