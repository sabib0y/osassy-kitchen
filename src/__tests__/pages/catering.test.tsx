import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/head
jest.mock('next/head', () => {
  return function Head({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

// Mock next/link
jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function Image(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Layout component
jest.mock('@/components/Layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Import component AFTER mocks are defined
import CateringPage from '@/pages/catering';

describe('CateringPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    render(<CateringPage />);
  });

  describe('Layout and Structure', () => {
    it('renders the hero section', () => {
      expect(screen.getByRole('heading', { level: 1, name: /catering/i })).toBeInTheDocument();
    });

    it('renders a subtitle in the hero section', () => {
      expect(screen.getByText(/authentic nigerian cuisine/i)).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    it('displays the main heading', () => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/catering/i);
    });

    it('includes a call-to-action button', () => {
      const ctaButton = screen.getByRole('link', { name: /get a quote/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/contact');
    });
  });

  describe('Services Section', () => {
    it('renders the services section heading', () => {
      expect(screen.getByRole('heading', { name: /our catering services/i })).toBeInTheDocument();
    });

    it('displays corporate events service', () => {
      expect(screen.getByText(/corporate events/i)).toBeInTheDocument();
      expect(screen.getByText(/board meetings.*conferences/i)).toBeInTheDocument();
    });

    it('displays weddings and celebrations service', () => {
      expect(screen.getByText(/weddings.*celebrations/i)).toBeInTheDocument();
    });

    it('displays private parties service', () => {
      expect(screen.getByText(/private parties/i)).toBeInTheDocument();
    });

    it('displays bulk orders service', () => {
      expect(screen.getByText(/bulk orders/i)).toBeInTheDocument();
    });
  });

  describe('Why Choose Us Section', () => {
    it('renders the why choose us section', () => {
      expect(screen.getByRole('heading', { name: /why choose osassy.*catering/i })).toBeInTheDocument();
    });

    it('displays authentic Nigerian cuisine point', () => {
      expect(screen.getByText(/authentic recipes/i)).toBeInTheDocument();
    });

    it('displays experienced chefs point', () => {
      expect(screen.getByText(/experienced chefs/i)).toBeInTheDocument();
    });

    it('displays flexible menus point', () => {
      expect(screen.getByText(/flexible menus/i)).toBeInTheDocument();
    });

    it('displays professional service point', () => {
      expect(screen.getByText(/professional service/i)).toBeInTheDocument();
    });
  });

  describe('Menu Highlights Section', () => {
    it('renders the menu section heading', () => {
      expect(screen.getByRole('heading', { name: /popular catering dishes/i })).toBeInTheDocument();
    });

    it('displays Jollof Rice as a menu item', () => {
      expect(screen.getByText(/jollof rice/i)).toBeInTheDocument();
    });

    it('displays Egusi Soup as a menu item', () => {
      expect(screen.getByText(/egusi soup/i)).toBeInTheDocument();
    });

    it('displays Suya as a menu item', () => {
      expect(screen.getByText(/suya/i)).toBeInTheDocument();
    });

    it('displays Puff Puff as a menu item', () => {
      expect(screen.getByText(/puff puff/i)).toBeInTheDocument();
    });
  });

  describe('How It Works Section', () => {
    it('renders the how it works section', () => {
      expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
    });

    it('displays step 1 - enquiry', () => {
      expect(screen.getByText(/tell us about your event/i)).toBeInTheDocument();
    });

    it('displays step 2 - consultation', () => {
      expect(screen.getByText(/we.*create a custom menu/i)).toBeInTheDocument();
    });

    it('displays step 3 - confirmation', () => {
      expect(screen.getByText(/confirm.*details/i)).toBeInTheDocument();
    });

    it('displays step 4 - delivery', () => {
      expect(screen.getByText(/deliver.*fresh/i)).toBeInTheDocument();
    });
  });

  describe('Pricing Section', () => {
    it('renders the pricing section', () => {
      expect(screen.getByRole('heading', { name: /pricing/i })).toBeInTheDocument();
    });

    it('displays minimum order information', () => {
      expect(screen.getByText(/minimum.*order/i)).toBeInTheDocument();
    });

    it('displays contact information for quotes', () => {
      expect(screen.getByText(/custom quote:/i)).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    it('renders the final CTA section', () => {
      expect(screen.getByRole('heading', { name: /ready to plan your event/i })).toBeInTheDocument();
    });

    it('includes a contact link', () => {
      const links = screen.getAllByRole('link', { name: /contact us|get in touch|request.*quote/i });
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveAttribute('href', '/contact');
    });

    it('includes phone number for enquiries', () => {
      expect(screen.getByText(/\+234|phone|call/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const h1 = screen.getAllByRole('heading', { level: 1 });
      const h2 = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toHaveLength(1);
      expect(h2.length).toBeGreaterThanOrEqual(4);
    });

    it('primary links have accessible text content', () => {
      // Check that key CTAs have text
      expect(screen.getByRole('link', { name: /get a quote/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /request full menu/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /request a quote/i })).toBeInTheDocument();
    });

    it('images have alt text', () => {
      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('Responsive Design Classes', () => {
    it('has container class for max-width constraint', () => {
      const containers = document.querySelectorAll('[class*="container"]');
      expect(containers.length).toBeGreaterThan(0);
    });
  });
});

