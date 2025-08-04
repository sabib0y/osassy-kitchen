import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderFilters, OrderStats, BulkOrderUpdate, PaginatedResponse } from '@/types/admin';

// Fetch orders with filtering and pagination
export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async (): Promise<PaginatedResponse<Order>> => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Fetch order statistics
export function useOrderStats() {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: async (): Promise<OrderStats> => {
      const response = await fetch('/api/admin/orders/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch order stats');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch single order
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async (): Promise<Order> => {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      return response.json();
    },
    enabled: !!orderId,
  });
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      return response.json();
    },
    onSuccess: (_, { orderId }) => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
}

// Bulk update order status
export function useBulkUpdateOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkOrderUpdate) => {
      const response = await fetch('/api/admin/orders/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update orders');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all order-related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
}

// Export orders
export function useExportOrders() {
  return useMutation({
    mutationFn: async (filters: OrderFilters = {}) => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/orders/export?${params}`);
      if (!response.ok) {
        throw new Error('Failed to export orders');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
  });
}
