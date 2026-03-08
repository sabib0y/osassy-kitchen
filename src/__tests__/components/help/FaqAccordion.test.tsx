import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FaqAccordion from '@/components/help/FaqAccordion';

const mockFaqData = [
  {
    id: '1',
    category: 'Subscription',
    question: 'How do I pause or cancel my subscription?',
    answer: 'You can pause or cancel your subscription from your account dashboard under the Subscriptions section.'
  },
  {
    id: '2',
    category: 'Subscription',
    question: 'Can I change the dishes in my upcoming delivery?',
    answer: 'Yes, you can modify your upcoming delivery up to 48 hours before the scheduled delivery date.'
  },
  {
    id: '3',
    category: 'Billing',
    question: 'How do I update my payment method?',
    answer: 'Navigate to your account settings and select Payment Methods to add or update your card details.'
  },
  {
    id: '4',
    category: 'Billing',
    question: 'Where can I find my invoices?',
    answer: 'All invoices are available in your account dashboard under the Billing History section.'
  },
  {
    id: '5',
    category: 'Delivery',
    question: 'What are your delivery days and times?',
    answer: 'We deliver Monday through Saturday between 10 AM and 6 PM. You can select your preferred delivery window during checkout.'
  },
  {
    id: '6',
    category: 'Food',
    question: 'Do you cater to dietary restrictions?',
    answer: 'Yes, we offer options for various dietary needs including vegetarian, vegan, and gluten-free meals.'
  }
];

