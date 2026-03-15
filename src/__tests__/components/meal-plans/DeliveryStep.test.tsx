import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeliveryStep from '../../../components/meals/DeliveryStep';
import { DeliveryDetails } from '../../../types/meal-plans';

describe('DeliveryStep Component', () => {
  const mockDeliveryDetails: DeliveryDetails = {
    address: '123 Test Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    phone: '07700900000',
    instructions: 'Ring the bell',
    preferredDay: 'Monday',
    preferredTimeSlot: '9:00 AM - 12:00 PM',
  };

  const mockOnContinue = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(
      <DeliveryStep
        initialData={mockDeliveryDetails}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delivery instructions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred delivery day/i)).toBeInTheDocument();
  });

  it('displays pre-filled values when deliveryDetails are provided', () => {
    render(
      <DeliveryStep
        initialData={mockDeliveryDetails}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument();
    expect(screen.getByDisplayValue('London')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SW1A 1AA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('07700900000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ring the bell')).toBeInTheDocument();
  });

  it('validates required fields before continuing', async () => {
    const emptyDetails: DeliveryDetails = {
      address: '',
      city: '',
      postcode: '',
      phone: '',
      preferredDay: '',
      preferredTimeSlot: '',
    };

    render(
      <DeliveryStep
        initialData={emptyDetails}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
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
        initialData={invalidPostcode}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/valid UK postcode/i)).toBeInTheDocument();
    });
  });

  it('validates UK phone number format', async () => {
    const invalidPhone: DeliveryDetails = {
      ...mockDeliveryDetails,
      phone: '123',
    };

    render(
      <DeliveryStep
        initialData={invalidPhone}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/valid UK phone number/i)).toBeInTheDocument();
    });
  });

  it('calls onContinue when all validations pass', async () => {
    render(
      <DeliveryStep
        initialData={mockDeliveryDetails}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
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
        initialData={mockDeliveryDetails}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
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
        initialData={noInstructions}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue to payment/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockOnContinue).toHaveBeenCalled();
    });
  });
});
