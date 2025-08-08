import { renderHook, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useProfile } from '../../hooks/useProfile';

// Mock next-auth
jest.mock('next-auth/react');

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockUseSession = jest.mocked(useSession);

const mockProfileResponse = {
  profile: {
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
  }
};

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProfileResponse
    });
  });

  it('returns loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    } as any);

    const { result } = renderHook(() => useProfile());

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('does not fetch when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    } as any);

    renderHook(() => useProfile());

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches profile when session is authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(result.current.profile).toEqual(
      expect.objectContaining({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      })
    );
  });

  it('handles profile fetch error', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP error! status: 500');
    expect(result.current.profile).toBe(null);
  });

  it('handles 401 error with appropriate message', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Authentication required. Please log in again.');
  });

  it('sets profile to null when unauthenticated', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('updateProfile updates profile successfully', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBe(null);
    });

    const updatedProfileResponse = {
      profile: {
        ...mockProfileResponse.profile,
        name: 'Jane Doe',
        updatedAt: '2023-01-02T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedProfileResponse
    });

    const profileData = {
      name: 'Jane Doe',
      email: 'john@example.com',
      phone: '+44 7123 456789'
    };

    await result.current.updateProfile(profileData);

    expect(mockFetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    // Wait for the profile state to be updated
    await waitFor(() => {
      expect(result.current.profile?.name).toBe('Jane Doe');
    });
  });

  it('updateProfile throws error when API fails', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBe(null);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Validation failed' })
    });

    const profileData = {
      name: 'Jane Doe',
      email: 'john@example.com',
      phone: '+44 7123 456789'
    };

    await expect(result.current.updateProfile(profileData)).rejects.toThrow('Validation failed');
  });

  it('updateProfile throws error when no profile is loaded', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    // Mock fetch to fail so no profile gets loaded
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).toBe(null);
    });

    const profileData = {
      name: 'Jane Doe',
      email: 'john@example.com',
      phone: '+44 7123 456789'
    };

    await expect(result.current.updateProfile(profileData)).rejects.toThrow('No profile data available');
  });

  it('refetchProfile refetches profile data', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBe(null);
    });

    // Clear the mock to count new calls
    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfileResponse
    });

    result.current.refetchProfile();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  it('enhances profile with default notification preferences', async () => {
    const profileWithoutNotifications = {
      profile: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        addresses: [],
        createdAt: '2023-01-01T00:00:00Z',
        emailVerified: true
      }
    };

    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => profileWithoutNotifications
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBe(null);
    });

    // Should have default notification preferences
    expect(result.current.profile?.notificationPreferences).toBeDefined();
    expect(result.current.profile?.notificationPreferences.emailNotifications.orderConfirmation).toBe(true);
    expect(result.current.profile?.notificationPreferences.smsNotifications.orderConfirmation).toBe(false);
  });

  it('handles network error during profile fetch', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.profile).toBe(null);
  });

  it('handles updateProfile with invalid JSON response', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'john@example.com' } },
      status: 'authenticated'
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBe(null);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => {
        throw new Error('Invalid JSON');
      }
    });

    const profileData = {
      name: 'Jane Doe',
      email: 'john@example.com',
      phone: '+44 7123 456789'
    };

    await expect(result.current.updateProfile(profileData)).rejects.toThrow('HTTP error! status: 400');
  });
});