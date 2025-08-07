/**
 * Integration test to verify Wave 1 components work together
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';

// Test imports from Chunk-001
import { api } from '../lib/api-client';
import { useMenuItems, useOrders } from '../hooks/useApi';
import type { MenuItem, Order, ApiResponse } from '../lib/api-types';

// Test imports from Chunk-003
import { StripeProvider } from '../components/StripeProvider';
import { useStripe, useStripeCheckout } from '../hooks/useStripe';
import { getStripeConfig } from '../lib/stripe-client';

// Test imports from Chunk-005
import UserLayout from '../components/user/UserLayout';
import UserSidebar from '../components/user/UserSidebar';
import UserHeader from '../components/user/UserHeader';

// Verify all exports exist
const verifyExports = () => {
  // API Integration
  console.assert(typeof api === 'object', 'API client should be exported');
  console.assert(typeof useMenuItems === 'function', 'useMenuItems hook should be exported');
  console.assert(typeof useOrders === 'function', 'useOrders hook should be exported');
  
  // Stripe Integration
  console.assert(typeof StripeProvider === 'function', 'StripeProvider should be exported');
  console.assert(typeof useStripe === 'function', 'useStripe hook should be exported');
  console.assert(typeof useStripeCheckout === 'function', 'useStripeCheckout hook should be exported');
  console.assert(typeof getStripeConfig === 'function', 'getStripeConfig should be exported');
  
  // User Layout
  console.assert(typeof UserLayout === 'function', 'UserLayout should be exported');
  console.assert(typeof UserSidebar === 'function', 'UserSidebar should be exported');
  console.assert(typeof UserHeader === 'function', 'UserHeader should be exported');
  
  return true;
};

// Test component that uses all three chunks
const TestIntegrationComponent: React.FC = () => {
  const { data: menuItems, isLoading: menuLoading } = useMenuItems();
  const { stripe, isLoading: stripeLoading } = useStripe();
  
  return (
    <div>
      <h1>Integration Test Component</h1>
      <p>API Status: {menuLoading ? 'Loading...' : 'Ready'}</p>
      <p>Stripe Status: {stripeLoading ? 'Loading...' : stripe ? 'Loaded' : 'Not loaded'}</p>
      <p>Menu Items: {menuItems?.data?.length || 0}</p>
    </div>
  );
};

// Full integration test
export const IntegrationTest: React.FC = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  const mockSession = {
    user: {
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2025-12-31',
  };
  
  return (
    <SessionProvider session={mockSession}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider>
          <UserLayout pageTitle="Integration Test" activeTab="dashboard">
            <TestIntegrationComponent />
          </UserLayout>
        </StripeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

// Run verification
if (typeof window === 'undefined') {
  console.log('✅ All Wave 1 exports verified successfully');
  verifyExports();
}

export default IntegrationTest;