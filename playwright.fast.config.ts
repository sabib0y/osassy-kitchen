import { defineConfig } from '@playwright/test';

/**
 * Fast-failing configuration for rapid test iteration
 * Timeouts are aggressive to fail fast and identify issues quickly
 */
export default defineConfig({
  testDir: './tests/e2e/specs',
  
  // Aggressive timeouts for fast failure
  timeout: 10 * 1000,  // 10 seconds per test (down from 30)
  
  // No retries - fail immediately
  retries: 0,
  
  // Run tests sequentially for easier debugging
  fullyParallel: false,
  workers: 1,
  
  // Minimal reporting for speed
  reporter: [['list']],
  
  use: {
    baseURL: 'http://localhost:3000',
    
    // Fast timeouts
    actionTimeout: 3 * 1000,      // 3 seconds for clicks, fills, etc
    navigationTimeout: 5 * 1000,   // 5 seconds for page loads
    
    // Skip screenshots/videos for speed
    screenshot: 'off',
    video: 'off',
    trace: 'off',
    
    // Smaller viewport for faster rendering
    viewport: { width: 1280, height: 720 },
  },
  
  projects: [
    {
      name: 'fast-chrome',
      use: { 
        browserName: 'chromium',
        // Headless for speed
        headless: true,
        // Disable animations for faster execution
        launchOptions: {
          args: [
            '--disable-animations',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
          ],
        },
      },
    },
  ],
  
  // No global setup for faster starts
  globalSetup: undefined,
  globalTeardown: undefined,
});