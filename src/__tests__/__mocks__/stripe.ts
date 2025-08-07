import { Stripe, StripeError } from '@stripe/stripe-js';

// Mock Stripe instance with all commonly used methods
export const createMockStripe = (overrides: Partial<Stripe> = {}): Stripe => ({
  elements: jest.fn().mockReturnValue({
    create: jest.fn().mockReturnValue({
      mount: jest.fn(),
      unmount: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }),
    getElement: jest.fn(),
    update: jest.fn(),
  }),
  createToken: jest.fn().mockResolvedValue({
    token: {
      id: 'tok_test_123',
      object: 'token',
      created: Date.now(),
      livemode: false,
      type: 'card',
      used: false,
    },
    error: undefined,
  }),
  createSource: jest.fn().mockResolvedValue({
    source: {
      id: 'src_test_123',
      object: 'source',
      created: Date.now(),
      currency: 'usd',
      flow: 'redirect',
      livemode: false,
      owner: {},
      receiver: {},
      redirect: {},
      statement_descriptor: null,
      status: 'pending',
      type: 'ideal',
      usage: 'reusable',
    },
    error: undefined,
  }),
  retrieveSource: jest.fn().mockResolvedValue({
    source: {
      id: 'src_test_123',
      object: 'source',
      created: Date.now(),
      currency: 'usd',
      flow: 'redirect',
      livemode: false,
      owner: {},
      receiver: {},
      redirect: {},
      statement_descriptor: null,
      status: 'chargeable',
      type: 'ideal',
      usage: 'reusable',
    },
    error: undefined,
  }),
  paymentRequest: jest.fn().mockReturnValue({
    canMakePayment: jest.fn().mockResolvedValue(null),
    show: jest.fn(),
    update: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  }),
  redirectToCheckout: jest.fn().mockResolvedValue({ error: undefined }),
  confirmCardPayment: jest.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: 'pi_test_123_secret',
    },
    error: undefined,
  }),
  confirmCardSetup: jest.fn().mockResolvedValue({
    setupIntent: {
      id: 'seti_test_123',
      object: 'setup_intent',
      status: 'succeeded',
      client_secret: 'seti_test_123_secret',
    },
    error: undefined,
  }),
  confirmPayment: jest.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: 'pi_test_123_secret',
    },
    error: undefined,
  }),
  confirmSetup: jest.fn().mockResolvedValue({
    setupIntent: {
      id: 'seti_test_123',
      object: 'setup_intent',
      status: 'succeeded',
      client_secret: 'seti_test_123_secret',
    },
    error: undefined,
  }),
  handleCardPayment: jest.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: 'pi_test_123_secret',
    },
    error: undefined,
  }),
  handleCardSetup: jest.fn().mockResolvedValue({
    setupIntent: {
      id: 'seti_test_123',
      object: 'setup_intent',
      status: 'succeeded',
      client_secret: 'seti_test_123_secret',
    },
    error: undefined,
  }),
  handleCardAction: jest.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'requires_confirmation',
      client_secret: 'pi_test_123_secret',
    },
    error: undefined,
  }),
  createPaymentMethod: jest.fn().mockResolvedValue({
    paymentMethod: {
      id: 'pm_test_123',
      object: 'payment_method',
      created: Date.now(),
      livemode: false,
      type: 'card',
    },
    error: undefined,
  }),
  retrievePaymentMethod: jest.fn().mockResolvedValue({
    paymentMethod: {
      id: 'pm_test_123',
      object: 'payment_method',
      created: Date.now(),
      livemode: false,
      type: 'card',
    },
    error: undefined,
  }),
  attachPaymentMethod: jest.fn().mockResolvedValue({
    paymentMethod: {
      id: 'pm_test_123',
      object: 'payment_method',
      created: Date.now(),
      livemode: false,
      type: 'card',
    },
    error: undefined,
  }),
  detachPaymentMethod: jest.fn().mockResolvedValue({
    paymentMethod: {
      id: 'pm_test_123',
      object: 'payment_method',
      created: Date.now(),
      livemode: false,
      type: 'card',
    },
    error: undefined,
  }),
  retrievePaymentIntent: jest.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: 'pi_test_123_secret',
    },
    error: undefined,
  }),
  retrieveSetupIntent: jest.fn().mockResolvedValue({
    setupIntent: {
      id: 'seti_test_123',
      object: 'setup_intent',
      status: 'succeeded',
      client_secret: 'seti_test_123_secret',
    },
    error: undefined,
  }),
  verifyMicrodepositsForPayment: jest.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: 'pi_test_123_secret',
    },
    error: undefined,
  }),
  verifyMicrodepositsForSetup: jest.fn().mockResolvedValue({
    setupIntent: {
      id: 'seti_test_123',
      object: 'setup_intent',
      status: 'succeeded',
      client_secret: 'seti_test_123_secret',
    },
    error: undefined,
  }),
  collectBankAccountForPayment: jest.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'requires_confirmation',
      client_secret: 'pi_test_123_secret',
    },
    error: undefined,
  }),
  collectBankAccountForSetup: jest.fn().mockResolvedValue({
    setupIntent: {
      id: 'seti_test_123',
      object: 'setup_intent',
      status: 'requires_confirmation',
      client_secret: 'seti_test_123_secret',
    },
    error: undefined,
  }),
  // Apply any overrides
  ...overrides,
} as Stripe);

