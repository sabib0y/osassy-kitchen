// Fix for tests - ensures proper module mocking

// Re-export stripe-client with proper mocking
export const mockGetStripe = jest.fn()
export const mockCreateCheckoutSession = jest.fn()
export const mockRedirectToCheckout = jest.fn()

// Mock stripe-client module
jest.mock('@/lib/stripe-client', () => ({
  getStripe: mockGetStripe,
  createCheckoutSession: mockCreateCheckoutSession,
  redirectToCheckout: mockRedirectToCheckout,
  createPaymentIntent: jest.fn(),
  isStripeError: jest.fn((error: any) => error?.type?.startsWith('Stripe')),
  getStripeErrorMessage: jest.fn((error: any) => error.message || 'Stripe error'),
  getStripeConfig: jest.fn(() => ({
    publishableKey: 'pk_test_123',
    isProduction: false,
    isTestMode: true,
  })),
  formatStripeAmount: jest.fn((amount: number) => `₦${(amount / 100).toFixed(2)}`),
  toStripeAmount: jest.fn((amount: number) => amount * 100),
}))

// Fix router mock
export const mockUseRouter = jest.fn()
jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: mockUseRouter,
  default: {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  },
}))

// Setup default router return value
mockUseRouter.mockReturnValue({
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(() => Promise.resolve()),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isReady: true,
})