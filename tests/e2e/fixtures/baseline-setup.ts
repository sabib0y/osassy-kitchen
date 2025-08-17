import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for baseline generation
 * Ensures consistent environment for screenshot capture
 */
async function globalSetup(config: FullConfig) {
  console.log('🎯 Starting baseline generation setup...');
  
  // Ensure baseline directories exist
  const baselineDir = path.join(process.cwd(), 'tests/e2e/specs/visual/visual-regression.spec.ts-snapshots');
  const resultsDir = path.join(process.cwd(), 'tests/baseline-results');
  const reportsDir = path.join(process.cwd(), 'tests/reports');
  
  [baselineDir, resultsDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
  
  // Clean up any existing baselines if requested
  if (process.env.FORCE_CLEAN_BASELINES === 'true') {
    console.log('🧹 Cleaning existing baselines...');
    fs.rmSync(baselineDir, { recursive: true, force: true });
    fs.mkdirSync(baselineDir, { recursive: true });
  }
  
  // Set up browser with consistent settings
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-web-security',
      '--force-color-profile=srgb',
      '--disable-font-subpixel-positioning',
      '--font-render-hinting=none',
      '--disable-lcd-text',
    ],
  });
  
  // Verify browser capabilities
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    timezoneId: 'UTC',
    locale: 'en-GB',
  });
  
  const page = await context.newPage();
  
  try {
    // Test basic functionality
    await page.goto('data:text/html,<html><body><h1>Browser Test</h1></body></html>');
    await page.screenshot({ path: path.join(resultsDir, 'browser-test.png') });
    console.log('✅ Browser verification successful');
  } catch (error) {
    console.error('❌ Browser verification failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  // Set environment variables for consistent testing
  process.env.NODE_ENV = 'production';
  process.env.TZ = 'UTC';
  process.env.LANG = 'en_GB.UTF-8';
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.DISABLE_ANALYTICS = 'true';
  
  // Wait for web server to be ready
  const maxWaitTime = 180000; // 3 minutes
  const startTime = Date.now();
  const baseURL = config.webServer?.url || 'http://localhost:3000';
  
  console.log(`⏳ Waiting for web server at ${baseURL}...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        console.log('✅ Web server is ready');
        break;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (Date.now() - startTime >= maxWaitTime) {
    throw new Error('Web server failed to start within timeout');
  }
  
  // Create baseline generation report
  const setupReport = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      timezone: process.env.TZ,
      locale: process.env.LANG,
    },
    config: {
      baseURL,
      timeout: maxWaitTime,
      browsers: config.projects?.map(p => p.name) || [],
    },
  };
  
  fs.writeFileSync(
    path.join(reportsDir, 'baseline-setup.json'),
    JSON.stringify(setupReport, null, 2)
  );
  
  console.log('🚀 Baseline generation setup complete');
}

export default globalSetup;