// Mock Stripe error factory
export const createMockStripeError = (type: StripeError['type'], message?: string): StripeError => ({
  type,
  message: message || 'A Stripe error occurred',
  charge: 'ch_test_123',
  code: 'card_declined',
  decline_code: 'generic_decline',
  doc_url: 'https://stripe.com/docs/error-codes',
  param: 'number',
  payment_intent: {
    id: 'pi_test_123',
    object: 'payment_intent',
    amount: 5000,
    currency: 'usd',
    status: 'requires_payment_method',
    client_secret: 'pi_test_123_secret',
  },
  payment_method: {
    id: 'pm_test_123',
    object: 'payment_method',
    created: Date.now(),
    livemode: false,
    type: 'card',
  },
  setup_intent: {
    id: 'seti_test_123',
    object: 'setup_intent',
    status: 'requires_payment_method',
    client_secret: 'seti_test_123_secret',
  },
  source: {
    id: 'src_test_123',
    object: 'source',
    created: Date.now(),
    currency: 'usd',
    flow: 'redirect',
    livemode: false,
    owner: {},
    receiver: {},
    redirect: {},
    statement_descriptor: null,
    status: 'pending',
    type: 'ideal',
    usage: 'reusable',
  },
});

// Default mock implementations
export const mockLoadStripe = jest.fn();

// Mock @stripe/stripe-js module
export const setupStripeMocks = () => {
  jest.mock('@stripe/stripe-js', () => ({
    loadStripe: mockLoadStripe,
  }));
};

// Reset all Stripe mocks
export const resetStripeMocks = () => {
  mockLoadStripe.mockReset();
};

// Helper to set up successful Stripe loading
export const setupSuccessfulStripeLoad = (stripeOverrides: Partial<Stripe> = {}) => {
  const mockStripe = createMockStripe(stripeOverrides);
  mockLoadStripe.mockResolvedValue(mockStripe);
  return mockStripe;
};

// Helper to set up failed Stripe loading
export const setupFailedStripeLoad = () => {
  mockLoadStripe.mockResolvedValue(null);
};

// Helper to set up Stripe loading error
export const setupStripeLoadError = (error: Error) => {
  mockLoadStripe.mockRejectedValue(error);
};

// Helper to set up redirectToCheckout success
export const setupRedirectToCheckoutSuccess = () => {
  const mockStripe = createMockStripe({
    redirectToCheckout: jest.fn().mockResolvedValue({ error: undefined }),
  });
  mockLoadStripe.mockResolvedValue(mockStripe);
  return mockStripe;
};

// Helper to set up redirectToCheckout failure
export const setupRedirectToCheckoutFailure = (errorMessage = 'Redirect failed') => {
  const error = errorMessage 
    ? createMockStripeError('validation_error', errorMessage)
    : { message: '' }; // Empty error object for testing

  const mockStripe = createMockStripe({
    redirectToCheckout: jest.fn().mockResolvedValue({
      error,
    }),
  });
  mockLoadStripe.mockResolvedValue(mockStripe);
  return mockStripe;
};