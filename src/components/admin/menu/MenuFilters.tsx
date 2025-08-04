import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { MenuItemFilters, MenuCategory } from '@/types/admin';

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

  const hasActiveFilters = filters.search || filters.category || filters.availability;

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit
    });
  };

  return (
    <div className="filter-section" style={{
      background: 'var(--card)',
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <form onSubmit={handleSubmit}>
        <div className="grid filter-grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Search Items
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={filters.search || ''}
                onChange={(e) => handleInputChange('search', e.target.value)}
                className="filter-input w-full pl-10 pr-4 py-2"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: 'var(--input)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="filter-input w-full"
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Availability
            </label>
            <select
              value={filters.availability || ''}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              className="filter-input w-full"
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontWeight: '600',
                transition: 'background 0.2s',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary inline-flex items-center justify-center gap-2"
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontWeight: '600',
                  transition: 'background 0.2s',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Search: &ldquo;{filters.search}&rdquo;
                <button
                  onClick={() => handleInputChange('search', '')}
                  className="hover:text-red-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {CATEGORIES.find(c => c.value === filters.category)?.label}
                <button
                  onClick={() => handleInputChange('category', '')}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.availability && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {AVAILABILITY_OPTIONS.find(o => o.value === filters.availability)?.label}
                <button
                  onClick={() => handleInputChange('availability', '')}
                  className="hover:text-green-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
