import { defineConfig, devices } from '@playwright/test';
import { visualConfig } from './visual.config';

/**
 * Baseline Generation Configuration - Osassy's Kitchen
 * 
 * This configuration is specifically for generating baseline images.
 * It includes optimised settings for consistent screenshot generation
 * across different environments and team members.
 */
export default defineConfig({
  ...visualConfig,
  
  testDir: './specs/visual',
  
  /* Baseline-specific settings */
  timeout: 120 * 1000, // Longer timeout for baseline generation
  fullyParallel: false, // Sequential for consistent generation
  workers: 1, // Single worker for consistency
  retries: 0, // No retries for baseline generation
  
  /* Enhanced expect settings for baselines */
  expect: {
    toHaveScreenshot: {
      threshold: 0.0, // Perfect match for baselines
      maxDiffPixels: 0,
      animations: 'disabled',
      scale: 'css',
      caret: 'hide',
      mode: 'css',
    },
    timeout: 60 * 1000,
  },
  
  /* Baseline-specific reporter */
  reporter: [
    ['line'],
    ['json', { outputFile: 'tests/reports/baseline-results.json' }],
  ],
  
  use: {
    ...visualConfig.use,
    
    /* Extended timeouts for baseline generation */
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,
    
    /* Force consistent rendering */
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    
    /* Disable all caching for fresh baselines */
    extraHTTPHeaders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    
    /* Enhanced context options for baselines */
    contextOptions: {
      ...visualConfig.use?.contextOptions,
      // Disable all interactive features
      permissions: [],
      // Force specific color profile
      colorScheme: 'light',
      // Consistent media preferences
      reducedMotion: 'reduce',
      // Disable hardware acceleration completely
      args: [
        '--disable-gpu',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--force-color-profile=srgb',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-video-decode',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-font-subpixel-positioning',
        '--font-render-hinting=none',
        '--disable-lcd-text',
      ],
    },
  },
  
  /* Baseline generation projects - limited set for consistency */
  projects: [
    /* Primary baseline generation - Chrome Desktop */
    {
      name: 'baseline-chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        channel: 'chrome',
        launchOptions: {
          args: [
            '--force-device-scale-factor=1',
            '--high-dpi-support=1',
            '--force-color-profile=srgb',
            '--disable-lcd-text',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
          ],
        },
      },
      testMatch: /.*baseline.*\.spec\.ts/,
    },
    
    /* Mobile baselines */
    {
      name: 'baseline-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
        deviceScaleFactor: 2, // Consistent mobile scaling
        isMobile: true,
        hasTouch: true,
      },
      testMatch: /.*baseline.*\.spec\.ts/,
    },
    
    /* Tablet baselines */
    {
      name: 'baseline-tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
        deviceScaleFactor: 1.5, // Consistent tablet scaling
      },
      testMatch: /.*baseline.*\.spec\.ts/,
    },
    
    /* Authentication setup for authenticated baselines */
    {
      name: 'baseline-setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'baseline-cleanup',
    },
    
    /* Cleanup after baseline generation */
    {
      name: 'baseline-cleanup',
      testMatch: /.*\.teardown\.ts/,
    },
  ],
  
  /* Enhanced web server for baseline generation */
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: false, // Always start fresh for baselines
    timeout: 180 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'production', // Use production build for baselines
      NEXT_TELEMETRY_DISABLED: '1',
      TZ: 'UTC',
      LANG: 'en_GB.UTF-8',
      LC_ALL: 'en_GB.UTF-8',
      // Disable all dynamic features
      DISABLE_ANALYTICS: 'true',
      DISABLE_TRACKING: 'true',
      STATIC_GENERATION: 'true',
      // Consistent random seed
      RANDOM_SEED: '12345',
      // Force consistent image loading
      NEXT_IMAGE_OPTIMIZATION: 'false',
    },
  },
  
  /* Global setup specifically for baselines */
  globalSetup: require.resolve('./fixtures/baseline-setup.ts'),
  globalTeardown: require.resolve('./fixtures/baseline-teardown.ts'),
  
  /* Baseline-specific output */
  outputDir: 'tests/baseline-results',
  
  /* Enhanced metadata for baseline tracking */
  metadata: {
    testType: 'baseline-generation',
    platform: process.platform,
    architecture: process.arch,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    environment: 'baseline',
    purpose: 'Reference image generation for visual regression testing',
  },
});

/**
 * Baseline Generation Environment Variables
 * 
 * Required environment variables for baseline generation:
 * 
 * GENERATE_BASELINES=true     - Enable baseline generation mode
 * CI=false                    - Disable CI-specific optimizations
 * NODE_ENV=production        - Use production build for consistency
 * 
 * Optional environment variables:
 * 
 * BASELINE_BROWSERS=chrome    - Comma-separated list of browsers
 * BASELINE_VIEWPORTS=desktop  - Comma-separated list of viewports
 * BASELINE_PAGES=all         - Comma-separated list of pages to capture
 * FORCE_FRESH_BUILD=true     - Force rebuild before baseline generation
 * BASELINE_QUALITY=high      - Set image quality (high|medium|low)
 * 
 * Example usage:
 * GENERATE_BASELINES=true npx playwright test --config=tests/e2e/baseline.config.ts
 */