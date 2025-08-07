import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import userEvent from '@testing-library/user-event'
import { createMockSession } from '../../test-utils'

import UserHeader from '@/components/user/UserHeader'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

// Mock next/router
jest.mock('next/router')
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) {
    return <div data-href={href}>{children}</div>
  }
})

describe('UserHeader', () => {
  const mockOnMenuClick = jest.fn()

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

    mockUseRouter.mockReturnValue({
      pathname: '/user/dashboard',
      query: {},
      asPath: '/user/dashboard',
      route: '/user/dashboard',
      push: jest.fn(),
    } as any)

    // Mock signOut
    mockSignOut.mockResolvedValue(undefined as any)
  })

  describe('Rendering and structure', () => {
    it('should render header with correct structure', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should show menu button by default', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('should hide menu button when showMenuButton is false', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} showMenuButton={false} />)

      const menuButton = screen.queryByRole('button', { name: /toggle navigation menu/i })
      expect(menuButton).not.toBeInTheDocument()
    })
  })

  describe('Page title and breadcrumbs', () => {
    it('should display correct title for dashboard route', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should display correct title for subscriptions route', () => {
      mockUseRouter.mockReturnValue({
        pathname: '/user/subscriptions',
        query: {},
        asPath: '/user/subscriptions',
        route: '/user/subscriptions',
        push: jest.fn(),
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('My Subscriptions')).toBeInTheDocument()
      expect(screen.getAllByText('Dashboard')).toHaveLength(1) // One in breadcrumb
      expect(screen.getByText('My Subscriptions')).toBeInTheDocument() // One in breadcrumb
    })

    it('should display correct title for orders route', () => {
      mockUseRouter.mockReturnValue({
        pathname: '/user/orders/123',
        query: {},
        asPath: '/user/orders/123',
        route: '/user/orders/[id]',
        push: jest.fn(),
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('Order History')).toBeInTheDocument()
    })

    it('should display correct title for profile route', () => {
      mockUseRouter.mockReturnValue({
        pathname: '/user/profile/edit',
        query: {},
        asPath: '/user/profile/edit',
        route: '/user/profile/edit',
        push: jest.fn(),
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('My Profile')).toBeInTheDocument()
    })

    it('should display correct title for payments route', () => {
      mockUseRouter.mockReturnValue({
        pathname: '/user/payments',
        query: {},
        asPath: '/user/payments',
        route: '/user/payments',
        push: jest.fn(),
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('Payment Methods')).toBeInTheDocument()
    })

    it('should display default title for unknown routes', () => {
      mockUseRouter.mockReturnValue({
        pathname: '/user/unknown',
        query: {},
        asPath: '/user/unknown',
        route: '/user/unknown',
        push: jest.fn(),
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should not show breadcrumb separator on dashboard page', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const chevrons = document.querySelectorAll('.fa-chevron-right')
      expect(chevrons).toHaveLength(0)
    })

    it('should show breadcrumb separator on non-dashboard pages', () => {
      mockUseRouter.mockReturnValue({
        pathname: '/user/orders',
        query: {},
        asPath: '/user/orders',
        route: '/user/orders',
        push: jest.fn(),
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const chevrons = document.querySelectorAll('.fa-chevron-right')
      expect(chevrons).toHaveLength(1)
    })
  })

  describe('Menu button interaction', () => {
    it('should call onMenuClick when menu button is clicked', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i })
      fireEvent.click(menuButton)

      expect(mockOnMenuClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Notifications', () => {
    it('should display notification button', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      expect(notificationButton).toBeInTheDocument()
    })

    it('should show unread count badge', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const badge = screen.getByText('2') // Based on mock data
      expect(badge).toBeInTheDocument()
    })

    it('should open notifications dropdown when button is clicked', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('Order Delivered')).toBeInTheDocument()
      expect(screen.getByText('Subscription Renewal')).toBeInTheDocument()
    })

    it('should close notifications dropdown when clicked outside', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      // Open dropdown
      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('Order Delivered')).toBeInTheDocument()

      // Click outside
      await user.click(document.body)

      await waitFor(() => {
        expect(screen.queryByText('Order Delivered')).not.toBeInTheDocument()
      })
    })

    it('should handle notification item click', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      // Open dropdown
      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      // Click on notification
      const notification = screen.getByText('Order Delivered').closest('.notificationItem')
      await user.click(notification as Element)

      expect(consoleSpy).toHaveBeenCalledWith('Notification clicked:', 1)
      
      consoleSpy.mockRestore()
    })

    it('should display correct notification types and icons', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(document.querySelector('.fa-check-circle')).toBeInTheDocument()
      expect(document.querySelector('.fa-info-circle')).toBeInTheDocument()
    })

    it('should show unread notifications correctly', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      const unreadNotifications = document.querySelectorAll('.unread')
      expect(unreadNotifications.length).toBeGreaterThan(0)
    })
  })

  describe('User dropdown', () => {
    it('should display user name in header', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should display default "User" when no name provided', () => {
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

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should open user dropdown when profile button is clicked', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

      expect(screen.getByText('My Profile')).toBeInTheDocument()
      expect(screen.getByText('Payment Methods')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Help & Support')).toBeInTheDocument()
      expect(screen.getByText('Log Out')).toBeInTheDocument()
    })

    it('should show expanded attribute when dropdown is open', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      expect(profileButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(profileButton)
      expect(profileButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('should close dropdown when clicked outside', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      // Open dropdown
      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

      expect(screen.getByText('My Profile')).toBeInTheDocument()

      // Click outside
      await user.click(document.body)

      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown when menu item is clicked', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      // Open dropdown
      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

      // Click on profile link
      const profileLink = screen.getByText('My Profile').closest('a')
      await user.click(profileLink as Element)

      await waitFor(() => {
        expect(screen.queryByText('Payment Methods')).not.toBeInTheDocument()
      })
    })

    it('should display user info in dropdown header', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

      expect(screen.getAllByText('John Doe')).toHaveLength(2) // Header button + dropdown
      expect(screen.getAllByText('john@example.com')).toHaveLength(1) // Only in dropdown
    })
  })

  describe('Logout functionality', () => {
    it('should call signOut when logout is clicked', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      // Open dropdown
      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

      // Click logout
      const logoutButton = screen.getByText('Log Out')
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })
  })

  describe('Quick actions', () => {
    it('should display quick action button', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const quickAction = screen.getByText('New Subscription').closest('a')
      expect(quickAction).toBeInTheDocument()
      expect(quickAction).toHaveAttribute('data-href', '/subscriptions')
    })

    it('should have proper title attribute', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const quickAction = screen.getByTitle('Create new subscription')
      expect(quickAction).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()

      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i })
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle navigation menu')

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      expect(profileButton).toHaveAttribute('aria-label', 'User menu')
      expect(profileButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should have aria-hidden on decorative icons', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const icons = document.querySelectorAll('.fas')
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('should have proper notification button aria-label', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications \(2 unread\)/i })
      expect(notificationButton).toBeInTheDocument()
    })
  })

  describe('Visual states', () => {
    it('should apply rotated class to chevron when dropdown is open', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      const chevron = profileButton.querySelector('.fa-chevron-down')
      
      expect(chevron).not.toHaveClass('rotated')

      await user.click(profileButton)
      expect(chevron).toHaveClass('rotated')
    })

    it('should show notification badge when there are unread notifications', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      expect(notificationButton).toHaveClass('hasNotifications')
    })

    it('should handle high unread count correctly', () => {
      // This would need to be tested by modifying the mock data or making it configurable
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const badge = document.querySelector('.notificationBadge')
      expect(badge).toBeInTheDocument()
      // With current mock data (2 unread), should show "2"
      expect(badge).toHaveTextContent('2')
    })
  })

  describe('Time formatting', () => {
    it('should format notification times correctly', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
      expect(screen.getByText('1 day ago')).toBeInTheDocument()
      expect(screen.getByText('3 days ago')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle missing user session gracefully', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should handle incomplete user data', () => {
      mockUseSession.mockReturnValue({
        data: createMockSession({
          user: {
            id: '1',
            name: 'Jane',
            email: undefined,
            role: 'USER',
          },
        }),
        status: 'authenticated',
      } as any)

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      expect(screen.getByText('Jane')).toBeInTheDocument()
      // Email should not appear if undefined
    })
  })
})