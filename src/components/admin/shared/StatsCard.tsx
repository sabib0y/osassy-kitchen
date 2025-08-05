import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from '@/styles/components/admin/menu.module.scss';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = '' 
}: StatsCardProps) {
  // Determine icon style based on title
  const getIconClass = () => {
    if (title.toLowerCase().includes('available')) return styles.available;
    if (title.toLowerCase().includes('categories')) return styles.categories;
    if (title.toLowerCase().includes('price')) return styles.price;
    return '';
  };

  return (
    <div className={`${styles.statsCard} ${className}`}>
      <div className={styles.statsCardContent}>
        <div className={styles.statsInfo}>
          <p className={styles.statsTitle}>
            {title}
          </p>
          <p className={styles.statsValue}>
            {typeof value === 'number' && value > 999 
              ? value.toLocaleString() 
              : value
            }
          </p>
          {trend && (
            <p className={`${styles.statsTrend} ${
              trend.isPositive !== false ? styles.positive : styles.negative
            }`}>
              <span>
                {trend.isPositive !== false ? '+' : ''}
                {trend.value}
              </span>
              <span className={styles.trendLabel}>{trend.label}</span>
            </p>
          )}
        </div>
        <div className={`${styles.statsIcon} ${getIconClass()}`}>
          <Icon />
        </div>
      </div>
    </div>
  );
}
