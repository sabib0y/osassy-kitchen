import { useState, useEffect, useCallback } from 'react';
import { PaymentMethod, PaymentMethodsResponse } from '../types/user';

interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
  loading: boolean;
  error: string | null;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (setupIntentClientSecret: string) => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  isProcessing: boolean;
}

export function usePaymentMethods(): UsePaymentMethodsReturn {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/payment-methods', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch payment methods');
      }

      const data: PaymentMethodsResponse = await response.json();
      
      // Sort payment methods by default status and creation date
      const sortedMethods = [...data.paymentMethods].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.createdAt - a.createdAt;
      });

      setPaymentMethods(sortedMethods);
      setDefaultPaymentMethodId(data.defaultPaymentMethodId || null);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPaymentMethod = useCallback(async (setupIntentClientSecret: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // This function will be called after Stripe Elements confirms the setup
      // The actual confirmation happens in the AddPaymentMethod component
      // Here we just refresh the payment methods list
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [fetchPaymentMethods]);

  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove payment method');
      }

      // Optimistically update the UI
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      
      // Refresh to ensure consistency
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error removing payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove payment method');
      // Refresh to restore correct state on error
      await fetchPaymentMethods();
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [fetchPaymentMethods]);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/payment-methods/${paymentMethodId}/default`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to set default payment method');
      }

      // Optimistically update the UI
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        isDefault: pm.id === paymentMethodId,
      })));
      setDefaultPaymentMethodId(paymentMethodId);
      
      // Refresh to ensure consistency
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
      // Refresh to restore correct state on error
      await fetchPaymentMethods();
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [fetchPaymentMethods]);

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    defaultPaymentMethodId,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    isProcessing,
  };
}