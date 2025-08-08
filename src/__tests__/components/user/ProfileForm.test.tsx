import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm from '../../../components/user/ProfileForm';
import { UserProfile } from '../../../types/user';

const mockProfile: UserProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+44 7123 456789',
  addresses: [],
  notificationPreferences: {
    id: 'notif_1',
    userId: '1',
    emailNotifications: {
      orderConfirmation: true,
      orderStatusUpdates: true,
      deliveryReminders: true,
      subscriptionUpdates: true,
      promotionsAndOffers: false,
      newsletter: false
    },
    smsNotifications: {
      orderConfirmation: false,
      deliveryReminders: false,
      orderStatusUpdates: false
    },
    pushNotifications: {
      orderConfirmation: true,
      orderStatusUpdates: true,
      deliveryReminders: true,
      promotions: false
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  createdAt: '2023-01-01T00:00:00Z',
  emailVerified: true
};

describe('ProfileForm', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  it('renders loading state correctly', () => {
    render(
      <ProfileForm
        profile={null}
        onUpdate={mockOnUpdate}
        loading={true}
      />
    );

    expect(screen.getByTestId('profile-form-loading')).toBeInTheDocument();
  });

  it('renders form with profile data correctly', () => {
    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    // Check if form fields are populated
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+44 7123 456789')).toBeInTheDocument();

    // Check if email field is disabled
    const emailField = screen.getByDisplayValue('john@example.com');
    expect(emailField).toBeDisabled();

    // Check if account information is displayed
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('validates required name field', async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const nameField = screen.getByDisplayValue('John Doe');
    const saveButton = screen.getByText('Save Changes');

    // Clear the name field
    await user.clear(nameField);
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('validates name length', async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const nameField = screen.getByDisplayValue('John Doe');
    const saveButton = screen.getByText('Save Changes');

    // Enter a name that's too short
    await user.clear(nameField);
    await user.type(nameField, 'A');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters long')).toBeInTheDocument();
    });

    // Enter a name that's too long
    await user.clear(nameField);
    await user.type(nameField, 'A'.repeat(51));
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be less than 50 characters')).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const phoneField = screen.getByDisplayValue('+44 7123 456789');
    const saveButton = screen.getByText('Save Changes');

    // Enter invalid phone number
    await user.clear(phoneField);
    await user.type(phoneField, '123');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('allows empty phone number (optional field)', async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const phoneField = screen.getByDisplayValue('+44 7123 456789');
    const nameField = screen.getByDisplayValue('John Doe');
    const saveButton = screen.getByText('Save Changes');

    // Clear phone field but make sure name is different to trigger form submission
    await user.clear(phoneField);
    await user.clear(nameField);
    await user.type(nameField, 'Jane Doe');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'john@example.com',
        phone: ''
      });
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const nameField = screen.getByDisplayValue('John Doe');
    const phoneField = screen.getByDisplayValue('+44 7123 456789');
    const saveButton = screen.getByText('Save Changes');

    // Update the name
    await user.clear(nameField);
    await user.type(nameField, 'Jane Smith');

    // Update phone
    await user.clear(phoneField);
    await user.type(phoneField, '+44 7987 654321');

    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'john@example.com',
        phone: '+44 7987 654321'
      });
    });
  });

  it('prevents submission when no changes made', async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    
    // Button should be disabled when no changes are made
    expect(saveButton).toBeDisabled();

    await user.click(saveButton);
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('shows success message after successful update', async () => {
    const mockSuccessfulUpdate = jest.fn().mockResolvedValue(undefined);

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockSuccessfulUpdate}
        loading={false}
      />
    );

    const nameField = screen.getByDisplayValue('John Doe');
    const saveButton = screen.getByText('Save Changes');

    // Make a change
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Jane Smith');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('shows error message when update fails', async () => {
    const mockFailedUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockFailedUpdate}
        loading={false}
      />
    );

    const nameField = screen.getByDisplayValue('John Doe');
    const saveButton = screen.getByText('Save Changes');

    // Make a change
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Jane Smith');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const mockSlowUpdate = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockSlowUpdate}
        loading={false}
      />
    );

    const nameField = screen.getByDisplayValue('John Doe');
    const saveButton = screen.getByText('Save Changes');

    // Make a change and submit
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Jane Smith');
    await userEvent.click(saveButton);

    // Check that form is disabled during submission
    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
      expect(nameField).toBeDisabled();
    });
  });

  it('resets form to original values', async () => {
    const user = userEvent.setup();

    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const nameField = screen.getByDisplayValue('John Doe');
    const resetButton = screen.getByText('Reset Changes');

    // Make changes
    await user.clear(nameField);
    await user.type(nameField, 'Jane Smith');

    // Reset should initially be disabled when no changes are made
    // Note: The reset button is only disabled when no changes are detected

    // After making changes, reset should be enabled
    await waitFor(() => {
      expect(resetButton).not.toBeDisabled();
    });

    // Click reset
    await user.click(resetButton);

    // Form should be back to original values
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('displays unverified email status correctly', () => {
    const unverifiedProfile = {
      ...mockProfile,
      emailVerified: false
    };

    render(
      <ProfileForm
        profile={unverifiedProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays member since date correctly', () => {
    render(
      <ProfileForm
        profile={mockProfile}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    // Check if the date is formatted correctly (British format)
    expect(screen.getByText('01/01/2023')).toBeInTheDocument();
  });

  it('handles profile with no phone number', () => {
    const profileWithoutPhone = {
      ...mockProfile,
      phone: null
    };

    render(
      <ProfileForm
        profile={profileWithoutPhone}
        onUpdate={mockOnUpdate}
        loading={false}
      />
    );

    const phoneField = screen.getByPlaceholderText('Enter your phone number (optional)');
    expect(phoneField).toHaveValue('');
  });
});