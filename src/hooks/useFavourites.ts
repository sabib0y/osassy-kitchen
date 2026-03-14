/**
 * Hook for managing user's favourite menu items
 * Handles dual persistence: localStorage for guests + database for authenticated users
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'osassy_favourites';

/**
 * Fetch favourites from API (authenticated users only)
 */
const fetchFavourites = async (): Promise<string[]> => {
  const response = await fetch('/api/user/favourites');
  if (!response.ok) {
    throw new Error('Failed to fetch favourites');
  }
  const data = await response.json();
  return data.success ? data.data : [];
};

/**
 * Add favourite via API
 */
const addFavouriteApi = async (menuItemId: string): Promise<void> => {
  const response = await fetch('/api/user/favourites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menuItemId }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to add favourite');
  }
};

/**
 * Remove favourite via API
 */
const removeFavouriteApi = async (menuItemId: string): Promise<void> => {
  const response = await fetch('/api/user/favourites', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menuItemId }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to remove favourite');
  }
};

/**
 * Get favourites from localStorage
 */
const getLocalFavourites = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading localStorage favourites:', error);
    return [];
  }
};

/**
 * Save favourites to localStorage
 */
const setLocalFavourites = (favourites: string[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  } catch (error) {
    console.error('Error saving localStorage favourites:', error);
  }
};

/**
 * Hook for managing favourites with dual persistence
 */
export const useFavourites = () => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const isAuthenticated = status === 'authenticated';

  // Local state for favourites (Set for O(1) lookups)
  // Initialise empty - will hydrate from localStorage in useEffect to avoid SSR mismatch
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate favourites from localStorage on client mount
  useEffect(() => {
    const localFavs = getLocalFavourites();
    if (localFavs.length > 0) {
      setFavourites(new Set(localFavs));
    }
    setIsHydrated(true);
  }, []);

  // Fetch favourites from API for authenticated users
  const { data: apiFavourites, isLoading, isError, error } = useQuery({
    queryKey: ['favourites'],
    queryFn: fetchFavourites,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for adding favourites
  const addMutation = useMutation({
    mutationFn: addFavouriteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
  });

  // Mutation for removing favourites
  const removeMutation = useMutation({
    mutationFn: removeFavouriteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
  });

  // Sync API favourites with local state when they load
  useEffect(() => {
    if (apiFavourites && Array.isArray(apiFavourites)) {
      const localFavs = getLocalFavourites();

      // Merge API favourites with localStorage favourites
      const mergedFavourites = new Set([...apiFavourites, ...localFavs]);

      setFavourites(mergedFavourites);

      // Update localStorage with merged list
      setLocalFavourites(Array.from(mergedFavourites));
    }
  }, [apiFavourites]);

  /**
   * Check if a menu item is favourited
   */
  const isFavourite = useCallback(
    (menuItemId: string): boolean => {
      return favourites.has(menuItemId);
    },
    [favourites]
  );

  /**
   * Toggle a menu item's favourite status
   */
  const toggleFavourite = useCallback(
    async (menuItemId: string): Promise<void> => {
      const isFavourited = favourites.has(menuItemId);

      // Optimistic update
      setFavourites((prev) => {
        const newSet = new Set(prev);
        if (isFavourited) {
          newSet.delete(menuItemId);
        } else {
          newSet.add(menuItemId);
        }

        // Update localStorage
        setLocalFavourites(Array.from(newSet));

        return newSet;
      });

      // Sync to API if authenticated
      if (isAuthenticated) {
        try {
          if (isFavourited) {
            await removeMutation.mutateAsync(menuItemId);
          } else {
            await addMutation.mutateAsync(menuItemId);
          }
        } catch (error) {
          console.error('Error toggling favourite:', error);
          // Optimistic update already applied, don't revert on error
        }
      }
    },
    [favourites, isAuthenticated, addMutation, removeMutation]
  );

  /**
   * Sync localStorage favourites to API (useful when user logs in)
   */
  const syncFavourites = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;

    const localFavs = getLocalFavourites();

    // Add each local favourite to API (API handles duplicates)
    for (const menuItemId of localFavs) {
      try {
        await addMutation.mutateAsync(menuItemId);
      } catch (error) {
        // Ignore duplicate errors - item already exists in API
        console.error(`Error syncing favourite ${menuItemId}:`, error);
      }
    }
  }, [isAuthenticated, addMutation]);

  return {
    favourites,
    isFavourite,
    toggleFavourite,
    syncFavourites,
    isLoading: !isHydrated || (isAuthenticated ? isLoading : false),
    isHydrated,
    isError,
    error,
  };
};

// Re-export for convenience
export type { };
