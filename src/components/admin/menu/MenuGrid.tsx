import React from 'react';
import { MenuItem } from '../../../types/admin';
import MenuItemCard from './MenuItemCard';
import { PageLoading } from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface MenuGridProps {
  items?: MenuItem[];
  isLoading?: boolean;
  error?: Error | null;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleAvailability: (id: string) => void;
}

export default function MenuGrid({
  items = [],
  isLoading = false,
  error,
  onEditItem,
  onDeleteItem,
  onToggleAvailability
}: MenuGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load menu items. Please try again." 
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
        <p className="text-gray-500 mb-4">
          No menu items match your current filters. Try adjusting your search criteria or add a new menu item.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={() => onEditItem(item)}
          onDelete={() => onDeleteItem(item.id)}
          onToggleAvailability={() => onToggleAvailability(item.id)}
        />
      ))}
    </div>
  );
}
