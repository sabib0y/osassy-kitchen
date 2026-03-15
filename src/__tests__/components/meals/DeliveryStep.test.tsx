import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeliveryStep from '../../../components/meals/DeliveryStep';
import {
  DeliveryDetails,
  DELIVERY_DAYS,
  WEEKDAY_TIME_SLOTS,
  SATURDAY_TIME_SLOTS,
} from '../../../types/meal-plans';

describe('DeliveryStep Component', () => {
  const validDeliveryDetails: DeliveryDetails = {
    address: '123 Test Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    phone: '07700900000',
    instructions: 'Ring the bell',
    preferredDay: 'Monday',
    preferredTimeSlot: '9:00 AM - 12:00 PM',
  };

  const emptyDeliveryDetails: DeliveryDetails = {
    address: '',
    city: '',
    postcode: '',
    phone: '',
    instructions: '',
    preferredDay: '',
    preferredTimeSlot: '',
  };

  const mockOnContinue = jest.fn();
  const mockOnBack = jest.fn();

  const renderDeliveryStep = (initialData?: DeliveryDetails) => {
    return render(
      <DeliveryStep
        initialData={initialData}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders all form fields correctly', () => {
      renderDeliveryStep();

      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delivery instructions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preferred delivery day/i)).toBeInTheDocument();
    });

    it('renders header with correct title and subtitle', () => {
      renderDeliveryStep();

      expect(screen.getByRole('heading', { name: /delivery details/i })).toBeInTheDocument();
      expect(screen.getByText(/where should we deliver your delicious meals/i)).toBeInTheDocument();
    });

    it('renders continue and back buttons', () => {
      renderDeliveryStep();

      expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to meals/i })).toBeInTheDocument();
    });

    it('displays pre-filled values when initialData is provided', () => {
      renderDeliveryStep(validDeliveryDetails);

      expect(screen.getByDisplayValue('123 Test Street')).toBeInTheDocument();
      expect(screen.getByDisplayValue('London')).toBeInTheDocument();
      expect(screen.getByDisplayValue('SW1A 1AA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('07700900000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ring the bell')).toBeInTheDocument();
    });

    it('shows all delivery day options in dropdown', () => {
      renderDeliveryStep();

      const dropdown = screen.getByLabelText(/preferred delivery day/i) as HTMLSelectElement;
      const options = Array.from(dropdown.options);

      // 6 days + placeholder option
      expect(options).toHaveLength(7);
      expect(options[0].value).toBe('');
      expect(options[0].text).toBe('Select a day');

      DELIVERY_DAYS.forEach((day, index) => {
        expect(options[index + 1].value).toBe(day);
        expect(options[index + 1].text).toBe(day);
      });
    });

    it('marks required fields with asterisk', () => {
      renderDeliveryStep();

      const requiredIndicators = screen.getAllByText('*');
      // Address, City, Postcode, Phone, Preferred Day = 5 required fields
      // Time slot is also required but only shows after day selection
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(5);
    });

    it('shows delivery instructions as optional', () => {
      renderDeliveryStep();

      expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();
    });
  });

  describe('Required Field Validation', () => {
    it('validates all required fields when form is empty', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/address is required/i)).toBeInTheDocument();
        expect(screen.getByText(/city is required/i)).toBeInTheDocument();
        expect(screen.getByText(/postcode is required/i)).toBeInTheDocument();
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
        expect(screen.getByText(/please select a preferred delivery day/i)).toBeInTheDocument();
      });

      expect(mockOnContinue).not.toHaveBeenCalled();
    });

    it('validates address is required', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        address: '',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/address is required/i)).toBeInTheDocument();
      });
    });

    it('validates city is required', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        city: '',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/city is required/i)).toBeInTheDocument();
      });
    });

    it('validates postcode is required', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        postcode: '',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/postcode is required/i)).toBeInTheDocument();
      });
    });

    it('validates phone is required', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        phone: '',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      });
    });

    it('validates preferred day is required', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        preferredDay: '',
        preferredTimeSlot: '',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select a preferred delivery day/i)).toBeInTheDocument();
      });
    });

    it('validates preferred time slot is required', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        preferredTimeSlot: '',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select a preferred delivery time/i)).toBeInTheDocument();
      });
    });

    it('clears error when field is corrected', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/address is required/i)).toBeInTheDocument();
      });

      const addressInput = screen.getByLabelText(/street address/i);
      fireEvent.change(addressInput, { target: { value: '456 New Street' } });

      await waitFor(() => {
        expect(screen.queryByText(/address is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('UK Postcode Validation', () => {
    const validPostcodes = [
      'SW1A 1AA',
      'SW1A1AA',
      'EC1A 1BB',
      'W1A 0AX',
      'M1 1AE',
      'B33 8TH',
      'CR2 6XH',
      'DN55 1PT',
      'L1 8JQ',
    ];

    const invalidPostcodes = [
      'INVALID',
      '12345',
      'ABC 123',
      'SW1A',
      '1AA',
      'SW1A 1A',
      'SW1A 1AAA',
      '',
    ];

    validPostcodes.forEach((postcode) => {
      it(`accepts valid UK postcode: ${postcode}`, async () => {
        const data: DeliveryDetails = {
          ...validDeliveryDetails,
          postcode,
        };
        renderDeliveryStep(data);

        fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

        await waitFor(() => {
          expect(screen.queryByText(/valid UK postcode/i)).not.toBeInTheDocument();
        });
      });
    });

    invalidPostcodes.filter(p => p !== '').forEach((postcode) => {
      it(`rejects invalid UK postcode: ${postcode}`, async () => {
        const data: DeliveryDetails = {
          ...validDeliveryDetails,
          postcode,
        };
        renderDeliveryStep(data);

        fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

        await waitFor(() => {
          expect(screen.getByText(/please enter a valid UK postcode/i)).toBeInTheDocument();
        });
      });
    });

    it('converts postcode to uppercase when typing', () => {
      renderDeliveryStep();

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: 'sw1a 1aa' } });

      expect(postcodeInput).toHaveValue('SW1A 1AA');
    });
  });

  describe('UK Phone Number Validation', () => {
    const validPhoneNumbers = [
      '07700900000',
      '07700 900 000',
      '+447700900000',
      '+44 7700 900 000',
      '01onal valid landline',
      '02012345678',
      '01onal valid landline',
    ];

    const invalidPhoneNumbers = [
      '123',
      'abcdefghijk',
      '1234567890123456',
      '+1 555 123 4567',
    ];

    it('accepts valid UK mobile number: 07700900000', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        phone: '07700900000',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockOnContinue).toHaveBeenCalled();
      });
    });

    it('accepts valid UK mobile number with spaces: 07700 900 000', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        phone: '07700 900 000',
      };
      renderDeliveryStep(data);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockOnContinue).toHaveBeenCalled();
      });
    });

    invalidPhoneNumbers.forEach((phone) => {
      it(`rejects invalid phone number: ${phone}`, async () => {
        const data: DeliveryDetails = {
          ...validDeliveryDetails,
          phone,
        };
        renderDeliveryStep(data);

        fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

        await waitFor(() => {
          expect(screen.getByText(/please enter a valid UK phone number/i)).toBeInTheDocument();
        });
      });
    });

    it('shows helper text about delivery updates', () => {
      renderDeliveryStep();

      expect(screen.getByText(/we'll text you delivery updates/i)).toBeInTheDocument();
    });
  });

  describe('Time Slot Selection', () => {
    it('does not show time slots when no day is selected', () => {
      renderDeliveryStep(emptyDeliveryDetails);

      // Time slot section should not be visible
      expect(screen.queryByLabelText(/preferred delivery time/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/9:00 AM - 12:00 PM/i)).not.toBeInTheDocument();
    });

    it('shows time slot options after day is selected', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
      fireEvent.change(dayDropdown, { target: { value: 'Monday' } });

      await waitFor(() => {
        // Time slot buttons should appear
        expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument();
      });
    });

    it('shows 3 time slots for weekdays (Monday-Friday)', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      for (const day of weekdays) {
        const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
        fireEvent.change(dayDropdown, { target: { value: day } });

        await waitFor(() => {
          const timeSlotButtons = screen.getAllByRole('button').filter(
            (btn) => WEEKDAY_TIME_SLOTS.some((slot) => btn.textContent?.includes(slot))
          );
          expect(timeSlotButtons).toHaveLength(3);
        });

        // Verify all weekday time slots are present
        WEEKDAY_TIME_SLOTS.forEach((slot) => {
          expect(screen.getByText(slot)).toBeInTheDocument();
        });
      }
    });

    it('shows 2 time slots for Saturday', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
      fireEvent.change(dayDropdown, { target: { value: 'Saturday' } });

      await waitFor(() => {
        const timeSlotButtons = screen.getAllByRole('button').filter(
          (btn) => SATURDAY_TIME_SLOTS.some((slot) => btn.textContent?.includes(slot))
        );
        expect(timeSlotButtons).toHaveLength(2);
      });

      // Verify all Saturday time slots are present
      SATURDAY_TIME_SLOTS.forEach((slot) => {
        expect(screen.getByText(slot)).toBeInTheDocument();
      });

      // Verify weekday slots are not present
      expect(screen.queryByText('3:00 PM - 6:00 PM')).not.toBeInTheDocument();
    });

    it('shows correct helper text for weekday delivery', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
      fireEvent.change(dayDropdown, { target: { value: 'Wednesday' } });

      await waitFor(() => {
        expect(screen.getByText(/weekday delivery windows/i)).toBeInTheDocument();
      });
    });

    it('shows correct helper text for Saturday delivery', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
      fireEvent.change(dayDropdown, { target: { value: 'Saturday' } });

      await waitFor(() => {
        expect(screen.getByText(/saturday delivery windows/i)).toBeInTheDocument();
      });
    });

    it('resets time slot when day changes', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        preferredDay: 'Monday',
        preferredTimeSlot: '9:00 AM - 12:00 PM',
      };
      renderDeliveryStep(data);

      // Verify initial time slot is selected
      const initialSlotButton = screen.getByRole('button', { name: /9:00 AM - 12:00 PM/i });
      expect(initialSlotButton).toHaveClass('timeSlotButtonActive');

      // Change the day
      const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
      fireEvent.change(dayDropdown, { target: { value: 'Tuesday' } });

      // Verify time slot is reset (no button should be active)
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(
          (btn) => WEEKDAY_TIME_SLOTS.some((slot) => btn.textContent?.includes(slot))
        );
        slotButtons.forEach((btn) => {
          expect(btn).not.toHaveClass('timeSlotButtonActive');
        });
      });
    });

    it('resets time slot when changing from weekday to Saturday', async () => {
      const data: DeliveryDetails = {
        ...validDeliveryDetails,
        preferredDay: 'Monday',
        preferredTimeSlot: '3:00 PM - 6:00 PM',
      };
      renderDeliveryStep(data);

      // Change to Saturday
      const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
      fireEvent.change(dayDropdown, { target: { value: 'Saturday' } });

      await waitFor(() => {
        // The old time slot should not exist
        expect(screen.queryByText('3:00 PM - 6:00 PM')).not.toBeInTheDocument();
        // Saturday slots should be visible
        expect(screen.getByText('10:00 AM - 1:00 PM')).toBeInTheDocument();
      });
    });

    it('allows selecting a time slot by clicking', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      const dayDropdown = screen.getByLabelText(/preferred delivery day/i);
      fireEvent.change(dayDropdown, { target: { value: 'Monday' } });

      await waitFor(() => {
        expect(screen.getByText('12:00 PM - 3:00 PM')).toBeInTheDocument();
      });

      const timeSlotButton = screen.getByRole('button', { name: /12:00 PM - 3:00 PM/i });
      fireEvent.click(timeSlotButton);

      expect(timeSlotButton).toHaveClass('timeSlotButtonActive');
    });
  });

  describe('Form Submission', () => {
    it('calls onContinue with correct data when form is valid', async () => {
      renderDeliveryStep(validDeliveryDetails);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockOnContinue).toHaveBeenCalledTimes(1);
        expect(mockOnContinue).toHaveBeenCalledWith(validDeliveryDetails);
      });
    });

    it('does not call onContinue when form is invalid', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/address is required/i)).toBeInTheDocument();
      });

      expect(mockOnContinue).not.toHaveBeenCalled();
    });

    it('includes optional instructions in submission data', async () => {
      const dataWithInstructions: DeliveryDetails = {
        ...validDeliveryDetails,
        instructions: 'Leave at the door',
      };
      renderDeliveryStep(dataWithInstructions);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockOnContinue).toHaveBeenCalledWith(
          expect.objectContaining({
            instructions: 'Leave at the door',
          })
        );
      });
    });

    it('allows submission without delivery instructions', async () => {
      const dataWithoutInstructions: DeliveryDetails = {
        ...validDeliveryDetails,
        instructions: '',
      };
      renderDeliveryStep(dataWithoutInstructions);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockOnContinue).toHaveBeenCalled();
      });
    });

    it('submits form data with user input changes', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      // Fill in all required fields
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: '789 User Street' },
      });
      fireEvent.change(screen.getByLabelText(/city/i), {
        target: { value: 'Manchester' },
      });
      fireEvent.change(screen.getByLabelText(/postcode/i), {
        target: { value: 'M1 1AE' },
      });
      fireEvent.change(screen.getByLabelText(/phone number/i), {
        target: { value: '07700123456' },
      });
      fireEvent.change(screen.getByLabelText(/preferred delivery day/i), {
        target: { value: 'Friday' },
      });

      await waitFor(() => {
        expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /9:00 AM - 12:00 PM/i }));

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(mockOnContinue).toHaveBeenCalledWith({
          address: '789 User Street',
          city: 'Manchester',
          postcode: 'M1 1AE',
          phone: '07700123456',
          instructions: '',
          preferredDay: 'Friday',
          preferredTimeSlot: '9:00 AM - 12:00 PM',
        });
      });
    });
  });

  describe('Back Button', () => {
    it('calls onBack when back button is clicked', () => {
      renderDeliveryStep(validDeliveryDetails);

      const backButton = screen.getByRole('button', { name: /back to meals/i });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('does not submit form when back button is clicked', () => {
      renderDeliveryStep(validDeliveryDetails);

      const backButton = screen.getByRole('button', { name: /back to meals/i });
      fireEvent.click(backButton);

      expect(mockOnContinue).not.toHaveBeenCalled();
    });
  });

  describe('Input Interactions', () => {
    it('updates address field on change', () => {
      renderDeliveryStep();

      const addressInput = screen.getByLabelText(/street address/i);
      fireEvent.change(addressInput, { target: { value: 'New Address' } });

      expect(addressInput).toHaveValue('New Address');
    });

    it('updates city field on change', () => {
      renderDeliveryStep();

      const cityInput = screen.getByLabelText(/city/i);
      fireEvent.change(cityInput, { target: { value: 'Birmingham' } });

      expect(cityInput).toHaveValue('Birmingham');
    });

    it('updates phone field on change', () => {
      renderDeliveryStep();

      const phoneInput = screen.getByLabelText(/phone number/i);
      fireEvent.change(phoneInput, { target: { value: '07777777777' } });

      expect(phoneInput).toHaveValue('07777777777');
    });

    it('updates instructions field on change', () => {
      renderDeliveryStep();

      const instructionsInput = screen.getByLabelText(/delivery instructions/i);
      fireEvent.change(instructionsInput, { target: { value: 'Gate code: 1234' } });

      expect(instructionsInput).toHaveValue('Gate code: 1234');
    });

    it('has correct placeholder texts', () => {
      renderDeliveryStep();

      expect(screen.getByPlaceholderText('123 High Street')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('London')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('SW1A 1AA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('07700 900000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/gate code, parking information/i)).toBeInTheDocument();
    });

    it('has correct autocomplete attributes', () => {
      renderDeliveryStep();

      expect(screen.getByLabelText(/street address/i)).toHaveAttribute('autocomplete', 'street-address');
      expect(screen.getByLabelText(/city/i)).toHaveAttribute('autocomplete', 'address-level2');
      expect(screen.getByLabelText(/postcode/i)).toHaveAttribute('autocomplete', 'postal-code');
      expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('autocomplete', 'tel');
    });
  });

  describe('Error Styling', () => {
    it('applies error styling to invalid fields', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        const addressInput = screen.getByLabelText(/street address/i);
        expect(addressInput).toHaveClass('inputError');
      });
    });

    it('removes error styling when field is corrected', async () => {
      renderDeliveryStep(emptyDeliveryDetails);

      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        const addressInput = screen.getByLabelText(/street address/i);
        expect(addressInput).toHaveClass('inputError');
      });

      const addressInput = screen.getByLabelText(/street address/i);
      fireEvent.change(addressInput, { target: { value: 'Valid Address' } });

      await waitFor(() => {
        expect(addressInput).not.toHaveClass('inputError');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper input types', () => {
      renderDeliveryStep();

      expect(screen.getByLabelText(/street address/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/city/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/postcode/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('type', 'tel');
    });

    it('has proper form structure', () => {
      renderDeliveryStep();

      // All inputs should have associated labels
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delivery instructions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preferred delivery day/i)).toBeInTheDocument();
    });

    it('instructions textarea has proper rows attribute', () => {
      renderDeliveryStep();

      const textarea = screen.getByLabelText(/delivery instructions/i);
      expect(textarea).toHaveAttribute('rows', '3');
    });
  });
});
