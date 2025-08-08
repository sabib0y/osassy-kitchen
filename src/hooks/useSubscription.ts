import { useState, useEffect, useCallback } from 'react';
import { SubscriptionResponse, UpdateSubscriptionRequest } from '../lib/api-types';

interface UseSubscriptionReturn {
  subscription: SubscriptionResponse | null;
  loading: boolean;
  error: string | null;
  isUpdating: boolean;
  updateSubscription: (updates: UpdateSubscriptionRequest) => Promise<SubscriptionResponse>;
  pauseSubscription: (pauseDate?: string) => Promise<SubscriptionResponse>;
  resumeSubscription: () => Promise<SubscriptionResponse>;
  cancelSubscription: () => Promise<SubscriptionResponse>;
  refetch: () => Promise<void>;
}

export const useSubscription = (subscriptionId: string): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/subscriptions/${subscriptionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Subscription not found');
        }
        throw new Error('Failed to fetch subscription');
      }
      
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  const updateSubscription = useCallback(async (updates: UpdateSubscriptionRequest): Promise<SubscriptionResponse> => {
    if (!subscription) {
      throw new Error('No subscription loaded');
    }

    setIsUpdating(true);
    setError(null);

    // Optimistic update
    const originalSubscription = subscription;
    if (updates.items) {
      const newPrice = updates.items.reduce((total, item) => {
        // We'd need to look up the menu item price, but for now we'll recalculate on server response
        return total;
      }, 0);
      
      setSubscription(prev => prev ? {
        ...prev,
        items: updates.items!.map(item => ({
          id: `temp-${item.menuItemId}`,
          quantity: item.quantity,
          menuItem: prev.items.find(i => i.menuItem.id === item.menuItemId)?.menuItem || {
            id: item.menuItemId,
            name: 'Loading...',
            description: '',
            price: 0,
            category: ''
          }
        }))
      } : null);
    }

    try {
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const data = await response.json();
      const updatedSubscription = data.subscription;
      
      setSubscription(updatedSubscription);
      return updatedSubscription;
    } catch (err) {
      // Revert optimistic update on error
      setSubscription(originalSubscription);
      
      console.error('Error updating subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [subscription, subscriptionId]);

  const pauseSubscription = useCallback(async (pauseDate?: string): Promise<SubscriptionResponse> => {
    if (!subscription) {
      throw new Error('No subscription loaded');
    }

    setIsUpdating(true);
    setError(null);

    // Optimistic update
    const originalSubscription = subscription;
    setSubscription(prev => prev ? {
      ...prev,
      status: 'PAUSED' as const
    } : null);

    try {
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pauseDate }),
      });

      if (!response.ok) {
        throw new Error('Failed to pause subscription');
      }

      const data = await response.json();
      const updatedSubscription = data.subscription;
      
      setSubscription(updatedSubscription);
      return updatedSubscription;
    } catch (err) {
      // Revert optimistic update on error
      setSubscription(originalSubscription);
      
      console.error('Error pausing subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [subscription, subscriptionId]);

  const resumeSubscription = useCallback(async (): Promise<SubscriptionResponse> => {
    if (!subscription) {
      throw new Error('No subscription loaded');
    }

    setIsUpdating(true);
    setError(null);

    // Optimistic update
    const originalSubscription = subscription;
    setSubscription(prev => prev ? {
      ...prev,
      status: 'ACTIVE' as const
    } : null);

    try {
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      const data = await response.json();
      const updatedSubscription = data.subscription;
      
      setSubscription(updatedSubscription);
      return updatedSubscription;
    } catch (err) {
      // Revert optimistic update on error
      setSubscription(originalSubscription);
      
      console.error('Error resuming subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [subscription, subscriptionId]);

  const cancelSubscription = useCallback(async (): Promise<SubscriptionResponse> => {
    if (!subscription) {
      throw new Error('No subscription loaded');
    }

    setIsUpdating(true);
    setError(null);

    // Optimistic update
    const originalSubscription = subscription;
    setSubscription(prev => prev ? {
      ...prev,
      status: 'CANCELLED' as const
    } : null);

    try {
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      const updatedSubscription = data.subscription;
      
      setSubscription(updatedSubscription);
      return updatedSubscription;
    } catch (err) {
      // Revert optimistic update on error
      setSubscription(originalSubscription);
      
      console.error('Error cancelling subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [subscription, subscriptionId]);

  const refetch = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscription();
    }
  }, [subscriptionId, fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    isUpdating,
    updateSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    refetch
  };
};

// Hook for managing multiple subscriptions (for the list page)
interface UseSubscriptionsReturn {
  subscriptions: SubscriptionResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSubscriptions = (): UseSubscriptionsReturn => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/subscriptions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    refetch
  };
};