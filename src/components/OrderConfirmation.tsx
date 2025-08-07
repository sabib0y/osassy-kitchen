import React from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  Package, 
  Calendar, 
  CreditCard, 
  MapPin,
  Clock,
  Truck,
  ChevronRight,
  Home,
  ShoppingBag,
  Receipt
} from 'lucide-react';
import styles from '@/styles/components/order-confirmation.module.css';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface OrderConfirmationProps {
  sessionId?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  items?: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  billingInterval?: 'WEEKLY' | 'MONTHLY';
  nextDeliveryDate?: Date;
  paymentMethod?: {
    brand?: string;
    last4?: string;
  };
  deliveryAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  isLoading?: boolean;
  error?: string;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  sessionId,
  orderId,
  customerName = 'Customer',
  customerEmail,
  items = [],
  subtotal = 0,
  deliveryFee = 500,
  total = 0,
  billingInterval = 'WEEKLY',
  nextDeliveryDate,
  paymentMethod,
  deliveryAddress,
  isLoading = false,
  error
}) => {
  // Calculate next delivery date if not provided
  const estimatedDelivery = nextDeliveryDate || (() => {
    const date = new Date();
    date.setDate(date.getDate() + (billingInterval === 'WEEKLY' ? 7 : 30));
    return date;
  })();

  // Format currency
  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB')}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link href="/subscriptions/create" className={styles.retryButton}>
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.confirmationContainer}>
      {/* Success Header */}
      <div className={styles.successHeader}>
        <div className={styles.successIconWrapper}>
          <CheckCircle className={styles.successIcon} />
        </div>
        <h1 className={styles.successTitle}>Order Confirmed!</h1>
        <p className={styles.successSubtitle}>
          Thank you for subscribing to Osassy Kitchen
        </p>
        {orderId && (
          <p className={styles.orderNumber} data-testid="order-id">
            Order #{orderId}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/user/dashboard" className={styles.actionButton}>
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
        <Link href="/user/subscriptions" className={styles.actionButton}>
          <Package className="w-4 h-4" />
          <span>View Subscription</span>
        </Link>
        <Link href="/subscriptions/create" className={styles.actionButtonSecondary}>
          <ShoppingBag className="w-4 h-4" />
          <span>Create Another</span>
        </Link>
      </div>

      {/* Order Details Grid */}
      <div className={styles.detailsGrid}>
        {/* Customer Information */}
        <div className={styles.detailsCard}>
          <h3 className={styles.cardTitle}>
            <Receipt className="w-5 h-5" />
            Customer Information
          </h3>
          <div className={styles.cardContent}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Name:</span>
              <span className={styles.infoValue} data-testid="customer-name">{customerName}</span>
            </div>
            {customerEmail && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue} data-testid="customer-email">{customerEmail}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Subscription:</span>
              <span className={styles.infoValue}>
                <span className={styles.badge} data-testid="billing-interval">
                  {billingInterval === 'WEEKLY' ? 'Weekly' : 'Monthly'} Delivery
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className={styles.detailsCard}>
          <h3 className={styles.cardTitle}>
            <Truck className="w-5 h-5" />
            Delivery Information
          </h3>
          <div className={styles.cardContent}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Next Delivery:</span>
              <span className={styles.infoValue}>{formatDate(estimatedDelivery)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Frequency:</span>
              <span className={styles.infoValue}>
                Every {billingInterval === 'WEEKLY' ? 'week' : 'month'}
              </span>
            </div>
            {deliveryAddress && (
              <div className={styles.addressSection}>
                <span className={styles.infoLabel}>
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Delivery Address:
                </span>
                <div className={styles.addressBlock}>
                  {deliveryAddress.line1 && <p>{deliveryAddress.line1}</p>}
                  {deliveryAddress.line2 && <p>{deliveryAddress.line2}</p>}
                  {(deliveryAddress.city || deliveryAddress.state) && (
                    <p>
                      {deliveryAddress.city}
                      {deliveryAddress.city && deliveryAddress.state && ', '}
                      {deliveryAddress.state} {deliveryAddress.postal_code}
                    </p>
                  )}
                  {deliveryAddress.country && <p>{deliveryAddress.country}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        {paymentMethod && (
          <div className={styles.detailsCard}>
            <h3 className={styles.cardTitle}>
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h3>
            <div className={styles.cardContent}>
              <div className={styles.paymentMethod}>
                <CreditCard className="w-5 h-5" />
                <span>
                  {paymentMethod.brand || 'Card'} ending in {paymentMethod.last4 || '****'}
                </span>
              </div>
              <p className={styles.paymentNote}>
                You will be charged {billingInterval === 'WEEKLY' ? 'weekly' : 'monthly'} on this card
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className={styles.itemsSection}>
        {items.length > 0 && (
          <>
            <h3 className={styles.sectionTitle}>Your Selected Dishes</h3>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item.id} className={styles.orderItem}>
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className={styles.itemImage}
                    />
                  )}
                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <p className={styles.itemQuantity}>Quantity: {item.quantity}</p>
                  </div>
                  <div className={styles.itemPrice}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Order Summary - Always show */}
        <div className={styles.orderSummary}>
          <div className={styles.summaryRow}>
            <span>Subtotal:</span>
            <span data-testid="subtotal">{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Delivery Fee:</span>
            <span data-testid="delivery-fee">{formatCurrency(deliveryFee)}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total per {billingInterval === 'WEEKLY' ? 'week' : 'month'}:</span>
            <span data-testid="total">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className={styles.nextSteps}>
        <h3 className={styles.nextStepsTitle}>What&apos;s Next?</h3>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Clock className="w-6 h-6" />
            </div>
            <h4>Confirmation Email</h4>
            <p>Check your email for order details and receipt</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Package className="w-6 h-6" />
            </div>
            <h4>Order Preparation</h4>
            <p>We&apos;ll start preparing your delicious Nigerian meals</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Truck className="w-6 h-6" />
            </div>
            <h4>Delivery</h4>
            <p>Your first delivery arrives on {formatDate(estimatedDelivery)}</p>
          </div>
        </div>
      </div>

      {/* Footer Message */}
      <div className={styles.footerMessage}>
        <p>
          Need help? Contact our support team at{' '}
          <a href="mailto:support@osassykitchen.com" className={styles.supportLink}>
            support@osassykitchen.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmation;