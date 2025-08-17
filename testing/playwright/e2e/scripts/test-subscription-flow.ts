import { chromium } from 'playwright';

async function testSubscriptionFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('🧪 Testing complete subscription flow...\n');
  
  try {
    // Test 1: Navigate from homepage
    console.log('Test 1: Homepage Navigation');
    console.log('==============================');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click subscription in menu
    console.log('📍 Clicking Subscription in navigation...');
    const subscriptionLink = await page.locator('a[href="/subscriptions"], [href*="subscription"]').first();
    if (await subscriptionLink.count() > 0) {
      await subscriptionLink.click();
      await page.waitForLoadState('networkidle');
      
      const url1 = page.url();
      console.log(`   Current URL: ${url1}`);
      
      // Check if redirected to login
      if (url1.includes('/login')) {
        console.log('   ➡️ Redirected to login (authentication required)');
        
        // Login
        console.log('\n🔑 Logging in...');
        await page.fill('input[type="email"]', 'test@test.com');
        await page.fill('input[type="password"]', 'test');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        const url2 = page.url();
        console.log(`   After login URL: ${url2}`);
      }
    } else {
      console.log('   ⚠️ No subscription link found in navigation');
    }
    
    // Test 2: Direct navigation to subscriptions page
    console.log('\nTest 2: Direct Navigation');
    console.log('==============================');
    console.log('📍 Going directly to /subscriptions...');
    await page.goto('http://localhost:3000/subscriptions');
    await page.waitForLoadState('networkidle');
    
    const url3 = page.url();
    console.log(`   Redirected to: ${url3}`);
    
    // Test 3: Navigate to user subscriptions
    console.log('\nTest 3: User Subscriptions Page');
    console.log('==============================');
    console.log('📍 Going to /user/subscriptions...');
    await page.goto('http://localhost:3000/user/subscriptions');
    await page.waitForLoadState('networkidle');
    
    const url4 = page.url();
    console.log(`   Current URL: ${url4}`);
    
    // Check page content
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);
    
    // Check for subscription list or create button
    const hasSubscriptions = await page.locator('[class*="subscription"], [data-testid*="subscription"]').count();
    console.log(`   Subscriptions found: ${hasSubscriptions}`);
    
    const createButton = await page.locator('a[href*="create"], button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.count() > 0) {
      console.log('   ✅ Create subscription button found');
      
      // Test 4: Navigate to create subscription
      console.log('\nTest 4: Create Subscription Page');
      console.log('==============================');
      await createButton.click();
      await page.waitForLoadState('networkidle');
      
      const url5 = page.url();
      console.log(`   Current URL: ${url5}`);
      
      // Check for menu items
      const menuItems = await page.locator('[class*="dish"], [class*="menu"], [data-testid*="menu"]').count();
      console.log(`   Menu items found: ${menuItems}`);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/admin.paul.idemudia/Desktop/code2/my_work/osassy_kitchen/kitchen-app/lums-nextjs-main/testing/playwright/screenshots/subscription-flow-test.png',
      fullPage: true 
    });
    
    console.log('\n✨ Test complete!');
    console.log('📸 Screenshot saved');
    console.log('\nPress Ctrl+C to close the browser...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testSubscriptionFlow().catch(console.error);