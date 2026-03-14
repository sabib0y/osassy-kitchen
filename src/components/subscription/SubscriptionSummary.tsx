/**
 * SubscriptionSummary component
 * Displays subscription cart summary with pricing calculations
 */

import React, { useMemo } from 'react';
import { SubscriptionCartItem, SubscriptionFrequency } from '@/types/user';
import { ShoppingBag, ArrowRight, Loader2, X } from 'lucide-react';
import styles from '@/styles/components/subscription/subscriptionSummary.module.scss';

interface SubscriptionSummaryProps {
  items: SubscriptionCartItem[];
  onCheckout: () => void;
  onRemoveItem: (menuItemId: string) => void;
  isLoading: boolean;
}

/**
 * Calculate weekly cost for an item based on frequency
 */
const calculateWeeklyCost = (price: number, quantity: number, frequency: SubscriptionFrequency): number => {
  const multiplier = {
    weekly: 1,
    biweekly: 0.5,
    monthly: 0.25,
  }[frequency];

  return price * quantity * multiplier;
};

/**
 * Calculate monthly cost for an item based on frequency
 */
const calculateMonthlyCost = (price: number, quantity: number, frequency: SubscriptionFrequency): number => {
  const multiplier = {
    weekly: 4,
    biweekly: 2,
    monthly: 1,
  }[frequency];

  return price * quantity * multiplier;
};

const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({
  items,
  onCheckout,
  onRemoveItem,
  isLoading,
}) => {
  const { weeklyTotal, monthlyTotal, itemCount } = useMemo(() => {
    const weeklyTotal = items.reduce(
      (sum, item) => sum + calculateWeeklyCost(item.price, item.quantity, item.frequency),
      0
    );
    const monthlyTotal = items.reduce(
      (sum, item) => sum + calculateMonthlyCost(item.price, item.quantity, item.frequency),
      0
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return { weeklyTotal, monthlyTotal, itemCount };
  }, [items]);

  const hasItems = items.length > 0;

  return (
    <div className={styles.summary} data-testid="subscription-summary">
      <div className={styles.header}>
        <h3 className={styles.title}>
          <ShoppingBag className={styles.titleIcon} />
          Your Subscription
          {hasItems && <span className={styles.itemCount}>({itemCount})</span>}
        </h3>
      </div>

      <div className={styles.content}>
        {!hasItems ? (
          <div className={styles.emptyState}>
            <ShoppingBag className={styles.emptyIcon} />
            <p className={styles.emptyText}>No items in your subscription</p>
            <p className={styles.emptySubtext}>Add favourited dishes to get started</p>
          </div>
        ) : (
          <>
            <div className={styles.itemsList}>
              {items.map((item) => {
                const weeklyItemCost = calculateWeeklyCost(item.price, item.quantity, item.frequency);
                const monthlyItemCost = calculateMonthlyCost(item.price, item.quantity, item.frequency);

                return (
                  <div key={item.id} className={styles.item} data-testid="summary-item">
                    <button
                      className={styles.removeButton}
                      onClick={() => onRemoveItem(item.menuItemId)}
                      aria-label={`Remove ${item.name}`}
                      data-testid="remove-item-button"
                    >
                      <X size={14} />
                    </button>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <span className={styles.itemQuantity}>×{item.quantity}</span>
                      </div>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemFrequency}>
                          {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
                        </span>
                        <span className={styles.itemPrice}>£{weeklyItemCost.toFixed(2)}/week</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.divider} />

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Estimated Weekly Cost:</span>
                <span className={styles.totalAmount} data-testid="weekly-total">
                  £{weeklyTotal.toFixed(2)}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Estimated Monthly Cost:</span>
                <span className={styles.totalAmount} data-testid="monthly-total">
                  £{monthlyTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className={styles.info}>
              <p className={styles.infoText}>
                Prices are estimates based on your selected frequencies. Actual costs may vary.
              </p>
            </div>

            <button
              className={styles.checkoutButton}
              onClick={onCheckout}
              disabled={isLoading}
              data-testid="checkout-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className={styles.loadingIcon} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Checkout</span>
                  <ArrowRight className={styles.arrowIcon} />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSummary;
