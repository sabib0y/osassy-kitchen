/**
 * Tests for EmptyFavourites component
 * Displays when user has no favourited items
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyFavourites from '@/components/subscription/EmptyFavourites';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('EmptyFavourites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the empty state message', () => {
    render(<EmptyFavourites />);

    expect(screen.getByText(/no favourites yet/i)).toBeInTheDocument();
  });

  it('should display a heart icon', () => {
    render(<EmptyFavourites />);

    // Check for heart icon via role or test id
    const icon = screen.getByTestId('heart-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should display descriptive text about favouriting items', () => {
    render(<EmptyFavourites />);

    expect(
      screen.getByText(/browse our menu and heart your favourite dishes/i)
    ).toBeInTheDocument();
  });

  it('should render a "Browse Menu" button', () => {
    render(<EmptyFavourites />);

    const button = screen.getByRole('button', { name: /browse menu/i });
    expect(button).toBeInTheDocument();
  });

  it('should navigate to /menu when "Browse Menu" is clicked', async () => {
    const user = userEvent.setup();
    render(<EmptyFavourites />);

    const button = screen.getByRole('button', { name: /browse menu/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith('/menu');
  });

  it('should have accessible structure', () => {
    render(<EmptyFavourites />);

    // Should have a main container
    const container = screen.getByTestId('empty-favourites');
    expect(container).toBeInTheDocument();
  });

  it('should render with correct styling classes', () => {
    render(<EmptyFavourites />);

    const container = screen.getByTestId('empty-favourites');
    expect(container.className).toContain('emptyFavourites');
  });
});
