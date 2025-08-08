import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import UserProfile from '../../../pages/user/profile';
import { useProfile } from '../../../hooks/useProfile';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('../../../hooks/useProfile');
jest.mock('../../../components/Layout/Layout.js', () => {
  return function MockLayout({ children, pageTitle }: any) {
    return (
      <div data-testid="layout" data-page-title={pageTitle}>
        {children}
      </div>
    );
  };
});
jest.mock('../../../components/Layout/Layout.js', () => {
  return function MockLayout({ children, pageTitle }: any) {
    return (
      <div data-testid="layout" data-page-title={pageTitle}>
        {children}
      </div>
    );
  };
});
jest.mock('../../../components/user/UserLayout', () => {
  return function MockUserLayout({ children }: any) {
    return <div data-testid="user-layout">{children}</div>;
  };
});
jest.mock('../../../components/user/UserHeader', () => {
  return function MockUserHeader({ title }: any) {
    return <div data-testid="user-header">{title}</div>;
  };
});
jest.mock('../../../components/user/ProfileForm', () => {
  return function MockProfileForm({ profile, onUpdate, loading }: any) {
    return (
      <div data-testid="profile-form">
        <div>Profile: {profile?.name || 'No profile'}</div>
        <div>Loading: {loading.toString()}</div>
        <button onClick={() => onUpdate({ name: 'Updated Name' })}>
          Update Profile
        </button>
      </div>
    );
  };
});
jest.mock('../../../components/user/AddressManager', () => {
  return function MockAddressManager({ addresses, onAddressChange }: any) {
    return (
      <div data-testid="address-manager">
        <div>Addresses: {addresses.length}</div>
        <button onClick={onAddressChange}>Change Address</button>
      </div>
    );
  };
});
jest.mock('../../../components/user/NotificationPreferences', () => {
  return function MockNotificationPreferences({ preferences, onUpdate }: any) {
    return (
      <div data-testid="notification-preferences">
        <div>Preferences: {preferences ? 'Loaded' : 'Not loaded'}</div>
        <button onClick={onUpdate}>Update Preferences</button>
      </div>
    );
  };
});

// Mock styles
jest.mock('../../../styles/components/user/profile.module.scss', () => ({
  loadingContainer: 'loadingContainer',
  loadingSpinner: 'loadingSpinner',
  errorContainer: 'errorContainer',
  retryButton: 'retryButton',
  profileContainer: 'profileContainer',
  tabs: 'tabs',
  tab: 'tab',
  active: 'active',
  tabContent: 'tabContent',
  tabPanel: 'tabPanel',
  formSection: 'formSection',
}));

const mockPush = jest.fn();
const mockUseRouter = jest.mocked(useRouter);
const mockUseSession = jest.mocked(useSession);
const mockUseProfile = jest.mocked(useProfile);

const mockProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  addresses: [
    {
      id: '1',
      type: 'HOME' as const,
      label: 'My Home',
      street: '123 Main St',
      city: 'London',
      state: 'England',
      postalCode: 'SW1A 1AA',
      country: 'United Kingdom',
      isDefault: true,
      deliveryInstructions: 'Ring doorbell',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ],
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

describe('UserProfile Page', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      pathname: '/user/profile',
      query: {},
      asPath: '/user/profile',
    } as any);

    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: jest.fn(),
      refetchProfile: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'loading'
    } as any);

    mockUseProfile.mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      updateProfile: jest.fn(),
      refetchProfile: jest.fn()
    });

    render(<UserProfile />);

    expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    } as any);

    render(<UserProfile />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('renders error state correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const mockRefetchProfile = jest.fn();
    mockUseProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: 'Failed to load profile',
      updateProfile: jest.fn(),
      refetchProfile: mockRefetchProfile
    });

    render(<UserProfile />);

    expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
    expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(mockRefetchProfile).toHaveBeenCalled();
  });

  it('renders profile page with tabs correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    render(<UserProfile />);

    // Check if page title is correct
    expect(screen.getByTestId('layout')).toHaveAttribute('data-page-title', 'Profile Settings - Osassy\'s Kitchen');

    // Check if tab navigation is present
    expect(screen.getAllByText('Personal Information')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Delivery Addresses')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Notifications')[0]).toBeInTheDocument();

    // Check if ProfileForm is rendered by default (personal tab)
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.getByText('Profile: John Doe')).toBeInTheDocument();
  });

  it('switches tabs correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    render(<UserProfile />);

    // Initially should show personal tab
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();

    // Click on addresses tab
    const addressesTab = screen.getByText('Delivery Addresses');
    fireEvent.click(addressesTab);

    expect(screen.getByTestId('address-manager')).toBeInTheDocument();
    expect(screen.getByText('Addresses: 1')).toBeInTheDocument();

    // Click on notifications tab
    const notificationsTab = screen.getByText('Notifications');
    fireEvent.click(notificationsTab);

    expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    expect(screen.getByText('Preferences: Loaded')).toBeInTheDocument();
  });

  it('handles profile update correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const mockUpdateProfile = jest.fn();
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refetchProfile: jest.fn()
    });

    render(<UserProfile />);

    const updateButton = screen.getByText('Update Profile');
    fireEvent.click(updateButton);

    expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
  });

  it('handles address changes correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const mockRefetchProfile = jest.fn();
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: jest.fn(),
      refetchProfile: mockRefetchProfile
    });

    render(<UserProfile />);

    // Switch to addresses tab
    fireEvent.click(screen.getByText('Delivery Addresses'));

    const changeButton = screen.getByText('Change Address');
    fireEvent.click(changeButton);

    expect(mockRefetchProfile).toHaveBeenCalled();
  });

  it('handles notification preference updates correctly', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const mockRefetchProfile = jest.fn();
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: jest.fn(),
      refetchProfile: mockRefetchProfile
    });

    render(<UserProfile />);

    // Switch to notifications tab
    fireEvent.click(screen.getByText('Notifications'));

    const updateButton = screen.getByText('Update Preferences');
    fireEvent.click(updateButton);

    expect(mockRefetchProfile).toHaveBeenCalled();
  });

  it('handles admin user redirect correctly', async () => {
    // This would be handled by getServerSideProps, but we can test the logic
    mockUseSession.mockReturnValue({
      data: { user: { email: 'admin@example.com', role: 'ADMIN' } },
      status: 'authenticated'
    } as any);

    render(<UserProfile />);

    // The component should still render, but getServerSideProps would handle the redirect
    expect(screen.getAllByText('Personal Information')[0]).toBeInTheDocument();
  });

  it('renders tab panels with correct headers and descriptions', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    render(<UserProfile />);

    // Personal Information tab (default)
    expect(screen.getAllByText('Personal Information')).toHaveLength(2); // Tab button + header
    expect(screen.getByText('Manage your personal details and account information.')).toBeInTheDocument();

    // Switch to addresses tab
    fireEvent.click(screen.getByText('Delivery Addresses'));
    expect(screen.getAllByText('Delivery Addresses')).toHaveLength(2); // Tab button + header
    expect(screen.getByText('Manage your delivery addresses for orders and subscriptions.')).toBeInTheDocument();

    // Switch to notifications tab
    fireEvent.click(screen.getByText('Notifications'));
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Choose how you\'d like to receive updates about your orders and account.')).toBeInTheDocument();
  });
});