import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { createMockSession } from '../../test-utils'

import UserSidebar from '@/components/user/UserSidebar'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    passHref,
  }: {
    children: React.ReactNode
    href: string
    passHref?: boolean
  }) {
    return <div data-href={href}>{children}</div>
  }
})

describe('UserSidebar', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseSession.mockReturnValue({
      data: createMockSession({
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
        },
      }),
      status: 'authenticated',
    } as any)

    ;(useRouter as jest.Mock).mockReturnValue({
      pathname: '/user/dashboard',
      query: {},
      asPath: '/user/dashboard',
      route: '/user/dashboard',
      push: jest.fn(),
    } as any)
  })

  describe('Rendering and structure', () => {
    it('should render sidebar with correct structure', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByRole('navigation', { name: /user dashboard navigation/i })).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('should render all navigation items', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Subscriptions')).toBeInTheDocument()
      expect(screen.getByText('Orders')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Payments')).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByText('New Subscription')).toBeInTheDocument()
      expect(screen.getByText('Browse Menu')).toBeInTheDocument()
      expect(screen.getByText('Help & Support')).toBeInTheDocument()
    })

    it('should apply open class when sidebarOpen is true', () => {
      render(<UserSidebar sidebarOpen={true} onClose={mockOnClose} />)

      const sidebar = screen.getByRole('navigation', { name: /user dashboard navigation/i })
      expect(sidebar).toHaveClass('sidebarOpen')
    })

    it('should not apply open class when sidebarOpen is false', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const sidebar = screen.getByRole('navigation', { name: /user dashboard navigation/i })
      expect(sidebar).not.toHaveClass('sidebarOpen')
    })
  })

  describe('User information display', () => {
    it('should display user name and email from session', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('should display default welcome when no user name', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({
          user: {
            id: '1',
            name: null,
            email: 'user@example.com',
            role: 'USER',
          },
        }),
        status: 'authenticated',
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByText('Welcome')).toBeInTheDocument()
      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    })

    it('should handle missing session gracefully', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByText('Welcome')).toBeInTheDocument()
      expect(screen.queryByText('@')).not.toBeInTheDocument()
    })
  })

  describe('Active tab detection', () => {
    it('should use activeTab prop when provided', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} activeTab="orders" />)

      const ordersItem = screen.getByText('Orders').closest('a')
      expect(ordersItem).toHaveClass('active')
      expect(ordersItem).toHaveAttribute('aria-current', 'page')
    })

    it('should detect active tab from current route - dashboard', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/user/dashboard',
        query: {},
        asPath: '/user/dashboard',
        route: '/user/dashboard',
        push: jest.fn(),
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const overviewItem = screen.getByText('Overview').closest('a')
      expect(overviewItem).toHaveClass('active')
    })

    it('should detect active tab from current route - subscriptions', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/user/subscriptions',
        query: {},
        asPath: '/user/subscriptions',
        route: '/user/subscriptions',
        push: jest.fn(),
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const subscriptionsItem = screen.getByText('Subscriptions').closest('a')
      expect(subscriptionsItem).toHaveClass('active')
    })

    it('should detect active tab from current route - orders', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/user/orders/123',
        query: {},
        asPath: '/user/orders/123',
        route: '/user/orders/[id]',
        push: jest.fn(),
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const ordersItem = screen.getByText('Orders').closest('a')
      expect(ordersItem).toHaveClass('active')
    })

    it('should detect active tab from current route - profile', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/user/profile/edit',
        query: {},
        asPath: '/user/profile/edit',
        route: '/user/profile/edit',
        push: jest.fn(),
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const profileItem = screen.getByText('Profile').closest('a')
      expect(profileItem).toHaveClass('active')
    })

    it('should detect active tab from current route - payments', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/user/payments',
        query: {},
        asPath: '/user/payments',
        route: '/user/payments',
        push: jest.fn(),
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const paymentsItem = screen.getByText('Payments').closest('a')
      expect(paymentsItem).toHaveClass('active')
    })

    it('should default to overview for unknown routes', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/unknown/route',
        query: {},
        asPath: '/unknown/route',
        route: '/unknown/route',
        push: jest.fn(),
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const overviewItem = screen.getByText('Overview').closest('a')
      expect(overviewItem).toHaveClass('active')
    })

    it('should prioritise activeTab prop over route detection', () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        pathname: '/user/orders',
        query: {},
        asPath: '/user/orders',
        route: '/user/orders',
        push: jest.fn(),
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} activeTab="profile" />)

      const profileItem = screen.getByText('Profile').closest('a')
      const ordersItem = screen.getByText('Orders').closest('a')
      
      expect(profileItem).toHaveClass('active')
      expect(ordersItem).not.toHaveClass('active')
    })
  })

  describe('Navigation interactions', () => {
    it('should call onClose when navigation item is clicked', () => {
      render(<UserSidebar sidebarOpen={true} onClose={mockOnClose} />)

      const overviewItem = screen.getByText('Overview').closest('a')
      fireEvent.click(overviewItem as Element)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when action button is clicked', () => {
      render(<UserSidebar sidebarOpen={true} onClose={mockOnClose} />)

      const newSubscriptionBtn = screen.getByText('New Subscription').closest('a')
      fireEvent.click(newSubscriptionBtn as Element)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when support link is clicked', () => {
      render(<UserSidebar sidebarOpen={true} onClose={mockOnClose} />)

      const supportLink = screen.getByText('Help & Support').closest('a')
      fireEvent.click(supportLink as Element)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when close button is clicked', () => {
      render(<UserSidebar sidebarOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByRole('button', { name: /close navigation menu/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Navigation links', () => {
    it('should have correct href attributes for navigation items', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const overviewLink = screen.getByText('Overview').closest('[data-href]')
      const subscriptionsLink = screen.getByText('Subscriptions').closest('[data-href]')
      const ordersLink = screen.getByText('Orders').closest('[data-href]')
      const profileLink = screen.getByText('Profile').closest('[data-href]')
      const paymentsLink = screen.getByText('Payments').closest('[data-href]')

      expect(overviewLink).toHaveAttribute('data-href', '/user/dashboard')
      expect(subscriptionsLink).toHaveAttribute('data-href', '/user/subscriptions')
      expect(ordersLink).toHaveAttribute('data-href', '/user/orders')
      expect(profileLink).toHaveAttribute('data-href', '/user/profile')
      expect(paymentsLink).toHaveAttribute('data-href', '/user/payments')
    })

    it('should have correct href attributes for action buttons', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const newSubscriptionLink = screen.getByText('New Subscription').closest('[data-href]')
      const browseMenuLink = screen.getByText('Browse Menu').closest('[data-href]')
      const supportLink = screen.getByText('Help & Support').closest('[data-href]')

      expect(newSubscriptionLink).toHaveAttribute('data-href', '/subscriptions')
      expect(browseMenuLink).toHaveAttribute('data-href', '/menu')
      expect(supportLink).toHaveAttribute('data-href', '/support')
    })
  })

  describe('Icons and visual elements', () => {
    it('should render FontAwesome icons for navigation items', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const icons = document.querySelectorAll('.fas')
      expect(icons.length).toBeGreaterThan(0)

      // Check for specific navigation icons
      expect(document.querySelector('.fa-home')).toBeInTheDocument()
      expect(document.querySelector('.fa-sync-alt')).toBeInTheDocument()
      expect(document.querySelector('.fa-shopping-bag')).toBeInTheDocument()
      expect(document.querySelector('.fa-user')).toBeInTheDocument()
      expect(document.querySelector('.fa-credit-card')).toBeInTheDocument()
    })

    it('should render action button icons', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(document.querySelector('.fa-plus')).toBeInTheDocument()
      expect(document.querySelector('.fa-utensils')).toBeInTheDocument()
      expect(document.querySelector('.fa-question-circle')).toBeInTheDocument()
    })

    it('should show active indicator for active nav item', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} activeTab="orders" />)

      const activeIndicator = document.querySelector('.activeIndicator')
      expect(activeIndicator).toBeInTheDocument()
    })

    it('should not show active indicator for non-active nav items', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} activeTab="orders" />)

      // Only one active indicator should exist
      const activeIndicators = document.querySelectorAll('.activeIndicator')
      expect(activeIndicators).toHaveLength(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const sidebar = screen.getByRole('navigation', { name: /user dashboard navigation/i })
      expect(sidebar).toHaveAttribute('role', 'navigation')
      expect(sidebar).toHaveAttribute('aria-label', 'User dashboard navigation')

      const closeButton = screen.getByRole('button', { name: /close navigation menu/i })
      expect(closeButton).toHaveAttribute('aria-label', 'Close navigation menu')
    })

    it('should set aria-current for active navigation item', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} activeTab="profile" />)

      const profileItem = screen.getByText('Profile').closest('a')
      expect(profileItem).toHaveAttribute('aria-current', 'page')

      const overviewItem = screen.getByText('Overview').closest('a')
      expect(overviewItem).not.toHaveAttribute('aria-current')
    })

    it('should have aria-hidden on decorative icons', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const icons = document.querySelectorAll('.fas')
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Mobile behaviour', () => {
    it('should handle mobile sidebar states correctly', () => {
      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      const sidebar = screen.getByRole('navigation', { name: /user dashboard navigation/i })
      expect(sidebar).toHaveClass('sidebar')
      expect(sidebar).not.toHaveClass('sidebarOpen')
    })

    it('should call onClose when any interactive element is clicked in mobile', () => {
      render(<UserSidebar sidebarOpen={true} onClose={mockOnClose} />)

      // Test multiple elements
      fireEvent.click(screen.getByText('Overview').closest('a') as Element)
      fireEvent.click(screen.getByText('New Subscription').closest('a') as Element)
      fireEvent.click(screen.getByText('Help & Support').closest('a') as Element)

      expect(mockOnClose).toHaveBeenCalledTimes(3)
    })
  })

  describe('Edge cases', () => {
    it('should handle missing session user gracefully', () => {
      mockUseSession.mockReturnValue({
        data: { expires: '2024-12-31', user: undefined },
        status: 'authenticated',
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByText('Welcome')).toBeInTheDocument()
      expect(screen.queryByText('@')).not.toBeInTheDocument()
    })

    it('should handle partial user information', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({
          user: {
            id: '1',
            name: 'Jane Doe',
            email: undefined,
            role: 'USER',
          },
        }),
        status: 'authenticated',
      } as any)

      render(<UserSidebar sidebarOpen={false} onClose={mockOnClose} />)

      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.queryByText('@')).not.toBeInTheDocument()
    })
  })
})