import React, { useState } from 'react';
import { Edit2, Trash2, ToggleLeft, ToggleRight, ImageIcon } from 'lucide-react';
import { MenuItem } from '../../../types/admin';
import styles from '@/styles/components/admin/menu.module.scss';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}

// Sample image URLs for demonstration (fallback when no image is uploaded)
const foodImages: Record<string, string> = {
  'jollof-rice': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=200&fit=crop',
  'egusi-soup': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=200&fit=crop',
  'grilled-chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=200&fit=crop',
  'pounded-yam': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=200&fit=crop',
  'nkwobi': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&h=200&fit=crop',
  'chapman': 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400&h=200&fit=crop',
  'default': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=200&fit=crop'
};

export default function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability
}: MenuItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatPrice = (price: number) => {
    return `£${price.toLocaleString()}`;
  };

  // Get image URL based on item name or use default
  const getFallbackImageUrl = (name: string) => {
    const key = name.toLowerCase().replace(/\s+/g, '-');
    return foodImages[key] || foodImages.default;
  };

  // Determine which image to display
  const getDisplayImage = () => {
    // Use uploaded thumbnail if available
    if (item.thumbnailUrl && !imageError) {
      return item.thumbnailUrl;
    }
    // Fall back to main image URL
    if (item.imageUrl && !imageError) {
      return item.imageUrl;
    }
    // Fall back to sample images
    return getFallbackImageUrl(item.name);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <div className={styles.menuItemCard}>
      {/* Image */}
      <div className={styles.imageContainer}>
        {imageLoading && (
          <div className={styles.imageLoading}>
            <ImageIcon size={32} className={styles.loadingIcon} />
          </div>
        )}
        <img
          src={getDisplayImage()}
          alt={item.name}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoading ? 'none' : 'block' }}
        />
        {/* Availability Badge - Overlay on image */}
        <span className={`${styles.availabilityBadge} ${item.available ? styles.available : styles.unavailable}`}>
          {item.available ? 'Available' : 'Unavailable'}
        </span>
        {/* Image Source Indicator */}
        {item.imageUrl && !imageError && (
          <div className={styles.imageSource} title="Custom image uploaded">
            <ImageIcon size={14} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        {/* Title */}
        <div className={styles.cardHeader}>
          <h3>{item.name}</h3>
        </div>

        {/* Description */}
        <p className={styles.description}>
          {item.description}
        </p>

        {/* Price and Usage */}
        <div className={styles.priceRow}>
          <span className={styles.price}>
            {formatPrice(item.price)}
          </span>
          <span className={styles.usageBadge}>
            Used in {Math.floor(Math.random() * 20 + 1)} subscriptions
          </span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={onEdit}
            className={styles.editBtn}
          >
            <Edit2 size={14} />
            Edit
          </button>
          
          <button
            onClick={onToggleAvailability}
            className={styles.toggleBtn}
            title={item.available ? 'Make Unavailable' : 'Make Available'}
          >
            {item.available ? (
              <ToggleRight size={16} />
            ) : (
              <ToggleLeft size={16} />
            )}
          </button>
          
          <button
            onClick={onDelete}
            className={styles.deleteBtn}
            title="Delete Item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}