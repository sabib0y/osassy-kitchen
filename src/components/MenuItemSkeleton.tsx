/**
 * MenuItemSkeleton Component
 * Loading skeleton for menu items to provide better UX during data fetching
 */

import React from 'react';
import styles from '@/styles/components/subscription-create.module.css';

interface MenuItemSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Individual skeleton card
 */
const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${styles.dishCard} ${styles.dishCardSkeleton} ${className || ''}`}>
    <div className={styles.dishCardImageContainer}>
      <div className={`${styles.skeletonImage} skeleton-pulse`} />
      <div className={`${styles.heartLike} skeleton-pulse`} />
    </div>
    <div className={styles.dishCardContent}>
      <div className={`${styles.skeletonTitle} skeleton-pulse`} />
      <div className={`${styles.skeletonDescription} skeleton-pulse`} />
      <div className={`${styles.skeletonDescription} skeleton-pulse`} style={{ width: '80%' }} />
      <div className={styles.dishPriceSection}>
        <div className={`${styles.skeletonPrice} skeleton-pulse`} />
        <div className={styles.quantityControls}>
          <div className={`${styles.skeletonBtn} skeleton-pulse`} />
          <div className={`${styles.skeletonQuantity} skeleton-pulse`} />
          <div className={`${styles.skeletonBtn} skeleton-pulse`} />
        </div>
      </div>
      <div className={`${styles.skeletonButton} skeleton-pulse`} />
    </div>
  </div>
);

/**
 * Loading skeleton component for menu items
 * Displays animated placeholders while data is being fetched
 * 
 * @param count - Number of skeleton cards to display (default: 6)
 * @param className - Additional CSS classes for the container
 */
const MenuItemSkeleton: React.FC<MenuItemSkeletonProps> = ({ 
  count = 6,
  className 
}) => {
  return (
    <div className={`${styles.dishesGrid} ${className || ''}`}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={`skeleton-${index}`} />
      ))}
    </div>
  );
};

/**
 * Skeleton for the summary panel while loading
 */
export const SummaryPanelSkeleton: React.FC = () => (
  <div className={styles.summaryPanel}>
    <div className={styles.summaryHeader}>
      <div className={`${styles.skeletonTitle} skeleton-pulse`} style={{ width: '150px' }} />
    </div>
    <div className={styles.summaryItems}>
      <div className={styles.emptySummary}>
        <div className={`skeleton-pulse`} style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '50%',
          backgroundColor: '#f0f0f0',
          margin: '0 auto 12px'
        }} />
        <div className={`skeleton-pulse`} style={{ 
          width: '200px', 
          height: '16px',
          backgroundColor: '#f0f0f0',
          margin: '0 auto 8px',
          borderRadius: '4px'
        }} />
        <div className={`skeleton-pulse`} style={{ 
          width: '150px', 
          height: '14px',
          backgroundColor: '#f0f0f0',
          margin: '0 auto',
          borderRadius: '4px'
        }} />
      </div>
    </div>
  </div>
);

/**
 * Inline skeleton loading animation styles
 */
export const SkeletonStyles: React.FC = () => (
  <style jsx global>{`
    @keyframes skeleton-loading {
      0% {
        background-color: #f0f0f0;
      }
      50% {
        background-color: #e0e0e0;
      }
      100% {
        background-color: #f0f0f0;
      }
    }

    .skeleton-pulse {
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .${styles.dishCardSkeleton} {
      pointer-events: none;
      user-select: none;
    }

    .${styles.skeletonImage} {
      width: 100%;
      height: 200px;
      background-color: #f0f0f0;
      border-radius: 8px;
    }

    .${styles.skeletonTitle} {
      width: 70%;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .${styles.skeletonDescription} {
      width: 100%;
      height: 14px;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .${styles.skeletonPrice} {
      width: 80px;
      height: 24px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }

    .${styles.skeletonBtn} {
      width: 32px;
      height: 32px;
      background-color: #f0f0f0;
      border-radius: 50%;
    }

    .${styles.skeletonQuantity} {
      width: 24px;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }

    .${styles.skeletonButton} {
      width: 100%;
      height: 40px;
      background-color: #f0f0f0;
      border-radius: 8px;
      margin-top: 12px;
    }
  `}</style>
);

export default MenuItemSkeleton;