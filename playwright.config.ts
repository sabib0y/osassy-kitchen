import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Osassy's Kitchen E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e/specs',
  /* Test timeout */
  timeout: 30 * 1000,
  /* Test execution settings */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'tests/reports/html' }],
    ['json', { outputFile: 'tests/reports/test-results.json' }],
    ['junit', { outputFile: 'tests/reports/junit.xml' }],
    ['list'],
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Trace collection */
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    
    /* Screenshot capture */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    /* Video recording */
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    /* Action timeout */
    actionTimeout: 15 * 1000,
    
    /* Navigation timeout */
    navigationTimeout: 30 * 1000,
    
    /* Test viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Permissions */
    permissions: ['geolocation', 'notifications'],
    
    /* Browser context options */
    contextOptions: {
      storageState: undefined,
    },
  },

  /* Configure projects for major browsers and devices */
  projects: [
    /* Desktop Browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    /* Mobile Browsers */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
      },
    },
    
    /* Tablet Browsers */
    {
      name: 'tablet-safari',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
    
    /* Authenticated user context */
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    /* Admin user context */
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    
    /* Setup project for authentication */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
  ],

  /* Global setup and teardown */
  globalSetup: path.join(__dirname, 'tests/fixtures/global-setup.ts'),
  globalTeardown: path.join(__dirname, 'tests/fixtures/global-teardown.ts'),

  /* Test output folder */
  outputDir: 'tests/test-results',

  /* Run local dev server before starting tests */
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
