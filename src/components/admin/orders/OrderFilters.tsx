import React from 'react';
import { Search, Filter } from 'lucide-react';
import { OrderFilters as OrderFiltersType } from '@/types/admin';

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFiltersChange: (filters: OrderFiltersType) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
}

export default function OrderFilters({ 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  isLoading = false 
}: OrderFiltersProps) {
  const handleInputChange = (key: keyof OrderFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters();
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
        <div className="grid filter-grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Order #, customer name..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="filter-input w-full"
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="filter-input w-full"
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleInputChange('dateFrom', e.target.value)}
              className="filter-input w-full"
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleInputChange('dateTo', e.target.value)}
              className="filter-input w-full"
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          {/* Apply Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
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
              Apply Filters
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
