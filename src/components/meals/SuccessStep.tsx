import React from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Calendar, Settings, Utensils, Mail, Clock } from 'lucide-react';
import styles from '../../styles/components/meals/successStep.module.scss';

interface SuccessStepProps {
  onBrowseMore?: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ onBrowseMore }) => {
  const router = useRouter();

  const handleManagePlan = () => {
    router.push('/user/subscriptions');
  };

  const handleBrowseMeals = () => {
    if (onBrowseMore) {
      onBrowseMore();
    } else {
      router.push('/meals');
    }
  };

  // Calculate estimated first delivery date (next week from today)
  const getEstimatedDeliveryDate = (): string => {
    const today = new Date();
    const daysToAdd = 7;
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + daysToAdd);

    return deliveryDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className={styles.container}>
      {/* Success Icon */}
      <div className={styles.successIcon} data-testid="success-icon">
        <CheckCircle size={80} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h1 className={styles.title}>
        You're all set! <span className={styles.celebration}>🎉</span>
      </h1>

      <p className={styles.message}>
        Your subscription has been created successfully. Get ready for delicious Nigerian meals delivered to your door!
      </p>

      {/* First Delivery Card */}
      <div className={styles.deliveryCard}>
        <div className={styles.cardIcon}>
          <Calendar size={32} />
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>First Delivery</h3>
          <p className={styles.deliveryDate}>{getEstimatedDeliveryDate()}</p>
          <p className={styles.cardSubtext}>
            <Mail size={14} />
            You'll receive a confirmation email with all the details shortly
          </p>
        </div>
      </div>

      {/* What's Next Section */}
      <div className={styles.nextSteps}>
        <h3 className={styles.nextStepsTitle}>What's Next?</h3>
        <ul className={styles.nextStepsList}>
          <li>
            <Clock size={18} className={styles.stepIcon} />
            <span>Track your deliveries in your dashboard</span>
          </li>
          <li>
            <Settings size={18} className={styles.stepIcon} />
            <span>Manage or pause your subscription anytime</span>
          </li>
          <li>
            <Utensils size={18} className={styles.stepIcon} />
            <span>Change your meal selections before each delivery</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleManagePlan}
        >
          <Settings size={18} />
          Manage My Plan
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleBrowseMeals}
        >
          <Utensils size={18} />
          Browse More Meals
        </button>
      </div>
    </div>
  );
};

export default SuccessStep;
