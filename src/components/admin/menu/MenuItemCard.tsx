import React from 'react';
import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { MenuItem } from '../../../types/admin';
import StatusBadge from '../shared/StatusBadge';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}

export default function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability
}: MenuItemCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'main-dishes': 'Main Dishes',
      'soups': 'Soups',
      'rice-dishes': 'Rice Dishes',
      'grilled': 'Grilled Items',
      'beverages': 'Beverages',
      'appetizers': 'Appetizers',
      'desserts': 'Desserts',
      'sides': 'Sides'
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="menu-item-card" style={{
      background: 'var(--card)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s'
    }}>
      {/* Image */}
      <div className="relative w-full h-48 bg-gray-200">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Availability Badge */}
        <div className="absolute top-2 right-2">
          <StatusBadge 
            status={item.available ? 'available' : 'unavailable'} 
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            {item.name}
          </h3>
          <span className="text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap" style={{ 
            color: 'var(--muted-foreground)', 
            background: 'var(--muted)',
            borderRadius: '1rem',
            fontSize: '0.7rem'
          }}>
            {getCategoryLabel(item.category)}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--secondary)' }}>
          {item.description}
        </p>

        {/* Price and Details */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
            {formatPrice(item.price)}
          </span>
          <span className="usage-badge">
            Used in {Math.floor(Math.random() * 20 + 1)} subscriptions
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="btn-secondary flex-1 inline-flex items-center justify-center gap-1"
            style={{
              background: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
              borderRadius: '0.5rem',
              padding: '0.4rem 0.75rem',
              fontWeight: '600',
              transition: 'background 0.2s',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          
          <button
            onClick={onToggleAvailability}
            className="btn-accent inline-flex items-center justify-center"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              border: 'none',
              padding: '0.4rem',
              fontSize: '0.75rem'
            }}
            title={item.available ? 'Make Unavailable' : 'Make Available'}
          >
            {item.available ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </button>
          
          <button
            onClick={onDelete}
            className="btn-destructive inline-flex items-center justify-center"
            style={{
              background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              border: 'none',
              padding: '0.4rem',
              fontSize: '0.75rem'
            }}
            title="Delete Item"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
