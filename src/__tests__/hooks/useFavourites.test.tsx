import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useFavourites } from '@/hooks/useFavourites';

// Mock dependencies
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Local storage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useFavourites', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = 'TestWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Guest users (not authenticated)', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should initialise with empty favourites', () => {
      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      expect(result.current.favourites).toEqual(new Set());
      expect(result.current.isLoading).toBe(false);
    });

    it('should load favourites from localStorage', () => {
      localStorageMock.setItem('osassy_favourites', JSON.stringify(['item-1', 'item-2']));

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      expect(result.current.favourites).toEqual(new Set(['item-1', 'item-2']));
    });

    it('should add a favourite to localStorage', () => {
      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.toggleFavourite('item-1');
      });

      expect(result.current.favourites.has('item-1')).toBe(true);
      expect(localStorageMock.getItem('osassy_favourites')).toBe(
        JSON.stringify(['item-1'])
      );
    });

    it('should remove a favourite from localStorage', () => {
      localStorageMock.setItem('osassy_favourites', JSON.stringify(['item-1', 'item-2']));

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.toggleFavourite('item-1');
      });

      expect(result.current.favourites.has('item-1')).toBe(false);
      expect(localStorageMock.getItem('osassy_favourites')).toBe(
        JSON.stringify(['item-2'])
      );
    });

    it('should handle isFavourite check correctly', () => {
      localStorageMock.setItem('osassy_favourites', JSON.stringify(['item-1']));

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFavourite('item-1')).toBe(true);
      expect(result.current.isFavourite('item-2')).toBe(false);
    });

    it('should not call API for guest users', () => {
      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.toggleFavourite('item-1');
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.setItem('osassy_favourites', 'invalid-json');

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      expect(result.current.favourites).toEqual(new Set());
    });
  });

  describe('Authenticated users', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should fetch favourites from API on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: ['item-1', 'item-2'] }),
      } as Response);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/user/favourites');
      expect(result.current.favourites).toEqual(new Set(['item-1', 'item-2']));
    });

    it('should merge localStorage favourites with API favourites', async () => {
      localStorageMock.setItem('osassy_favourites', JSON.stringify(['item-1', 'item-3']));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: ['item-2', 'item-4'] }),
      } as Response);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should contain all unique items from both sources
      expect(result.current.favourites).toEqual(
        new Set(['item-1', 'item-2', 'item-3', 'item-4'])
      );
    });

    it('should add favourite via API and update localStorage', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { menuItemId: 'item-1' } }),
        } as Response);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavourite('item-1');
      });

      await waitFor(() => {
        expect(result.current.favourites.has('item-1')).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/user/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: 'item-1' }),
      });

      expect(localStorageMock.getItem('osassy_favourites')).toBe(
        JSON.stringify(['item-1'])
      );
    });

    it('should remove favourite via API and update localStorage', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: ['item-1'] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { menuItemId: 'item-1' } }),
        } as Response);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavourite('item-1');
      });

      await waitFor(() => {
        expect(result.current.favourites.has('item-1')).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/user/favourites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: 'item-1' }),
      });

      expect(localStorageMock.getItem('osassy_favourites')).toBe(JSON.stringify([]));
    });

    it('should handle API errors gracefully when adding', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Server error' }),
        } as Response);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavourite('item-1');
      });

      // Should still be in favourites locally (optimistic update)
      expect(result.current.favourites.has('item-1')).toBe(true);
    });

    it('should sync localStorage favourites to API when user logs in', async () => {
      localStorageMock.setItem('osassy_favourites', JSON.stringify(['item-1', 'item-2']));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { menuItemId: 'item-1' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { menuItemId: 'item-2' } }),
        } as Response);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.syncFavourites();
      });

      // Should have called POST for both items (at least)
      expect(mockFetch.mock.calls.filter(call =>
        call[1]?.method === 'POST'
      )).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid toggles correctly', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.toggleFavourite('item-1');
        result.current.toggleFavourite('item-1');
        result.current.toggleFavourite('item-1');
      });

      // After 3 toggles, should be favourited (on -> off -> on)
      expect(result.current.favourites.has('item-1')).toBe(true);
    });

    it('should handle multiple items being toggled', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useFavourites(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.toggleFavourite('item-1');
        result.current.toggleFavourite('item-2');
        result.current.toggleFavourite('item-3');
      });

      expect(result.current.favourites.size).toBe(3);
      expect(result.current.favourites.has('item-1')).toBe(true);
      expect(result.current.favourites.has('item-2')).toBe(true);
      expect(result.current.favourites.has('item-3')).toBe(true);
    });
  });
});
