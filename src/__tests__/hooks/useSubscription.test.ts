import { renderHook, act } from '@testing-library/react';
import { useSubscription, useSubscriptions } from '../../hooks/useSubscription';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSubscriptionResponse = {
  id: 'sub-123',
  planName: 'Weekly Nigerian Feast',
  interval: 'WEEKLY',
  price: 2500,
  status: 'ACTIVE',
  startDate: '2024-01-01T00:00:00.000Z',
  nextDeliveryDate: '2024-01-08T00:00:00.000Z',
  stripeSubscriptionId: 'sub_stripe123',
  items: [
    {
      id: 'item-1',
      quantity: 2,
      menuItem: {
        id: 'menu-1',
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

describe('useSubscription', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSubscription('test-id'));

      expect(result.current.subscription).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('Fetch Subscription', () => {
    it('should fetch subscription successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: mockSubscriptionResponse })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(result.current.subscription).toEqual(mockSubscriptionResponse);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/user/subscriptions/test-id');
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(result.current.subscription).toBeNull();
      expect(result.current.error).toBe('Failed to fetch subscription');
    });

    it('should handle 404 specifically', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(result.current.error).toBe('Subscription not found');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(result.current.subscription).toBeNull();
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Update Subscription', () => {
    it('should update subscription successfully with optimistic updates', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: mockSubscriptionResponse })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      // Update request
      const updatedSubscription = { ...mockSubscriptionResponse, price: 3000 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: updatedSubscription })
      });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateSubscription({
          items: [{ menuItemId: 'menu-1', quantity: 3 }]
        });
      });
      expect(updateResult).toEqual(updatedSubscription);

      expect(result.current.isUpdating).toBe(false);
      expect(mockFetch).toHaveBeenLastCalledWith('/api/user/subscriptions/test-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ menuItemId: 'menu-1', quantity: 3 }] })
      });
    });

    it('should handle update failure and revert optimistic updates', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: mockSubscriptionResponse })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      const originalSubscription = result.current.subscription;

      // Failed update request
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await act(async () => {
        try {
          await result.current.updateSubscription({
            items: [{ menuItemId: 'menu-1', quantity: 3 }]
          });
        } catch (error: any) {
          expect(error.message).toBe('Failed to update subscription');
        }
      });

      expect(result.current.subscription).toEqual(originalSubscription);
      expect(result.current.error).toBe('Failed to update subscription');
      expect(result.current.isUpdating).toBe(false);
    });

    it('should throw error when no subscription is loaded', async () => {
      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        try {
          await result.current.updateSubscription({ items: [] });
        } catch (error: any) {
          expect(error.message).toBe('No subscription loaded');
        }
      });
    });
  });

  describe('Pause Subscription', () => {
    it('should pause subscription successfully', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: mockSubscriptionResponse })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      const pausedSubscription = { ...mockSubscriptionResponse, status: 'PAUSED' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: pausedSubscription })
      });

      let pauseResult: any;
      await act(async () => {
        pauseResult = await result.current.pauseSubscription();
      });
      expect(pauseResult.status).toBe('PAUSED');

      expect(mockFetch).toHaveBeenLastCalledWith('/api/user/subscriptions/test-id/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    });

    it('should pause subscription with specific date', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: mockSubscriptionResponse })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      const pausedSubscription = { ...mockSubscriptionResponse, status: 'PAUSED' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: pausedSubscription })
      });

      const pauseDate = '2024-02-01';
      await act(async () => {
        await result.current.pauseSubscription(pauseDate);
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/user/subscriptions/test-id/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pauseDate })
      });
    });
  });

  describe('Resume Subscription', () => {
    it('should resume subscription successfully', async () => {
      const pausedSubscription = { ...mockSubscriptionResponse, status: 'PAUSED' };
      
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: pausedSubscription })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      const resumedSubscription = { ...pausedSubscription, status: 'ACTIVE' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: resumedSubscription })
      });

      let resumeResult: any;
      await act(async () => {
        resumeResult = await result.current.resumeSubscription();
      });
      expect(resumeResult.status).toBe('ACTIVE');

      expect(mockFetch).toHaveBeenLastCalledWith('/api/user/subscriptions/test-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' })
      });
    });
  });

  describe('Cancel Subscription', () => {
    it('should cancel subscription successfully', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: mockSubscriptionResponse })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      const cancelledSubscription = { ...mockSubscriptionResponse, status: 'CANCELLED' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: cancelledSubscription })
      });

      let cancelResult: any;
      await act(async () => {
        cancelResult = await result.current.cancelSubscription();
      });
      expect(cancelResult.status).toBe('CANCELLED');

      expect(mockFetch).toHaveBeenLastCalledWith('/api/user/subscriptions/test-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
    });
  });

  describe('Refetch', () => {
    it('should refetch subscription data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscription: mockSubscriptionResponse })
      });

      const { result } = renderHook(() => useSubscription('test-id'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useSubscriptions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSubscriptions());

      expect(result.current.subscriptions).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fetch Subscriptions', () => {
    it('should fetch subscriptions successfully', async () => {
      const subscriptions = [mockSubscriptionResponse];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscriptions })
      });

      const { result } = renderHook(() => useSubscriptions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(result.current.subscriptions).toEqual(subscriptions);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/user/subscriptions');
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as any);

      const { result } = renderHook(() => useSubscriptions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(result.current.subscriptions).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch subscriptions');
    });

    it('should handle empty subscriptions response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscriptions: null })
      });

      const { result } = renderHook(() => useSubscriptions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(result.current.subscriptions).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Refetch', () => {
    it('should refetch subscriptions data', async () => {
      const subscriptions = [mockSubscriptionResponse];
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ subscriptions })
      });

      const { result } = renderHook(() => useSubscriptions());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});