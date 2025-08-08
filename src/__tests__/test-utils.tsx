import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'

// Mock Stripe Provider
const MockStripeProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="stripe-provider">{children}</div>
}

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null
  queryClient?: QueryClient
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    session = null,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  } = options

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <MockStripeProvider>
          {children}
        </MockStripeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'USER',
  phone: '+1234567890',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const createMockSession = (overrides = {}): Session => ({
  user: createMockUser(),
  expires: '2024-12-31T23:59:59.999Z',
  ...overrides,
})

export const createMockMenuItem = (overrides = {}) => ({
  id: '1',
  name: 'Test Dish',
  description: 'Delicious test dish',
  price: 15.99,
  category: 'Main Course',
  available: true,
  imageUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const createMockOrder = (overrides = {}) => ({
  id: '1',
  totalPrice: 31.98,
  deliveryDate: '2024-01-02T12:00:00.000Z',
  status: 'PENDING' as const,
  notes: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deliveryAddress: '123 Test St, Test City',
  deliveryFee: 5.99,
  specialInstructions: null,
  subscription: null,
  items: [
    {
      id: '1',
      quantity: 2,
      price: 15.99,
      menuItem: createMockMenuItem(),
    },
  ],
  user: createMockUser(),
  ...overrides,
})

export const createMockSubscription = (overrides = {}) => ({
  id: '1',
  planName: 'Weekly Plan',
  interval: 'WEEKLY' as const,
  price: 49.99,
  status: 'ACTIVE' as const,
  startDate: '2024-01-01T00:00:00.000Z',
  nextDeliveryDate: '2024-01-08T00:00:00.000Z',
  stripeSubscriptionId: 'sub_test123',
  items: [
    {
      id: '1',
      quantity: 1,
      menuItem: createMockMenuItem(),
    },
  ],
  recentOrders: [createMockOrder()],
  ...overrides,
})

export const createMockApiResponse = <T,>(data: T, overrides = {}) => ({
  success: true,
  data,
  ...overrides,
})

export const createMockApiError = (message = 'Test error', status = 400, overrides = {}) => ({
  message,
  status,
  code: 'TEST_ERROR',
  details: {},
  ...overrides,
})

// Helper to create a fresh QueryClient for tests
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
})

// Helper to wait for React Query to settle
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }