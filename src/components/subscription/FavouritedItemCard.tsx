/**
 * FavouritedItemCard component
 * Card displaying a favourited menu item with quantity and frequency controls
 */

import React from 'react';
import { MenuItem } from '@/types/admin';
import { SubscriptionCartItem } from '@/types/user';
import FrequencySelector from './FrequencySelector';
import { Plus, Minus, Trash2 } from 'lucide-react';
import styles from '@/styles/components/subscription/favouritedItemCard.module.scss';

interface FavouritedItemCardProps {
  item: MenuItem;
  cartItem: SubscriptionCartItem | null;
  onQuantityChange: (menuItemId: string, newQuantity: number) => void;
  onFrequencyChange: (menuItemId: string, frequency: 'weekly' | 'biweekly' | 'monthly') => void;
  onRemove: (menuItemId: string) => void;
}

const FavouritedItemCard: React.FC<FavouritedItemCardProps> = ({
  item,
  cartItem,
  onQuantityChange,
  onFrequencyChange,
  onRemove,
}) => {
  const quantity = cartItem?.quantity || 1;
  const frequency = cartItem?.frequency || 'weekly';

  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(item.id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(item.id, quantity + 1);
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  return (
    <div className={styles.card} data-testid="favourited-item-card">
      {/* Left: Square image */}
      <div className={styles.imageContainer}>
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1633237308525-a7fa7d67e41f?w=300&h=300&fit=crop&crop=center'}
          alt={item.name}
          className={styles.image}
          loading="lazy"
        />
      </div>

      {/* Right: Stacked content */}
      <div className={styles.content}>
        {/* Row 1: Title */}
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{item.name}</h3>
        </div>

        {/* Row 2: Teaser/Description */}
        <div className={styles.teaserRow}>
          <p className={styles.description}>{item.description || 'Delicious Nigerian cuisine'}</p>
        </div>

        {/* Row 3: Price + Quantity + Remove */}
        <div className={styles.controlsRow}>
          <div className={styles.priceSection}>
            <span className={styles.price}>£{item.price.toFixed(2)}</span>
          </div>

          <div className={styles.quantityButtons}>
            <button
              className={styles.quantityButton}
              onClick={handleDecrease}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              data-testid="decrease-quantity"
            >
              <Minus size={16} />
            </button>
            <span className={styles.quantityDisplay} data-testid="quantity-display">
              {quantity}
            </span>
            <button
              className={styles.quantityButton}
              onClick={handleIncrease}
              aria-label="Increase quantity"
              data-testid="increase-quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            className={styles.removeButton}
            onClick={handleRemove}
            aria-label="Remove from subscription"
            data-testid="remove-button"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FavouritedItemCard;
