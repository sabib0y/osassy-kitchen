import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { createMockSession } from '../../test-utils'

import UserLayout from '@/components/user/UserLayout'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/router
jest.mock('next/router')
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock child components
jest.mock('@/components/user/UserSidebar', () => {
  return function MockUserSidebar({
    activeTab,
    sidebarOpen,
    onClose,
  }: {
    activeTab?: string
    sidebarOpen: boolean
    onClose: () => void
  }) {
    return (
      <div data-testid="user-sidebar">
        <div data-testid="active-tab">{activeTab || 'none'}</div>
        <div data-testid="sidebar-open">{sidebarOpen ? 'open' : 'closed'}</div>
        <button data-testid="sidebar-close" onClick={onClose}>
          Close Sidebar
        </button>
      </div>
    )
  }
})

jest.mock('@/components/user/UserHeader', () => {
  return function MockUserHeader({
    onMenuClick,
    showMenuButton,
  }: {
    onMenuClick: () => void
    showMenuButton?: boolean
  }) {
    return (
      <div data-testid="user-header">
        {showMenuButton && (
          <button data-testid="menu-button" onClick={onMenuClick}>
            Open Menu
          </button>
        )}
      </div>
    )
  }
})

jest.mock('@/components/Layout/Layout', () => {
  return function MockLayout({
    children,
    pageTitle,
  }: {
    children: React.ReactNode
    pageTitle: string
  }) {
    return (
      <div data-testid="layout">
        <div data-testid="page-title">{pageTitle}</div>
        {children}
      </div>
    )
  }
})

describe('UserLayout', () => {
  let mockPush: jest.Mock
  let mockEvents: any

  beforeEach(() => {
    mockPush = jest.fn()
    mockEvents = {
      on: jest.fn(),
      off: jest.fn(),
    }

    mockUseRouter.mockReturnValue({
      push: mockPush,
      pathname: '/user/dashboard',
      events: mockEvents,
      query: {},
      asPath: '/user/dashboard',
      route: '/user/dashboard',
    } as any)

    // Default authenticated session
    mockUseSession.mockReturnValue({
      data: createMockSession(),
      status: 'authenticated',
    } as any)

    jest.clearAllMocks()
  })

  describe('Authentication checks', () => {
    it('should show loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any)

      render(
        <UserLayout>
          <div>Test content</div>
        </UserLayout>
      )

      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument()
      expect(screen.queryByText('Test content')).not.toBeInTheDocument()
    })

    it('should redirect to login when unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any)

      render(
        <UserLayout>
          <div>Test content</div>
        </UserLayout>
      )

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should return null while redirecting unauthenticated user', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any)

      const { container } = render(
        <UserLayout>
          <div>Test content</div>
        </UserLayout>
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render layout when authenticated', () => {
      render(
        <UserLayout>
          <div data-testid="test-content">Test content</div>
        </UserLayout>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      expect(screen.getByTestId('user-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('user-header')).toBeInTheDocument()
    })
  })

  describe('Layout structure and props', () => {
    it('should render with default props', () => {
      render(
        <UserLayout>
          <div data-testid="content">Content</div>
        </UserLayout>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.getByTestId('user-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('user-header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed')
    })

    it('should pass correct activeTab to sidebar', () => {
      render(
        <UserLayout activeTab="orders">
          <div>Content</div>
        </UserLayout>
      )

      expect(screen.getByTestId('active-tab')).toHaveTextContent('orders')
    })

    it('should hide sidebar when showSidebar is false', () => {
      render(
        <UserLayout showSidebar={false}>
          <div data-testid="content">Content</div>
        </UserLayout>
      )

      expect(screen.queryByTestId('user-sidebar')).not.toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should pass custom page title', () => {
      const customTitle = 'Custom Page Title'
      
      render(
        <UserLayout pageTitle={customTitle}>
          <div>Content</div>
        </UserLayout>
      )

      // Check that the title is passed to Layout component
      expect(screen.getByTestId('page-title')).toHaveTextContent(customTitle)
    })

    it('should use default page title when not provided', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      expect(screen.getByTestId('page-title')).toHaveTextContent("User Dashboard - Osassy's Kitchen")
    })
  })

  describe('Sidebar functionality', () => {
    it('should open sidebar when menu button is clicked', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed')

      fireEvent.click(screen.getByTestId('menu-button'))

      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open')
    })

    it('should close sidebar when close button is clicked', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      // Open sidebar first
      fireEvent.click(screen.getByTestId('menu-button'))
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open')

      // Close sidebar
      fireEvent.click(screen.getByTestId('sidebar-close'))
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed')
    })

    it('should close sidebar on overlay click', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      // Open sidebar first
      fireEvent.click(screen.getByTestId('menu-button'))
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open')

      // Find and click overlay
      const overlay = document.querySelector('.mobileOverlay')
      expect(overlay).toBeInTheDocument()
      
      fireEvent.click(overlay as Element)
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed')
    })

    it('should close sidebar on Escape key press', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      // Open sidebar first
      fireEvent.click(screen.getByTestId('menu-button'))
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open')

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed')
    })

    it('should not close sidebar on non-Escape key press', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      // Open sidebar first
      fireEvent.click(screen.getByTestId('menu-button'))
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open')

      // Press non-Escape key
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' })
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open')
    })

    it('should close sidebar on route change', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      // Open sidebar first
      fireEvent.click(screen.getByTestId('menu-button'))
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('open')

      // Simulate route change
      const routeChangeHandler = mockEvents.on.mock.calls.find(
        (call: any) => call[0] === 'routeChangeStart'
      )?.[1]
      
      expect(routeChangeHandler).toBeDefined()
      routeChangeHandler()
      
      expect(screen.getByTestId('sidebar-open')).toHaveTextContent('closed')
    })

    it('should register and unregister router event listeners', () => {
      const { unmount } = render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      expect(mockEvents.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function))

      unmount()

      expect(mockEvents.off).toHaveBeenCalledWith('routeChangeStart', expect.any(Function))
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on overlay', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      // Open sidebar to show overlay
      fireEvent.click(screen.getByTestId('menu-button'))

      const overlay = document.querySelector('.mobileOverlay')
      expect(overlay).toHaveAttribute('aria-label', 'Close sidebar')
    })

    it('should have proper meta tags for user pages', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      // Check that meta tags are rendered (mocked Head component should render them)
      const metaTags = document.querySelectorAll('meta')
      expect(metaTags.length).toBeGreaterThan(0)
    })
  })

  describe('Header menu button visibility', () => {
    it('should show menu button by default', () => {
      render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      expect(screen.getByTestId('menu-button')).toBeInTheDocument()
    })

    it('should hide menu button when showSidebar is false', () => {
      render(
        <UserLayout showSidebar={false}>
          <div>Content</div>
        </UserLayout>
      )

      expect(screen.queryByTestId('menu-button')).not.toBeInTheDocument()
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle session becoming null after loading', async () => {
      // Start with loading session
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any)

      const { rerender } = render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument()

      // Change to unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any)

      rerender(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should handle transition from loading to authenticated', () => {
      // Start with loading session
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any)

      const { rerender } = render(
        <UserLayout>
          <div data-testid="content">Content</div>
        </UserLayout>
      )

      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument()

      // Change to authenticated
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
      } as any)

      rerender(
        <UserLayout>
          <div data-testid="content">Content</div>
        </UserLayout>
      )

      expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('Event cleanup', () => {
    it('should clean up keyboard event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <UserLayout>
          <div>Content</div>
        </UserLayout>
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })
})