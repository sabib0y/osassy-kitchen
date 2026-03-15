import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationPreferences from '../../../components/user/NotificationPreferences';
import { NotificationPreferences as NotificationPreferencesType } from '../../../types/user';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPreferences: NotificationPreferencesType = {
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
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('NotificationPreferences', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  it('renders loading state when preferences are undefined', () => {
    render(
      <NotificationPreferences
        preferences={undefined}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Loading notification preferences...')).toBeInTheDocument();
  });

  it('renders notification preferences correctly', () => {
    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Notifications')).toBeInTheDocument();

    // Check if switches are in correct states
    const emailOrderConfirmationInput = document.getElementById('emailOrderConfirmation') as HTMLInputElement;
    expect(emailOrderConfirmationInput.checked).toBe(true);

    const emailPromotionsInput = document.getElementById('emailPromotions') as HTMLInputElement;
    expect(emailPromotionsInput.checked).toBe(false);
  });

  it('toggles email notification settings', async () => {
    const user = userEvent.setup();

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    const promotionsToggle = document.getElementById('emailPromotions') as HTMLInputElement;
    expect(promotionsToggle.checked).toBe(false);

    await user.click(promotionsToggle);
    expect(promotionsToggle.checked).toBe(true);
  });

  it('toggles SMS notification settings', async () => {
    const user = userEvent.setup();

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    // Find SMS order confirmation toggle
    const smsOrderToggle = document.getElementById('smsOrderConfirmation') as HTMLInputElement;

    expect(smsOrderToggle.checked).toBe(false);

    await user.click(smsOrderToggle);
    expect(smsOrderToggle.checked).toBe(true);
  });

  it('saves preferences when Save button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    const saveButton = screen.getByText('Save Preferences');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockPreferences)
      });
    });

    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('shows success message after successful save', async () => {
    const user = userEvent.setup();

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    const saveButton = screen.getByText('Save Preferences');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Notification preferences updated successfully!')).toBeInTheDocument();
    });
  });

  it('shows error message when save fails', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to update preferences' })
    });

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    const saveButton = screen.getByText('Save Preferences');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update notification preferences')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    
    // Mock slow API response
    mockFetch.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    const saveButton = screen.getByText('Save Preferences');
    await user.click(saveButton);

    // Check that button shows loading state
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    // Check that toggles are disabled during submission
    const toggles = screen.getAllByRole('checkbox');
    toggles.forEach(toggle => {
      expect(toggle).toBeDisabled();
    });
  });

  it('updates local state when toggles are changed', async () => {
    const user = userEvent.setup();

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    const promotionsToggle = document.getElementById('emailPromotions') as HTMLInputElement;
    const newsletterToggle = document.getElementById('emailNewsletter') as HTMLInputElement;

    // Toggle multiple settings
    await user.click(promotionsToggle);
    await user.click(newsletterToggle);

    expect(promotionsToggle.checked).toBe(true);
    expect(newsletterToggle.checked).toBe(true);

    // Save and check that updated preferences are sent
    const saveButton = screen.getByText('Save Preferences');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...mockPreferences,
          emailNotifications: {
            ...mockPreferences.emailNotifications,
            promotionsAndOffers: true,
            newsletter: true
          }
        })
      });
    });
  });

  it('displays correct section descriptions', () => {
    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Receive updates via email about your orders and account.')).toBeInTheDocument();
    expect(screen.getByText('Receive important updates via text message.')).toBeInTheDocument();
  });

  it('displays correct notification item descriptions', () => {
    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Get notified when your order is confirmed')).toBeInTheDocument();
    expect(screen.getByText('Get updates when your order status changes')).toBeInTheDocument();
    expect(screen.getByText('Get reminders before your delivery arrives')).toBeInTheDocument();
    expect(screen.getByText('Get notified about subscription changes and renewals')).toBeInTheDocument();
  });

  it('maintains toggle state consistency across sections', async () => {
    const user = userEvent.setup();

    render(
      <NotificationPreferences
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    // Email order confirmation should be enabled, SMS should be disabled
    const emailToggle = document.getElementById('emailOrderConfirmation') as HTMLInputElement;
    const smsToggle = document.getElementById('smsOrderConfirmation') as HTMLInputElement;

    expect(emailToggle.checked).toBe(true);
    expect(smsToggle.checked).toBe(false);

    // Toggle SMS and verify it changes independently
    await user.click(smsToggle);
    expect(smsToggle.checked).toBe(true);
    expect(emailToggle.checked).toBe(true); // Should remain unchanged
  });
});