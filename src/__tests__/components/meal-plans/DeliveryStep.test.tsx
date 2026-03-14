import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeliveryStep from '../../../components/meal-plans/DeliveryStep';
import { DeliveryDetails } from '../../../types/meal-plans';

describe('DeliveryStep Component', () => {
  const mockDeliveryDetails: DeliveryDetails = {
    address: '123 Test Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    phone: '07700900000',
    instructions: 'Ring the bell',
    preferredDay: 'Monday',
  };

  const mockOnUpdate = jest.fn();
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(
      <DeliveryStep
        deliveryDetails={mockDeliveryDetails}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByLabelText(/delivery address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delivery instructions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred delivery day/i)).toBeInTheDocument();
  });

  it('displays pre-filled values when deliveryDetails are provided', () => {
    render(
      <DeliveryStep
        deliveryDetails={mockDeliveryDetails}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument();
    expect(screen.getByDisplayValue('London')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SW1A 1AA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('07700900000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ring the bell')).toBeInTheDocument();
  });

  it('calls onUpdate when form fields change', () => {
    render(
      <DeliveryStep
        deliveryDetails={mockDeliveryDetails}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    const addressInput = screen.getByLabelText(/delivery address/i);
    fireEvent.change(addressInput, { target: { value: '456 New Street' } });

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '456 New Street',
      })
    );
  });

  it('validates required fields before continuing', async () => {
    const emptyDetails: DeliveryDetails = {
      address: '',
      city: '',
      postcode: '',
      phone: '',
      preferredDay: '',
    };

    render(
      <DeliveryStep
        deliveryDetails={emptyDetails}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    });

    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('validates postcode format', async () => {
    const invalidPostcode: DeliveryDetails = {
      ...mockDeliveryDetails,
      postcode: 'INVALID',
    };

    render(
      <DeliveryStep
        deliveryDetails={invalidPostcode}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid postcode format/i)).toBeInTheDocument();
    });
  });

  it('validates UK phone number format', async () => {
    const invalidPhone: DeliveryDetails = {
      ...mockDeliveryDetails,
      phone: '123',
    };

    render(
      <DeliveryStep
        deliveryDetails={invalidPhone}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
    });
  });

  it('calls onContinue when all validations pass', async () => {
    render(
      <DeliveryStep
        deliveryDetails={mockDeliveryDetails}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockOnContinue).toHaveBeenCalled();
    });
  });

  it('shows all delivery day options in dropdown', () => {
    render(
      <DeliveryStep
        deliveryDetails={mockDeliveryDetails}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    const dropdown = screen.getByLabelText(/preferred delivery day/i);
    const options = (dropdown as HTMLSelectElement).options;

    expect(options).toHaveLength(7); // 6 days + placeholder
    expect(options[1].value).toBe('Monday');
    expect(options[6].value).toBe('Saturday');
  });

  it('allows optional delivery instructions field to be empty', async () => {
    const noInstructions: DeliveryDetails = {
      ...mockDeliveryDetails,
      instructions: '',
    };

    render(
      <DeliveryStep
        deliveryDetails={noInstructions}
        onUpdate={mockOnUpdate}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockOnContinue).toHaveBeenCalled();
    });
  });
});
