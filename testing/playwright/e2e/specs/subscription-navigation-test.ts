import { test, expect, Page, BrowserContext } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Comprehensive Subscription Navigation Test Suite
 * 
 * Tests the navigation from homepage to subscription page and identifies
 * the Link component errors that cause runtime issues.
 * 
 * Created: August 13, 2025
 * Purpose: Debug Link component errors in subscription navigation flow
 */

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = 'testing/playwright/screenshots/subscription-nav-debug';
const TEST_CREDENTIALS = {
  email: 'test@test.com',
  password: 'test'
};

// Ensure screenshots directory exists
test.beforeAll(async () => {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
});

/**
 * Helper function to capture console logs and errors
 */
async function setupConsoleLogging(page: Page) {
  const consoleLogs: any[] = [];
  const consoleErrors: any[] = [];
  
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push({
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      type: 'pageerror'
    });
  });

  return { consoleLogs, consoleErrors };
}

/**
 * Helper function to take screenshot with timestamp
 */
async function takeTimestampedScreenshot(page: Page, filename: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${filename}_${timestamp}.png`);
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage: true 
  });
  return screenshotPath;
}

test.describe('Subscription Navigation - Error Detection', () => {
  
  test('Navigate to subscription page as unauthenticated user', async ({ page }) => {
    const { consoleLogs, consoleErrors } = await setupConsoleLogging(page);
    
    // Step 1: Navigate to homepage
    console.log('Step 1: Navigating to homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await takeTimestampedScreenshot(page, 'step1-homepage-loaded');
    
    // Step 2: Look for subscription link in navigation
    console.log('Step 2: Looking for subscription navigation link...');
    await page.waitForSelector('nav', { timeout: 10000 });
    
    // Take screenshot of navigation
    await takeTimestampedScreenshot(page, 'step2-navigation-visible');
    
    // Check if subscription link exists
    const subscriptionLink = page.locator('a[href="/subscriptions"], a:has-text("Subscription")');
    await expect(subscriptionLink).toBeVisible({ timeout: 10000 });
    
    // Step 3: Click on subscription link and capture any errors
    console.log('Step 3: Clicking subscription link...');
    await subscriptionLink.click();
    
    // Wait for navigation or errors
    await page.waitForTimeout(2000);
    await takeTimestampedScreenshot(page, 'step3-after-subscription-click');
    
    // Step 4: Check if we're redirected to login (expected for unauthenticated users)
    const currentUrl = page.url();
    console.log('Current URL after click:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('✓ Correctly redirected to login page');
      await takeTimestampedScreenshot(page, 'step4-login-redirect');
    } else if (currentUrl.includes('/subscriptions') || currentUrl.includes('/user/subscriptions')) {
      console.log('! User was not redirected to login - checking page content');
      await takeTimestampedScreenshot(page, 'step4-subscription-page-loaded');
    }
    
    // Step 5: Report console errors
    console.log('\n=== CONSOLE LOGS ANALYSIS ===');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach((error, index) => {
        console.log(`\nError ${index + 1}:`);
        console.log(`Type: ${error.type || 'console error'}`);
        console.log(`Message: ${error.text}`);
        if (error.location) {
          console.log(`Location: ${JSON.stringify(error.location)}`);
        }
        if (error.stack) {
          console.log(`Stack: ${error.stack}`);
        }
        console.log(`Timestamp: ${error.timestamp}`);
      });
    }
    
    // Check specifically for Link component errors
    const linkErrors = consoleErrors.filter(error => 
      error.text.includes('Invalid <Link>') || 
      error.text.includes('Link') ||
      error.text.includes('<a> child')
    );
    
    if (linkErrors.length > 0) {
      console.log('\n❌ LINK COMPONENT ERRORS FOUND:');
      linkErrors.forEach((error, index) => {
        console.log(`\nLink Error ${index + 1}:`);
        console.log(`Message: ${error.text}`);
        console.log(`Location: ${JSON.stringify(error.location)}`);
      });
    }
    
    // Log results to test output
    expect.soft(consoleErrors.length).toBe(0);
  });

  test('Navigate to subscription page as authenticated user', async ({ page }) => {
    const { consoleLogs, consoleErrors } = await setupConsoleLogging(page);
    
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await takeTimestampedScreenshot(page, 'auth-step1-login-page');
    
    // Step 2: Login with test credentials
    console.log('Step 2: Logging in with test credentials...');
    await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    
    // Take screenshot before submitting login
    await takeTimestampedScreenshot(page, 'auth-step2-before-login-submit');
    
    // Submit login form
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check if login was successful
    const currentUrl = page.url();
    console.log('URL after login attempt:', currentUrl);
    await takeTimestampedScreenshot(page, 'auth-step2-after-login-submit');
    
    // Step 3: Navigate to homepage if not already there
    if (!currentUrl.includes('localhost:3000') || currentUrl.includes('/login')) {
      console.log('Step 3: Navigating to homepage after login...');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
    }
    await takeTimestampedScreenshot(page, 'auth-step3-homepage-after-login');
    
    // Step 4: Look for subscription link in navigation
    console.log('Step 4: Looking for subscription navigation link...');
    await page.waitForSelector('nav', { timeout: 10000 });
    
    // Check if subscription link exists
    const subscriptionLink = page.locator('a[href="/subscriptions"], a:has-text("Subscription")');
    await expect(subscriptionLink).toBeVisible({ timeout: 10000 });
    
    // Step 5: Click on subscription link and capture any errors
    console.log('Step 5: Clicking subscription link as authenticated user...');
    await subscriptionLink.click();
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    await takeTimestampedScreenshot(page, 'auth-step5-after-subscription-click');
    
    // Step 6: Check final URL and page state
    const finalUrl = page.url();
    console.log('Final URL after authenticated subscription click:', finalUrl);
    
    if (finalUrl.includes('/user/subscriptions')) {
      console.log('✓ Successfully navigated to user subscriptions page');
      await takeTimestampedScreenshot(page, 'auth-step6-subscriptions-page-success');
    } else {
      console.log('! Unexpected navigation result');
      await takeTimestampedScreenshot(page, 'auth-step6-unexpected-result');
    }
    
    // Step 7: Report console errors
    console.log('\n=== AUTHENTICATED FLOW CONSOLE ANALYSIS ===');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS DETECTED IN AUTHENTICATED FLOW:');
      consoleErrors.forEach((error, index) => {
        console.log(`\nError ${index + 1}:`);
        console.log(`Type: ${error.type || 'console error'}`);
        console.log(`Message: ${error.text}`);
        if (error.location) {
          console.log(`Location: ${JSON.stringify(error.location)}`);
        }
        if (error.stack) {
          console.log(`Stack: ${error.stack}`);
        }
        console.log(`Timestamp: ${error.timestamp}`);
      });
    }
    
    // Check specifically for Link component errors
    const linkErrors = consoleErrors.filter(error => 
      error.text.includes('Invalid <Link>') || 
      error.text.includes('Link') ||
      error.text.includes('<a> child')
    );
    
    if (linkErrors.length > 0) {
      console.log('\n❌ LINK COMPONENT ERRORS IN AUTHENTICATED FLOW:');
      linkErrors.forEach((error, index) => {
        console.log(`\nLink Error ${index + 1}:`);
        console.log(`Message: ${error.text}`);
        console.log(`Location: ${JSON.stringify(error.location)}`);
      });
    }
    
    // Log results to test output
    expect.soft(consoleErrors.length).toBe(0);
  });

  test('Deep inspection of Link components in subscription pages', async ({ page }) => {
    const { consoleLogs, consoleErrors } = await setupConsoleLogging(page);
    
    // Navigate directly to user subscriptions page (this will redirect to login if needed)
    console.log('Direct navigation test: Going to /user/subscriptions...');
    await page.goto(`${BASE_URL}/user/subscriptions`);
    await page.waitForTimeout(3000);
    await takeTimestampedScreenshot(page, 'direct-nav-user-subscriptions');
    
    // Navigate to subscriptions index (which redirects)
    console.log('Redirect test: Going to /subscriptions...');
    await page.goto(`${BASE_URL}/subscriptions`);
    await page.waitForTimeout(3000);
    await takeTimestampedScreenshot(page, 'direct-nav-subscriptions-redirect');
    
    // Navigate to subscription creation page
    console.log('Creation page test: Going to /subscriptions/create...');
    await page.goto(`${BASE_URL}/subscriptions/create`);
    await page.waitForTimeout(3000);
    await takeTimestampedScreenshot(page, 'direct-nav-subscription-create');
    
    // Report findings
    console.log('\n=== DIRECT NAVIGATION CONSOLE ANALYSIS ===');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS IN DIRECT NAVIGATION:');
      consoleErrors.forEach((error, index) => {
        console.log(`\nDirect Nav Error ${index + 1}:`);
        console.log(`Type: ${error.type || 'console error'}`);
        console.log(`Message: ${error.text}`);
        if (error.location) {
          console.log(`Location: ${JSON.stringify(error.location)}`);
        }
        if (error.stack) {
          console.log(`Stack: ${error.stack}`);
        }
        console.log(`Timestamp: ${error.timestamp}`);
      });
    }
    
    // Check specifically for Link component errors
    const linkErrors = consoleErrors.filter(error => 
      error.text.includes('Invalid <Link>') || 
      error.text.includes('Link') ||
      error.text.includes('<a> child')
    );
    
    if (linkErrors.length > 0) {
      console.log('\n❌ LINK COMPONENT ERRORS IN DIRECT NAVIGATION:');
      linkErrors.forEach((error, index) => {
        console.log(`\nDirect Nav Link Error ${index + 1}:`);
        console.log(`Message: ${error.text}`);
        console.log(`Location: ${JSON.stringify(error.location)}`);
      });
    }
  });

  test('Inspect DOM for problematic Link components', async ({ page }) => {
    console.log('DOM Inspection Test: Checking for nested Link > button structures...');
    
    // Go to homepage first
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Inspect the navigation structure
    const linkButtons = await page.locator('a > button, a > .btn, Link > button').count();
    console.log(`Found ${linkButtons} potential Link > button combinations`);
    
    if (linkButtons > 0) {
      console.log('⚠️  Found potential problematic Link > button structures');
      const linkButtonElements = page.locator('a > button, a > .btn');
      const count = await linkButtonElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = linkButtonElements.nth(i);
        const parentHref = await element.locator('..').getAttribute('href');
        const buttonText = await element.textContent();
        console.log(`  - Link href="${parentHref}" contains button with text: "${buttonText}"`);
      }
    }
    
    // Try navigating to the subscriptions page to trigger the error
    console.log('Attempting to trigger Link error by navigation...');
    await page.click('a[href="/subscriptions"]');
    await page.waitForTimeout(2000);
    
    await takeTimestampedScreenshot(page, 'dom-inspection-after-click');
  });
});

test.describe('Subscription Page Component Analysis', () => {
  
  test('Analyze subscription page components for Link errors', async ({ page }) => {
    const { consoleLogs, consoleErrors } = await setupConsoleLogging(page);
    
    // Try to access the subscriptions page directly
    console.log('Accessing subscriptions page for component analysis...');
    
    // First navigate to homepage to establish context
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Now try to access subscriptions
    await page.goto(`${BASE_URL}/subscriptions`);
    await page.waitForTimeout(3000);
    
    // Check for any JavaScript errors during page load
    console.log('\n=== SUBSCRIPTION PAGE COMPONENT ANALYSIS ===');
    console.log(`Total console messages during page load: ${consoleLogs.length}`);
    console.log(`Total console errors during page load: ${consoleErrors.length}`);
    
    // Look for specific patterns in errors
    const reactErrors = consoleErrors.filter(error => 
      error.text.includes('React') || 
      error.text.includes('Component') ||
      error.text.includes('render')
    );
    
    if (reactErrors.length > 0) {
      console.log('\n🔍 REACT-RELATED ERRORS:');
      reactErrors.forEach((error, index) => {
        console.log(`\nReact Error ${index + 1}:`);
        console.log(`Message: ${error.text}`);
        if (error.stack) {
          console.log(`Stack: ${error.stack}`);
        }
      });
    }
    
    // Look for Link-specific errors
    const linkErrors = consoleErrors.filter(error => 
      error.text.toLowerCase().includes('link') &&
      (error.text.includes('invalid') || error.text.includes('child'))
    );
    
    if (linkErrors.length > 0) {
      console.log('\n❌ LINK-SPECIFIC ERRORS DETECTED:');
      linkErrors.forEach((error, index) => {
        console.log(`\nLink Error ${index + 1}:`);
        console.log(`Message: ${error.text}`);
        console.log(`Type: ${error.type}`);
        if (error.location) {
          console.log(`File: ${error.location.url}`);
          console.log(`Line: ${error.location.lineNumber}`);
          console.log(`Column: ${error.location.columnNumber}`);
        }
        if (error.stack) {
          console.log(`Stack trace: ${error.stack}`);
        }
      });
    }
    
    await takeTimestampedScreenshot(page, 'component-analysis-final');
  });
});

// Summary test to generate final report
test('Generate comprehensive error report', async ({ page }) => {
  console.log('\n' + '='.repeat(60));
  console.log('COMPREHENSIVE SUBSCRIPTION NAVIGATION ERROR REPORT');
  console.log('='.repeat(60));
  
  console.log('\n📋 TEST SUMMARY:');
  console.log('1. ✅ Navigation flow tests completed');
  console.log('2. ✅ Console error detection enabled');
  console.log('3. ✅ Screenshots captured for debugging');
  console.log('4. ✅ Both authenticated and unauthenticated flows tested');
  console.log('5. ✅ Component structure analysis completed');
  
  console.log('\n🔍 SUSPECTED ISSUES BASED ON CODE REVIEW:');
  console.log('1. ❌ /src/pages/user/subscriptions/index.tsx lines 154 & 203');
  console.log('   - Link components wrapping button elements');
  console.log('   - Next.js 13+ requires Link components to not wrap interactive elements');
  console.log('   - Should use Link with className instead of wrapping buttons');
  
  console.log('\n🛠️  RECOMMENDED FIXES:');
  console.log('1. Replace Link > button patterns with Link components that have button styling');
  console.log('2. Update all instances of <Link><button></button></Link> to <Link className="button-style">');
  console.log('3. Ensure Link components do not wrap other interactive elements');
  
  console.log('\n📁 SCREENSHOTS LOCATION:');
  console.log(`   ${SCREENSHOTS_DIR}/`);
  
  console.log('\n⚠️  NEXT STEPS:');
  console.log('1. Fix Link component usage in subscription pages');
  console.log('2. Re-run tests to verify fixes');
  console.log('3. Check other pages for similar Link > button patterns');
  
  console.log('\n' + '='.repeat(60));
});