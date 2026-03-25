import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactPage from '@/pages/contact';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/contact',
    push: jest.fn(),
  }),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Contact Page', () => {
  beforeEach(() => {
    render(<ContactPage />);
  });

  describe('Page Structure', () => {
    it('renders the page title', () => {
      expect(screen.getByRole('heading', { name: /contact us/i, level: 1 })).toBeInTheDocument();
    });

    it('renders the hero section with subtitle', () => {
      expect(screen.getByText(/we'd love to hear from you/i)).toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('displays email contact information', () => {
      expect(screen.getByRole('heading', { name: /email/i })).toBeInTheDocument();
    });

    it('displays phone contact information', () => {
      expect(screen.getByRole('heading', { name: /phone/i })).toBeInTheDocument();
    });

    it('displays business hours', () => {
      expect(screen.getByRole('heading', { name: /hours/i })).toBeInTheDocument();
    });

    it('displays location information', () => {
      expect(screen.getByRole('heading', { name: /location/i })).toBeInTheDocument();
    });
  });

  describe('Contact Form', () => {
    it('renders the contact form', () => {
      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    });

    it('renders email input field', () => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });

    it('renders message textarea', () => {
      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
    });

    it('renders submit button', () => {
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has semantic heading structure', () => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('form inputs have associated labels', () => {
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      expect(nameInput).toHaveAttribute('id');
    });
  });
});
