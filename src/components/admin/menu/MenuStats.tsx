import React from 'react';
import { Utensils, CheckCircle, Grid3X3, DollarSign } from 'lucide-react';
import { useMenuStats } from '@/hooks/admin/useMenu';
import StatsCard from '@/components/admin/shared/StatsCard';
import { PageLoading } from '@/components/admin/shared/LoadingSpinner';
import styles from '@/styles/components/admin/menu.module.scss';

export default function MenuStats() {
  const { data: stats, isLoading, error } = useMenuStats();

  if (isLoading) {
    return (
      <div className={styles.statsLoadingGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statsSkeletonCard}>
            <div className={styles.statsSkeletonContent}>
              <div className={styles.statsSkeletonText}>
                <div className={styles.statsSkeletonTitle}></div>
                <div className={styles.statsSkeletonValue}></div>
              </div>
              <div className={styles.statsSkeletonIcon}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.statsErrorContainer}>
        <div className={styles.statsErrorMessage}>
          <p>Failed to load menu statistics</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const statsData = [
    {
      title: 'Total Items',
      value: stats.totalItems.toString(),
      icon: Utensils
    },
    {
      title: 'Available',
      value: stats.availableItems.toString(),
      icon: CheckCircle
    },
    {
      title: 'Categories',
      value: stats.totalCategories.toString(),
      icon: Grid3X3
    },
    {
      title: 'Avg Price',
      value: formatPrice(stats.averagePrice),
      icon: DollarSign
    }
  ];

  return (
    <div className={styles.statsGrid}>
      {statsData.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}
