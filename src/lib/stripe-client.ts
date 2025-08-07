import { loadStripe, Stripe, StripeError } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | undefined;

/**
 * Get or create a singleton instance of Stripe.js
 * This ensures Stripe is only loaded once and reused across the application
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
      // Return a rejected promise instead of throwing synchronously
      return Promise.reject(new Error('Stripe publishable key is not configured'));
    }

    // Load Stripe.js asynchronously
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

// Reset the singleton for testing purposes
export const resetStripePromise = () => {
  if (process.env.NODE_ENV === 'test') {
    stripePromise = undefined;
  }
};

/**
 * Create a Stripe Checkout Session
 */
export const createCheckoutSession = async (params: {
  priceId: string;
  items?: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ sessionId: string }> => {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId: params.priceId,
      items: params.items || [],
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create checkout session');
  }

  return response.json();
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Failed to load Stripe');
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    throw new Error(error.message || 'Failed to redirect to checkout');
  }
};

/**
 * Create a Payment Intent for custom checkout flows
 */
export const createPaymentIntent = async (params: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<{ clientSecret: string }> => {
  const response = await fetch('/api/payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || 'gbp',
      metadata: params.metadata || {},
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create payment intent');
  }

  return response.json();
};

/**
 * Type guards and error handling utilities
 */
export const isStripeError = (error: any): error is StripeError => {
  return Boolean(error && typeof error === 'object' && 'type' in error);
};

export const getStripeErrorMessage = (error: StripeError): string => {
  switch (error.type) {
    case 'card_error':
      return error.message || 'Your card was declined.';
    case 'validation_error':
      return error.message || 'Invalid payment information.';
    case 'api_error':
      return 'An error occurred with our payment system. Please try again.';
    case 'authentication_error':
      return 'Authentication with payment provider failed.';
    case 'rate_limit_error':
      return 'Too many requests. Please wait and try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

/**
 * Environment and configuration utilities
 */
export const getStripeConfig = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    publishableKey,
    isProduction,
    isTestMode: !isProduction || (publishableKey?.startsWith('pk_test_') ?? true),
  };
};

/**
 * Format amount for Stripe (convert from pence to pounds)
 */
export const formatStripeAmount = (amount: number, currency = 'gbp'): string => {
  const divisor = 100; // GBP uses 100 pence per pound
  const normalizedCurrency = currency.toLowerCase();
  
  if (normalizedCurrency === 'gbp') {
    return `£${(amount / divisor).toFixed(2)}`;
  }
  
  // Fallback to Intl formatter for other currencies
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  });
  
  return formatter.format(amount / divisor);
};

/**
 * Convert amount to Stripe format (pence)
 */
export const toStripeAmount = (amount: number): number => {
  return Math.round(amount * 100);
};