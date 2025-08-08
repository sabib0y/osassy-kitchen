/**
 * Wave 1 Integration Test Setup
 * Provides enhanced setup and teardown for Wave 1 integration tests
 */

// Mock implementations for consistent testing
export const mockEnvironment = {
  NEXT_PUBLIC_API_BASE_URL: '/api',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock_key',
  STRIPE_SECRET_KEY: 'sk_test_mock_key',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'test-secret-wave1',
}

// Enhanced fetch mock for API testing
export const createMockFetch = () => {
  return jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    // Default successful response
    const defaultResponse = {
      success: true,
      data: { message: 'Mock response', url, method: options?.method || 'GET' }
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(defaultResponse),
      text: () => Promise.resolve(JSON.stringify(defaultResponse)),
    })
  })
}

// Session mock factory
export const createMockSession = (overrides = {}) => ({
  data: {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
      ...overrides
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  status: 'authenticated' as const,
})

// Router mock factory
export const createMockRouter = (overrides = {}) => ({
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  push: jest.fn(() => Promise.resolve(true)),
  replace: jest.fn(() => Promise.resolve(true)),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(() => Promise.resolve()),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isReady: true,
  ...overrides,
})

// Wave 1 specific setup function
export const setupWave1Tests = () => {
  // Set environment variables
  Object.entries(mockEnvironment).forEach(([key, value]) => {
    process.env[key] = value
  })

  // Setup global fetch mock
  const mockFetch = createMockFetch()
  global.fetch = mockFetch

  // Clear any existing mocks
  jest.clearAllMocks()

  // Reset modules to ensure clean state
  jest.resetModules()

  return {
    mockFetch,
    mockSession: createMockSession(),
    mockRouter: createMockRouter(),
  }
}

// Wave 1 specific cleanup function
export const cleanupWave1Tests = () => {
  // Clear all mocks
  jest.clearAllMocks()

  // Clear all timers
  jest.clearAllTimers()

  // Reset modules
  jest.resetModules()

  // Clear require cache for Wave 1 modules
  const wave1Modules = [
    '@/lib/api-client',
    '@/lib/api-types',
    '@/lib/stripe-client',
    '@/hooks/useApi',
    '@/hooks/useStripe',
    '@/components/StripeProvider',
    '@/components/user/UserLayout',
    '@/components/user/UserSidebar',
    '@/components/user/UserHeader',
  ]

  wave1Modules.forEach(modulePath => {
    try {
      const resolvedPath = require.resolve(modulePath)
      delete require.cache[resolvedPath]
    } catch (error) {
      // Module might not exist or be resolvable in test environment
      console.debug(`Could not clear cache for ${modulePath}:`, error)
    }
  })
}

// Test timeout configuration
export const WAVE1_TEST_TIMEOUT = 30000 // 30 seconds

// Enhanced error handling for async tests
export const withTimeoutAndErrorHandling = async (testFn: () => Promise<void>, timeout = 10000) => {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Test timed out after ${timeout}ms`))
    }, timeout)

    testFn()
      .then(() => {
        clearTimeout(timer)
        resolve()
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

// Module loading with retry logic
export const loadModuleWithRetry = async (modulePath: string, maxRetries = 3) => {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const module = require(modulePath)
      return module
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * attempt))
      
      // Clear module cache before retry
      try {
        const resolvedPath = require.resolve(modulePath)
        delete require.cache[resolvedPath]
      } catch {
        // Ignore cache clear errors
      }
    }
  }
  
  throw lastError || new Error(`Failed to load module ${modulePath} after ${maxRetries} attempts`)
}