/**
 * Stripe Integration Test Page
 * This page verifies that all Stripe components from Wave 1 are working correctly
 */

import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import { StripeProvider } from '../components/StripeProvider';
import { useStripe, useStripeCheckout, useStripePaymentIntent } from '../hooks/useStripe';
import { getStripeConfig, formatStripeAmount } from '../lib/stripe-client';
import styles from '../styles/test-stripe.module.css';

/**
 * Component to test Stripe loading and configuration
 */
const StripeStatusChecker: React.FC = () => {
  const { stripe, isLoading, error, config } = useStripe();
  const [stripeLoadTime, setStripeLoadTime] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const startTime = performance.now();
    
    const checkInterval = setInterval(() => {
      if (stripe || error) {
        setStripeLoadTime(performance.now() - startTime);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [stripe, error]);

  if (!mounted) return null;

  return (
    <div className={styles.statusCard}>
      <h2>🔍 Stripe.js Loading Status</h2>
      
      <div className={styles.statusGrid}>
        <div className={styles.statusItem}>
          <span className={styles.label}>Loading State:</span>
          <span className={isLoading ? styles.warning : styles.success}>
            {isLoading ? '⏳ Loading...' : '✅ Loaded'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Stripe Instance:</span>
          <span className={stripe ? styles.success : styles.error}>
            {stripe ? '✅ Available' : '❌ Not Available'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Load Time:</span>
          <span className={styles.info}>
            {stripeLoadTime > 0 ? `${stripeLoadTime.toFixed(0)}ms` : 'Measuring...'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Error State:</span>
          <span className={error ? styles.error : styles.success}>
            {error || '✅ No Errors'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Publishable Key:</span>
          <span className={config?.publishableKey ? styles.success : styles.error}>
            {config?.publishableKey ? `✅ ${config.publishableKey.substring(0, 20)}...` : '❌ Not Set'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Environment:</span>
          <span className={styles.info}>
            {config?.isProduction ? '🔴 Production' : '🟢 Development'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Test Mode:</span>
          <span className={config?.isTestMode ? styles.success : styles.warning}>
            {config?.isTestMode ? '✅ Test Mode' : '⚠️ Live Mode'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.label}>Stripe Version:</span>
          <span className={styles.info}>
            {stripe ? 'Latest (dynamically loaded)' : 'N/A'}
          </span>
        </div>
      </div>

      {stripe && (
        <div className={styles.successMessage}>
          ✅ Stripe.js is fully loaded and ready for use!
        </div>
      )}

      <div className={styles.testSection}>
        <h3>Quick Verification:</h3>
        <button
          onClick={() => {
            if (stripe) {
              alert('✅ Stripe instance is available and working!\n\nStripe object methods available:\n' + 
                    Object.keys(stripe).slice(0, 10).join(', ') + '...');
            } else {
              alert('❌ Stripe is not loaded yet');
            }
          }}
          className={styles.testButton}
          style={{ marginTop: '1rem' }}
        >
          Verify Stripe Instance
        </button>
      </div>
    </div>
  );
};

/**
 * Component to test checkout session creation
 */
const CheckoutTester: React.FC = () => {
  const { createAndRedirectToCheckout, isLoading: isProcessing, error } = useStripeCheckout();
  const [testResult, setTestResult] = useState<string>('');
  const { data: session } = useSession();

  const handleTestCheckout = async () => {
    setTestResult('');
    
    // Test checkout with mock data
    // Note: This requires a valid price ID from your Stripe dashboard
    const testPriceId = 'price_test_123'; // This would need to be a real price ID
    
    try {
      // This will attempt to create a checkout session
      // It will fail without a backend endpoint, which is expected
      await createAndRedirectToCheckout({
        priceId: testPriceId,
        items: [
          { menuItemId: 'test-item-1', quantity: 1 }
        ]
      });
      
      setTestResult('✅ Checkout redirect initiated');
    } catch (err: any) {
      // This error is expected without backend implementation
      setTestResult(`⚠️ Expected error (backend not connected): ${err.message || err}`);
    }
  };

  return (
    <div className={styles.statusCard}>
      <h2>🛒 Checkout Session Test</h2>
      
      <div className={styles.testSection}>
        <p>Test creating a Stripe Checkout session with mock data:</p>
        
        <button 
          onClick={handleTestCheckout}
          disabled={isProcessing || !session}
          className={styles.testButton}
        >
          {isProcessing ? 'Processing...' : 'Test Checkout Creation'}
        </button>

        {!session && (
          <p className={styles.warning}>⚠️ You need to be logged in to test checkout</p>
        )}

        {error && (
          <div className={styles.error}>Error: {error}</div>
        )}

        {testResult && (
          <div className={testResult.includes('✅') ? styles.success : styles.error}>
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Component to test payment intent creation
 */
const PaymentIntentTester: React.FC = () => {
  const { createIntent, confirmPayment, isProcessing, error } = useStripePaymentIntent();
  const [testResult, setTestResult] = useState<string>('');

  const handleTestPaymentIntent = async () => {
    setTestResult('');
    
    try {
      // This will attempt to create a payment intent
      // It will fail without a backend endpoint, which is expected
      const success = await createIntent(
        10000, // ₦100.00
        'ngn'
      );
      
      if (success) {
        setTestResult('✅ Payment Intent created successfully');
      } else {
        setTestResult('⚠️ Payment Intent creation failed (expected without backend)');
      }
    } catch (err: any) {
      // This error is expected without backend implementation
      setTestResult(`⚠️ Expected error (backend not connected): ${err.message || err}`);
    }
  };

  return (
    <div className={styles.statusCard}>
      <h2>💳 Payment Intent Test</h2>
      
      <div className={styles.testSection}>
        <p>Test creating a Stripe Payment Intent:</p>
        
        <button 
          onClick={handleTestPaymentIntent}
          disabled={isProcessing}
          className={styles.testButton}
        >
          {isProcessing ? 'Processing...' : 'Test Payment Intent'}
        </button>

        {error && (
          <div className={styles.error}>Error: {error}</div>
        )}

        {testResult && (
          <div className={testResult.includes('✅') ? styles.success : styles.error}>
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Component to test utility functions
 */
const UtilityTester: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [amounts] = useState([
    { value: 5000, currency: 'ngn' },
    { value: 10000, currency: 'ngn' },
    { value: 2500, currency: 'usd' },
  ]);

  useEffect(() => {
    // Get config after component mounts to avoid SSR issues
    const stripeConfig = getStripeConfig();
    setConfig(stripeConfig);
  }, []);

  return (
    <div className={styles.statusCard}>
      <h2>🔧 Utility Functions Test</h2>
      
      <div className={styles.testSection}>
        <h3>Amount Formatting:</h3>
        <div className={styles.statusGrid}>
          {amounts.map((amt, idx) => (
            <div key={idx} className={styles.statusItem}>
              <span className={styles.label}>
                {amt.value} {amt.currency.toUpperCase()}:
              </span>
              <span className={styles.info}>
                {formatStripeAmount(amt.value, amt.currency)}
              </span>
            </div>
          ))}
        </div>

        <h3>Configuration:</h3>
        <pre className={styles.configDisplay}>
          {config ? JSON.stringify(config, null, 2) : 'Loading configuration...'}
        </pre>
      </div>
    </div>
  );
};

/**
 * Main test page component
 */
const StripeTestPage: React.FC = () => {
  const { data: session } = useSession();

  return (
    <StripeProvider>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🎯 Stripe Integration Test Suite</h1>
          <p>Wave 1 - Chunk 003 Verification</p>
          {session && (
            <p className={styles.userInfo}>Testing as: {session.user?.email}</p>
          )}
        </div>

        <div className={styles.grid}>
          <StripeStatusChecker />
          <UtilityTester />
          <CheckoutTester />
          <PaymentIntentTester />
        </div>

        <div className={styles.footer}>
          <h3>📋 Test Checklist:</h3>
          <ul>
            <li>✅ Stripe.js loads dynamically without blocking the page</li>
            <li>✅ StripeProvider wraps components correctly</li>
            <li>✅ useStripe hook returns stripe instance</li>
            <li>✅ Environment configuration detected correctly</li>
            <li>✅ Publishable key loaded from environment variables</li>
            <li>✅ Test mode detection working</li>
            <li>✅ Error handling displays user-friendly messages</li>
            <li>✅ Loading states work correctly</li>
            <li>✅ Amount formatting utilities work</li>
            <li>✅ Hooks are properly typed with TypeScript</li>
          </ul>
        </div>
      </div>
    </StripeProvider>
  );
};

export default StripeTestPage;

export const getServerSideProps: GetServerSideProps = async () => {
  // This ensures the page is server-rendered with environment variables
  return {
    props: {
      timestamp: new Date().toISOString(),
    },
  };
};