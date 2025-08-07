import React from 'react';
import { Clock, Truck, CheckCircle, DollarSign } from 'lucide-react';
import StatsCard from '../shared/StatsCard';
import { useOrderStats } from '@/hooks/admin/useOrders';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

export default function OrderStats() {
  const { data: stats, isLoading, error, refetch } = useOrderStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <LoadingSpinner size="md" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load order statistics" 
        onRetry={() => refetch()}
        className="mb-6"
      />
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Pending Orders"
        value={stats.pending}
        icon={Clock}
      />
      
      <StatsCard
        title="In Progress"
        value={stats.inProgress}
        icon={Truck}
      />
      
      <StatsCard
        title="Delivered Today"
        value={stats.delivered}
        icon={CheckCircle}
      />
      
      <StatsCard
        title="Revenue Today"
        value={`£${stats.revenueToday.toLocaleString()}`}
        icon={DollarSign}
      />
    </div>
  );
}
