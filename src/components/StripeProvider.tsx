import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Stripe } from '@stripe/stripe-js';
import { getStripe, getStripeConfig } from '@/lib/stripe-client';

interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
  error: string | null;
  config: {
    publishableKey: string | undefined;
    isProduction: boolean;
    isTestMode: boolean;
  };
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
  options?: {
    stripeAccount?: string;
    locale?: string;
  };
}

/**
 * StripeProvider component that initializes Stripe.js and provides it via React Context
 * This should wrap your app at the appropriate level where Stripe functionality is needed
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = getStripeConfig();

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if publishable key is available
        if (!config.publishableKey) {
          throw new Error('Stripe publishable key is not configured');
        }

        // Load Stripe.js
        const stripeInstance = await getStripe();
        
        // If getStripe returns null, it means Stripe failed to load but didn't throw an error
        // This could happen due to browser restrictions, network issues, etc.
        // We set stripe to null without throwing an error, letting the component handle it gracefully
        setStripe(stripeInstance);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Stripe';
        setError(errorMessage);
        console.error('Stripe initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, [config.publishableKey]);

  const contextValue: StripeContextType = {
    stripe,
    isLoading,
    error,
    config,
  };

  return (
    <StripeContext.Provider value={contextValue}>
      {children}
    </StripeContext.Provider>
  );
};

/**
 * Custom hook to access the Stripe context
 * Must be used within a StripeProvider
 */
export const useStripeContext = (): StripeContextType => {
  const context = useContext(StripeContext);
  
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  
  return context;
};

/**
 * Higher-Order Component that ensures Stripe is loaded before rendering children
 */
export const withStripe = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { stripe, isLoading, error } = useStripeContext();

    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666', fontSize: '14px' }}>Loading payment system...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#e74c3c',
            fontSize: '48px',
            marginBottom: '8px'
          }}>⚠️</div>
          <h3 style={{ color: '#e74c3c', margin: 0 }}>Payment System Error</h3>
          <p style={{ color: '#666', fontSize: '14px', maxWidth: '400px' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    if (!stripe) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Payment system not available</p>
        </div>
      );
    }

    return <Component {...props} />;
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withStripe(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Component that displays Stripe configuration info (useful for debugging)
 * Should only be used in development
 */
export const StripeDebugInfo: React.FC = () => {
  const { config, stripe, isLoading, error } = useStripeContext();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#000',
      color: '#fff',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      opacity: 0.8
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Stripe Debug Info</h4>
      <div>Status: {isLoading ? 'Loading' : error ? 'Error' : stripe ? 'Ready' : 'Not Ready'}</div>
      <div>Mode: {config.isTestMode ? 'Test' : 'Live'}</div>
      <div>Key: {config.publishableKey ? `${config.publishableKey.substring(0, 20)}...` : 'Not Set'}</div>
      {error && <div style={{ color: '#e74c3c' }}>Error: {error}</div>}
    </div>
  );
};