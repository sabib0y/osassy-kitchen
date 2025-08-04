import React from 'react';
import { Utensils, CheckCircle, Grid3X3, DollarSign } from 'lucide-react';
import { useMenuStats } from '@/hooks/admin/useMenu';
import StatsCard from '@/components/admin/shared/StatsCard';
import { PageLoading } from '@/components/admin/shared/LoadingSpinner';

export default function MenuStats() {
  const { data: stats, isLoading, error } = useMenuStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Failed to load menu statistics</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const statsData = [
    {
      title: 'Total Items',
      value: stats.totalItems.toString(),
      icon: Utensils
    },
    {
      title: 'Available',
      value: stats.availableItems.toString(),
      icon: CheckCircle
    },
    {
      title: 'Categories',
      value: stats.totalCategories.toString(),
      icon: Grid3X3
    },
    {
      title: 'Avg Price',
      value: formatPrice(stats.averagePrice),
      icon: DollarSign
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statsData.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}
