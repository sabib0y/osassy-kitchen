const { chromium } = require('playwright');

async function checkSubscriptions() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Checking subscriptions...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('   ✅ Logged in\n');

    // Step 2: Navigate to subscriptions page
    console.log('2️⃣ Navigating to subscriptions page...');
    await page.goto('http://localhost:3000/subscriptions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'testing/playwright/screenshots/subscriptions-current.png' });
    
    // Check page content
    const pageContent = await page.content();
    console.log('\n📋 Page Analysis:');
    
    // Check for loading state
    if (pageContent.includes('Loading subscriptions')) {
      console.log('   ⏳ Page is still loading');
    }
    
    // Check for error state
    if (pageContent.includes('Failed to load subscriptions') || pageContent.includes('Error')) {
      console.log('   ❌ Error loading subscriptions');
    }
    
    // Check for empty state
    if (pageContent.includes('No Subscriptions Yet')) {
      console.log('   📭 No subscriptions found (empty state)');
    }
    
    // Check for subscription content
    if (pageContent.includes('Weekly') || pageContent.includes('Monthly')) {
      console.log('   ✅ Found subscription content!');
      
      // Try to find subscription details
      const subscriptionCards = await page.$$('[class*="subscription"]');
      console.log(`   📦 Found ${subscriptionCards.length} subscription elements`);
    }
    
    // Check for specific subscription status
    if (pageContent.includes('ACTIVE')) {
      console.log('   🟢 Active subscription found');
    }
    
    // Log any network errors
    page.on('response', response => {
      if (response.url().includes('/api/user/subscriptions') && response.status() !== 200) {
        console.log(`   ⚠️ API Error: ${response.status()} ${response.statusText()}`);
      }
    });
    
    // Try to find subscription data
    const subscriptionData = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="subscription"], [data-testid*="subscription"]');
      return elements.length;
    });
    
    console.log(`\n   📊 DOM Analysis: ${subscriptionData} subscription-related elements found`);
    
    // Check if API call was made
    console.log('\n3️⃣ Checking API calls...');
    await page.goto('http://localhost:3000/subscriptions');
    
    // Wait for API response
    const apiResponse = await page.waitForResponse(
      response => response.url().includes('/api/user/subscriptions'),
      { timeout: 5000 }
    ).catch(() => null);
    
    if (apiResponse) {
      console.log(`   API Response Status: ${apiResponse.status()}`);
      if (apiResponse.status() === 200) {
        const data = await apiResponse.json();
        console.log(`   Subscriptions returned: ${data.subscriptions ? data.subscriptions.length : 0}`);
      }
    } else {
      console.log('   ⚠️ No API call to /api/user/subscriptions detected');
    }
    
    console.log('\n✅ Check completed! See screenshot: testing/playwright/screenshots/subscriptions-current.png');
    
    // Keep browser open for inspection
    console.log('   Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'testing/playwright/screenshots/error.png' });
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
}

// Run the check
checkSubscriptions();