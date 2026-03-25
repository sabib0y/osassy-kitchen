/**
 * EmptyFavourites component
 * Displays when user has no favourited menu items
 */

import React from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/components/subscription/emptyFavourites.module.scss';

const EmptyFavourites: React.FC = () => {
  const router = useRouter();

  const handleBrowseMeals = () => {
    router.push('/meals');
  };

  return (
    <div className={styles.emptyFavourites} data-testid="empty-favourites">
      <div className={styles.iconContainer}>
        <svg
          data-testid="heart-icon"
          className={styles.heartIcon}
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      <h2 className={styles.title}>No Favourites Yet</h2>

      <p className={styles.description}>
        Browse our menu and heart your favourite dishes to create your custom subscription plan.
      </p>

      <button
        className={styles.browseButton}
        onClick={handleBrowseMeals}
        type="button"
      >
        Browse Meals
      </button>
    </div>
  );
};

export default EmptyFavourites;
