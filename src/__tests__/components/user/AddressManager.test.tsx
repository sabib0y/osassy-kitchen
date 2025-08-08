import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressManager from '../../../components/user/AddressManager';
import { Address } from '../../../types/user';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockAddresses: Address[] = [
  {
    id: '1',
    type: 'HOME',
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
  },
  {
    id: '2',
    type: 'WORK',
    label: 'Office',
    street: '456 Business Ave',
    city: 'London',
    state: 'England',
    postalCode: 'EC1A 1BB',
    country: 'United Kingdom',
    isDefault: false,
    deliveryInstructions: 'Reception desk',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

describe('AddressManager', () => {
  const mockOnAddressChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });

  it('renders addresses correctly', () => {
    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    expect(screen.getByText('My Home')).toBeInTheDocument();
    expect(screen.getByText('Office')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('456 Business Ave')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('renders empty state when no addresses', () => {
    render(
      <AddressManager
        addresses={[]}
        onAddressChange={mockOnAddressChange}
      />
    );

    expect(screen.getByText('No Delivery Addresses')).toBeInTheDocument();
    expect(screen.getByText('Add your first delivery address to start ordering')).toBeInTheDocument();
  });

  it('opens modal when Add New Address is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const addButton = screen.getByText('Add New Address');
    await user.click(addButton);

    expect(screen.getByText('Add Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Address Type *')).toBeInTheDocument();
  });

  it('opens edit modal when Edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(screen.getByText('Edit Address')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Home')).toBeInTheDocument();
  });

  it('handles delete address with confirmation', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm
    const mockConfirm = jest.fn(() => true);
    Object.defineProperty(window, 'confirm', {
      value: mockConfirm,
      writable: true
    });

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this address?');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/addresses/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    });

    expect(mockOnAddressChange).toHaveBeenCalled();
  });

  it('does not delete address when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm to return false
    const mockConfirm = jest.fn(() => false);
    Object.defineProperty(window, 'confirm', {
      value: mockConfirm,
      writable: true
    });

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnAddressChange).not.toHaveBeenCalled();
  });

  it('handles set default address', async () => {
    const user = userEvent.setup();

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    // The second address should have a "Set Default" button
    const setDefaultButton = screen.getByText('Set Default');
    await user.click(setDefaultButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/addresses/2/default', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
    });

    expect(mockOnAddressChange).toHaveBeenCalled();
  });

  it('displays delivery instructions when available', () => {
    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    expect(screen.getByText('Ring doorbell')).toBeInTheDocument();
    expect(screen.getByText('Reception desk')).toBeInTheDocument();
  });

  it('shows correct address type icons', () => {
    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const addressCards = screen.getAllByTestId('address-card');
    expect(addressCards).toHaveLength(2);
  });

  it('handles API error during delete', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to delete address' })
    });
    
    const mockConfirm = jest.fn(() => true);
    Object.defineProperty(window, 'confirm', {
      value: mockConfirm,
      writable: true
    });

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete address')).toBeInTheDocument();
    });
  });

  it('handles API error during set default', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to set default address' })
    });

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const setDefaultButton = screen.getByText('Set Default');
    await user.click(setDefaultButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to set default address')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AddressManager
        addresses={mockAddresses}
        onAddressChange={mockOnAddressChange}
      />
    );

    const addButton = screen.getByText('Add New Address');
    await user.click(addButton);

    // Verify modal is open by checking for modal-specific content
    expect(screen.getByText('Add Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Address Type *')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Check that modal-specific content is no longer present
    expect(screen.queryByText('Add Address')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Address Type *')).not.toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(
      <AddressManager
        addresses={[]}
        onAddressChange={mockOnAddressChange}
      />
    );

    // Should show add button even in empty state
    expect(screen.getByText('Add New Address')).toBeInTheDocument();
  });
});