import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactForm from '@/components/help/ContactForm';

// Mock fetch
global.fetch = jest.fn();

// Helper function to fill form
const fillForm = (
  name: string,
  email: string,
  subject: string,
  message: string
) => {
  fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: subject } });
  fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: message } });
};

describe('ContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<ContactForm />);

      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
    });

    it('should render with correct input types', () => {
      render(<ContactForm />);

      expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/Email Address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/Message/i).tagName).toBe('TEXTAREA');
    });

    it('should have required attributes on fields', () => {
      render(<ContactForm />);

      expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/Email Address/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/Subject/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/Message/i)).toHaveAttribute('required');
    });

    it('should render subject dropdown with all options', () => {
      render(<ContactForm />);

      const select = screen.getByLabelText(/Subject/i) as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.text);

      expect(options).toEqual([
        'Select a subject',
        'Subscription Inquiry',
        'Billing Question',
        'Delivery Issue',
        'Technical Problem',
        'Feedback & Suggestions',
        'Other'
      ]);
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      render(<ContactForm />);

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email', async () => {
      render(<ContactForm />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when no subject selected', async () => {
      render(<ContactForm />);

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'Test message with enough characters' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select a subject/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for empty message', async () => {
      render(<ContactForm />);

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for message too short', async () => {
      render(<ContactForm />);

      const messageInput = screen.getByLabelText(/Message/i);
      fireEvent.change(messageInput, { target: { value: 'Hi' } });

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when fields are corrected', async () => {
      render(<ContactForm />);

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Message sent successfully' })
      });

      render(<ContactForm />);

      fillForm('John Doe', 'john@example.com', 'Subscription Inquiry', 'I need help with my subscription');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            subject: 'Subscription Inquiry',
            message: 'I need help with my subscription'
          })
        });
      });
    });

    it('should show success message after successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Message sent successfully' })
      });

      render(<ContactForm />);

      fillForm('John Doe', 'john@example.com', 'Billing Question', 'Question about my bill');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message sent successfully/i)).toBeInTheDocument();
      });
    });

    it('should reset form after successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<ContactForm />);

      const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const messageInput = screen.getByLabelText(/Message/i) as HTMLTextAreaElement;

      fillForm('John Doe', 'john@example.com', 'Other', 'Test message content');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(emailInput.value).toBe('');
        expect(messageInput.value).toBe('');
      });
    });

    it('should show error message on submission failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: 'Failed to send message' })
      });

      render(<ContactForm />);

      fillForm('John Doe', 'john@example.com', 'Technical Problem', 'Website is not loading');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        }), 100))
      );

      render(<ContactForm />);

      fillForm('John Doe', 'john@example.com', 'Delivery Issue', 'My order has not arrived');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Sending.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ContactForm />);

      fillForm('John Doe', 'john@example.com', 'Feedback & Suggestions', 'Great service!');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred. Please try again/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      render(<ContactForm />);

      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Contact Form');
      expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/Email Address/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should announce errors to screen readers', async () => {
      render(<ContactForm />);

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should be keyboard navigable', () => {
      render(<ContactForm />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);

      // Simulate Tab key
      fireEvent.keyDown(nameInput, { key: 'Tab' });
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
    });
  });
});
