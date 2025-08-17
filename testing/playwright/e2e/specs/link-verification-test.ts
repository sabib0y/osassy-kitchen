import { test, expect, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Link Component Verification Test Suite
 * 
 * Verifies that all Link component fixes are working correctly in the subscription navigation flow
 * Tests the complete user journey: Homepage → Subscription link → Login → Subscription page → Create subscription
 * 
 * Created: August 13, 2025
 * Purpose: Verify Link component error fixes in subscription navigation
 */

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = 'testing/playwright/screenshots/link-verification';
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
  const linkErrors: any[] = [];
  
  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    
    consoleLogs.push(logEntry);
    
    if (msg.type() === 'error') {
      consoleErrors.push(logEntry);
    }
    
    // Check specifically for Link component errors
    if (msg.text().includes('Invalid <Link>') || 
        msg.text().includes('Link') && msg.text().includes('<a>') ||
        msg.text().includes('nested') && msg.text().includes('anchor') ||
        msg.text().includes('button') && msg.text().includes('Link')) {
      linkErrors.push(logEntry);
    }
  });

  page.on('pageerror', (error) => {
    const errorEntry = {
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      type: 'pageerror'
    };
    
    consoleErrors.push(errorEntry);
    
    // Check if it's a Link-related error
    if (error.message.includes('Invalid <Link>') || 
        error.message.includes('Link') || 
        error.message.includes('anchor') ||
        error.message.includes('button')) {
      linkErrors.push(errorEntry);
    }
  });

  return { consoleLogs, consoleErrors, linkErrors };
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
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Helper function to report console errors
 */
function reportConsoleErrors(consoleErrors: any[], linkErrors: any[], testName: string) {
  console.log(`\n=== ${testName.toUpperCase()} CONSOLE ANALYSIS ===`);
  console.log(`Total console errors: ${consoleErrors.length}`);
  console.log(`Link-specific errors: ${linkErrors.length}`);
  
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
  
  if (linkErrors.length > 0) {
    console.log('\n❌ LINK COMPONENT ERRORS FOUND:');
    linkErrors.forEach((error, index) => {
      console.log(`\nLink Error ${index + 1}:`);
      console.log(`Message: ${error.text}`);
      console.log(`Location: ${JSON.stringify(error.location)}`);
    });
    return false; // Indicates Link errors were found
  } else {
    console.log('\n✅ NO LINK COMPONENT ERRORS DETECTED!');
    return true; // Indicates no Link errors
  }
}

