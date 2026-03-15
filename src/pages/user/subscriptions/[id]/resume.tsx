/**
 * Subscription Resume Page
 * Allows users to resume a paused subscription by selecting a new delivery schedule
 */

import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Play } from 'lucide-react';
import UserLayout from '@/components/user/UserLayout';
import { SubscriptionResponse } from '@/lib/api-types';
import styles from '@/styles/pages/subscriptionResume.module.scss';

interface ResumePageProps {
  subscriptionId: string;
}

interface DeliverySlot {
  day: string;
  timeSlots: string[];
}

const DELIVERY_SLOTS: DeliverySlot[] = [
  { day: 'Monday', timeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'] },
  { day: 'Tuesday', timeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'] },
  { day: 'Wednesday', timeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'] },
  { day: 'Thursday', timeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'] },
  { day: 'Friday', timeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'] },
  { day: 'Saturday', timeSlots: ['10:00 AM - 1:00 PM', '1:00 PM - 4:00 PM'] },
];

const ResumePage: React.FC<ResumePageProps> = ({ subscriptionId }) => {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');

  useEffect(() => {
    fetchSubscription();
  }, [subscriptionId]);

  useEffect(() => {
    // Set minimum start date to next week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    setStartDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();

      // Check if subscription is paused
      if (data.subscription.status !== 'PAUSED') {
        router.push(`/user/subscriptions/${subscriptionId}`);
        return;
      }

      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getMinStartDate = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  const getAvailableTimeSlots = () => {
    const slot = DELIVERY_SLOTS.find(s => s.day === selectedDay);
    return slot?.timeSlots || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDay || !selectedTimeSlot || !startDate) {
      setError('Please fill in all delivery details');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Resume subscription with new delivery schedule
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resume',
          deliveryDetails: {
            preferredDay: selectedDay,
            preferredTimeSlot: selectedTimeSlot,
            nextDeliveryDate: startDate,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resume subscription');
      }

      // Redirect to subscription details with success message
      router.push(`/user/subscriptions/${subscriptionId}?resumed=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <UserLayout pageTitle="Resume Subscription - Osassy's Kitchen" activeTab="subscriptions">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading subscription...</p>
        </div>
      </UserLayout>
    );
  }

  if (error && !subscription) {
    return (
      <UserLayout pageTitle="Resume Subscription - Osassy's Kitchen" activeTab="subscriptions">
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <Link href="/user/subscriptions" className={styles.backLink}>
            Back to Subscriptions
          </Link>
        </div>
      </UserLayout>
    );
  }

  if (!subscription) {
    return null;
  }

  const totalItems = (subscription.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Head>
        <title>Resume Subscription - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Resume your meal subscription" />
      </Head>

      <UserLayout pageTitle="Resume Subscription" activeTab="subscriptions">
        <div className={styles.resumePage}>
          {/* Back Link */}
          <Link href="/user/subscriptions" className={styles.backLink}>
            <ArrowLeft size={20} />
            Back to Subscriptions
          </Link>

          {/* Header */}
          <div className={styles.header}>
            <h1>Resume Your Subscription</h1>
            <p>Select a new delivery schedule to restart your meal plan</p>
          </div>

          {/* Subscription Summary */}
          <div className={styles.subscriptionSummary}>
            <h2>Subscription Summary</h2>
            <div className={styles.summaryContent}>
              <div className={styles.summaryItem}>
                <span className={styles.label}>Plan</span>
                <span className={styles.value}>{subscription.planName}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.label}>Items</span>
                <span className={styles.value}>{totalItems} items per delivery</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.label}>Price</span>
                <span className={styles.value}>
                  {formatCurrency(subscription.price)}/{subscription.interval.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Items Preview */}
            <div className={styles.itemsPreview}>
              <h3>Your Meals</h3>
              <div className={styles.itemsList}>
                {(subscription.items || []).map(item => (
                  <div key={item.id} className={styles.itemTag}>
                    {item.quantity}x {item.menuItem.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Schedule Form */}
          <form onSubmit={handleSubmit} className={styles.deliveryForm}>
            <h2>Choose Your Delivery Schedule</h2>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Start Date */}
            <div className={styles.formGroup}>
              <label htmlFor="startDate">
                <Calendar size={18} />
                First Delivery Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                min={getMinStartDate()}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <p className={styles.hint}>
                Please allow at least 7 days for the chef to prepare your meals
              </p>
            </div>

            {/* Preferred Day */}
            <div className={styles.formGroup}>
              <label>
                <MapPin size={18} />
                Preferred Delivery Day
              </label>
              <div className={styles.daySelector}>
                {DELIVERY_SLOTS.map(slot => (
                  <button
                    key={slot.day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(slot.day);
                      setSelectedTimeSlot('');
                    }}
                    className={`${styles.dayButton} ${selectedDay === slot.day ? styles.selected : ''}`}
                  >
                    {slot.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot */}
            {selectedDay && (
              <div className={styles.formGroup}>
                <label>
                  <Clock size={18} />
                  Preferred Time Slot
                </label>
                <div className={styles.timeSlotSelector}>
                  {getAvailableTimeSlots().map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`${styles.timeSlotButton} ${selectedTimeSlot === slot ? styles.selected : ''}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !selectedDay || !selectedTimeSlot || !startDate}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Resuming...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Resume Subscription
                </>
              )}
            </button>
          </form>
        </div>
      </UserLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { id } = context.params as { id: string };

  return {
    props: {
      subscriptionId: id,
    },
  };
};

export default ResumePage;
