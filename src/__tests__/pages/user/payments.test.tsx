import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import UserPayments from '../../../pages/user/payments';
import { PaymentMethod } from '../../../types/user';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  getSession: jest.fn(),
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        on: jest.fn(),
        update: jest.fn(),
        clear: jest.fn(),
      })),
      getElement: jest.fn(),
    })),
    confirmCardSetup: jest.fn(() => Promise.resolve({
      setupIntent: {
        id: 'seti_test',
        status: 'succeeded',
      },
      error: null,
    })),
  })),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div>{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    confirmCardSetup: jest.fn(() => Promise.resolve({
      setupIntent: {
        id: 'seti_test',
        status: 'succeeded',
      },
      error: null,
    })),
  }),
  useElements: () => ({
    getElement: jest.fn(() => ({
      clear: jest.fn(),
    })),
  }),
}));

// Mock UserLayout
jest.mock('../../../components/user/UserLayout', () => {
  return function UserLayout({ children, pageTitle, activeTab }: any) {
    return (
      <div data-testid="user-layout" data-page-title={pageTitle} data-active-tab={activeTab}>
        {children}
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('UserPayments', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    pathname: '/user/payments',
    query: {},
    asPath: '/user/payments',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  };

  const mockSession = {
    user: {
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2024-12-31',
  };

  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_1',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        funding: 'credit',
      },
      billingDetails: {
        name: 'Test User',
        email: 'test@example.com',
      },
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'pm_2',
      type: 'card',
      card: {
        brand: 'mastercard',
        last4: '5555',
        expMonth: 6,
        expYear: 2024,
        funding: 'debit',
      },
      billingDetails: {
        name: 'Test User',
      },
      isDefault: false,
      createdAt: Date.now() - 86400000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        paymentMethods: mockPaymentMethods,
        defaultPaymentMethodId: 'pm_1',
      }),
    });
  });

  it('renders the payments page with header', async () => {
    render(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText('Payment Methods')).toBeInTheDocument();
      expect(screen.getByText('Manage your payment methods for subscriptions and orders')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<UserPayments />);
    expect(screen.getByText('Loading payment methods...')).toBeInTheDocument();
  });

  it('displays payment methods after loading', async () => {
    render(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText('•••• 4242')).toBeInTheDocument();
      expect(screen.getByText('•••• 5555')).toBeInTheDocument();
      expect(screen.getByText('Visa')).toBeInTheDocument();
      expect(screen.getByText('Mastercard')).toBeInTheDocument();
    });
  });

  it('shows default badge for default payment method', async () => {
    render(<UserPayments />);

    await waitFor(() => {
      const defaultCard = screen.getByTestId('payment-method-pm_1');
      expect(defaultCard).toHaveClass('default');
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  it('shows expired badge for expired cards', async () => {
    const expiredCard: PaymentMethod = {
      id: 'pm_expired',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '1111',
        expMonth: 1,
        expYear: 2020,
      },
      isDefault: false,
      createdAt: Date.now(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [expiredCard],
        defaultPaymentMethodId: null,
      }),
    });

    render(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText('Expired')).toBeInTheDocument();
      const expiredCardElement = screen.getByTestId('payment-method-pm_expired');
      expect(expiredCardElement).toHaveClass('expired');
    });
  });

  it('displays empty state when no payment methods', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [],
        defaultPaymentMethodId: null,
      }),
    });

    render(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText('No Payment Methods')).toBeInTheDocument();
      expect(screen.getByText('Add a payment method to make purchases and manage your subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Payment Method')).toBeInTheDocument();
    });
  });

  it('shows add payment method form when add button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [],
        defaultPaymentMethodId: null,
      }),
    });

    render(<UserPayments />);

    await waitFor(() => {
      const addButton = screen.getByText('Add Your First Payment Method');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
      expect(screen.getByLabelText('Cardholder Name')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });
  });

  it('handles remove payment method', async () => {
    render(<UserPayments />);

    await waitFor(() => {
      const removeButtons = screen.getAllByLabelText('Remove payment method');
      expect(removeButtons).toHaveLength(2);
    });

    // Mock successful deletion
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock refreshed list without the deleted card
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [mockPaymentMethods[0]],
        defaultPaymentMethodId: 'pm_1',
      }),
    });

    const removeButton = screen.getAllByLabelText('Remove payment method')[1];
    fireEvent.click(removeButton);

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText('Confirm?')).toBeInTheDocument();
    });

    // Click again to confirm
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/payment-methods/pm_2',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  it('handles set default payment method', async () => {
    render(<UserPayments />);

    await waitFor(() => {
      const setDefaultButtons = screen.getAllByLabelText('Set as default payment method');
      expect(setDefaultButtons).toHaveLength(1); // Only non-default card has this button
    });

    // Mock successful update
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock refreshed list with updated default
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: mockPaymentMethods.map(pm => ({
          ...pm,
          isDefault: pm.id === 'pm_2',
        })),
        defaultPaymentMethodId: 'pm_2',
      }),
    });

    const setDefaultButton = screen.getByLabelText('Set as default payment method');
    fireEvent.click(setDefaultButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/payment-methods/pm_2/default',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  it('displays error message when API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load payment methods' }),
    });

    render(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load payment methods')).toBeInTheDocument();
    });
  });

  it('displays security note', async () => {
    render(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText('Your payment information is secure')).toBeInTheDocument();
      expect(screen.getByText(/We use industry-standard encryption/)).toBeInTheDocument();
    });
  });

  it('handles network error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load payment methods')).toBeInTheDocument();
    });
  });
});