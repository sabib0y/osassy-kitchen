import { useState, useCallback, useMemo } from 'react';
import { useStripeContext } from '@/components/StripeProvider';
import { 
  createCheckoutSession, 
  redirectToCheckout, 
  createPaymentIntent,
  isStripeError,
  getStripeErrorMessage,
  formatStripeAmount,
  toStripeAmount
} from '@/lib/stripe-client';

interface UseStripeCheckoutOptions {
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
  successUrl?: string;
  cancelUrl?: string;
}

interface UseStripeCheckoutResult {
  isLoading: boolean;
  error: string | null;
  createAndRedirectToCheckout: (params: {
    priceId: string;
    items?: Array<{
      menuItemId: string;
      quantity: number;
    }>;
  }) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for handling Stripe Checkout sessions
 */
export const useStripeCheckout = (options: UseStripeCheckoutOptions = {}): UseStripeCheckoutResult => {
  const { stripe, isLoading: stripeLoading, error: stripeError } = useStripeContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAndRedirectToCheckout = useCallback(async (params: {
    priceId: string;
    items?: Array<{
      menuItemId: string;
      quantity: number;
    }>;
  }) => {
    if (!stripe) {
      setError('Stripe is not available');
      return;
    }

    if (stripeError) {
      setError(stripeError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create checkout session
      const { sessionId } = await createCheckoutSession({
        priceId: params.priceId,
        items: params.items,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
      });

      // Call success callback
      options.onSuccess?.(sessionId);

      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during checkout';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [stripe, stripeError, options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading: isLoading || stripeLoading,
    error: error || stripeError,
    createAndRedirectToCheckout,
    clearError,
  };
};

interface UseStripePaymentIntentOptions {
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
}

interface UseStripePaymentIntentResult {
  isLoading: boolean;
  error: string | null;
  paymentIntent: any;
  createPayment: (params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }) => Promise<string | null>; // Returns client secret
  confirmPayment: (clientSecret: string, paymentMethod: any) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Custom hook for handling Payment Intents (for custom checkout flows)
 */
export const useStripePaymentIntent = (options: UseStripePaymentIntentOptions = {}): UseStripePaymentIntentResult => {
  const { stripe, isLoading: stripeLoading, error: stripeError } = useStripeContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  const createPayment = useCallback(async (params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }): Promise<string | null> => {
    if (!stripe) {
      setError('Stripe is not available');
      return null;
    }

    if (stripeError) {
      setError(stripeError);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { clientSecret } = await createPaymentIntent({
        amount: toStripeAmount(params.amount), // Convert to kobo/cents
        currency: params.currency || 'gbp',
        metadata: params.metadata,
      });

      return clientSecret;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [stripe, stripeError, options]);

  const confirmPayment = useCallback(async (
    clientSecret: string, 
    paymentMethod: any
  ): Promise<boolean> => {
    if (!stripe) {
      setError('Stripe is not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: paymentMethod }
      );

      if (error) {
        const errorMessage = isStripeError(error) 
          ? getStripeErrorMessage(error) 
          : (error as any).message || 'Payment failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
        return false;
      }

      setPaymentIntent(confirmedPayment);
      options.onSuccess?.(confirmedPayment);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment confirmation failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [stripe, options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading: isLoading || stripeLoading,
    error: error || stripeError,
    paymentIntent,
    createPayment,
    confirmPayment,
    clearError,
  };
};

/**
 * Custom hook for common Stripe utilities and state
 */
export const useStripe = () => {
  const { stripe, isLoading, error, config } = useStripeContext();

  const utils = useMemo(() => ({
    // Format currency amounts
    formatAmount: (amount: number, currency = 'gbp') => formatStripeAmount(amount, currency),
    
    // Convert to Stripe amount format
    toStripeAmount: (amount: number) => toStripeAmount(amount),
    
    // Check if Stripe is ready
    isReady: Boolean(stripe && !isLoading && !error),
    
    // Check if in test mode
    isTestMode: config?.isTestMode ?? false,
    
    // Get current configuration
    getConfig: () => config,
  }), [stripe, isLoading, error, config]);

  return {
    stripe,
    isLoading,
    error,
    config: config || { publishableKey: undefined, isProduction: false, isTestMode: true },
    ...utils,
  };
};

/**
 * Custom hook for managing subscription-related Stripe operations
 */
export const useStripeSubscription = () => {
  const checkout = useStripeCheckout();
  
  const createSubscription = useCallback(async (params: {
    priceId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
    }>;
    billingInterval: 'WEEKLY' | 'MONTHLY';
  }) => {
    // Map billing interval to specific price IDs
    // These should match the price IDs created in your Stripe dashboard
    const priceIdMap = {
      WEEKLY: 'price_1RtHViQcnp5UiDwRGeiN3oy0',  // From the subscription page
      MONTHLY: 'price_1RtHViQcnp5UiDwRQ8S4gxgG', // From the subscription page
    };

    const actualPriceId = priceIdMap[params.billingInterval] || params.priceId;

    await checkout.createAndRedirectToCheckout({
      priceId: actualPriceId,
      items: params.items,
    });
  }, [checkout]);

  return {
    ...checkout,
    createSubscription,
  };
};