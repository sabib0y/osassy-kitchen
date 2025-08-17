import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Visual Regression Testing Configuration - Osassy's Kitchen
 * 
 * This configuration is specifically optimised for visual regression testing
 * with consistent screenshot capture across different browsers and devices.
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './specs/visual',
  
  /* Test timeout - increased for visual tests */
  timeout: 60 * 1000,
  
  /* Test execution settings */
  fullyParallel: false, // Sequential for consistent baseline generation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once for visual flakiness
  workers: process.env.CI ? 1 : 2, // Limited workers for consistency
  
  /* Visual test specific settings */
  expect: {
    // Global screenshot comparison thresholds
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
      animations: 'disabled',
      // Enable pixel ratio adjustments for better cross-browser consistency
      scale: 'css',
      // Clip to content area by default
      caret: 'hide',
    },
    // Timeout for screenshot comparisons
    timeout: 30 * 1000,
  },
  
  /* Reporter configuration */
  reporter: [
    ['html', { 
      outputFolder: 'tests/reports/visual-html',
      open: process.env.CI ? 'never' : 'on-failure',
    }],
    ['json', { outputFile: 'tests/reports/visual-results.json' }],
    ['junit', { outputFile: 'tests/reports/visual-junit.xml' }],
    ['list'],
  ],
  
  /* Shared settings for all visual tests */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Trace collection - disabled for performance */
    trace: 'off',
    
    /* Screenshot capture - always capture for visual tests */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
      // Consistent quality settings
      quality: 90,
      // Omit background for transparency support
      omitBackground: false,
    },
    
    /* Video recording - disabled for performance */
    video: 'off',
    
    /* Action timeout */
    actionTimeout: 15 * 1000, // Increased for slow elements
    
    /* Navigation timeout */
    navigationTimeout: 45 * 1000, // Increased for complex pages
    
    /* Default viewport for visual tests */
    viewport: { width: 1920, height: 1080 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Accept downloads for testing file features */
    acceptDownloads: false,
    
    /* Bypass CSP for testing */
    bypassCSP: true,
    
    /* Extra HTTP headers for consistency */
    extraHTTPHeaders: {
      'Accept-Language': 'en-GB,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    
    /* Browser context options for consistent visual tests */
    contextOptions: {
      // Disable hardware acceleration for consistent rendering
      args: [
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--force-color-profile=srgb',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Temporarily disable to test without images
        '--disable-javascript', // Can be removed if JS is needed
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
        '--disable-lcd-text',
      ],
      // Consistent timezone
      timezoneId: 'UTC',
      // Consistent locale
      locale: 'en-GB',
      // Reduced motion preference for consistent animations
      reducedMotion: 'reduce',
      // Force light mode for consistent theming (unless testing dark mode)
      colorScheme: 'light',
      // Disable permissions to avoid prompts
      permissions: [],
      // Consistent geolocation
      geolocation: { latitude: 51.5074, longitude: -0.1278 }, // London
      // Force specific screen properties
      screen: { width: 1920, height: 1080 },
      // Disable notifications
      hasTouch: false,
      isMobile: false,
    },
    
    /* Consistent user agent */
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Visual-Test-Agent/1.0',
    
    /* Force consistent fonts */
    fontFamily: 'Arial, sans-serif',
    
    /* Disable smooth scrolling for consistency */
    hasTouch: false,
  },

  /* Visual regression test projects */
  projects: [
    /* Primary visual regression tests - Desktop Chrome */
    {
      name: 'visual-chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        launchOptions: {
          args: [
            '--force-device-scale-factor=1',
            '--high-dpi-support=1',
            '--force-color-profile=srgb',
            '--disable-lcd-text',
          ],
        },
      },
    },
    
    /* Laptop visual tests */
    {
      name: 'visual-laptop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
      },
    },
    
    /* Mobile visual tests */
    {
      name: 'visual-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
        deviceScaleFactor: 2, // Reduced from 3 for consistency
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Visual-Test-Mobile',
      },
    },
    
    /* iPhone testing */
    {
      name: 'visual-iphone',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    
    /* Tablet visual tests */
    {
      name: 'visual-tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
        deviceScaleFactor: 1.5, // Reduced for consistency
      },
    },
    
    /* Tablet landscape */
    {
      name: 'visual-tablet-landscape',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1366, height: 1024 },
        deviceScaleFactor: 1.5,
      },
    },
    
    /* Cross-browser testing for critical paths */
    {
      name: 'visual-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        launchOptions: {
          firefoxUserPrefs: {
            'layout.css.devPixelsPerPx': '1.0',
            'gfx.canvas.azure.backends': 'cairo',
            'gfx.content.azure.backends': 'cairo',
          },
        },
      },
    },
    
    {
      name: 'visual-webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        launchOptions: {
          args: [
            '--disable-gpu',
            '--force-color-profile=srgb',
          ],
        },
      },
    },
    
    /* Edge browser testing */
    {
      name: 'visual-edge',
      use: {
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        channel: 'msedge',
      },
    },
    
    /* Authenticated user visual tests */
    {
      name: 'visual-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: 'tests/fixtures/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    /* Admin user visual tests */
    {
      name: 'visual-admin',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: 'tests/fixtures/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    
    /* Dark mode visual tests (if supported) */
    {
      name: 'visual-dark-mode',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        colorScheme: 'dark',
        contextOptions: {
          colorScheme: 'dark',
          forcedColors: 'none',
        },
        launchOptions: {
          args: [
            '--force-dark-mode',
            '--enable-features=WebContentsForceDarkMode',
          ],
        },
      },
    },
    
    /* High contrast mode testing */
    {
      name: 'visual-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          forcedColors: 'active',
          colorScheme: 'light',
        },
      },
    },
    
    /* High DPI display tests */
    {
      name: 'visual-high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        launchOptions: {
          args: [
            '--force-device-scale-factor=2',
            '--high-dpi-support=1',
          ],
        },
      },
    },
    
    /* Reduced motion testing */
    {
      name: 'visual-reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          reducedMotion: 'reduce',
        },
      },
    },
    
    /* Print media testing */
    {
      name: 'visual-print',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          media: 'print',
        },
      },
    },
    
    /* Authentication setup project */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },
    
    /* Cleanup project */
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
    },
    
    /* Baseline generation project */
    {
      name: 'generate-baselines',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
      testMatch: /.*baseline.*\.spec\.ts/,
    },
  ],

  /* Global setup and teardown */
  globalSetup: path.join(__dirname, '../fixtures/global-setup.ts'),
  globalTeardown: path.join(__dirname, '../fixtures/global-teardown.ts'),

  /* Test output folder */
  outputDir: 'tests/visual-results',

  /* Run local dev server before starting tests */
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // Increased timeout for build
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      // Disable analytics and tracking for consistent visual tests
      NEXT_TELEMETRY_DISABLED: '1',
      // Set consistent environment variables
      TZ: 'UTC',
      // Disable image optimisation for consistency
      NEXT_IMAGE_OPTIMIZATION: 'false',
      // Force consistent locale
      LANG: 'en_GB.UTF-8',
      LC_ALL: 'en_GB.UTF-8',
      // Disable auto-updates and notifications
      DISABLE_UPDATE_CHECK: 'true',
      // Set consistent random seed for any randomisation
      RANDOM_SEED: '12345',
    },
  },

  /* Metadata for reporting */
  metadata: {
    testType: 'visual-regression',
    platform: process.platform,
    version: '1.0.0',
    architecture: process.arch,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'test',
  },

  /* Custom test configuration */
  testIdAttribute: 'data-testid',
  
  /* Grep patterns for test filtering */
  grep: process.env.VISUAL_GREP ? new RegExp(process.env.VISUAL_GREP) : undefined,
  grepInvert: process.env.VISUAL_GREP_INVERT ? new RegExp(process.env.VISUAL_GREP_INVERT) : undefined,
});

/**
 * Visual Test Environment Variables
 * 
 * Set these environment variables to control visual test behaviour:
 * 
 * GENERATE_BASELINES=true  - Generate new baseline images
 * UPDATE_SNAPSHOTS=true   - Update existing snapshots
 * VISUAL_THRESHOLD=0.2    - Set custom threshold for comparisons
 * HEADLESS=false          - Run tests in headed mode for debugging
 * SLOW_MO=1000           - Slow down actions for debugging
 * DEBUG_VISUAL=true      - Enable verbose logging for visual tests
 * CI=true                - Set CI mode for stricter testing
 * SKIP_CROSS_BROWSER=true - Skip cross-browser tests (Firefox, Safari, Edge)
 * BASELINE_UPDATE_MODE=partial - Update only failing screenshots
 * VISUAL_DIFF_MODE=split - Show side-by-side comparison
 * 
 * Example usage:
 * GENERATE_BASELINES=true npx playwright test visual-regression
 * UPDATE_SNAPSHOTS=true npx playwright test visual-regression --grep "login"
 * HEADLESS=false SLOW_MO=500 npx playwright test visual-regression --debug
 * SKIP_CROSS_BROWSER=true npx playwright test visual-regression
 */