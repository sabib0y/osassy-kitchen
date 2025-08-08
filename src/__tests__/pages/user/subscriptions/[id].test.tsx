import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import SubscriptionManagementPage from '../../../../pages/user/subscriptions/[id]';
import { useSubscription } from '../../../../hooks/useSubscription';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('next-auth/react');
jest.mock('../../../../hooks/useSubscription');
jest.mock('../../../../components/user/UserLayout', () => {
  return function MockUserLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="user-layout">{children}</div>;
  };
});
jest.mock('../../../../components/user/SubscriptionDetails', () => {
  return function MockSubscriptionDetails({ subscription }: { subscription: any }) {
    return <div data-testid="subscription-details">Details for {subscription.planName}</div>;
  };
});
jest.mock('../../../../components/user/SubscriptionEditor', () => {
  return function MockSubscriptionEditor({ 
    subscription, 
    onSave, 
    onCancel 
  }: { 
    subscription: any; 
    onSave: (items: Array<{ menuItemId: string; quantity: number }>) => Promise<void>; 
    onCancel: () => void; 
  }) {
    return (
      <div data-testid="subscription-editor">
        <button onClick={() => onSave([{ menuItemId: 'test-item', quantity: 2 }])}>
          Save Changes
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>;

const mockSubscription = {
  id: 'test-subscription-id',
  planName: 'Weekly Nigerian Delights',
  interval: 'WEEKLY' as const,
  price: 2500,
  status: 'ACTIVE' as const,
  startDate: '2024-01-01T00:00:00.000Z',
  nextDeliveryDate: '2024-01-08T00:00:00.000Z',
  stripeSubscriptionId: 'sub_test123',
  items: [
    {
      id: 'item-1',
      quantity: 2,
      menuItem: {
        id: 'menu-item-1',
        name: 'Jollof Rice',
        description: 'Spicy Nigerian rice dish',
        price: 1000,
        imageUrl: null,
        category: 'Main Course'
      }
    }
  ],
  recentOrders: []
};

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

describe('SubscriptionManagementPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      back: mockRouterBack,
      query: { id: 'test-subscription-id' },
      pathname: '/user/subscriptions/[id]',
      route: '/user/subscriptions/[id]',
      asPath: '/user/subscriptions/test-subscription-id',
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      }
    } as any);

    mockUseSession.mockReturnValue({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      status: 'authenticated'
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when subscription is loading', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        loading: true,
        error: null,
        isUpdating: false,
        updateSubscription: jest.fn(),
        pauseSubscription: jest.fn(),
        resumeSubscription: jest.fn(),
        cancelSubscription: jest.fn(),
        refetch: jest.fn()
      });

      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      expect(screen.getByText('Loading subscription details...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when subscription fails to load', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        loading: false,
        error: 'Subscription not found',
        isUpdating: false,
        updateSubscription: jest.fn(),
        pauseSubscription: jest.fn(),
        resumeSubscription: jest.fn(),
        cancelSubscription: jest.fn(),
        refetch: jest.fn()
      });

      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      expect(screen.getByText('Failed to Load Subscription')).toBeInTheDocument();
      expect(screen.getByText('Subscription not found')).toBeInTheDocument();
    });

    it('should handle go back on error', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        loading: false,
        error: 'Subscription not found',
        isUpdating: false,
        updateSubscription: jest.fn(),
        pauseSubscription: jest.fn(),
        resumeSubscription: jest.fn(),
        cancelSubscription: jest.fn(),
        refetch: jest.fn()
      });

      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      fireEvent.click(screen.getByText('Go Back'));
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  describe('Not Found State', () => {
    it('should show not found message when subscription is null but not loading', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        loading: false,
        error: null,
        isUpdating: false,
        updateSubscription: jest.fn(),
        pauseSubscription: jest.fn(),
        resumeSubscription: jest.fn(),
        cancelSubscription: jest.fn(),
        refetch: jest.fn()
      });

      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      expect(screen.getByText('Subscription Not Found')).toBeInTheDocument();
      expect(screen.getByText('View All Subscriptions')).toBeInTheDocument();
    });
  });

  describe('Loaded Subscription', () => {
    beforeEach(() => {
      mockUseSubscription.mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        isUpdating: false,
        updateSubscription: jest.fn().mockResolvedValue(mockSubscription),
        pauseSubscription: jest.fn().mockResolvedValue(mockSubscription),
        resumeSubscription: jest.fn().mockResolvedValue(mockSubscription),
        cancelSubscription: jest.fn().mockResolvedValue(mockSubscription),
        refetch: jest.fn()
      });
    });

    it('should render subscription details by default', () => {
      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      expect(screen.getByText('Weekly Nigerian Delights')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-details')).toBeInTheDocument();
    });

    it('should show edit mode when edit button is clicked', () => {
      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      fireEvent.click(screen.getByText('Edit Items'));
      expect(screen.getByTestId('subscription-editor')).toBeInTheDocument();
    });

    it('should handle back button navigation', () => {
      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      fireEvent.click(screen.getByText('Back to Subscriptions'));
      expect(mockRouterBack).toHaveBeenCalled();
    });

    describe('Subscription Actions', () => {
      it('should show pause button for active subscription', () => {
        render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

        expect(screen.getByText('Pause')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      it('should show pause confirmation modal when pause is clicked', async () => {
        render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

        fireEvent.click(screen.getByText('Pause'));

        await waitFor(() => {
          expect(screen.getByRole('heading', { name: /pause subscription/i })).toBeInTheDocument();
        });
      });

      it('should show cancel confirmation modal when cancel is clicked', async () => {
        render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
          expect(screen.getByRole('heading', { name: /cancel subscription/i })).toBeInTheDocument();
          expect(screen.getAllByText(/This action cannot be undone/)[0]).toBeInTheDocument();
        });
      });

      it('should call pause subscription when confirmed', async () => {
        const mockPauseSubscription = jest.fn().mockResolvedValue(mockSubscription);
        mockUseSubscription.mockReturnValue({
          subscription: mockSubscription,
          loading: false,
          error: null,
          isUpdating: false,
          updateSubscription: jest.fn(),
          pauseSubscription: mockPauseSubscription,
          resumeSubscription: jest.fn(),
          cancelSubscription: jest.fn(),
          refetch: jest.fn()
        });

        render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

        fireEvent.click(screen.getByText('Pause'));

        await waitFor(() => {
          expect(screen.getByRole('heading', { name: /pause subscription/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /pause subscription/i }));

        await waitFor(() => {
          expect(mockPauseSubscription).toHaveBeenCalled();
        });
      });
    });

    describe('Edit Mode', () => {
      it('should switch to edit mode and back to view mode', () => {
        render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

        // Enter edit mode
        fireEvent.click(screen.getByText('Edit Items'));
        expect(screen.getByTestId('subscription-editor')).toBeInTheDocument();

        // Exit edit mode
        fireEvent.click(screen.getByText('Cancel Edit'));
        expect(screen.getByTestId('subscription-details')).toBeInTheDocument();
      });

      it('should handle save subscription changes', async () => {
        const mockUpdateSubscription = jest.fn().mockResolvedValue(mockSubscription);
        mockUseSubscription.mockReturnValue({
          subscription: mockSubscription,
          loading: false,
          error: null,
          isUpdating: false,
          updateSubscription: mockUpdateSubscription,
          pauseSubscription: jest.fn(),
          resumeSubscription: jest.fn(),
          cancelSubscription: jest.fn(),
          refetch: jest.fn()
        });

        render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

        // Enter edit mode
        fireEvent.click(screen.getByText('Edit Items'));

        // Save changes
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
          expect(mockUpdateSubscription).toHaveBeenCalledWith({
            items: [{ menuItemId: 'test-item', quantity: 2 }]
          });
        });
      });
    });
  });

  describe('Paused Subscription', () => {
    it('should show resume button for paused subscription', () => {
      const pausedSubscription = { ...mockSubscription, status: 'PAUSED' as const };
      mockUseSubscription.mockReturnValue({
        subscription: pausedSubscription,
        loading: false,
        error: null,
        isUpdating: false,
        updateSubscription: jest.fn(),
        pauseSubscription: jest.fn(),
        resumeSubscription: jest.fn().mockResolvedValue(pausedSubscription),
        cancelSubscription: jest.fn(),
        refetch: jest.fn()
      });

      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    });
  });

  describe('Cancelled Subscription', () => {
    it('should not show action buttons for cancelled subscription', () => {
      const cancelledSubscription = { ...mockSubscription, status: 'CANCELLED' as const };
      mockUseSubscription.mockReturnValue({
        subscription: cancelledSubscription,
        loading: false,
        error: null,
        isUpdating: false,
        updateSubscription: jest.fn(),
        pauseSubscription: jest.fn(),
        resumeSubscription: jest.fn(),
        cancelSubscription: jest.fn(),
        refetch: jest.fn()
      });

      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      expect(screen.queryByText('Pause')).not.toBeInTheDocument();
      expect(screen.queryByText('Resume')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit Items')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons when updating', () => {
      mockUseSubscription.mockReturnValue({
        subscription: mockSubscription,
        loading: false,
        error: null,
        isUpdating: true,
        updateSubscription: jest.fn(),
        pauseSubscription: jest.fn(),
        resumeSubscription: jest.fn(),
        cancelSubscription: jest.fn(),
        refetch: jest.fn()
      });

      render(<SubscriptionManagementPage subscriptionId="test-subscription-id" />);

      expect(screen.getByText('Edit Items')).toBeDisabled();
      expect(screen.getByText('Pause')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });
});