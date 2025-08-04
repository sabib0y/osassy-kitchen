import React from 'react';
import { CheckSquare, Truck, CheckCircle, X } from 'lucide-react';
import { useBulkUpdateOrders } from '@/hooks/admin/useOrders';
import { Order } from '@/types/admin';
import { ButtonLoading } from '../shared/LoadingSpinner';

interface BulkActionsProps {
  selectedOrderIds: string[];
  onClearSelection: () => void;
  onSuccess?: () => void;
}

export default function BulkActions({ 
  selectedOrderIds, 
  onClearSelection,
  onSuccess 
}: BulkActionsProps) {
  const bulkUpdateMutation = useBulkUpdateOrders();

  const handleBulkUpdate = async (status: Order['status']) => {
    try {
      await bulkUpdateMutation.mutateAsync({
        orderIds: selectedOrderIds,
        status,
      });
      onClearSelection();
      onSuccess?.();
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  if (selectedOrderIds.length === 0) {
    return null;
  }

  const isLoading = bulkUpdateMutation.isPending;

  return (
    <div className="bulk-actions active" style={{
      background: 'var(--accent)',
      color: 'var(--accent-foreground)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1rem',
      display: 'block'
    }}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          <span id="selectedCount">{selectedOrderIds.length}</span> orders selected
        </span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBulkUpdate('IN_PROGRESS')}
            disabled={isLoading}
            className="btn-secondary"
            style={{
              background: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontWeight: '600',
              transition: 'background 0.2s',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? <ButtonLoading /> : <Truck className="w-4 h-4" />}
            Mark In Progress
          </button>
          
          <button
            onClick={() => handleBulkUpdate('DELIVERED')}
            disabled={isLoading}
            className="btn-primary"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontWeight: '600',
              transition: 'background 0.2s',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? <ButtonLoading /> : <CheckCircle className="w-4 h-4" />}
            Mark Delivered
          </button>
          
          <button
            onClick={() => handleBulkUpdate('CANCELLED')}
            disabled={isLoading}
            className="btn-destructive"
            style={{
              background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontWeight: '600',
              transition: 'background 0.2s',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? <ButtonLoading /> : <X className="w-4 h-4" />}
            Cancel Orders
          </button>
          
          <button
            onClick={onClearSelection}
            disabled={isLoading}
            className="btn-secondary"
            style={{
              background: 'white',
              color: 'var(--foreground)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontWeight: '600',
              transition: 'background 0.2s',
              border: '1px solid var(--border)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}
