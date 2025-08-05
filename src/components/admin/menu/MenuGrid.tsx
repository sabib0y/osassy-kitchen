import React from 'react';
import { MenuItem } from '../../../types/admin';
import MenuItemCard from './MenuItemCard';
import { PageLoading } from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import styles from '@/styles/components/admin/menu.module.scss';

interface MenuGridProps {
  items?: MenuItem[];
  isLoading?: boolean;
  error?: Error | null;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleAvailability: (id: string) => void;
}

export default function MenuGrid({
  items = [],
  isLoading = false,
  error,
  onEditItem,
  onDeleteItem,
  onToggleAvailability
}: MenuGridProps) {
  if (isLoading) {
    return (
      <div className={styles.loadingGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonImage}></div>
            <div className={styles.skeletonContent}>
              <div className={`${styles.skeletonLine} ${styles.title}`}></div>
              <div className={`${styles.skeletonLine} ${styles.description}`}></div>
              <div className={`${styles.skeletonLine} ${styles.description}`}></div>
              <div>
                <div className={`${styles.skeletonLine} ${styles.price}`}></div>
                <div className={`${styles.skeletonLine} ${styles.usage}`}></div>
              </div>
              <div className={`${styles.skeletonLine} ${styles.button}`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load menu items. Please try again." 
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3>No menu items found</h3>
        <p>No menu items match your current filters. Try adjusting your search criteria or add a new menu item.</p>
      </div>
    );
  }

  return (
    <div className={styles.menuGrid}>
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={() => onEditItem(item)}
          onDelete={() => onDeleteItem(item.id)}
          onToggleAvailability={() => onToggleAvailability(item.id)}
        />
      ))}
    </div>
  );
}