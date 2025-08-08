import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SubscriptionDetails from '../../../components/user/SubscriptionDetails';
import { SubscriptionResponse } from '../../../lib/api-types';

const mockSubscription: SubscriptionResponse = {
  id: 'sub-123',
  planName: 'Weekly Nigerian Feast',
  interval: 'WEEKLY',
  price: 25,
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
        description: 'Spicy Nigerian rice dish with vegetables',
        price: 10,
        imageUrl: 'https://example.com/jollof.jpg',
        category: 'Main Course'
      }
    },
    {
      id: 'item-2',
      quantity: 1,
      menuItem: {
        id: 'menu-2',
        name: 'Plantain',
        description: 'Sweet fried plantain',
        price: 5,
        imageUrl: null,
        category: 'Side Dish'
      }
    }
  ],
  recentOrders: [
    {
      id: 'order-1',
      totalPrice: 25,
      deliveryDate: '2024-01-01T00:00:00.000Z',
      status: 'DELIVERED',
      notes: null,
      createdAt: '2023-12-30T00:00:00.000Z',
      updatedAt: '2023-12-30T00:00:00.000Z',
      deliveryAddress: '123 Test Street',
      deliveryFee: 5,
      items: [
        {
          id: 'order-item-1',
          quantity: 2,
          price: 10,
          menuItem: {
            id: 'menu-1',
            name: 'Jollof Rice',
            description: 'Spicy Nigerian rice dish',
            price: 10,
            imageUrl: null,
            category: 'Main Course'
          }
        }
      ]
    }
  ]
};

