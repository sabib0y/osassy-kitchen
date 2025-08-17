import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

/**
 * Comprehensive Playwright Configuration for E2E Testing
 * Supports multiple browsers, environments, and testing scenarios
 */

// Environment variables with defaults
const CI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS !== 'false';
const WORKERS = process.env.WORKERS ? parseInt(process.env.WORKERS) : CI ? 2 : 1;
const RETRIES = process.env.RETRIES ? parseInt(process.env.RETRIES) : CI ? 2 : 1;
const TIMEOUT = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 30000;
const GLOBAL_TIMEOUT = process.env.GLOBAL_TIMEOUT ? parseInt(process.env.GLOBAL_TIMEOUT) : 600000;

export default defineConfig({
  // Test directory and patterns
  testDir: './specs',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  testIgnore: ['**/node_modules/**', '**/build/**', '**/dist/**'],

  // Global test timeout (10 minutes)
  globalTimeout: GLOBAL_TIMEOUT,
  
  // Individual test timeout
  timeout: TIMEOUT,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      threshold: 0.3,
      mode: 'percent',
      animations: 'disabled',
    },
    toMatchSnapshot: {
      threshold: 0.3,
      mode: 'percent',
    },
  },

  // Test execution settings
  fullyParallel: true,
  forbidOnly: CI,
  retries: RETRIES,
  workers: WORKERS,
  
  // Global setup and teardown
  globalSetup: resolve(__dirname, '../fixtures/global-setup.ts'),
  globalTeardown: resolve(__dirname, '../fixtures/global-teardown.ts'),

  // Reporter configuration
  reporter: [
    // Always show progress in console
    ['list', { printSteps: true }],
    
    // HTML report for detailed analysis
    ['html', {
      outputFolder: '../reports/html',
      open: !CI ? 'on-failure' : 'never',
      host: 'localhost',
      port: 9323,
    }],
    
    // JSON report for programmatic analysis
    ['json', {
      outputFile: '../reports/test-results.json',
    }],
    
    // JUnit XML for CI integration
    ['junit', {
      outputFile: '../reports/junit.xml',
      stripANSIControlSequences: true,
    }],
    
    // GitHub Actions annotations in CI
    ...(CI ? [['github' as const]] : []),
    
    // Allure reporter for advanced reporting (if installed)
    ...(process.env.ALLURE_REPORTER === 'true' ? [['allure-playwright' as const]] : []),
  ],

  // Output directory for test artifacts
  outputDir: '../test-results',

  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: BASE_URL,
    
    // Browser launch options
    headless: HEADLESS,
    
    // Trace collection for debugging
    trace: CI ? 'retain-on-failure' : 'on-first-retry',
    
    // Screenshot capture
    screenshot: {
      mode: CI ? 'only-on-failure' : 'on-first-retry',
      fullPage: true,
    },
    
    // Video recording
    video: CI ? 'retain-on-failure' : 'on-first-retry',
    
    // Action and navigation timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Locale and timezone
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    
    // Default viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: !CI,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-GB,en;q=0.9',
    },
    
    // Context options
    contextOptions: {
      // Permissions
      permissions: ['notifications'],
      
      // Geolocation (if needed)
      geolocation: { longitude: -0.1276, latitude: 51.5074 }, // London
      
      // Reduce motion for consistent testing
      reducedMotion: 'reduce',
      
      // Force colour scheme for consistent screenshots
      colorScheme: 'light',
    },
  },

  // Projects for different browsers and configurations
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      fullyParallel: false,
      teardown: 'cleanup',
    },
    
    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
      fullyParallel: false,
    },

    // Desktop Chrome
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        channel: 'chrome',
      },
      dependencies: ['setup'],
    },

    // Desktop Firefox
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },

    // Desktop Safari (WebKit)
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },

    // Microsoft Edge
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 },
        channel: 'msedge',
      },
      dependencies: ['setup'],
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
      dependencies: ['setup'],
    },

    // Tablet
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
      },
      dependencies: ['setup'],
    },

    // High DPI display
    {
      name: 'Desktop Chrome HiDPI',
      use: {
        ...devices['Desktop Chrome HiDPI'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
      },
      dependencies: ['setup'],
    },

    // Slow network simulation
    {
      name: 'Desktop Chrome Slow Network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--simulate-slow-network',
            '--throttling.cpu.slowdown_factor=6',
            '--throttling.network.throughput=1024',
          ],
        },
      },
      dependencies: ['setup'],
    },

    // Dark mode testing
    {
      name: 'Desktop Chrome Dark Mode',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        colorScheme: 'dark',
        contextOptions: {
          reducedMotion: 'reduce',
          colorScheme: 'dark',
        },
      },
      dependencies: ['setup'],
    },
  ],

  // Development server configuration
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
    reuseExistingServer: !CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
    },
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Test metadata
  metadata: {
    testType: 'e2e',
    environment: CI ? 'ci' : 'local',
    browser: 'multi',
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  },
});