import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentStep from '../../../components/meal-plans/PaymentStep';
import { MealPlan, SelectedMeal, DeliveryDetails } from '../../../types/meal-plans';

describe('PaymentStep Component', () => {
  const mockSelectedPlan: MealPlan = {
    id: 'plan-1',
    name: '3 Meals Per Week',
    mealsPerWeek: 3,
    pricePerWeek: 29.99,
    description: 'Ideal for individuals',
  };

  const mockSelectedMeals: SelectedMeal[] = [
    {
      id: 'meal-1',
      name: 'Jollof Rice with Chicken',
      description: 'Traditional Nigerian rice dish',
      imageUrl: '/images/jollof.jpg',
      category: 'Rice Dishes',
      price: 10.99,
    },
    {
      id: 'meal-2',
      name: 'Egusi Soup with Pounded Yam',
      description: 'Classic Nigerian soup',
      imageUrl: '/images/egusi.jpg',
      category: 'Soups',
      price: 12.99,
    },
    {
      id: 'meal-3',
      name: 'Ayamase with Rice',
      description: 'Spicy green pepper sauce',
      imageUrl: '/images/ayamase.jpg',
      category: 'Rice Dishes',
      price: 11.99,
    },
  ];

  const mockDeliveryDetails: DeliveryDetails = {
    address: '123 Test Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    phone: '07700900000',
    instructions: 'Ring the bell',
    preferredDay: 'Monday',
  };

  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders order summary correctly', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    expect(screen.getByText('Review Your Order')).toBeInTheDocument();
    expect(screen.getByText('3 Meals Per Week')).toBeInTheDocument();
  });

  it('displays all selected meals', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
    expect(screen.getByText('Egusi Soup with Pounded Yam')).toBeInTheDocument();
    expect(screen.getByText('Ayamase with Rice')).toBeInTheDocument();
  });

  it('displays delivery summary', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText(/london/i)).toBeInTheDocument();
    expect(screen.getByText(/sw1a 1aa/i)).toBeInTheDocument();
    expect(screen.getByText(/monday/i)).toBeInTheDocument();
  });

  it('displays the weekly price', () => {
    const { container } = render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    // Price appears in both the plan card and price summary
    const priceElements = screen.getAllByText(/£29\.99/);
    expect(priceElements.length).toBeGreaterThan(0);

    // Check that "per week" text exists in the rendered output
    expect(container.textContent).toContain('per week');
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm subscription/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  it('disables confirm button when loading', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /processing/i });
    expect(confirmButton).toBeDisabled();
  });

  it('shows processing text when loading', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('displays meal count correctly', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    expect(screen.getByText(/\(3 meals selected\)/i)).toBeInTheDocument();
  });

  it('renders meal images when available', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('shows delivery instructions when provided', () => {
    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mockSelectedMeals}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    expect(screen.getByText('Ring the bell')).toBeInTheDocument();
  });

  it('handles meals without images gracefully', () => {
    const mealsWithoutImages = mockSelectedMeals.map((meal) => ({
      ...meal,
      imageUrl: undefined,
    }));

    render(
      <PaymentStep
        selectedPlan={mockSelectedPlan}
        selectedMeals={mealsWithoutImages}
        deliveryDetails={mockDeliveryDetails}
        onConfirm={mockOnConfirm}
        isLoading={false}
      />
    );

    expect(screen.getByText('Jollof Rice with Chicken')).toBeInTheDocument();
  });
});
