import React from 'react';
import { Clock, Truck, CheckCircle, DollarSign } from 'lucide-react';
import { useOrderStats } from '@/hooks/admin/useOrders';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import styles from '@/styles/components/admin/orders.module.scss';

export default function OrderStats() {
  const { data: stats, isLoading, error, refetch } = useOrderStats();

  if (isLoading) {
    return (
      <div className={styles.statsGrid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.statsCard}>
            <LoadingSpinner size="sm" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load order statistics"
        onRetry={() => refetch()}
        className="mb-6"
      />
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statsCard}>
        <div className={`${styles.statsIcon} ${styles.pending}`}>
          <Clock size={24} />
        </div>
        <div className={styles.statsContent}>
          <div className={styles.statsLabel}>Pending Orders</div>
          <div className={styles.statsValue}>{stats.pending}</div>
        </div>
      </div>

      <div className={styles.statsCard}>
        <div className={`${styles.statsIcon} ${styles.inProgress}`}>
          <Truck size={24} />
        </div>
        <div className={styles.statsContent}>
          <div className={styles.statsLabel}>In Progress</div>
          <div className={styles.statsValue}>{stats.inProgress}</div>
        </div>
      </div>

      <div className={styles.statsCard}>
        <div className={`${styles.statsIcon} ${styles.delivered}`}>
          <CheckCircle size={24} />
        </div>
        <div className={styles.statsContent}>
          <div className={styles.statsLabel}>Delivered Today</div>
          <div className={styles.statsValue}>{stats.delivered}</div>
        </div>
      </div>

      <div className={styles.statsCard}>
        <div className={`${styles.statsIcon} ${styles.revenue}`}>
          <DollarSign size={24} />
        </div>
        <div className={styles.statsContent}>
          <div className={styles.statsLabel}>Revenue Today</div>
          <div className={styles.statsValue}>₦{stats.revenueToday.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
