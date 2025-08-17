import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright Configuration for Link Verification Tests
 * Excludes global setup to avoid authentication issues
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/login.spec.ts'],
  
  /* Test timeout */
  timeout: 30 * 1000,
  
  /* Test execution settings */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  
  /* Reporter configuration */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'testing/playwright/reports/html' }],
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3000',
    
    /* Trace collection */
    trace: 'retain-on-failure',
    
    /* Screenshot capture */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    /* Video recording */
    video: 'retain-on-failure',
    
    /* Action timeout */
    actionTimeout: 15 * 1000,
    
    /* Navigation timeout */
    navigationTimeout: 30 * 1000,
    
    /* Test viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  /* Test output folder */
  outputDir: 'testing/playwright/test-results',
});