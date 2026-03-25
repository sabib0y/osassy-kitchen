import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FAQPage from '@/pages/faq';
import '@testing-library/jest-dom';

describe('FAQ Page', () => {
  beforeEach(() => {
    render(<FAQPage />);
  });

  describe('Page Structure', () => {
    it('renders the page title', () => {
      expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    });

    it('renders the hero section', () => {
      expect(screen.getByText(/find answers to common questions/i)).toBeInTheDocument();
    });

    it('renders all category tabs', () => {
      expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subscriptions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delivery/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /payments/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument();
    });

    it('renders the CTA section', () => {
      expect(screen.getByText(/ready to get started/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    });
  });

  describe('Category Filtering', () => {
    it('shows all FAQs when "All" category is selected', () => {
      const allButton = screen.getByRole('button', { name: /^all$/i });
      fireEvent.click(allButton);

      // Should see questions from all categories
      expect(screen.getByText(/how do meal plan subscriptions work/i)).toBeInTheDocument();
      expect(screen.getByText(/where do you deliver/i)).toBeInTheDocument();
    });

    it('filters FAQs by Subscriptions category', () => {
      const subscriptionsButton = screen.getByRole('button', { name: /subscriptions/i });
      fireEvent.click(subscriptionsButton);

      expect(screen.getByText(/how do meal plan subscriptions work/i)).toBeInTheDocument();
      expect(screen.getByText(/can i change my meals each week/i)).toBeInTheDocument();
    });

    it('filters FAQs by Delivery category', () => {
      const deliveryButton = screen.getByRole('button', { name: /delivery/i });
      fireEvent.click(deliveryButton);

      expect(screen.getByText(/where do you deliver/i)).toBeInTheDocument();
      expect(screen.getByText(/what days do you deliver/i)).toBeInTheDocument();
    });

    it('filters FAQs by Payments category', () => {
      const paymentsButton = screen.getByRole('button', { name: /payments/i });
      fireEvent.click(paymentsButton);

      expect(screen.getByText(/when am i charged/i)).toBeInTheDocument();
      expect(screen.getByText(/what payment methods do you accept/i)).toBeInTheDocument();
    });

    it('filters FAQs by Food category', () => {
      const foodButton = screen.getByRole('button', { name: /food/i });
      fireEvent.click(foodButton);

      expect(screen.getByText(/are the meals freshly cooked/i)).toBeInTheDocument();
      expect(screen.getByText(/do you cater to dietary requirements/i)).toBeInTheDocument();
    });

    it('highlights active category tab', () => {
      const subscriptionsButton = screen.getByRole('button', { name: /subscriptions/i });
      fireEvent.click(subscriptionsButton);

      expect(subscriptionsButton).toHaveClass('active');
    });
  });

  describe('Accordion Functionality', () => {
    it('expands FAQ item when clicked', () => {
      const question = screen.getByText(/how do meal plan subscriptions work/i);
      const questionButton = question.closest('button');

      if (!questionButton) throw new Error('Question button not found');

      fireEvent.click(questionButton);

      // Should show the answer (check aria-expanded state)
      expect(questionButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText(/our meal plan subscriptions/i)).toBeInTheDocument();
    });

    it('collapses FAQ item when clicked again', () => {
      const question = screen.getByText(/how do meal plan subscriptions work/i);
      const questionButton = question.closest('button');

      if (!questionButton) throw new Error('Question button not found');

      // Open
      fireEvent.click(questionButton);
      expect(questionButton).toHaveAttribute('aria-expanded', 'true');

      // Close
      fireEvent.click(questionButton);
      expect(questionButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('displays chevron icon indicating accordion state', () => {
      const question = screen.getByText(/how do meal plan subscriptions work/i);
      const questionButton = question.closest('button');

      if (!questionButton) throw new Error('Question button not found');

      // Initially shows down chevron
      expect(questionButton.querySelector('svg')).toBeInTheDocument();
    });

    it('allows multiple FAQ items to be open simultaneously', () => {
      const question1Button = screen.getByText(/how do meal plan subscriptions work/i).closest('button');
      const question2Button = screen.getByText(/where do you deliver/i).closest('button');

      if (!question1Button || !question2Button) throw new Error('Question buttons not found');

      fireEvent.click(question1Button);
      fireEvent.click(question2Button);

      // Both should be expanded
      expect(question1Button).toHaveAttribute('aria-expanded', 'true');
      expect(question2Button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Content Verification', () => {
    describe('Subscriptions FAQs', () => {
      beforeEach(() => {
        const subscriptionsButton = screen.getByRole('button', { name: /subscriptions/i });
        fireEvent.click(subscriptionsButton);
      });

      it('includes question about subscription operation', () => {
        expect(screen.getByText(/how do meal plan subscriptions work/i)).toBeInTheDocument();
      });

      it('includes question about changing meals', () => {
        expect(screen.getByText(/can i change my meals each week/i)).toBeInTheDocument();
      });

      it('includes question about skipping subscription', () => {
        expect(screen.getByText(/how do i skip or pause my subscription/i)).toBeInTheDocument();
      });

      it('includes question about cancellation', () => {
        expect(screen.getByText(/can i cancel my subscription anytime/i)).toBeInTheDocument();
      });

      it('includes question about changing plan', () => {
        expect(screen.getByText(/what happens if i want to change my plan/i)).toBeInTheDocument();
      });
    });

    describe('Delivery FAQs', () => {
      beforeEach(() => {
        const deliveryButton = screen.getByRole('button', { name: /delivery/i });
        fireEvent.click(deliveryButton);
      });

      it('includes question about delivery locations', () => {
        expect(screen.getByText(/where do you deliver/i)).toBeInTheDocument();
      });

      it('includes question about delivery days', () => {
        expect(screen.getByText(/what days do you deliver/i)).toBeInTheDocument();
      });

      it('includes question about packaging', () => {
        expect(screen.getByText(/how are the meals packaged/i)).toBeInTheDocument();
      });

      it('includes question about freshness', () => {
        expect(screen.getByText(/how long do the meals stay fresh/i)).toBeInTheDocument();
      });

      it('includes question about missed delivery', () => {
        expect(screen.getByText(/what if i'm not home for delivery/i)).toBeInTheDocument();
      });
    });

    describe('Payments FAQs', () => {
      beforeEach(() => {
        const paymentsButton = screen.getByRole('button', { name: /payments/i });
        fireEvent.click(paymentsButton);
      });

      it('includes question about charging', () => {
        expect(screen.getByText(/when am i charged/i)).toBeInTheDocument();
      });

      it('includes question about payment methods', () => {
        expect(screen.getByText(/what payment methods do you accept/i)).toBeInTheDocument();
      });

      it('includes question about minimum commitment', () => {
        expect(screen.getByText(/is there a minimum commitment/i)).toBeInTheDocument();
      });

      it('includes question about refunds', () => {
        expect(screen.getByText(/how do refunds work/i)).toBeInTheDocument();
      });
    });

    describe('Food FAQs', () => {
      beforeEach(() => {
        const foodButton = screen.getByRole('button', { name: /food/i });
        fireEvent.click(foodButton);
      });

      it('includes question about freshly cooked meals', () => {
        expect(screen.getByText(/are the meals freshly cooked/i)).toBeInTheDocument();
      });

      it('includes question about dietary requirements', () => {
        expect(screen.getByText(/do you cater to dietary requirements/i)).toBeInTheDocument();
      });

      it('includes question about reheating', () => {
        expect(screen.getByText(/how do i reheat the meals/i)).toBeInTheDocument();
      });

      it('includes question about portion sizes', () => {
        expect(screen.getByText(/what portion sizes do you offer/i)).toBeInTheDocument();
      });

      it('includes question about local sourcing', () => {
        expect(screen.getByText(/are ingredients sourced locally/i)).toBeInTheDocument();
      });
    });
  });

  describe('SEO', () => {
    it('renders with FAQ in the page structure', () => {
      // Page title is set via next/head which doesn't update document.title in jsdom
      // Instead verify the FAQ heading is present
      expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible accordion buttons with aria-expanded', () => {
      // Get FAQ item buttons (not category tabs)
      const faqButtons = screen.getAllByRole('button').filter(
        button => button.getAttribute('aria-label') === 'Question'
      );
      faqButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-expanded');
      });
    });

    it('uses semantic HTML for FAQ structure', () => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders category tabs', () => {
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(5); // Category tabs + FAQ buttons
    });
  });

  describe('CTA Section', () => {
    it('links to our process page', () => {
      const ctaLink = screen.getByRole('link', { name: /get started/i });
      expect(ctaLink).toHaveAttribute('href', '/our-process');
    });
  });
});