describe('SubscriptionDetails', () => {
  it('should render subscription overview by default', () => {
    render(<SubscriptionDetails subscription={mockSubscription} />);

    expect(screen.getByText('Weekly Nigerian Feast')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getAllByText('£25.00')).toHaveLength(2); // Header + price card
    expect(screen.getAllByText('WEEKLY delivery')).toHaveLength(2); // Header + summary card
  });

  describe('Overview Tab', () => {
    it('should display summary cards', () => {
      render(<SubscriptionDetails subscription={mockSubscription} />);

      expect(screen.getByText('Subscription Plan')).toBeInTheDocument();
      expect(screen.getByText('Weekly Nigerian Feast')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Per weekly')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Items' })).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total quantity: 2 + 1
      expect(screen.getByText('Started')).toBeInTheDocument();
    });

    it('should show next delivery information for active subscriptions', () => {
      render(<SubscriptionDetails subscription={mockSubscription} />);

      expect(screen.getByText('Next Delivery')).toBeInTheDocument();
      expect(screen.getByText('You\'ll receive:')).toBeInTheDocument();
      expect(screen.getByText('2x Jollof Rice')).toBeInTheDocument();
      expect(screen.getByText('1x Plantain')).toBeInTheDocument();
    });

    it('should show paused notice for paused subscriptions', () => {
      const pausedSubscription = { ...mockSubscription, status: 'PAUSED' as const };
      render(<SubscriptionDetails subscription={pausedSubscription} />);

      expect(screen.getByText('Subscription Paused')).toBeInTheDocument();
      expect(screen.getByText('Your subscription is currently paused. No orders will be generated until you resume it.')).toBeInTheDocument();
    });

    it('should show cancelled notice for cancelled subscriptions', () => {
      const cancelledSubscription = { ...mockSubscription, status: 'CANCELLED' as const };
      render(<SubscriptionDetails subscription={cancelledSubscription} />);

      expect(screen.getByText('Subscription Cancelled')).toBeInTheDocument();
      expect(screen.getByText('This subscription has been cancelled. No further orders will be generated.')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs when clicked', () => {
      render(<SubscriptionDetails subscription={mockSubscription} />);

      // Default is overview
      expect(screen.getByText('Subscription Plan')).toBeInTheDocument();

      // Switch to items tab
      fireEvent.click(screen.getByRole('button', { name: /Items/ }));
      expect(screen.getByText('Subscription Items')).toBeInTheDocument();
      expect(screen.getByText('Items included in each delivery')).toBeInTheDocument();

      // Switch to history tab
      fireEvent.click(screen.getAllByRole('button', { name: /History/ })[0]);
      expect(screen.getByText('Order History')).toBeInTheDocument();

      // Switch to billing tab
      fireEvent.click(screen.getAllByRole('button', { name: '💳 Billing' })[0]);
      expect(screen.getByText('Billing Information')).toBeInTheDocument();

      // Switch back to overview
      fireEvent.click(screen.getByRole('button', { name: /Overview/ }));
      expect(screen.getByText('Subscription Plan')).toBeInTheDocument();
    });
  });

  describe('Items Tab', () => {
    beforeEach(() => {
      render(<SubscriptionDetails subscription={mockSubscription} />);
      fireEvent.click(screen.getByRole('button', { name: /Items/ }));
    });

    it('should display all subscription items', () => {
      expect(screen.getByText('Jollof Rice')).toBeInTheDocument();
      expect(screen.getByText('Spicy Nigerian rice dish with vegetables')).toBeInTheDocument();
      expect(screen.getByText('Main Course')).toBeInTheDocument();
      expect(screen.getByText('2x')).toBeInTheDocument();
      expect(screen.getByText('£20.00')).toBeInTheDocument(); // 2 * £10.00

      expect(screen.getByText('Plantain')).toBeInTheDocument();
      expect(screen.getByText('Sweet fried plantain')).toBeInTheDocument();
      expect(screen.getByText('Side Dish')).toBeInTheDocument();
      expect(screen.getByText('1x')).toBeInTheDocument();
      expect(screen.getAllByText('£5.00')).toHaveLength(2); // Individual price + total for plantain
    });

    it('should show total per delivery', () => {
      expect(screen.getByText('Total per delivery:')).toBeInTheDocument();
      expect(screen.getAllByText('£25.00')).toHaveLength(2); // Header + total per delivery
    });
  });

  describe('History Tab', () => {
    beforeEach(() => {
      render(<SubscriptionDetails subscription={mockSubscription} />);
      fireEvent.click(screen.getAllByRole('button', { name: /History/ })[0]);
    });

    it('should display recent orders', () => {
      expect(screen.getByText('Order History')).toBeInTheDocument();
      expect(screen.getByText('Recent orders from this subscription')).toBeInTheDocument();
      expect(screen.getByText('Order #order-1')).toBeInTheDocument(); // Last 8 chars of 'order-1'
      expect(screen.getByText('DELIVERED')).toBeInTheDocument();
      expect(screen.getByText('2x Jollof Rice')).toBeInTheDocument();
    });

  });

  describe('History Tab - Empty State', () => {
    it('should show empty state when no orders exist', () => {
      const subscriptionWithoutOrders = { 
        ...mockSubscription, 
        recentOrders: [] // Explicitly empty array
      };
      render(<SubscriptionDetails subscription={subscriptionWithoutOrders} />);
      fireEvent.click(screen.getAllByRole('button', { name: /History/ })[0]);

      expect(screen.getByText('No Orders Yet')).toBeInTheDocument();
      expect(screen.getByText('Orders from this subscription will appear here once they\'re generated.')).toBeInTheDocument();
    });
  });

  describe('Billing Tab', () => {
    beforeEach(() => {
      render(<SubscriptionDetails subscription={mockSubscription} />);
      fireEvent.click(screen.getAllByRole('button', { name: '💳 Billing' })[0]);
    });

    it('should display billing information', () => {
      expect(screen.getByText('Billing Information')).toBeInTheDocument();
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Plan:')).toBeInTheDocument();
      expect(screen.getByText('Weekly Nigerian Feast')).toBeInTheDocument();
      expect(screen.getByText('Billing cycle:')).toBeInTheDocument();
      expect(screen.getByText('WEEKLY')).toBeInTheDocument();
      expect(screen.getByText('Amount:')).toBeInTheDocument();
      expect(screen.getAllByText('£25.00')).toHaveLength(2); // Header + amount
    });

    it('should show Stripe information when available', () => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Payment is processed securely through Stripe')).toBeInTheDocument();
      expect(screen.getByText('ID: tripe123')).toBeInTheDocument(); // Last 8 chars of 'sub_stripe123'
    });

    it('should show next billing date for active subscriptions', () => {
      expect(screen.getByText('Next billing:')).toBeInTheDocument();
      expect(screen.getByText('8 Jan 2024')).toBeInTheDocument();
    });

  });

  describe('Billing Tab - Paused Subscription', () => {
    it('should not show next billing for non-active subscriptions', () => {
      const pausedSubscription = { 
        ...mockSubscription, 
        status: 'PAUSED' as const,
        nextDeliveryDate: null // Explicitly set to null for paused subscriptions
      };
      render(<SubscriptionDetails subscription={pausedSubscription} />);
      fireEvent.click(screen.getAllByRole('button', { name: '💳 Billing' })[0]);

      expect(screen.queryByText('Next billing:')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(<SubscriptionDetails subscription={mockSubscription} />);

      // Check start date formatting
      expect(screen.getByText('1 Jan 2024')).toBeInTheDocument();

      // Check next delivery date formatting (in overview)
      expect(screen.getByText('Monday, 8 January 2024')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency in British pounds', () => {
      render(<SubscriptionDetails subscription={mockSubscription} />);
      
      // Switch to Items tab to see individual prices
      fireEvent.click(screen.getByRole('button', { name: /Items/ }));

      expect(screen.getAllByText('£25.00')).toHaveLength(2); // Header + total per delivery
      expect(screen.getByText('£10.00')).toBeInTheDocument(); // Individual item price
      expect(screen.getByText('£20.00')).toBeInTheDocument(); // 2 * £10.00
      expect(screen.getAllByText('£5.00')).toHaveLength(2); // Individual price + total for plantain
    });
  });

  describe('Status Display', () => {
    it('should show correct status styling for active subscription', () => {
      render(<SubscriptionDetails subscription={mockSubscription} />);

      const statusElement = screen.getByText('ACTIVE');
      expect(statusElement).toBeInTheDocument();
    });

    it('should show correct status styling for paused subscription', () => {
      const pausedSubscription = { ...mockSubscription, status: 'PAUSED' as const };
      render(<SubscriptionDetails subscription={pausedSubscription} />);

      const statusElement = screen.getByText('PAUSED');
      expect(statusElement).toBeInTheDocument();
    });

    it('should show correct status styling for cancelled subscription', () => {
      const cancelledSubscription = { ...mockSubscription, status: 'CANCELLED' as const };
      render(<SubscriptionDetails subscription={cancelledSubscription} />);

      const statusElement = screen.getByText('CANCELLED');
      expect(statusElement).toBeInTheDocument();
    });
  });
});