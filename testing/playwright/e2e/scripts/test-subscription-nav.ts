import { chromium } from 'playwright';

async function testSubscriptionNavigation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('🧪 Testing subscription navigation...\n');
  
  try {
    // Go to homepage
    console.log('1️⃣ Navigating to homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click subscription link in navigation
    console.log('2️⃣ Clicking Subscription link in navigation...');
    await page.click('a[href="/subscriptions"], [href="/subscriptions"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the subscriptions page
    const url = page.url();
    console.log(`3️⃣ Current URL: ${url}`);
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for errors
    const hasError = await page.locator('.error, [class*="error"]').count();
    if (hasError > 0) {
      console.error('❌ Error found on page');
      const errorText = await page.locator('.error, [class*="error"]').first().textContent();
      console.error(`   Error text: ${errorText}`);
    } else {
      console.log('✅ No errors found');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/admin.paul.idemudia/Desktop/code2/my_work/osassy_kitchen/kitchen-app/lums-nextjs-main/testing/playwright/screenshots/subscription-nav-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved');
    
    console.log('\n✨ Test complete!');
    console.log('Press Ctrl+C to close the browser...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testSubscriptionNavigation().catch(console.error);