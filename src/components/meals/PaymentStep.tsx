import React from 'react';
import { ArrowLeft, Lock, CreditCard, MapPin, Calendar, Utensils } from 'lucide-react';
import { MealPlan, SelectedMeal, DeliveryDetails } from '../../types/meal-plans';
import styles from '../../styles/components/meals/paymentStep.module.scss';

interface PaymentStepProps {
  plan: MealPlan;
  meals: SelectedMeal[];
  deliveryDetails: DeliveryDetails;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  plan,
  meals,
  deliveryDetails,
  onConfirm,
  onBack,
  isLoading,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Review Your Order</h2>
        <p className={styles.subtitle}>Check everything looks good before confirming</p>
      </div>

      <div className={styles.content}>
        {/* Plan Summary */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Utensils size={20} className={styles.sectionIcon} />
            Your Plan
          </h3>
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div className={styles.planInfo}>
                <h4 className={styles.planName}>{plan.name}</h4>
                {plan.description && (
                  <p className={styles.planDescription}>{plan.description}</p>
                )}
              </div>
              <div className={styles.planPricing}>
                <span className={styles.planPrice}>
                  £{plan.pricePerWeek.toFixed(2)}
                </span>
                <span className={styles.pricePeriod}>per week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Meals */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.mealCount}>{meals.length} meals selected</span>
          </h3>
          <div className={styles.mealsList}>
            {meals.map((meal) => (
              <div key={meal.id} className={styles.mealItem}>
                {meal.imageUrl && (
                  <img
                    src={meal.imageUrl}
                    alt={meal.name}
                    className={styles.mealImage}
                  />
                )}
                <div className={styles.mealDetails}>
                  <h4 className={styles.mealName}>{meal.name}</h4>
                  <p className={styles.mealDescription}>{meal.description}</p>
                  <span className={styles.mealCategory}>{meal.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Summary */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <MapPin size={20} className={styles.sectionIcon} />
            Delivery Details
          </h3>
          <div className={styles.deliveryCard}>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryLabel}>Address</span>
              <div className={styles.deliveryValue}>
                <p>{deliveryDetails.address}</p>
                <p>{deliveryDetails.city}, {deliveryDetails.postcode}</p>
              </div>
            </div>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryLabel}>Phone</span>
              <span className={styles.deliveryValue}>{deliveryDetails.phone}</span>
            </div>
            <div className={styles.deliveryRow}>
              <span className={styles.deliveryLabel}>
                <Calendar size={16} className={styles.inlineIcon} />
                Delivery Day
              </span>
              <span className={styles.deliveryValue}>{deliveryDetails.preferredDay}</span>
            </div>
            {deliveryDetails.instructions && (
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryLabel}>Instructions</span>
                <span className={styles.deliveryValue}>{deliveryDetails.instructions}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className={styles.priceSection}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Weekly Total</span>
            <span className={styles.priceValue}>£{plan.pricePerWeek.toFixed(2)}</span>
          </div>
          <p className={styles.priceNote}>
            Your subscription will renew weekly. You can pause or cancel anytime from your dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Processing...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Confirm Subscription
              </>
            )}
          </button>
        </div>

        <div className={styles.secureNote}>
          <Lock size={14} />
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
