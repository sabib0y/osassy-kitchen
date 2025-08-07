const { chromium } = require('playwright');

async function testSubscriptionFlow() {
  // Launch browser in headed mode so you can see it
  const browser = await chromium.launch({
    headless: false, // Show the browser
    slowMo: 500 // Slow down actions by 500ms so you can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting subscription flow test...\n');

    // Step 1: Login first
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('   Filling login credentials...');
    
    // Fill email
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'test@test.com');
    console.log('   ✅ Filled email: test@test.com');
    
    // Fill password
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'test');
    console.log('   ✅ Filled password');
    
    // Take screenshot of login form
    await page.screenshot({ path: 'testing/playwright/screenshots/login-form.png' });
    
    // Click login button
    const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")');
    if (loginButton) {
      await loginButton.click();
      console.log('   ✅ Clicked login button');
    } else {
      // Try to find any button that might be the login button
      const buttons = await page.$$('button');
      console.log(`   Found ${buttons.length} buttons, clicking the most likely one...`);
      if (buttons.length > 0) {
        await buttons[0].click();
      }
    }
    
    // Wait for navigation after login
    await page.waitForTimeout(3000);
    console.log('   ✅ Login completed\n');
    
    // Check if we're logged in by looking at the URL or page content
    const currentUrl = page.url();
    console.log(`   Current URL after login: ${currentUrl}\n`);

    // Step 2: Navigate to subscription creation page
    console.log('2️⃣ Navigating to subscription page...');
    await page.goto('http://localhost:3000/subscriptions/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the subscription page
    await page.screenshot({ path: 'testing/playwright/screenshots/subscription-page-after-login.png' });
    console.log('   ✅ Subscription page loaded\n');

    // Step 3: Select menu items
    console.log('3️⃣ Selecting menu items...');
    
    // Look for menu item cards or add buttons
    // Try different selectors based on common patterns
    const selectors = [
      'button:has-text("+")',
      'button:has-text("Add")',
      '[data-testid*="add"]',
      '.menu-item button',
      '.dish-card button',
      'button.add-button',
      'button.increment'
    ];
    
    let itemsAdded = 0;
    for (const selector of selectors) {
      const buttons = await page.$$(selector);
      if (buttons.length > 0) {
        console.log(`   Found ${buttons.length} buttons with selector: ${selector}`);
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
          try {
            await buttons[i].click();
            itemsAdded++;
            console.log(`   ✅ Added item ${itemsAdded}`);
            await page.waitForTimeout(500);
          } catch (e) {
            console.log(`   ⚠️ Could not click button ${i + 1}`);
          }
        }
        if (itemsAdded >= 3) break;
      }
    }
    
    if (itemsAdded === 0) {
      console.log('   ⚠️ No menu items found to add. Page might not have loaded correctly.');
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'testing/playwright/screenshots/subscription-page-debug.png' });
    } else {
      console.log(`   ✅ Added ${itemsAdded} menu items\n`);
    }

    await page.waitForTimeout(1000);

    // Step 4: Select billing interval
    console.log('4️⃣ Selecting billing interval...');
    
    // Look for billing options
    const billingOptions = await page.$$('input[type="radio"], label:has-text("Weekly"), label:has-text("Monthly")');
    if (billingOptions.length > 0) {
      await billingOptions[0].click();
      console.log('   ✅ Selected billing option\n');
    } else {
      console.log('   ⚠️ No billing options found\n');
    }

    // Step 5: Fill customer information (if not pre-filled)
    console.log('5️⃣ Checking/filling customer information...');
    
    // Name field
    const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
    if (nameInput) {
      const currentValue = await nameInput.inputValue();
      if (!currentValue) {
        await nameInput.fill('Test User');
        console.log('   ✅ Filled name');
      }
    }

    // Email field (might be pre-filled from login)
    const emailInput = await page.$('input[name="email"], input[type="email"]');
    if (emailInput) {
      const currentValue = await emailInput.inputValue();
      if (!currentValue) {
        await emailInput.fill('test@test.com');
        console.log('   ✅ Filled email');
      }
    }

    // Phone field
    const phoneInput = await page.$('input[name="phone"], input[type="tel"]');
    if (phoneInput) {
      await phoneInput.fill('+447123456789');
      console.log('   ✅ Filled phone');
    }

    // Address fields
    const addressInput = await page.$('input[name="address"], input[placeholder*="address" i]');
    if (addressInput) {
      await addressInput.fill('71 Malmsmead House');
      console.log('   ✅ Filled address');
    }

    await page.waitForTimeout(1000);

    // Step 6: Proceed to checkout
    console.log('\n6️⃣ Looking for checkout button...');
    
    const checkoutSelectors = [
      'button:has-text("Checkout")',
      'button:has-text("Proceed to Checkout")',
      'button:has-text("Continue")',
      'button:has-text("Subscribe")',
      'button:has-text("Pay")',
      'button:has-text("Next")',
      'button[type="submit"]'
    ];
    
    let checkoutClicked = false;
    for (const selector of checkoutSelectors) {
      const button = await page.$(selector);
      if (button) {
        const isDisabled = await button.isDisabled();
        if (!isDisabled) {
          console.log(`   Found checkout button with selector: ${selector}`);
          await button.click();
          checkoutClicked = true;
          console.log('   ✅ Clicked checkout button');
          break;
        }
      }
    }
    
    if (!checkoutClicked) {
      console.log('   ⚠️ No checkout button found or all are disabled');
      // Take a screenshot to debug
      await page.screenshot({ path: 'testing/playwright/screenshots/checkout-button-debug.png' });
    }
    
    // Wait for navigation or Stripe to load
    await page.waitForTimeout(5000);
    
    // Check if we're on Stripe checkout
    const finalUrl = page.url();
    console.log(`\n   Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('stripe.com')) {
      console.log('7️⃣ Redirected to Stripe checkout!');
      
      // You can fill the Stripe form here if needed
      console.log('   Ready to fill payment details (not automated for safety)');
      
      // Take screenshot of Stripe page
      await page.screenshot({ path: 'testing/playwright/screenshots/stripe-checkout.png' });
    } else {
      console.log('   Still on site, might have embedded payment form');
      // Take final screenshot
      await page.screenshot({ path: 'testing/playwright/screenshots/subscription-flow-final.png' });
    }

    console.log('\n✅ Test completed! Check the screenshots.');
    
    // Keep browser open for 10 seconds so you can see the result
    console.log('   Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'testing/playwright/screenshots/error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
}

// Run the test
testSubscriptionFlow();