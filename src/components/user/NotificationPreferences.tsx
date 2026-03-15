import React, { useState, useEffect } from 'react';
import { NotificationPreferences } from '../../types/user';
import styles from '../../styles/components/user/profile.module.scss';

interface NotificationPreferencesProps {
  preferences: NotificationPreferences | undefined;
  onUpdate: () => void;
}

const NotificationPreferencesComponent: React.FC<NotificationPreferencesProps> = ({ 
  preferences, 
  onUpdate 
}) => {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggle = (
    category: 'emailNotifications',
    setting: string,
    value: boolean
  ) => {
    if (!localPreferences) return;

    setLocalPreferences({
      ...localPreferences,
      [category]: {
        ...localPreferences[category],
        [setting]: value
      }
    });
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      setMessage({ type: 'success', text: 'Notification preferences updated successfully!' });
      onUpdate();
    } catch (error) {
      console.error('Notification preferences update error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update notification preferences' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!localPreferences) {
    return (
      <div className={styles.notificationPreferences}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading notification preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.notificationPreferences}>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{message.text}</span>
        </div>
      )}

      <div className={styles.notificationSections}>
        {/* Email Notifications */}
        <div className={styles.notificationSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <i className="fas fa-envelope"></i>
            </div>
            <div className={styles.sectionInfo}>
              <h3>Email Notifications</h3>
              <p>Receive updates via email about your orders and account.</p>
            </div>
          </div>

          <div className={styles.notificationList}>
            <div className={styles.notificationItem}>
              <div className={styles.itemInfo}>
                <label htmlFor="emailOrderConfirmation">Order Confirmation</label>
                <small>Get notified when your order is confirmed</small>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  id="emailOrderConfirmation"
                  type="checkbox"
                  checked={localPreferences.emailNotifications.orderConfirmation}
                  onChange={(e) => handleToggle('emailNotifications', 'orderConfirmation', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.itemInfo}>
                <label htmlFor="emailOrderStatus">Order Status Updates</label>
                <small>Get updates when your order status changes</small>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  id="emailOrderStatus"
                  type="checkbox"
                  checked={localPreferences.emailNotifications.orderStatusUpdates}
                  onChange={(e) => handleToggle('emailNotifications', 'orderStatusUpdates', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.itemInfo}>
                <label htmlFor="emailDeliveryReminders">Delivery Reminders</label>
                <small>Get reminders before your delivery arrives</small>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  id="emailDeliveryReminders"
                  type="checkbox"
                  checked={localPreferences.emailNotifications.deliveryReminders}
                  onChange={(e) => handleToggle('emailNotifications', 'deliveryReminders', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.itemInfo}>
                <label htmlFor="emailSubscriptionUpdates">Subscription Updates</label>
                <small>Get notified about subscription changes and renewals</small>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  id="emailSubscriptionUpdates"
                  type="checkbox"
                  checked={localPreferences.emailNotifications.subscriptionUpdates}
                  onChange={(e) => handleToggle('emailNotifications', 'subscriptionUpdates', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.itemInfo}>
                <label htmlFor="emailPromotions">Promotions & Offers</label>
                <small>Receive special offers and promotional emails</small>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  id="emailPromotions"
                  type="checkbox"
                  checked={localPreferences.emailNotifications.promotionsAndOffers}
                  onChange={(e) => handleToggle('emailNotifications', 'promotionsAndOffers', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.notificationItem}>
              <div className={styles.itemInfo}>
                <label htmlFor="emailNewsletter">Newsletter</label>
                <small>Stay updated with our latest news and recipes</small>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  id="emailNewsletter"
                  type="checkbox"
                  checked={localPreferences.emailNotifications.newsletter}
                  onChange={(e) => handleToggle('emailNotifications', 'newsletter', e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className={styles.notificationActions}>
        <button
          className={styles.primaryButton}
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className={styles.buttonSpinner}></div>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesComponent;