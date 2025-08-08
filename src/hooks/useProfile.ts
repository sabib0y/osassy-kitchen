import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserProfile, ProfileFormData } from '../types/user';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileFormData) => Promise<void>;
  refetchProfile: () => void;
}

export const useProfile = (): UseProfileReturn => {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (status === 'loading' || !session) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in again.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Enhanced profile structure with default values
      const enhancedProfile: UserProfile = {
        id: data.profile.id,
        name: data.profile.name,
        email: data.profile.email,
        phone: data.profile.phone,
        addresses: data.profile.addresses || [],
        notificationPreferences: data.profile.notificationPreferences || {
          id: 'default',
          userId: data.profile.id,
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        // Backward compatibility
        address: data.profile.address,
        createdAt: data.profile.createdAt,
        emailVerified: data.profile.emailVerified
      };

      setProfile(enhancedProfile);
    } catch (err) {
      console.error('Profile fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  const updateProfile = useCallback(async (data: ProfileFormData): Promise<void> => {
    if (!profile) {
      throw new Error('No profile data available');
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        name: responseData.profile.name,
        phone: responseData.profile.phone,
        updatedAt: responseData.profile.updatedAt
      } : null);

    } catch (err) {
      console.error('Profile update error:', err);
      throw err; // Re-throw to let component handle the error
    }
  }, [profile]);

  const refetchProfile = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Initial fetch when session is available
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    } else if (status === 'unauthenticated') {
      setProfile(null);
      setError(null);
      setLoading(false);
    }
  }, [status, fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile
  };
};