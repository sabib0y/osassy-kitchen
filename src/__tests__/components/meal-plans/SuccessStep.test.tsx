import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import SuccessStep from '../../../components/meals/SuccessStep';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('SuccessStep Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders success message', () => {
    render(<SuccessStep />);

    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
  });

  it('renders celebration emoji', () => {
    render(<SuccessStep />);

    expect(screen.getByText(/🎉/)).toBeInTheDocument();
  });

  it('displays confirmation message', () => {
    render(<SuccessStep />);

    expect(screen.getByText(/subscription has been created/i)).toBeInTheDocument();
  });

  it('displays first delivery information', () => {
    render(<SuccessStep />);

    expect(screen.getByRole('heading', { name: /first delivery/i })).toBeInTheDocument();
  });

  it('renders "Manage My Plan" button', () => {
    render(<SuccessStep />);

    const manageButton = screen.getByRole('button', { name: /manage my plan/i });
    expect(manageButton).toBeInTheDocument();
  });

  it('renders "Browse More Meals" button', () => {
    render(<SuccessStep />);

    const browseButton = screen.getByRole('button', { name: /browse more meals/i });
    expect(browseButton).toBeInTheDocument();
  });

  it('navigates to subscriptions page when "Manage My Plan" is clicked', () => {
    render(<SuccessStep />);

    const manageButton = screen.getByRole('button', { name: /manage my plan/i });
    fireEvent.click(manageButton);

    expect(mockPush).toHaveBeenCalledWith('/user/subscriptions');
  });

  it('navigates to meals page when "Browse More Meals" is clicked', () => {
    render(<SuccessStep />);

    const browseButton = screen.getByRole('button', { name: /browse more meals/i });
    fireEvent.click(browseButton);

    expect(mockPush).toHaveBeenCalledWith('/meals');
  });

  it('displays check mark icon', () => {
    render(<SuccessStep />);

    // Check for success icon or styling
    const successIcon = screen.getByTestId('success-icon');
    expect(successIcon).toBeInTheDocument();
  });

  it('displays next steps information', () => {
    render(<SuccessStep />);

    expect(screen.getByText(/what's next/i)).toBeInTheDocument();
  });

  it('has proper styling for celebration state', () => {
    const { container } = render(<SuccessStep />);

    const successContainer = container.querySelector('[class*="container"]');
    expect(successContainer).toBeInTheDocument();
  });

  it('displays email confirmation message', () => {
    render(<SuccessStep />);

    const confirmationMessages = screen.getAllByText(/confirmation email/i);
    expect(confirmationMessages.length).toBeGreaterThan(0);
  });
});
