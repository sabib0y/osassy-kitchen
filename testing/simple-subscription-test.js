const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = './testing/playwright/screenshots/subscription-debug';

async function runSubscriptionTest() {
  // Ensure screenshots directory exists
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  
  console.log('🚀 Starting subscription navigation test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Set up console logging
  const consoleLogs = [];
  const consoleErrors = [];
  
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
      console.log(`❌ Console Error: ${msg.text()}`);
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
    console.log(`🚨 Page Error: ${error.message}`);
  });

  try {
    // Step 1: Navigate to homepage
    console.log('📍 Step 1: Navigating to homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'step1-homepage.png'), 
      fullPage: true 
    });
    console.log('✅ Homepage loaded successfully');

    // Step 2: Look for subscription navigation link
    console.log('📍 Step 2: Looking for subscription link...');
    
    // Wait for navigation to be available
    await page.waitForSelector('nav', { timeout: 10000 });
    
    // Look for subscription link
    const subscriptionLink = page.locator('a[href="/subscriptions"], a:has-text("Subscription")');
    const isVisible = await subscriptionLink.isVisible();
    
    if (isVisible) {
      console.log('✅ Subscription link found');
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'step2-subscription-link-found.png'), 
        fullPage: true 
      });
    } else {
      console.log('❌ Subscription link not found');
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'step2-subscription-link-missing.png'), 
        fullPage: true 
      });
      return;
    }

    // Step 3: Click subscription link
    console.log('📍 Step 3: Clicking subscription link...');
    await subscriptionLink.click();
    
    // Wait a moment for any errors to occur
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`Current URL after click: ${currentUrl}`);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'step3-after-click.png'), 
      fullPage: true 
    });

    // Step 4: Analyze the results
    console.log('\n=== CONSOLE LOG ANALYSIS ===');
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
        if (error.location) {
          console.log(`Location: ${JSON.stringify(error.location)}`);
        }
      });
    } else {
      console.log('\n✅ No Link component errors detected in console');
    }

    // Step 5: Try to access subscription page directly
    console.log('\n📍 Step 5: Testing direct navigation to subscription pages...');
    
    // Test /subscriptions
    await page.goto(`${BASE_URL}/subscriptions`);
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'step5-subscriptions-direct.png'), 
      fullPage: true 
    });
    console.log(`Direct /subscriptions navigation - URL: ${page.url()}`);
    
    // Test /user/subscriptions
    await page.goto(`${BASE_URL}/user/subscriptions`);
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'step5-user-subscriptions-direct.png'), 
      fullPage: true 
    });
    console.log(`Direct /user/subscriptions navigation - URL: ${page.url()}`);

    // Step 6: Test with authentication
    console.log('\n📍 Step 6: Testing with authentication...');
    
    // Try to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Check if login form exists
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
    
    if (emailInput > 0 && passwordInput > 0) {
      console.log('✅ Login form found, attempting to login...');
      await page.fill('input[type="email"], input[name="email"]', 'test@test.com');
      await page.fill('input[type="password"], input[name="password"]', 'test');
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'step6-before-login.png'), 
        fullPage: true 
      });
      
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'step6-after-login.png'), 
        fullPage: true 
      });
      
      // Now try to navigate to subscriptions again
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const authSubscriptionLink = page.locator('a[href="/subscriptions"], a:has-text("Subscription")');
      if (await authSubscriptionLink.isVisible()) {
        console.log('Clicking subscription link as authenticated user...');
        await authSubscriptionLink.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, 'step6-auth-subscription-click.png'), 
          fullPage: true 
        });
        
        console.log(`Authenticated subscription navigation - URL: ${page.url()}`);
      }
    } else {
      console.log('❌ Login form not found');
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'step6-no-login-form.png'), 
        fullPage: true 
      });
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'error-screenshot.png'), 
      fullPage: true 
    });
  } finally {
    console.log('\n📝 Final Console Error Summary:');
    console.log(`Total errors captured: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
      });
    } else {
      console.log('✅ No console errors detected');
    }
    
    console.log(`\n📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    
    await browser.close();
    console.log('\n🏁 Test completed!');
  }
}

runSubscriptionTest().catch(console.error);