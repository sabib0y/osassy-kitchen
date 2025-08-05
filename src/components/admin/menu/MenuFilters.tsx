import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { MenuItemFilters, MenuCategory } from '@/types/admin';
import styles from '@/styles/components/admin/menu.module.scss';

interface MenuFiltersProps {
  filters: MenuItemFilters;
  onFiltersChange: (filters: MenuItemFilters) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
}

const CATEGORIES: { value: MenuCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'main-dishes', label: 'Main Dishes' },
  { value: 'soups', label: 'Soups' },
  { value: 'rice-dishes', label: 'Rice Dishes' },
  { value: 'grilled', label: 'Grilled Items' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'appetizers', label: 'Appetizers' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'sides', label: 'Sides' }
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All Items' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' }
];

export default function MenuFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  isLoading = false
}: MenuFiltersProps) {
  const handleInputChange = (key: keyof MenuItemFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
      page: 1 // Reset to first page when filters change
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters();
  };

  return (
    <div className={`${styles.menuManagement} ${styles.filtersSection}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.filterGrid}>
          {/* Search Input */}
          <div className={styles.filterGroup}>
            <label>Search Items</label>
            <input
              type="text"
              placeholder="Search menu items..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.filterGroup}>
            <label>Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className={styles.filterGroup}>
            <label>Availability</label>
            <select
              value={filters.availability || ''}
              onChange={(e) => handleInputChange('availability', e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Apply Button */}
          <div className={styles.filterGroup}>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}