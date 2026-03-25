/**
 * MealDetailModal - Shows full meal details in a modal
 * CTA directs users to /meal-plans (not add to cart)
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Flame, Leaf, ArrowRight, ChefHat } from 'lucide-react';
import styles from '@/styles/components/meals/mealDetailModal.module.scss';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  imageUrl?: string | null;
}

interface MealDetailModalProps {
  meal: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const MealDetailModal: React.FC<MealDetailModalProps> = ({ meal, isOpen, onClose }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !meal) return null;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Rice': '🍚',
      'Stew': '🍲',
      'Soup': '🥘',
      'Specials': '⭐',
      'Drinks': '🥤',
      'Sides': '🥗',
      'Desserts': '🍰',
      'Light Meals': '🥗'
    };
    return icons[category] || '🍽️';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-title"
      >
        {/* Close Button */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Image Section */}
        <div className={styles.imageSection}>
          {meal.imageUrl ? (
            <img src={meal.imageUrl} alt={meal.name} className={styles.mealImage} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <ChefHat size={64} />
              <span className={styles.categoryEmoji}>{getCategoryIcon(meal.category)}</span>
            </div>
          )}

          {/* Tags Overlay */}
          <div className={styles.tagsOverlay}>
            {meal.isSpicy && (
              <span className={`${styles.tag} ${styles.spicy}`}>
                <Flame size={14} />
                Spicy
              </span>
            )}
            {meal.isVegetarian && (
              <span className={`${styles.tag} ${styles.vegetarian}`}>
                <Leaf size={14} />
                Vegetarian
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.category}>{meal.category}</span>
            <h2 id="meal-title" className={styles.title}>{meal.name}</h2>
            <span className={styles.price}>£{meal.price.toFixed(2)}</span>
          </div>

          {meal.description && (
            <div className={styles.description}>
              <h3>About This Dish</h3>
              <p>{meal.description}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className={styles.info}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Category</span>
              <span className={styles.infoValue}>
                {getCategoryIcon(meal.category)} {meal.category}
              </span>
            </div>
            {meal.isSpicy && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Spice Level</span>
                <span className={styles.infoValue}>
                  <Flame size={16} className={styles.spicyIcon} />
                  Spicy
                </span>
              </div>
            )}
            {meal.isVegetarian && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Dietary</span>
                <span className={styles.infoValue}>
                  <Leaf size={16} className={styles.vegIcon} />
                  Vegetarian
                </span>
              </div>
            )}
          </div>

          {/* Availability Notice */}
          {!meal.available && (
            <div className={styles.unavailableNotice}>
              <span>This dish is currently unavailable</span>
            </div>
          )}

          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <p className={styles.ctaText}>
              Want this dish in your weekly meal plan?
            </p>
            <Link href="/our-process" className={styles.ctaButton}>
              Subscribe to Get This Dish
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealDetailModal;