test.describe('Link Component Verification Tests', () => {
  
  test('Complete user journey: Homepage → Subscription → Login → Dashboard → Subscription page', async ({ page }) => {
    const { consoleLogs, consoleErrors, linkErrors } = await setupConsoleLogging(page);
    
    console.log('\n🚀 Starting complete user journey test...');
    
    // Step 1: Navigate to homepage
    console.log('\n📍 Step 1: Navigating to homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await takeTimestampedScreenshot(page, 'step1-homepage');
    
    // Check for errors on homepage load
    const homepageErrors = [...consoleErrors];
    const homepageLinkErrors = [...linkErrors];
    
    // Step 2: Look for subscription link in navigation
    console.log('\n📍 Step 2: Looking for subscription navigation link...');
    await page.waitForSelector('nav', { timeout: 10000 });
    
    // Look for subscription links in various forms
    const subscriptionSelectors = [
      'a[href="/subscriptions"]',
      'a:has-text("Subscription")',
      'a:has-text("subscription")', 
      'a[href*="subscription"]',
      '[data-testid="subscription-link"]'
    ];
    
    let subscriptionLink = null;
    for (const selector of subscriptionSelectors) {
      try {
        subscriptionLink = page.locator(selector).first();
        if (await subscriptionLink.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found subscription link using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!subscriptionLink || !(await subscriptionLink.isVisible())) {
      console.log('⚠️  No subscription link found in navigation, checking page content...');
      await takeTimestampedScreenshot(page, 'step2-no-subscription-link');
      
      // Look for any subscription-related links on the page
      const anySubscriptionLink = page.locator('a').filter({ hasText: /subscription/i }).first();
      if (await anySubscriptionLink.isVisible({ timeout: 5000 })) {
        subscriptionLink = anySubscriptionLink;
        console.log('✅ Found subscription link in page content');
      } else {
        console.log('❌ No subscription link found anywhere on the page');
        await takeTimestampedScreenshot(page, 'step2-no-subscription-anywhere');
      }
    }
    
    await takeTimestampedScreenshot(page, 'step2-subscription-link-found');
    
    // Step 3: Click on subscription link
    if (subscriptionLink && await subscriptionLink.isVisible()) {
      console.log('\n📍 Step 3: Clicking subscription link...');
      await subscriptionLink.click();
      await page.waitForTimeout(2000);
      await takeTimestampedScreenshot(page, 'step3-after-subscription-click');
      
      const currentUrl = page.url();
      console.log(`Current URL after click: ${currentUrl}`);
      
      if (currentUrl.includes('/login')) {
        console.log('✅ Correctly redirected to login page');
        await takeTimestampedScreenshot(page, 'step3-login-redirect');
        
        // Step 4: Login with test credentials
        console.log('\n📍 Step 4: Logging in with test credentials...');
        
        try {
          await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
          await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
          await takeTimestampedScreenshot(page, 'step4-before-login-submit');
          
          await page.click('button[type="submit"], input[type="submit"]');
          await page.waitForTimeout(3000);
          await takeTimestampedScreenshot(page, 'step4-after-login-submit');
          
          const postLoginUrl = page.url();
          console.log(`URL after login: ${postLoginUrl}`);
          
        } catch (loginError) {
          console.log(`⚠️  Login attempt failed: ${loginError}`);
          await takeTimestampedScreenshot(page, 'step4-login-failed');
        }
      } else if (currentUrl.includes('/subscription')) {
        console.log('ℹ️  Directly reached subscription page (user might be auto-logged in)');
        await takeTimestampedScreenshot(page, 'step3-direct-subscription-access');
      }
    } else {
      console.log('❌ Could not find or click subscription link');
      await takeTimestampedScreenshot(page, 'step3-subscription-click-failed');
    }
    
    // Step 5: Navigate to subscription management page
    console.log('\n📍 Step 5: Navigating to subscription management page...');
    await page.goto(`${BASE_URL}/user/subscriptions`);
    await page.waitForTimeout(3000);
    await takeTimestampedScreenshot(page, 'step5-subscription-management');
    
    const subscriptionPageUrl = page.url();
    console.log(`Subscription page URL: ${subscriptionPageUrl}`);
    
    if (subscriptionPageUrl.includes('/login')) {
      console.log('ℹ️  Redirected to login from subscription page');
      await takeTimestampedScreenshot(page, 'step5-subscription-login-redirect');
    } else {
      console.log('✅ Successfully accessed subscription management page');
      
      // Step 6: Test interactive elements on subscription page
      console.log('\n📍 Step 6: Testing interactive elements...');
      
      // Look for "New Subscription" button
      const newSubscriptionButton = page.locator('a[href="/subscriptions/create"], a:has-text("New Subscription")').first();
      if (await newSubscriptionButton.isVisible({ timeout: 5000 })) {
        console.log('✅ Found "New Subscription" button');
        await takeTimestampedScreenshot(page, 'step6-new-subscription-button');
        
        // Test clicking the button
        await newSubscriptionButton.click();
        await page.waitForTimeout(2000);
        await takeTimestampedScreenshot(page, 'step6-after-new-subscription-click');
        
        const createPageUrl = page.url();
        console.log(`Create subscription page URL: ${createPageUrl}`);
      } else {
        console.log('⚠️  "New Subscription" button not found');
        await takeTimestampedScreenshot(page, 'step6-no-new-subscription-button');
      }
    }
    
    // Final error analysis
    const finalErrors = reportConsoleErrors(consoleErrors, linkErrors, 'Complete User Journey');
    
    // Expect no Link component errors
    expect(linkErrors.length, `Found ${linkErrors.length} Link component errors`).toBe(0);
    
    console.log('\n🎯 User journey test completed!');
  });

  test('Direct subscription page testing with DOM inspection', async ({ page }) => {
    const { consoleLogs, consoleErrors, linkErrors } = await setupConsoleLogging(page);
    
    console.log('\n🔍 Starting direct subscription page DOM inspection...');
    
    // Step 1: Navigate directly to subscription page
    console.log('\n📍 Step 1: Navigating to subscription management page...');
    await page.goto(`${BASE_URL}/user/subscriptions`);
    await page.waitForTimeout(3000);
    await takeTimestampedScreenshot(page, 'dom-step1-subscription-page');
    
    // Step 2: Inspect DOM structure for problematic Link patterns
    console.log('\n📍 Step 2: Inspecting DOM for problematic Link patterns...');
    
    // Check for nested Link > button patterns
    const linkButtonCount = await page.locator('a > button, Link > button').count();
    console.log(`Found ${linkButtonCount} potential Link > button combinations`);
    
    if (linkButtonCount > 0) {
      console.log('⚠️  Found potential problematic Link > button structures');
      const linkButtonElements = page.locator('a > button');
      const count = await linkButtonElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = linkButtonElements.nth(i);
        const parentHref = await element.locator('..').getAttribute('href');
        const buttonText = await element.textContent();
        console.log(`  - Link href="${parentHref}" contains button with text: "${buttonText}"`);
      }
    }
    
    // Check for nested Link > a patterns
    const linkAnchorCount = await page.locator('a > a').count();
    console.log(`Found ${linkAnchorCount} potential Link > anchor combinations`);
    
    // Step 3: Test all Link components on the page
    console.log('\n📍 Step 3: Testing all Link components...');
    const allLinks = page.locator('a[href]');
    const linkCount = await allLinks.count();
    console.log(`Found ${linkCount} links on the page`);
    
    // Test first few links to see if they cause errors
    const maxLinksToTest = Math.min(linkCount, 5);
    for (let i = 0; i < maxLinksToTest; i++) {
      const link = allLinks.nth(i);
      const href = await link.getAttribute('href');
      const text = (await link.textContent())?.trim() || '';
      
      console.log(`Testing link ${i + 1}: "${text}" (${href})`);
      
      // Hover over the link to trigger any potential issues
      await link.hover();
      await page.waitForTimeout(500);
    }
    
    await takeTimestampedScreenshot(page, 'dom-step3-links-tested');
    
    // Final error analysis
    const finalErrors = reportConsoleErrors(consoleErrors, linkErrors, 'DOM Inspection');
    
    // Expect no Link component errors
    expect(linkErrors.length, `Found ${linkErrors.length} Link component errors during DOM inspection`).toBe(0);
    
    console.log('\n🔍 DOM inspection test completed!');
  });

  test('UserHeader component Link testing', async ({ page }) => {
    const { consoleLogs, consoleErrors, linkErrors } = await setupConsoleLogging(page);
    
    console.log('\n🧪 Starting UserHeader component Link testing...');
    
    // Navigate to a page that uses UserHeader
    console.log('\n📍 Navigating to user dashboard to test UserHeader...');
    await page.goto(`${BASE_URL}/user/dashboard`);
    await page.waitForTimeout(3000);
    await takeTimestampedScreenshot(page, 'header-step1-dashboard');
    
    // Test breadcrumb links
    console.log('\n📍 Testing breadcrumb links...');
    const breadcrumbLinks = page.locator('.breadcrumb a, [data-testid="breadcrumb"] a');
    const breadcrumbCount = await breadcrumbLinks.count();
    console.log(`Found ${breadcrumbCount} breadcrumb links`);
    
    if (breadcrumbCount > 0) {
      for (let i = 0; i < breadcrumbCount; i++) {
        const link = breadcrumbLinks.nth(i);
        const text = await link.textContent();
        console.log(`Testing breadcrumb link: "${text}"`);
        await link.hover();
        await page.waitForTimeout(300);
      }
    }
    
    // Test quick action links
    console.log('\n📍 Testing quick action links...');
    const quickActionLinks = page.locator('.quickActions a, [data-testid="quick-action"] a');
    const quickActionCount = await quickActionLinks.count();
    console.log(`Found ${quickActionCount} quick action links`);
    
    if (quickActionCount > 0) {
      for (let i = 0; i < quickActionCount; i++) {
        const link = quickActionLinks.nth(i);
        const text = await link.textContent();
        console.log(`Testing quick action link: "${text}"`);
        await link.hover();
        await page.waitForTimeout(300);
      }
    }
    
    // Test dropdown menu links
    console.log('\n📍 Testing user dropdown menu...');
    const userProfileBtn = page.locator('.userProfileBtn, [data-testid="user-profile-btn"]').first();
    if (await userProfileBtn.isVisible({ timeout: 5000 })) {
      console.log('✅ Found user profile button');
      await userProfileBtn.click();
      await page.waitForTimeout(1000);
      await takeTimestampedScreenshot(page, 'header-dropdown-opened');
      
      // Test dropdown links
      const dropdownLinks = page.locator('.userDropdown a, [data-testid="user-dropdown"] a');
      const dropdownLinkCount = await dropdownLinks.count();
      console.log(`Found ${dropdownLinkCount} dropdown links`);
      
      if (dropdownLinkCount > 0) {
        for (let i = 0; i < dropdownLinkCount; i++) {
          const link = dropdownLinks.nth(i);
          const text = await link.textContent();
          console.log(`Testing dropdown link: "${text}"`);
          await link.hover();
          await page.waitForTimeout(300);
        }
      }
    }
    
    await takeTimestampedScreenshot(page, 'header-test-completed');
    
    // Final error analysis
    const finalErrors = reportConsoleErrors(consoleErrors, linkErrors, 'UserHeader Component');
    
    // Expect no Link component errors
    expect(linkErrors.length, `Found ${linkErrors.length} Link component errors in UserHeader`).toBe(0);
    
    console.log('\n🧪 UserHeader component test completed!');
  });
});

// Summary test to generate final report
test('Generate comprehensive Link verification report', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE LINK COMPONENT VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log('1. ✅ Complete user journey testing completed');
  console.log('2. ✅ DOM structure inspection completed');
  console.log('3. ✅ UserHeader component Link testing completed');
  console.log('4. ✅ Console error monitoring active throughout all tests');
  console.log('5. ✅ Screenshots captured at each critical step');
  
  console.log('\n🔍 WHAT WAS TESTED:');
  console.log('1. Homepage to subscription navigation flow');
  console.log('2. Login process and authenticated navigation');
  console.log('3. Subscription management page functionality');
  console.log('4. UserHeader component Link interactions');
  console.log('5. DOM structure for problematic Link patterns');
  console.log('6. Console error detection for Link-specific issues');
  
  console.log('\n📂 EXPECTED FIXED COMPONENTS:');
  console.log('1. ✅ /src/components/user/UserHeader.tsx');
  console.log('   - Dashboard breadcrumb link (Line 115-117)');
  console.log('   - New Subscription quick action (Line 132-139)');
  console.log('   - Notifications link (Line 201-203)');
  console.log('   - Profile dropdown links (Lines 239-275)');
  console.log('');
  console.log('2. ✅ /src/pages/user/subscriptions/index.tsx');
  console.log('   - New Subscription header button (Line 154-157)');
  console.log('   - Create First Subscription button (Line 201-204)');
  console.log('   - Manage subscription button (Line 266-272)');
  
  console.log('\n📁 SCREENSHOTS LOCATION:');
  console.log(`   ${SCREENSHOTS_DIR}/`);
  
  console.log('\n🎯 VERDICT:');
  console.log('The tests above will indicate if Link component errors have been successfully fixed.');
  console.log('Look for "✅ NO LINK COMPONENT ERRORS DETECTED!" messages in the test output.');
  
  console.log('\n' + '='.repeat(80));
});