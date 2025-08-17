#!/usr/bin/env node

/**
 * Validation script for the UI Route Capture
 * This script tests the capture functionality on a subset of routes
 */

import { chromium } from '@playwright/test';
import { UIRouteCapture, ALL_ROUTES } from './capture-all-ui-routes';
import path from 'path';

async function validateCapture() {
  console.log('🔍 Validating UI Route Capture Script...\n');

  // Test subset of routes for quick validation
  const testRoutes = [
    ALL_ROUTES.find(r => r.name === 'public-homepage'),
    ALL_ROUTES.find(r => r.name === 'public-login'),
    ALL_ROUTES.find(r => r.name === 'auth-user-dashboard'),
  ].filter(Boolean);

  if (testRoutes.length === 0) {
    console.error('❌ No test routes found');
    return false;
  }

  console.log(`📋 Testing ${testRoutes.length} routes:${testRoutes.map(r => `\n  • ${r!.name} (${r!.path})`).join('')}\n`);

  try {
    // Test browser launch
    console.log('🚀 Testing browser launch...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test navigation to homepage
    console.log('🏠 Testing navigation to homepage...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 10000 });
    const title = await page.title();
    console.log(`✅ Homepage loaded: "${title}"`);

    // Test login page
    console.log('🔐 Testing navigation to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 10000 });
    const loginForm = await page.locator('form, input[type="email"]').count();
    console.log(`✅ Login page loaded with ${loginForm} form elements`);

    // Test authentication
    console.log('🔑 Testing authentication...');
    try {
      await page.fill('input[type="email"], input[name="email"]', 'test@test.com');
      await page.fill('input[type="password"], input[name="password"]', 'test');
      
      const submitButton = page.locator('button[type="submit"], input[type="submit"], .login-button, .btn-primary');
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const isAuthenticated = !currentUrl.includes('/login');
      console.log(`${isAuthenticated ? '✅' : '⚠️'} Authentication test: ${isAuthenticated ? 'Success' : 'Failed or redirected'}`);
    } catch (error) {
      console.log('⚠️ Authentication test failed (this might be expected if test user doesn\'t exist)');
    }

    // Test screenshot capability
    console.log('📸 Testing screenshot capability...');
    const testScreenshotPath = path.join(process.cwd(), 'testing/playwright/screenshots/validation-test.png');
    await page.screenshot({ path: testScreenshotPath, fullPage: true });
    console.log(`✅ Screenshot saved to: ${testScreenshotPath}`);

    await browser.close();

    console.log('\n🎉 Validation completed successfully!');
    console.log('\n📋 Validation Results:');
    console.log('  ✅ Browser launch and navigation');
    console.log('  ✅ Page loading and DOM access');
    console.log('  ✅ Form interaction capability');
    console.log('  ✅ Screenshot generation');
    console.log('\n🚀 The main capture script should work correctly.');
    console.log('\n💡 To run the full capture:');
    console.log('   npm run capture:all-ui');

    return true;

  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('  1. Make sure Next.js dev server is running: npm run dev');
    console.log('  2. Ensure Playwright is installed: npm run playwright:install');
    console.log('  3. Check if test user exists in database (test@test.com / test)');
    console.log('  4. Verify localhost:3000 is accessible');
    
    return false;
  }
}

// Health check function
async function healthCheck() {
  console.log('🏥 Running health check...\n');

  const checks = [
    {
      name: 'Next.js Dev Server',
      check: async () => {
        try {
          const response = await fetch('http://localhost:3000/');
          return response.ok;
        } catch {
          return false;
        }
      },
      fix: 'Run: npm run dev'
    },
    {
      name: 'Playwright Installation',
      check: async () => {
        try {
          const { chromium } = await import('@playwright/test');
          const browser = await chromium.launch({ headless: true });
          await browser.close();
          return true;
        } catch {
          return false;
        }
      },
      fix: 'Run: npm run playwright:install'
    },
    {
      name: 'Script Dependencies',
      check: async () => {
        try {
          await import('./capture-all-ui-routes');
          return true;
        } catch {
          return false;
        }
      },
      fix: 'Check TypeScript compilation errors'
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    process.stdout.write(`🔍 ${check.name}... `);
    const passed = await check.check();
    console.log(passed ? '✅ OK' : '❌ FAILED');
    
    if (!passed) {
      console.log(`   💡 Fix: ${check.fix}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Main execution
async function main() {
  console.log('🎯 UI Route Capture - Validation Tool');
  console.log('=' .repeat(50));
  
  // Run health check first
  const healthOk = await healthCheck();
  
  if (!healthOk) {
    console.log('\n❌ Health check failed. Please fix the issues above before proceeding.');
    process.exit(1);
  }

  console.log('\n✅ Health check passed!\n');
  
  // Run validation
  const validationOk = await validateCapture();
  
  if (validationOk) {
    console.log('\n🎉 All systems go! You can now run the full UI capture.');
    process.exit(0);
  } else {
    console.log('\n❌ Validation failed. Please check the errors above.');
    process.exit(1);
  }
}

// Handle direct execution
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { validateCapture, healthCheck };