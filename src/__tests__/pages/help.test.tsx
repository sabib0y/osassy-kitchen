import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpPage from '@/pages/help';
import { useRouter } from 'next/router';

// Mock router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock components
jest.mock('@/components/Layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

describe('HelpPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/help',
      query: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render the help page with all main sections', () => {
      render(<HelpPage />);
      
      expect(screen.getByTestId('help-page')).toBeInTheDocument();
      expect(screen.getByText(/Help Center/i)).toBeInTheDocument();
      expect(screen.getByText(/How can we help/i)).toBeInTheDocument();
    });

    it('should render the search bar', () => {
      render(<HelpPage />);
      
      const searchInput = screen.getByPlaceholderText(/Search for answers/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should render FAQ section with category tabs', () => {
      render(<HelpPage />);

      expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
      expect(screen.getByTestId('category-tab-all')).toBeInTheDocument();
      expect(screen.getByTestId('category-tab-subscription')).toBeInTheDocument();
      expect(screen.getByTestId('category-tab-billing')).toBeInTheDocument();
      expect(screen.getByTestId('category-tab-delivery')).toBeInTheDocument();
      expect(screen.getByTestId('category-tab-food')).toBeInTheDocument();
    });

    it('should render contact section', () => {
      render(<HelpPage />);
      
      expect(screen.getByText(/Still need help/i)).toBeInTheDocument();
      expect(screen.getByText(/Our team is here to assist you/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should filter FAQs based on search input', async () => {
      render(<HelpPage />);

      const searchInput = screen.getByPlaceholderText(/Search for answers/i);
      fireEvent.change(searchInput, { target: { value: 'subscription' } });

      // Advance timers to trigger debounced search
      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(screen.getByText(/pause or cancel my subscription/i)).toBeInTheDocument();
    });

    it('should show "no results" message when search has no matches', async () => {
      render(<HelpPage />);

      const searchInput = screen.getByPlaceholderText(/Search for answers/i);
      fireEvent.change(searchInput, { target: { value: 'xyz123notfound' } });

      // Advance timers to trigger debounced search (300ms)
      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(screen.getByText(/No results found for/i)).toBeInTheDocument();
    });

    it('should clear search when input is emptied', async () => {
      render(<HelpPage />);

      const searchInput = screen.getByPlaceholderText(/Search for answers/i);
      fireEvent.change(searchInput, { target: { value: 'subscription' } });

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(screen.getByText(/pause or cancel my subscription/i)).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: '' } });

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(screen.getAllByTestId(/faq-item/i).length).toBeGreaterThan(1);
    });
  });

  describe('FAQ Category Navigation', () => {
    it('should show all FAQs by default', () => {
      render(<HelpPage />);
      
      const faqItems = screen.getAllByTestId(/faq-item/i);
      expect(faqItems.length).toBeGreaterThan(4);
    });

    it('should filter FAQs when category is selected', async () => {
      render(<HelpPage />);

      const billingTab = screen.getByTestId('category-tab-billing');
      fireEvent.click(billingTab);

      await waitFor(() => {
        expect(screen.getByText(/update my payment method/i)).toBeInTheDocument();
        expect(screen.queryByText(/pause or cancel my subscription/i)).not.toBeInTheDocument();
      });
    });

    it('should highlight active category tab', () => {
      render(<HelpPage />);

      const subscriptionTab = screen.getByTestId('category-tab-subscription');
      fireEvent.click(subscriptionTab);

      expect(subscriptionTab).toHaveClass('active');
    });
  });

  describe('FAQ Accordion', () => {
    it('should expand FAQ item when clicked', () => {
      render(<HelpPage />);

      const faqQuestion = screen.getByText(/How do I pause or cancel my subscription/i);
      const faqItem = faqQuestion.closest('[data-testid="faq-item"]');

      fireEvent.click(faqQuestion);

      const answer = faqItem?.querySelector('[data-testid="faq-answer"]');
      expect(answer).toHaveClass('expanded');
    });

    it('should collapse FAQ item when clicked again', () => {
      render(<HelpPage />);

      const faqQuestion = screen.getByText(/How do I pause or cancel my subscription/i);
      const faqItem = faqQuestion.closest('[data-testid="faq-item"]');

      // First click expands
      fireEvent.click(faqQuestion);
      const answer = faqItem?.querySelector('[data-testid="faq-answer"]');
      expect(answer).toHaveClass('expanded');

      // Second click collapses
      fireEvent.click(faqQuestion);
      expect(answer).not.toHaveClass('expanded');
    });

    it('should allow multiple FAQs to be expanded', () => {
      render(<HelpPage />);

      const faq1 = screen.getByText(/How do I pause or cancel my subscription/i);
      const faq2 = screen.getByText(/update my payment method/i);

      fireEvent.click(faq1);
      fireEvent.click(faq2);

      const answers = screen.getAllByTestId('faq-answer');
      const expandedAnswers = answers.filter(answer =>
        answer.classList.contains('expanded')
      );
      expect(expandedAnswers.length).toBe(2);
    });
  });

  describe('Contact Form', () => {
    it('should render contact form with all fields', () => {
      render(<HelpPage />);
      
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
    });

    it('should have correct subject dropdown options', () => {
      render(<HelpPage />);
      
      const subjectSelect = screen.getByLabelText(/Subject/i) as HTMLSelectElement;
      const options = Array.from(subjectSelect.options).map(option => option.text);
      
      expect(options).toContain('Subscription Inquiry');
      expect(options).toContain('Billing Question');
      expect(options).toContain('Delivery Issue');
      expect(options).toContain('Technical Problem');
      expect(options).toContain('Feedback & Suggestions');
      expect(options).toContain('Other');
    });
  });

  describe('Contact Information', () => {
    it('should display email contact', () => {
      render(<HelpPage />);
      
      expect(screen.getByText(/Email Us/i)).toBeInTheDocument();
      expect(screen.getByText(/support@osassyskitchen.com/i)).toBeInTheDocument();
    });

    it('should display phone/WhatsApp contact', () => {
      render(<HelpPage />);
      
      expect(screen.getByText(/Call or WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText(/\+234/i)).toBeInTheDocument();
      expect(screen.getByText(/Mon-Fri, 9am-5pm WAT/i)).toBeInTheDocument();
    });

    it('should display social media links', () => {
      render(<HelpPage />);
      
      expect(screen.getByText(/Follow Us/i)).toBeInTheDocument();
      expect(screen.getByTestId('instagram-link')).toBeInTheDocument();
      expect(screen.getByTestId('twitter-link')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should be mobile responsive', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<HelpPage />);
      
      const container = screen.getByTestId('help-page');
      expect(container).toHaveClass('help-page');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<HelpPage />);
      
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab').length).toBe(5); // All, Subscription, Billing, Delivery, Food
    });

    it('should support keyboard navigation', () => {
      render(<HelpPage />);

      const searchInput = screen.getByPlaceholderText(/Search for answers/i);
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Focus on first category tab
      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();
      expect(document.activeElement).toBe(firstTab);
    });
  });
});