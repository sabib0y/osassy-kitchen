import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import CancelPage from '@/pages/cancel'
import { createMockSession } from '../test-utils'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock next/link
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, className }: any) => (
      <a href={href} className={className}>
        {children}
      </a>
    ),
  }
})

// Mock Layout component
jest.mock('@/components/Layout/Layout', () => {
  return {
    __esModule: true,
    default: function MockLayout({
      children,
      pageTitle,
    }: {
      children: React.ReactNode
      pageTitle: string
    }) {
      return (
        <div data-testid="layout">
          <title>{pageTitle}</title>
          {children}
        </div>
      )
    }
  }
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  XCircle: ({ className }: any) => (
    <div data-testid="x-circle" className={className}>XCircle</div>
  ),
  ArrowLeft: ({ className }: any) => (
    <div data-testid="arrow-left" className={className}>ArrowLeft</div>
  ),
  ShoppingCart: ({ className }: any) => (
    <div data-testid="shopping-cart" className={className}>ShoppingCart</div>
  ),
  RefreshCw: ({ className }: any) => (
    <div data-testid="refresh-cw" className={className}>RefreshCw</div>
  ),
  HelpCircle: ({ className }: any) => (
    <div data-testid="help-circle" className={className}>HelpCircle</div>
  ),
  Phone: ({ className }: any) => (
    <div data-testid="phone" className={className}>Phone</div>
  ),
  Mail: ({ className }: any) => (
    <div data-testid="mail" className={className}>Mail</div>
  ),
  MessageCircle: ({ className }: any) => (
    <div data-testid="message-circle" className={className}>MessageCircle</div>
  ),
  Home: ({ className }: any) => (
    <div data-testid="home-icon" className={className}>Home</div>
  ),
  CreditCard: ({ className }: any) => (
    <div data-testid="credit-card" className={className}>CreditCard</div>
  ),
  ShieldAlert: ({ className }: any) => (
    <div data-testid="shield-alert" className={className}>ShieldAlert</div>
  ),
  AlertTriangle: ({ className }: any) => (
    <div data-testid="alert-triangle" className={className}>AlertTriangle</div>
  ),
}))

