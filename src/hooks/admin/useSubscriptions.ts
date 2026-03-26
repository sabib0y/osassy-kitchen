import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SubscriptionUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
}

export interface SubscriptionItem {
  id: string;
  quantity: number;
  menuItem: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    category: string;
  };
}

export interface RecentOrder {
  id: string;
  status: string;
  deliveryDate: string | null;
  totalPrice: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  planName: string;
  interval: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  price: number;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: string;
  nextDeliveryDate: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
  user: SubscriptionUser;
  items: SubscriptionItem[];
  recentOrders: RecentOrder[];
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  status?: string;
  interval?: string;
  search?: string;
}

export interface SubscriptionPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  pagination: SubscriptionPagination;
}

// Fetch subscriptions with filtering and pagination
export function useSubscriptions(filters: SubscriptionFilters = {}) {
  return useQuery({
    queryKey: ['admin-subscriptions', filters],
    queryFn: async (): Promise<SubscriptionsResponse> => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/subscriptions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      return response.json();
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Update subscription status
export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      status
    }: {
      subscriptionId: string;
      status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
    }) => {
      const response = await fetch(`/api/admin/subscriptions?subscriptionId=${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription status');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate subscriptions queries
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
  });
}
