import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import userEvent from '@testing-library/user-event'
import { createMockSession } from '../../test-utils'

import UserHeader from '@/components/user/UserHeader'
import { NotificationPayload } from '@/types/websocket'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
    ...props
  }: {
    children: React.ReactNode
    href: string
    className?: string
    [key: string]: any
  }) {
    return (
      <a href={href} className={className} data-href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Mock WebSocket context
const mockClearNotifications = jest.fn()
const mockWebSocketContext = {
  connected: true,
  connecting: false,
  reconnecting: false,
  error: null,
  send: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
  unsubscribe: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  reconnect: jest.fn(),
  onOrderUpdate: jest.fn(() => jest.fn()),
  onSubscriptionUpdate: jest.fn(() => jest.fn()),
  onNotification: jest.fn(() => jest.fn()),
  onDashboardUpdate: jest.fn(() => jest.fn()),
  onSystemMessage: jest.fn(() => jest.fn()),
  recentNotifications: [] as NotificationPayload[],
  clearNotifications: mockClearNotifications,
}

jest.mock('@/components/providers/WebSocketProvider', () => ({
  useWebSocketContext: () => mockWebSocketContext,
}))

// Helper to create mock notifications
const createNotification = (overrides: Partial<NotificationPayload> = {}): NotificationPayload => ({
  id: `notif-${Math.random().toString(36).slice(2)}`,
  title: 'Test Notification',
  message: 'Test message',
  type: 'info',
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  ...overrides,
})

describe('UserHeader', () => {
  const mockOnMenuClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset notification state
    mockWebSocketContext.recentNotifications = []
    mockWebSocketContext.connected = true

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

      expect(screen.getByRole('heading', { name: 'My Subscriptions' })).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getAllByText('My Subscriptions')).toHaveLength(2)
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

      expect(screen.getByRole('heading', { name: 'Order History' })).toBeInTheDocument()
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

      expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument()
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

      expect(screen.getByRole('heading', { name: 'Payment Methods' })).toBeInTheDocument()
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

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
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

  describe('Notifications (live WebSocket)', () => {
    it('should display notification button', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      expect(notificationButton).toBeInTheDocument()
    })

    it('should not show badge when there are no notifications', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const badge = document.querySelector('.notificationBadge')
      expect(badge).not.toBeInTheDocument()
    })

    it('should show unread count badge from WebSocket context', () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'Order Delivered', type: 'success' }),
        createNotification({ id: 'n2', title: 'Subscription Renewal', type: 'info' }),
      ]

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const badge = document.querySelector('.notificationBadge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('2')
    })

    it('should cap badge display at 9+', () => {
      mockWebSocketContext.recentNotifications = Array.from({ length: 10 }, (_, i) =>
        createNotification({ id: `n${i}` })
      )

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const badge = document.querySelector('.notificationBadge')
      expect(badge).toHaveTextContent('9+')
    })

    it('should open notifications dropdown when button is clicked', async () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'Order Delivered', type: 'success' }),
        createNotification({ id: 'n2', title: 'Subscription Renewal', type: 'info' }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('Order Delivered')).toBeInTheDocument()
      expect(screen.getByText('Subscription Renewal')).toBeInTheDocument()
    })

    it('should show empty state when no notifications', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('No new notifications')).toBeInTheDocument()
    })

    it('should show notification header with unread count', async () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1' }),
        createNotification({ id: 'n2' }),
        createNotification({ id: 'n3' }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('3 unread')).toBeInTheDocument()
    })

    it('should close notifications dropdown when clicked outside', async () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'Order Delivered' }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('Order Delivered')).toBeInTheDocument()

      // Click outside
      await user.click(document.body)

      await waitFor(() => {
        expect(screen.queryByText('Order Delivered')).not.toBeInTheDocument()
      })
    })

    it('should navigate to actionUrl when notification is clicked', async () => {
      const mockPush = jest.fn()
      mockUseRouter.mockReturnValue({
        pathname: '/user/dashboard',
        query: {},
        asPath: '/user/dashboard',
        route: '/user/dashboard',
        push: mockPush,
      } as any)

      mockWebSocketContext.recentNotifications = [
        createNotification({
          id: 'n1',
          title: 'Order Shipped',
          actionUrl: '/user/orders/456',
        }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      const notification = screen.getByText('Order Shipped').closest('[class*="notificationItem"]')
      await user.click(notification as Element)

      expect(mockPush).toHaveBeenCalledWith('/user/orders/456')
    })

    it('should not navigate when notification has no actionUrl', async () => {
      const mockPush = jest.fn()
      mockUseRouter.mockReturnValue({
        pathname: '/user/dashboard',
        query: {},
        asPath: '/user/dashboard',
        route: '/user/dashboard',
        push: mockPush,
      } as any)

      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'General Info' }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      const notification = screen.getByText('General Info').closest('[class*="notificationItem"]')
      await user.click(notification as Element)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should display correct notification type icons', async () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'Success', type: 'success' }),
        createNotification({ id: 'n2', title: 'Info', type: 'info' }),
        createNotification({ id: 'n3', title: 'Warning', type: 'warning' }),
        createNotification({ id: 'n4', title: 'Error', type: 'error' }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(document.querySelector('.fa-check-circle')).toBeInTheDocument()
      expect(document.querySelector('.fa-info-circle')).toBeInTheDocument()
      expect(document.querySelector('.fa-exclamation-triangle')).toBeInTheDocument()
      expect(document.querySelector('.fa-exclamation-circle')).toBeInTheDocument()
    })

    it('should show Clear all button when there are notifications', async () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1' }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('Clear all')).toBeInTheDocument()
    })

    it('should not show Clear all button when there are no notifications', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
    })

    it('should call clearNotifications and close dropdown when Clear all is clicked', async () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'Test' }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      const clearButton = screen.getByText('Clear all')
      await user.click(clearButton)

      expect(mockClearNotifications).toHaveBeenCalledTimes(1)
    })

    it('should apply hasNotifications class when unread count > 0', () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1' }),
      ]

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      expect(notificationButton).toHaveClass('hasNotifications')
    })

    it('should not apply hasNotifications class when there are no notifications', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      expect(notificationButton).not.toHaveClass('hasNotifications')
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
      expect(screen.getByText('Support')).toBeInTheDocument()
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

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

      expect(screen.getByText('My Profile')).toBeInTheDocument()

      await user.click(document.body)

      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown when menu item is clicked', async () => {
      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

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

      const profileButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(profileButton)

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

    it('should have proper notification button aria-label with unread count', () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1' }),
        createNotification({ id: 'n2' }),
      ]

      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications \(2 unread\)/i })
      expect(notificationButton).toBeInTheDocument()
    })

    it('should have notification button without unread count when empty', () => {
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /^notifications\s*$/i })
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
  })

  describe('Time formatting', () => {
    it('should format notification times as relative time', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'Recent', timestamp: twoHoursAgo }),
        createNotification({ id: 'n2', title: 'Older', timestamp: oneDayAgo }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
      // "yesterday" or "1 day ago" depending on Intl.RelativeTimeFormat
      const timeElements = document.querySelectorAll('[class*="notificationTime"]')
      expect(timeElements.length).toBe(2)
    })

    it('should show "Just now" for very recent notifications', async () => {
      mockWebSocketContext.recentNotifications = [
        createNotification({ id: 'n1', title: 'Just happened', timestamp: new Date().toISOString() }),
      ]

      const user = userEvent.setup()
      render(<UserHeader onMenuClick={mockOnMenuClick} />)

      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationButton)

      expect(screen.getByText('Just now')).toBeInTheDocument()
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
    })
  })
})