describe('FaqAccordion', () => {
  describe('Rendering', () => {
    it('should render all FAQ items', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      mockFaqData.forEach(faq => {
        expect(screen.getByText(faq.question)).toBeInTheDocument();
      });
    });

    it('should render with collapsed items by default', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const answers = screen.queryAllByTestId(/faq-answer/i);
      answers.forEach(answer => {
        expect(answer).not.toHaveClass('expanded');
      });
    });

    it('should render category badges', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      expect(screen.getAllByText('Subscription').length).toBe(2);
      expect(screen.getAllByText('Billing').length).toBe(2);
      expect(screen.getByText('Delivery')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('should render expand/collapse icons', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const expandIcons = screen.getAllByTestId('expand-icon');
      expect(expandIcons).toHaveLength(mockFaqData.length);
    });
  });

  describe('Accordion Functionality', () => {
    it('should expand item when clicked', async () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const firstQuestion = screen.getByText(mockFaqData[0].question);
      fireEvent.click(firstQuestion);
      
      await waitFor(() => {
        const answer = screen.getByText(mockFaqData[0].answer);
        expect(answer.parentElement).toHaveClass('expanded');
      });
    });

    it('should collapse item when clicked again', async () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const firstQuestion = screen.getByText(mockFaqData[0].question);
      
      // Expand
      fireEvent.click(firstQuestion);
      await waitFor(() => {
        const answer = screen.getByText(mockFaqData[0].answer);
        expect(answer.parentElement).toHaveClass('expanded');
      });
      
      // Collapse
      fireEvent.click(firstQuestion);
      await waitFor(() => {
        const answer = screen.getByText(mockFaqData[0].answer);
        expect(answer.parentElement).not.toHaveClass('expanded');
      });
    });

    it('should allow multiple items to be expanded', async () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const firstQuestion = screen.getByText(mockFaqData[0].question);
      const secondQuestion = screen.getByText(mockFaqData[1].question);
      
      fireEvent.click(firstQuestion);
      fireEvent.click(secondQuestion);
      
      await waitFor(() => {
        const firstAnswer = screen.getByText(mockFaqData[0].answer);
        const secondAnswer = screen.getByText(mockFaqData[1].answer);
        
        expect(firstAnswer.parentElement).toHaveClass('expanded');
        expect(secondAnswer.parentElement).toHaveClass('expanded');
      });
    });

    it('should rotate expand icon when expanded', async () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const firstQuestion = screen.getByText(mockFaqData[0].question);
      const firstItem = firstQuestion.closest('[data-testid="faq-item"]');
      const expandIcon = firstItem?.querySelector('[data-testid="expand-icon"]');
      
      expect(expandIcon).not.toHaveClass('rotated');
      
      fireEvent.click(firstQuestion);
      
      await waitFor(() => {
        expect(expandIcon).toHaveClass('rotated');
      });
    });
  });

  describe('Filtering', () => {
    it('should filter FAQs by category', () => {
      render(<FaqAccordion faqs={mockFaqData} selectedCategory="Billing" />);
      
      expect(screen.queryByText('How do I pause or cancel my subscription?')).not.toBeInTheDocument();
      expect(screen.getByText('How do I update my payment method?')).toBeInTheDocument();
      expect(screen.getByText('Where can I find my invoices?')).toBeInTheDocument();
    });

    it('should show all FAQs when no category selected', () => {
      render(<FaqAccordion faqs={mockFaqData} selectedCategory="All" />);
      
      expect(screen.getAllByTestId('faq-item')).toHaveLength(mockFaqData.length);
    });

    it('should handle search filtering', () => {
      render(<FaqAccordion faqs={mockFaqData} searchQuery="payment" />);
      
      expect(screen.getByText('How do I update my payment method?')).toBeInTheDocument();
      expect(screen.queryByText('How do I pause or cancel my subscription?')).not.toBeInTheDocument();
    });

    it('should handle combined category and search filtering', () => {
      render(
        <FaqAccordion 
          faqs={mockFaqData} 
          selectedCategory="Billing"
          searchQuery="invoice"
        />
      );
      
      expect(screen.getByText('Where can I find my invoices?')).toBeInTheDocument();
      expect(screen.queryByText('How do I update my payment method?')).not.toBeInTheDocument();
    });

    it('should be case-insensitive for search', () => {
      render(<FaqAccordion faqs={mockFaqData} searchQuery="PAYMENT" />);
      
      expect(screen.getByText('How do I update my payment method?')).toBeInTheDocument();
    });

    it('should search in both questions and answers', () => {
      render(<FaqAccordion faqs={mockFaqData} searchQuery="dashboard" />);
      
      // This should find FAQs that mention "dashboard" in the answer
      expect(screen.getByText('How do I pause or cancel my subscription?')).toBeInTheDocument();
      expect(screen.getByText('Where can I find my invoices?')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no FAQs provided', () => {
      render(<FaqAccordion faqs={[]} />);
      
      expect(screen.getByText(/No FAQs available/i)).toBeInTheDocument();
    });

    it('should show no results message when search has no matches', () => {
      render(<FaqAccordion faqs={mockFaqData} searchQuery="xyz123notfound" />);
      
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search/i)).toBeInTheDocument();
    });

    it('should show no results for category with no items', () => {
      render(<FaqAccordion faqs={mockFaqData} selectedCategory="NonExistentCategory" />);
      
      expect(screen.getByText(/No FAQs in this category/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const faqItems = screen.getAllByTestId('faq-item');
      faqItems.forEach((item, index) => {
        const button = item.querySelector('button');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAttribute('aria-controls', `faq-answer-${mockFaqData[index].id}`);
      });
    });

    it('should update aria-expanded when expanded', async () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const firstItem = screen.getAllByTestId('faq-item')[0];
      const button = firstItem.querySelector('button');
      
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(button!);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should be keyboard navigable', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const firstItem = screen.getAllByTestId('faq-item')[0];
      const button = firstItem.querySelector('button');
      
      button?.focus();
      expect(document.activeElement).toBe(button);
      
      // Simulate Enter key
      fireEvent.keyDown(button!, { key: 'Enter' });
      
      const answer = screen.getByText(mockFaqData[0].answer);
      expect(answer.parentElement).toHaveClass('expanded');
    });

    it('should support Space key for activation', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      const firstItem = screen.getAllByTestId('faq-item')[0];
      const button = firstItem.querySelector('button');
      
      fireEvent.keyDown(button!, { key: ' ' });
      
      const answer = screen.getByText(mockFaqData[0].answer);
      expect(answer.parentElement).toHaveClass('expanded');
    });
  });

  describe('Performance', () => {
    it('should handle large number of FAQs', () => {
      const largeFaqSet = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        category: `Category ${i % 5}`,
        question: `Question ${i}`,
        answer: `Answer ${i}`
      }));
      
      render(<FaqAccordion faqs={largeFaqSet} />);
      
      expect(screen.getAllByTestId('faq-item')).toHaveLength(100);
    });

    it('should efficiently filter large datasets', () => {
      const largeFaqSet = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        category: `Category ${i % 5}`,
        question: `Question ${i}`,
        answer: `Answer ${i}`
      }));
      
      const { rerender } = render(<FaqAccordion faqs={largeFaqSet} searchQuery="Question 5" />);
      
      expect(screen.getAllByTestId('faq-item')).toHaveLength(11); // Question 5, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59
      
      rerender(<FaqAccordion faqs={largeFaqSet} searchQuery="Question 50" />);
      expect(screen.getByText('Question 50')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined props gracefully', () => {
      render(<FaqAccordion faqs={mockFaqData} />);
      
      expect(screen.getAllByTestId('faq-item')).toHaveLength(mockFaqData.length);
    });

    it('should handle malformed FAQ data', () => {
      const malformedData = [
        { id: '1', question: 'Test question' }, // Missing category and answer
        { id: '2', category: 'Test', answer: 'Test answer' }, // Missing question
      ] as any;
      
      render(<FaqAccordion faqs={malformedData} />);
      
      // Should handle gracefully without crashing
      expect(screen.getByText(/No FAQs available/i)).toBeInTheDocument();
    });
  });
});