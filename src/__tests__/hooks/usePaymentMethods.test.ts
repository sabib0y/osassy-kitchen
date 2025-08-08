import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { PaymentMethod } from '../../types/user';

// Mock fetch
global.fetch = jest.fn();

describe('usePaymentMethods', () => {
  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_1',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
      },
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'pm_2',
      type: 'card',
      card: {
        brand: 'mastercard',
        last4: '5555',
        expMonth: 6,
        expYear: 2024,
      },
      isDefault: false,
      createdAt: Date.now() - 86400000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        paymentMethods: mockPaymentMethods,
        defaultPaymentMethodId: 'pm_1',
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches payment methods on mount', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    expect(result.current.loading).toBe(true);
    expect(result.current.paymentMethods).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.paymentMethods).toHaveLength(2);
    expect(result.current.defaultPaymentMethodId).toBe('pm_1');
    expect(result.current.error).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/payment-methods',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    );
  });

  it('sorts payment methods with default first', async () => {
    const unsortedMethods = [
      { ...mockPaymentMethods[1], isDefault: false },
      { ...mockPaymentMethods[0], isDefault: true },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: unsortedMethods,
        defaultPaymentMethodId: 'pm_1',
      }),
    });

    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.paymentMethods[0].id).toBe('pm_1');
    expect(result.current.paymentMethods[0].isDefault).toBe(true);
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Failed to load payment methods';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.paymentMethods).toEqual([]);
  });

  it('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.paymentMethods).toEqual([]);
  });

  it('removes payment method successfully', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock successful deletion
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock refreshed list without the deleted card
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [mockPaymentMethods[0]],
        defaultPaymentMethodId: 'pm_1',
      }),
    });

    await act(async () => {
      await result.current.removePaymentMethod('pm_2');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/payment-methods/pm_2',
      expect.objectContaining({
        method: 'DELETE',
      })
    );

    await waitFor(() => {
      expect(result.current.paymentMethods).toHaveLength(1);
    });
  });

  it('handles remove payment method error', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const errorMessage = 'Failed to remove payment method';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    await act(async () => {
      await expect(result.current.removePaymentMethod('pm_2')).rejects.toThrow(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('sets default payment method successfully', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock successful update
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock refreshed list with updated default
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: mockPaymentMethods.map(pm => ({
          ...pm,
          isDefault: pm.id === 'pm_2',
        })),
        defaultPaymentMethodId: 'pm_2',
      }),
    });

    await act(async () => {
      await result.current.setDefaultPaymentMethod('pm_2');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/payment-methods/pm_2/default',
      expect.objectContaining({
        method: 'PUT',
      })
    );

    await waitFor(() => {
      expect(result.current.defaultPaymentMethodId).toBe('pm_2');
    });
  });

  it('handles set default payment method error', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const errorMessage = 'Failed to set default payment method';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    await act(async () => {
      await expect(result.current.setDefaultPaymentMethod('pm_2')).rejects.toThrow(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('adds payment method and refreshes list', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newPaymentMethod: PaymentMethod = {
      id: 'pm_3',
      type: 'card',
      card: {
        brand: 'amex',
        last4: '0005',
        expMonth: 3,
        expYear: 2026,
      },
      isDefault: false,
      createdAt: Date.now(),
    };

    // Mock refreshed list with new payment method
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [...mockPaymentMethods, newPaymentMethod],
        defaultPaymentMethodId: 'pm_1',
      }),
    });

    await act(async () => {
      await result.current.addPaymentMethod('seti_test_secret');
    });

    await waitFor(() => {
      expect(result.current.paymentMethods).toHaveLength(3);
    });
  });

  it('sets isProcessing during operations', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isProcessing).toBe(false);

    // Mock successful deletion
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock refreshed list
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [mockPaymentMethods[0]],
        defaultPaymentMethodId: 'pm_1',
      }),
    });

    const removePromise = act(async () => {
      await result.current.removePaymentMethod('pm_2');
    });

    // Check that isProcessing is set to true during operation
    expect(result.current.isProcessing).toBe(true);

    await removePromise;

    // Check that isProcessing is reset after operation
    expect(result.current.isProcessing).toBe(false);
  });

  it('handles empty response from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: [],
        defaultPaymentMethodId: null,
      }),
    });

    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.paymentMethods).toEqual([]);
    expect(result.current.defaultPaymentMethodId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles malformed API response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const { result } = renderHook(() => usePaymentMethods());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.paymentMethods).toEqual([]);
  });

  it('refreshes payment methods after error recovery', async () => {
    const { result } = renderHook(() => usePaymentMethods());

    // First call fails
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Initial error' }),
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Initial error');
    });

    // Manual refresh succeeds
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        paymentMethods: mockPaymentMethods,
        defaultPaymentMethodId: 'pm_1',
      }),
    });

    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.paymentMethods).toHaveLength(2);
  });
});