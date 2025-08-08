import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentMethodList from '../../../components/user/PaymentMethodList';
import { PaymentMethod } from '../../../types/user';

describe('PaymentMethodList', () => {
  const mockOnRemove = jest.fn();
  const mockOnSetDefault = jest.fn();

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
        name: 'John Doe',
        email: 'john@example.com',
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
        name: 'Jane Doe',
      },
      isDefault: false,
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'pm_3',
      type: 'card',
      card: {
        brand: 'amex',
        last4: '0005',
        expMonth: 1,
        expYear: 2023,
      },
      isDefault: false,
      createdAt: Date.now() - 172800000,
    },
  ];

  const defaultProps = {
    paymentMethods: mockPaymentMethods,
    defaultPaymentMethodId: 'pm_1',
    onRemove: mockOnRemove,
    onSetDefault: mockOnSetDefault,
    isProcessing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders payment methods correctly', () => {
    render(<PaymentMethodList {...defaultProps} />);

    expect(screen.getByText('•••• 4242')).toBeInTheDocument();
    expect(screen.getByText('•••• 5555')).toBeInTheDocument();
    expect(screen.getByText('•••• 0005')).toBeInTheDocument();
  });

  it('displays card brand names correctly', () => {
    render(<PaymentMethodList {...defaultProps} />);

    expect(screen.getByText('Visa')).toBeInTheDocument();
    expect(screen.getByText('Mastercard')).toBeInTheDocument();
    expect(screen.getByText('American Express')).toBeInTheDocument();
  });

  it('shows default badge for default payment method', () => {
    render(<PaymentMethodList {...defaultProps} />);

    const defaultCard = screen.getByTestId('payment-method-pm_1');
    expect(defaultCard).toHaveClass('default');
    
    const defaultBadges = screen.getAllByText('Default');
    expect(defaultBadges).toHaveLength(1);
  });

  it('shows expired badge for expired cards', () => {
    render(<PaymentMethodList {...defaultProps} />);

    const expiredCard = screen.getByTestId('payment-method-pm_3');
    expect(expiredCard).toHaveClass('expired');
    
    const expiredBadges = screen.getAllByText('Expired');
    expect(expiredBadges).toHaveLength(1);
  });

  it('displays cardholder names when available', () => {
    render(<PaymentMethodList {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('formats expiry dates correctly', () => {
    render(<PaymentMethodList {...defaultProps} />);

    expect(screen.getByText('Expires 12/25')).toBeInTheDocument();
    expect(screen.getByText('Expires 06/24')).toBeInTheDocument();
    expect(screen.getByText('Expires 01/23')).toBeInTheDocument();
  });

  it('shows Set Default button only for non-default, non-expired cards', () => {
    render(<PaymentMethodList {...defaultProps} />);

    const setDefaultButtons = screen.getAllByLabelText('Set as default payment method');
    expect(setDefaultButtons).toHaveLength(1); // Only pm_2 should have this button
  });

  it('handles set default action', async () => {
    mockOnSetDefault.mockResolvedValueOnce(undefined);
    
    render(<PaymentMethodList {...defaultProps} />);

    const setDefaultButton = screen.getByLabelText('Set as default payment method');
    fireEvent.click(setDefaultButton);

    await waitFor(() => {
      expect(mockOnSetDefault).toHaveBeenCalledWith('pm_2');
    });
  });

  it('shows confirmation before removing payment method', async () => {
    render(<PaymentMethodList {...defaultProps} />);

    const removeButtons = screen.getAllByLabelText('Remove payment method');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm?')).toBeInTheDocument();
    });

    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('removes payment method after confirmation', async () => {
    mockOnRemove.mockResolvedValueOnce(undefined);
    
    render(<PaymentMethodList {...defaultProps} />);

    const removeButtons = screen.getAllByLabelText('Remove payment method');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm?')).toBeInTheDocument();
    });

    // Click again to confirm
    fireEvent.click(screen.getByLabelText('Confirm removal'));

    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('pm_1');
    });
  });

  it('resets confirmation state after timeout', async () => {
    render(<PaymentMethodList {...defaultProps} />);

    const removeButton = screen.getAllByLabelText('Remove payment method')[0];
    fireEvent.click(removeButton);

    expect(screen.getByText('Confirm?')).toBeInTheDocument();

    // Fast-forward time to reset confirmation
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Confirm?')).not.toBeInTheDocument();
    });
  });

  it('disables buttons when processing', () => {
    render(<PaymentMethodList {...defaultProps} isProcessing={true} />);

    const setDefaultButton = screen.getByLabelText('Set as default payment method');
    expect(setDefaultButton).toBeDisabled();

    const removeButtons = screen.getAllByLabelText('Remove payment method');
    removeButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('shows spinner when processing specific card', async () => {
    mockOnRemove.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    render(<PaymentMethodList {...defaultProps} />);

    const removeButton = screen.getAllByLabelText('Remove payment method')[0];
    fireEvent.click(removeButton);
    fireEvent.click(screen.getByLabelText('Confirm removal'));

    await waitFor(() => {
      expect(screen.getByTestId('payment-method-pm_1').querySelector('.fa-spinner')).toBeInTheDocument();
    });
  });

  it('displays empty state when no payment methods', () => {
    render(<PaymentMethodList {...defaultProps} paymentMethods={[]} />);

    expect(screen.getByText('No Payment Methods')).toBeInTheDocument();
    expect(screen.getByText('Add a payment method to make purchases and manage your subscriptions')).toBeInTheDocument();
  });

  it('displays correct card brand icons', () => {
    const cardsWithBrands: PaymentMethod[] = [
      { ...mockPaymentMethods[0], card: { ...mockPaymentMethods[0].card, brand: 'visa' }},
      { ...mockPaymentMethods[0], id: 'pm_mc', card: { ...mockPaymentMethods[0].card, brand: 'mastercard' }},
      { ...mockPaymentMethods[0], id: 'pm_amex', card: { ...mockPaymentMethods[0].card, brand: 'amex' }},
      { ...mockPaymentMethods[0], id: 'pm_disc', card: { ...mockPaymentMethods[0].card, brand: 'discover' }},
      { ...mockPaymentMethods[0], id: 'pm_diners', card: { ...mockPaymentMethods[0].card, brand: 'diners' }},
      { ...mockPaymentMethods[0], id: 'pm_jcb', card: { ...mockPaymentMethods[0].card, brand: 'jcb' }},
      { ...mockPaymentMethods[0], id: 'pm_other', card: { ...mockPaymentMethods[0].card, brand: 'unknown' }},
    ];

    render(<PaymentMethodList {...defaultProps} paymentMethods={cardsWithBrands} />);

    expect(document.querySelector('.fa-cc-visa')).toBeInTheDocument();
    expect(document.querySelector('.fa-cc-mastercard')).toBeInTheDocument();
    expect(document.querySelector('.fa-cc-amex')).toBeInTheDocument();
    expect(document.querySelector('.fa-cc-discover')).toBeInTheDocument();
    expect(document.querySelector('.fa-cc-diners-club')).toBeInTheDocument();
    expect(document.querySelector('.fa-cc-jcb')).toBeInTheDocument();
    expect(document.querySelector('.fa-credit-card')).toBeInTheDocument(); // Default icon
  });

  it('handles error when removing payment method fails', async () => {
    mockOnRemove.mockRejectedValueOnce(new Error('Failed to remove'));
    
    render(<PaymentMethodList {...defaultProps} />);

    const removeButton = screen.getAllByLabelText('Remove payment method')[0];
    fireEvent.click(removeButton);
    fireEvent.click(screen.getByLabelText('Confirm removal'));

    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('pm_1');
    });

    // Should reset processing state after error
    await waitFor(() => {
      expect(removeButton).not.toBeDisabled();
    });
  });

  it('handles error when setting default fails', async () => {
    mockOnSetDefault.mockRejectedValueOnce(new Error('Failed to set default'));
    
    render(<PaymentMethodList {...defaultProps} />);

    const setDefaultButton = screen.getByLabelText('Set as default payment method');
    fireEvent.click(setDefaultButton);

    await waitFor(() => {
      expect(mockOnSetDefault).toHaveBeenCalledWith('pm_2');
    });

    // Should reset processing state after error
    await waitFor(() => {
      expect(setDefaultButton).not.toBeDisabled();
    });
  });
});