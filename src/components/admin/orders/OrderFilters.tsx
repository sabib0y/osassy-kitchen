import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { OrderFilters as OrderFiltersType } from '@/types/admin';
import styles from '@/styles/components/admin/orders.module.scss';

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
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleInputChange = (key: keyof OrderFiltersType, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined,
    };
    onFiltersChange(newFilters);

    // Auto-apply filters after debounce (except for search which handles its own debounce)
    if (key !== 'search') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onApplyFilters();
      }, 300);
    }
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });

    // Debounce search input
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onApplyFilters();
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.filtersCard}>
      <div className={styles.filtersRow}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search orders..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Status */}
        <select
          value={filters.status || ''}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Date From */}
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleInputChange('dateFrom', e.target.value)}
          className={styles.dateInput}
          placeholder="From"
        />

        {/* Date To */}
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => handleInputChange('dateTo', e.target.value)}
          className={styles.dateInput}
          placeholder="To"
        />

        {/* Loading indicator */}
        {isLoading && (
          <span className={styles.filteringText}>Filtering...</span>
        )}
      </div>
    </div>
  );
}
