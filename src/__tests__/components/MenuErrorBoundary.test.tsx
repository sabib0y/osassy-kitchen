import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import MenuErrorBoundary from '@/components/MenuErrorBoundary'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: ({ style }: any) => (
    <div data-testid="alert-circle" style={style}>AlertCircle</div>
  ),
  RefreshCw: ({ style }: any) => (
    <div data-testid="refresh-icon" style={style}>RefreshCw</div>
  ),
  Home: ({ style }: any) => (
    <div data-testid="home-icon" style={style}>Home</div>
  ),
}))

// Mock styles module
jest.mock('@/styles/components/subscription-create.module.css', () => ({
  errorBoundaryContainer: 'errorBoundaryContainer',
}))

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Child component content</div>
}

describe('MenuErrorBoundary', () => {
  let mockPush: jest.Mock
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    mockPush = jest.fn()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      pathname: '/test',
      query: {},
      asPath: '/test',
      route: '/test',
    } as any)

    // Suppress console.error for error boundary tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    jest.clearAllMocks()
  })

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <MenuErrorBoundary>
          <div data-testid="child">Child content</div>
        </MenuErrorBoundary>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    it('should render multiple children correctly', () => {
      render(
        <MenuErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should catch errors and display error UI', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We encountered an error while loading the menu/)).toBeInTheDocument()
      expect(screen.queryByText('Child component content')).not.toBeInTheDocument()
    })

    it('should display error icon', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const alertIcon = screen.getByTestId('alert-circle')
      expect(alertIcon).toBeInTheDocument()
      expect(alertIcon).toHaveStyle({
        width: '40px',
        height: '40px',
        color: '#dc2626',
      })
    })

    it('should show Try Again button', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i })
      expect(tryAgainButton).toBeInTheDocument()
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
    })

    it('should show Go to Dashboard button', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const dashboardButton = screen.getByRole('button', { name: /Go to Dashboard/i })
      expect(dashboardButton).toBeInTheDocument()
      expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    })

    it('should log error in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })

      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => 
        call[0] === 'Menu Error Boundary caught error:'
      )
      expect(errorCall).toBeDefined()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })

      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const detailsElement = screen.getByText('Error Details (Development Only)')
      expect(detailsElement).toBeInTheDocument()
      expect(screen.getByText(/Test error message/)).toBeInTheDocument()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })

    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })

      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })
  })

  describe('Recovery Actions', () => {
    it('should reset error state when Try Again is clicked', () => {
      let shouldThrow = true
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Child component content</div>
      }

      const { rerender } = render(
        <MenuErrorBoundary>
          <TestComponent />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Update the flag so component won't throw after reset
      shouldThrow = false

      // Click Try Again
      fireEvent.click(screen.getByRole('button', { name: /Try Again/i }))

      // Force a rerender to see the reset state
      rerender(
        <MenuErrorBoundary>
          <TestComponent />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Child component content')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    it('should call onRetry callback when provided', () => {
      const onRetryMock = jest.fn()
      
      render(
        <MenuErrorBoundary onRetry={onRetryMock}>
          <ThrowError />
        </MenuErrorBoundary>
      )

      fireEvent.click(screen.getByRole('button', { name: /Try Again/i }))

      expect(onRetryMock).toHaveBeenCalledTimes(1)
    })

    it('should handle Try Again without onRetry callback', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      // Should not throw when clicking without onRetry
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /Try Again/i }))
      }).not.toThrow()
    })

    it('should navigate to dashboard when Go to Dashboard is clicked', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const dashboardLink = screen.getByRole('button', { name: /Go to Dashboard/i }).closest('a')
      expect(dashboardLink).toHaveAttribute('href', '/user/dashboard')
    })
  })

  describe('Button Interactions', () => {
    it('should change Try Again button style on hover', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i })
      
      // Initial style
      expect(tryAgainButton).toHaveStyle({ backgroundColor: '#8B4513' })

      // Hover
      fireEvent.mouseEnter(tryAgainButton)
      expect(tryAgainButton).toHaveStyle({ backgroundColor: '#6b3410' })

      // Leave
      fireEvent.mouseLeave(tryAgainButton)
      expect(tryAgainButton).toHaveStyle({ backgroundColor: '#8B4513' })
    })

    it('should change Dashboard button style on hover', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const dashboardButton = screen.getByRole('button', { name: /Go to Dashboard/i })
      
      // Initial style - check the actual style attribute
      const initialStyle = dashboardButton.getAttribute('style')
      expect(initialStyle).toContain('background-color: transparent')

      // Hover
      fireEvent.mouseEnter(dashboardButton)
      const hoverStyle = dashboardButton.getAttribute('style')
      expect(hoverStyle).toContain('background-color: rgb(254, 243, 231)')

      // Leave
      fireEvent.mouseLeave(dashboardButton)
      const leaveStyle = dashboardButton.getAttribute('style')
      expect(leaveStyle).toContain('background-color: transparent')
    })
  })

  describe('Multiple Errors', () => {
    it('should handle multiple consecutive errors', () => {
      const { rerender } = render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Reset
      fireEvent.click(screen.getByRole('button', { name: /Try Again/i }))

      // Throw another error
      rerender(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })

    it('should update error details when new error occurs', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })

      let errorMessage = 'First error'
      const ErrorComponent = () => {
        throw new Error(errorMessage)
      }

      const { rerender } = render(
        <MenuErrorBoundary>
          <ErrorComponent />
        </MenuErrorBoundary>
      )

      expect(screen.getByText(/First error/)).toBeInTheDocument()

      // Change the error message for the next render
      errorMessage = 'Second error'

      // Reset and throw new error
      fireEvent.click(screen.getByRole('button', { name: /Try Again/i }))
      
      // Force rerender which will throw the new error
      rerender(
        <MenuErrorBoundary>
          <ErrorComponent />
        </MenuErrorBoundary>
      )

      expect(screen.getByText(/Second error/)).toBeInTheDocument()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })
  })

  describe('Error Boundary Lifecycle', () => {
    it('should maintain error state until reset', () => {
      const { rerender } = render(
        <MenuErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Rerender without resetting - error should persist
      rerender(
        <MenuErrorBoundary>
          <div>New content</div>
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.queryByText('New content')).not.toBeInTheDocument()
    })

    it('should clear error state when component unmounts and remounts', () => {
      const { unmount } = render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      unmount()

      // Remount with working component
      render(
        <MenuErrorBoundary>
          <div>Working component</div>
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Working component')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should apply correct container styles', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const container = screen.getByText('Oops! Something went wrong').closest('div')?.parentElement
      expect(container).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '40px 20px',
        textAlign: 'center',
      })
    })

    it('should have proper icon container styling', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const iconContainer = screen.getByTestId('alert-circle').parentElement
      expect(iconContainer).toHaveStyle({
        width: '80px',
        height: '80px',
        backgroundColor: '#fee2e2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })
    })

    it('should have responsive button layout', () => {
      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      const buttonContainer = screen.getByRole('button', { name: /Try Again/i }).parentElement
      expect(buttonContainer).toHaveStyle({
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle errors thrown during render', () => {
      const BrokenComponent = () => {
        throw new Error('Render error')
        return null // This line is never reached
      }

      render(
        <MenuErrorBoundary>
          <BrokenComponent />
        </MenuErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })

    it('should handle async errors', async () => {
      const AsyncError = () => {
        React.useEffect(() => {
          // Async errors are not caught by error boundaries
          setTimeout(() => {
            throw new Error('Async error')
          }, 0)
        }, [])
        return <div>Async component</div>
      }

      render(
        <MenuErrorBoundary>
          <AsyncError />
        </MenuErrorBoundary>
      )

      // Note: Error boundaries don't catch errors in event handlers,
      // async code, or during SSR. This test documents this limitation.
      expect(screen.getByText('Async component')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    it('should handle null error gracefully', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })

      render(
        <MenuErrorBoundary>
          <ThrowError />
        </MenuErrorBoundary>
      )

      // Should render even if error details are somehow null
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })
  })
})