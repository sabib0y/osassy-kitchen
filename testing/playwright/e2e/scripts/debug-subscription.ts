import { chromium } from 'playwright';

async function debugSubscriptionPage() {
  const browser = await chromium.launch({ 
    headless: false,  // Show browser for debugging
    slowMo: 100      // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('🔍 Debugging Subscription Page...\n');
  
  try {
    // 1. First login
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    console.log('2️⃣ Logging in with test credentials...');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    console.log('✅ Login successful\n');
    
    // 2. Navigate to subscription page
    console.log('3️⃣ Navigating to subscription creation page...');
    await page.goto('http://localhost:3000/subscriptions/create');
    await page.waitForLoadState('networkidle');
    
    // Check for errors
    const pageTitle = await page.title();
    console.log(`📄 Page Title: ${pageTitle}`);
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console Error:', msg.text());
      }
    });
    
    // Check for network errors
    page.on('requestfailed', request => {
      console.error('❌ Request failed:', request.url(), request.failure()?.errorText);
    });
    
    // Wait a bit to catch any async errors
    await page.waitForTimeout(2000);
    
    // Check if menu items are loading
    const menuItems = await page.locator('.menu-item, .dish-card, [data-testid*="menu"]').count();
    console.log(`📦 Menu items found: ${menuItems}`);
    
    // Check for loading states
    const isLoading = await page.locator('.loading, .skeleton, .spinner').count();
    console.log(`⏳ Loading elements: ${isLoading}`);
    
    // Check for error messages
    const errorMessages = await page.locator('.error, .alert-danger, [role="alert"]').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error, .alert-danger, [role="alert"]').first().textContent();
      console.error(`❌ Error message found: ${errorText}`);
    }
    
    // Take screenshot for debugging
    const screenshotPath = '/Users/admin.paul.idemudia/Desktop/code2/my_work/osassy_kitchen/kitchen-app/lums-nextjs-main/testing/playwright/screenshots/debug-subscription.png';
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);
    
    // Check API calls
    console.log('\n🔌 Checking API calls...');
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          status: 'pending'
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const call = apiCalls.find(c => c.url === response.url());
        if (call) {
          call.status = response.status();
          console.log(`  ${call.method} ${call.url} -> ${call.status}`);
        }
      }
    });
    
    // Reload to capture API calls
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get page content for analysis
    const pageContent = await page.content();
    const hasContent = pageContent.length > 1000;
    console.log(`\n📝 Page has content: ${hasContent} (${pageContent.length} chars)`);
    
    // Check specific elements
    console.log('\n🔍 Checking page elements:');
    const elements = {
      'Header': 'header, nav',
      'Cart/Summary': '.cart, .summary, [data-testid*="cart"]',
      'Menu Grid': '.menu-grid, .grid, .menu-items',
      'Footer': 'footer'
    };
    
    for (const [name, selector] of Object.entries(elements)) {
      const exists = await page.locator(selector).count() > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${name}`);
    }
    
    console.log('\n✨ Debug complete! Check the browser window and screenshot.');
    console.log('Press Ctrl+C to close the browser...');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugSubscriptionPage().catch(console.error);