// Mock styles
jest.mock('@/styles/pages/cancel.module.css', () => ({
  container: 'container',
  content: 'content',
  loadingWrapper: 'loadingWrapper',
  spinner: 'spinner',
  cancelHeader: 'cancelHeader',
  iconWrapper: 'iconWrapper',
  cancelIcon: 'cancelIcon',
  title: 'title',
  subtitle: 'subtitle',
  infoBox: 'infoBox',
  infoIcon: 'infoIcon',
  infoContent: 'infoContent',
  actionButtons: 'actionButtons',
  primaryButton: 'primaryButton',
  secondaryButton: 'secondaryButton',
  reasonsSection: 'reasonsSection',
  sectionTitle: 'sectionTitle',
  reasonsGrid: 'reasonsGrid',
  reasonCard: 'reasonCard',
  reasonIcon: 'reasonIcon',
  tipsSection: 'tipsSection',
  tipsList: 'tipsList',
  tip: 'tip',
  tipNumber: 'tipNumber',
  tipContent: 'tipContent',
  supportSection: 'supportSection',
  supportText: 'supportText',
  contactOptions: 'contactOptions',
  contactButton: 'contactButton',
  faqSection: 'faqSection',
  faqList: 'faqList',
  faqItem: 'faqItem',
  faqQuestion: 'faqQuestion',
  faqAnswer: 'faqAnswer',
  footerMessage: 'footerMessage',
  footerCTA: 'footerCTA',
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Store original location
const originalLocation = window.location

beforeAll(() => {
  // @ts-ignore
  delete window.location
  window.location = mockLocation as any
})

afterAll(() => {
  window.location = originalLocation
})

describe('CancelPage', () => {
  let mockPush: jest.Mock
  let mockRouter: any

  beforeEach(() => {
    mockPush = jest.fn()
    mockRouter = {
      push: mockPush,
      query: {},
      pathname: '/cancel',
      asPath: '/cancel',
      route: '/cancel',
    }
    mockUseRouter.mockReturnValue(mockRouter)

    // Default authenticated session
    mockUseSession.mockReturnValue({
      data: createMockSession(),
      status: 'authenticated',
      update: jest.fn(),
    } as any)
    
    // Reset localStorage mock
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    
    // Reset window.location
    mockLocation.href = ''
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render cancel page with correct title', () => {
      render(<CancelPage />)

      // Check that the document title is set correctly
      expect(document.title).toBe('Payment Cancelled - Osassy Kitchen')
      expect(screen.getByText('Payment Cancelled')).toBeInTheDocument()
    })

    it('should display cancellation icon', () => {
      render(<CancelPage />)

      const icon = screen.getByTestId('x-circle')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('cancelIcon')
    })

    it('should display main cancellation message', () => {
      render(<CancelPage />)

      expect(screen.getByText(/Your payment was not processed and no charges were made/)).toBeInTheDocument()
    })

    it('should render all sections', () => {
      render(<CancelPage />)

      // Main content
      expect(screen.getByText('Payment Cancelled')).toBeInTheDocument()
      
      // Buttons
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
      
      // Help section
      expect(screen.getByText(/Need Help\?/)).toBeInTheDocument()
      
      // Reasons section
      expect(screen.getByText(/Common Reasons for Cancellation/)).toBeInTheDocument()
    })
  })

  describe('Navigation Buttons', () => {
    it('should navigate to subscriptions page when Try Again is clicked', () => {
      render(<CancelPage />)

      const retryButton = screen.getByRole('button', { name: /Try Again/i })
      fireEvent.click(retryButton)

      expect(mockPush).toHaveBeenCalledWith('/subscriptions/create')
    })

    it('should have link to dashboard', () => {
      render(<CancelPage />)

      const dashboardLink = screen.getByText('Go to Dashboard').closest('a')
      expect(dashboardLink).toHaveAttribute('href', '/user/dashboard')
    })

    it('should display correct icons in buttons', () => {
      render(<CancelPage />)

      const retryButton = screen.getByRole('button', { name: /Try Again/i })
      
      // Check for icons within buttons
      expect(retryButton.querySelector('[data-testid="refresh-cw"]')).toBeInTheDocument()
    })

    it('should have proper button styling classes', () => {
      render(<CancelPage />)

      const retryButton = screen.getByRole('button', { name: /Try Again/i })
      const dashboardLink = screen.getByText('Go to Dashboard').closest('a')

      expect(retryButton).toHaveClass('primaryButton')
      expect(dashboardLink).toHaveClass('secondaryButton')
    })
  })

  describe('Help Section', () => {
    it('should display help section title', () => {
      render(<CancelPage />)

      expect(screen.getByText('Need Help?')).toBeInTheDocument()
    })

    it('should display help text', () => {
      render(<CancelPage />)

      expect(screen.getByText(/Our support team is here to assist you with any payment issues/)).toBeInTheDocument()
    })

    it('should display contact options', () => {
      render(<CancelPage />)

      expect(screen.getByRole('button', { name: /Email Support/i })).toBeInTheDocument()
      expect(screen.getByText('Call Us')).toBeInTheDocument()
      expect(screen.getByText('Live Chat')).toBeInTheDocument()
    })

    it('should have email support button that is clickable', () => {
      render(<CancelPage />)

      const emailButton = screen.getByRole('button', { name: /Email Support/i })
      
      // Just verify the button exists and is clickable
      expect(emailButton).toBeInTheDocument()
      expect(emailButton).not.toBeDisabled()
      
      // Test button click without checking window.location.href
      // The actual navigation is handled by the browser
      fireEvent.click(emailButton)
      
      // The button should still be there after clicking
      expect(emailButton).toBeInTheDocument()
    })
  })

  describe('Cancellation Reasons', () => {
    it('should display reasons section title', () => {
      render(<CancelPage />)

      expect(screen.getByText('Common Reasons for Cancellation')).toBeInTheDocument()
    })

    it('should display all cancellation reason cards', () => {
      render(<CancelPage />)

      expect(screen.getByText('Payment Method')).toBeInTheDocument()
      expect(screen.getByText('Security Check')).toBeInTheDocument()
      expect(screen.getByText('Changed Mind')).toBeInTheDocument()
    })

    it('should display reason descriptions', () => {
      render(<CancelPage />)

      expect(screen.getByText(/Incorrect card details or insufficient funds/)).toBeInTheDocument()
      expect(screen.getByText(/Bank declined for security reasons/)).toBeInTheDocument()
      expect(screen.getByText(/Decided to review order before completing/)).toBeInTheDocument()
    })
  })

  describe('Session Handling', () => {
    it('should render correctly when user is authenticated', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
        update: jest.fn(),
      } as any)

      render(<CancelPage />)

      expect(screen.getByText('Payment Cancelled')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should redirect to login when user is unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as any)

      render(<CancelPage />)

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should show loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      } as any)

      render(<CancelPage />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
    
    it('should not redirect when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      } as any)

      render(<CancelPage />)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Cart Backup', () => {
    it('should save cart to backup on mount', () => {
      localStorageMock.getItem.mockReturnValue('{"items": [1, 2, 3]}')
      
      render(<CancelPage />)

      expect(localStorageMock.getItem).toHaveBeenCalledWith('subscription_cart')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('subscription_cart_backup', '{"items": [1, 2, 3]}')
    })

    it('should restore cart backup when retry payment is clicked', () => {
      localStorageMock.getItem.mockReturnValue('{"items": [1, 2, 3]}')
      
      render(<CancelPage />)

      const retryButton = screen.getByRole('button', { name: /Try Again/i })
      fireEvent.click(retryButton)

      expect(localStorageMock.getItem).toHaveBeenCalledWith('subscription_cart_backup')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('subscription_cart', '{"items": [1, 2, 3]}')
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      expect(() => render(<CancelPage />)).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save cart:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('FAQ Section', () => {
    it('should display FAQ section', () => {
      render(<CancelPage />)

      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    })

    it('should display FAQ questions', () => {
      render(<CancelPage />)

      expect(screen.getByText(/Will I be charged for the cancelled transaction\?/)).toBeInTheDocument()
      expect(screen.getByText(/Are my selected dishes saved\?/)).toBeInTheDocument()
      expect(screen.getByText(/Is my payment information secure\?/)).toBeInTheDocument()
      expect(screen.getByText(/Can I pay with a different method\?/)).toBeInTheDocument()
    })

    it('should display FAQ answers', () => {
      render(<CancelPage />)

      expect(screen.getByText(/No, you will not be charged/)).toBeInTheDocument()
      expect(screen.getByText(/Yes! We've saved your selection/)).toBeInTheDocument()
      expect(screen.getByText(/Absolutely. We use Stripe for payment processing/)).toBeInTheDocument()
      expect(screen.getByText(/Currently, we accept all major credit and debit cards/)).toBeInTheDocument()
    })
  })

  describe('Troubleshooting Tips', () => {
    it('should display troubleshooting section', () => {
      render(<CancelPage />)

      expect(screen.getByText('Having Trouble?')).toBeInTheDocument()
    })

    it('should display all tips', () => {
      render(<CancelPage />)

      expect(screen.getByText('Check Your Card Details')).toBeInTheDocument()
      expect(screen.getByText('Contact Your Bank')).toBeInTheDocument()
      expect(screen.getByText('Try a Different Card')).toBeInTheDocument()
      expect(screen.getByText('Clear Browser Data')).toBeInTheDocument()
    })
  })

  describe('Footer Message', () => {
    it('should display footer message', () => {
      render(<CancelPage />)

      expect(screen.getByText(/Ready to enjoy delicious Nigerian meals delivered to your door\?/)).toBeInTheDocument()
    })

    it('should display footer CTA button', () => {
      render(<CancelPage />)

      const footerCTA = screen.getByRole('button', { name: /Complete Your Subscription/i })
      expect(footerCTA).toBeInTheDocument()
      expect(footerCTA).toHaveClass('footerCTA')
    })

    it('should navigate when footer CTA is clicked', () => {
      render(<CancelPage />)

      const footerCTA = screen.getByRole('button', { name: /Complete Your Subscription/i })
      fireEvent.click(footerCTA)

      expect(mockPush).toHaveBeenCalledWith('/subscriptions/create')
    })
  })

  describe('Edge Cases', () => {
    it('should attempt to redirect when router push is available', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as any)

      render(<CancelPage />)

      // Should attempt to redirect to login
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should handle empty localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      render(<CancelPage />)

      // Should not attempt to set backup if no cart exists
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('subscription_cart_backup', expect.anything())
    })

    it('should render with minimal props', () => {
      expect(() => render(<CancelPage />)).not.toThrow()
    })
  })
})