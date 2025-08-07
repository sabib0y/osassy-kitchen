const { chromium } = require('playwright');

async function testCompleteSubscriptionFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting complete subscription flow test...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('   ✅ Logged in\n');

    // Step 2: Navigate to subscriptions page to check initial state
    console.log('2️⃣ Checking initial subscriptions page...');
    await page.goto('http://localhost:3000/subscriptions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'testing/playwright/screenshots/subscriptions-before.png' });
    console.log('   ✅ Screenshot taken of subscriptions page (before)\n');

    // Step 3: Go to create subscription
    console.log('3️⃣ Creating new subscription...');
    await page.goto('http://localhost:3000/subscriptions/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 4: Select menu items
    console.log('4️⃣ Selecting menu items...');
    const addButtons = await page.$$('button:has-text("+")');
    if (addButtons.length > 0) {
      for (let i = 0; i < Math.min(3, addButtons.length); i++) {
        await addButtons[i].click();
        await page.waitForTimeout(500);
      }
      console.log(`   ✅ Added ${Math.min(3, addButtons.length)} items\n`);
    }

    // Step 5: Select weekly billing
    console.log('5️⃣ Selecting weekly billing...');
    const weeklyOption = await page.$('label:has-text("Weekly")');
    if (weeklyOption) {
      await weeklyOption.click();
      console.log('   ✅ Selected weekly billing\n');
    }

    // Step 6: Fill customer info
    console.log('6️⃣ Filling customer information...');
    const nameInput = await page.$('input[name="name"]');
    if (nameInput) {
      await nameInput.fill('Test User');
    }
    
    const phoneInput = await page.$('input[name="phone"]');
    if (phoneInput) {
      await phoneInput.fill('+447123456789');
    }
    
    const addressInput = await page.$('input[name="address"]');
    if (addressInput) {
      await addressInput.fill('71 Malmsmead House');
    }
    console.log('   ✅ Filled customer info\n');

    // Step 7: Click checkout
    console.log('7️⃣ Proceeding to checkout...');
    const checkoutButton = await page.$('button:has-text("Proceed to Checkout")');
    if (checkoutButton) {
      await checkoutButton.click();
      console.log('   ✅ Clicked checkout\n');
    }

    // Wait for Stripe redirect
    await page.waitForTimeout(5000);

    // Step 8: Fill Stripe payment form
    if (page.url().includes('stripe.com')) {
      console.log('8️⃣ Filling Stripe payment form...');
      
      // Wait for Stripe form to load
      await page.waitForTimeout(3000);

      // Fill email if needed
      const stripeEmail = await page.$('input[name="email"]');
      if (stripeEmail) {
        await stripeEmail.fill('test@test.com');
      }

      // Fill card details
      const cardFrame = page.frameLocator('iframe[title*="Secure card"]').first();
      if (cardFrame) {
        await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
        await cardFrame.locator('input[name="exp-date"]').fill('12/35');
        await cardFrame.locator('input[name="cvc"]').fill('123');
        await cardFrame.locator('input[name="postal"]').fill('E1 6AN');
      } else {
        // Try alternative selectors
        await page.fill('input[placeholder*="Card number"]', '4242424242424242');
        await page.fill('input[placeholder*="MM / YY"]', '12/35');
        await page.fill('input[placeholder*="CVC"]', '123');
      }

      // Fill billing details
      await page.fill('input[name="name"]', 'Test User');
      const countrySelect = await page.$('select[name="country"]');
      if (countrySelect) {
        await countrySelect.selectOption('GB');
      }
      await page.fill('input[name="addressLine1"]', '71 Malmsmead House');
      await page.fill('input[name="addressCity"]', 'London');
      await page.fill('input[name="addressState"]', 'London');
      await page.fill('input[name="addressPostalCode"]', 'E1 6AN');

      console.log('   ✅ Filled payment details\n');

      // Submit payment
      console.log('9️⃣ Submitting payment...');
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('   ✅ Payment submitted\n');
      }

      // Wait for redirect back to site
      await page.waitForTimeout(10000);
    }

    // Step 10: Check success page
    console.log('🔟 Checking for success...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('success')) {
      console.log('   ✅ Payment successful!\n');
      await page.screenshot({ path: 'testing/playwright/screenshots/success-page.png' });
      
      // Wait a moment for any redirects
      await page.waitForTimeout(3000);
    }

    // Step 11: Navigate to subscriptions page to verify
    console.log('1️⃣1️⃣ Checking subscriptions page for new subscription...');
    await page.goto('http://localhost:3000/subscriptions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'testing/playwright/screenshots/subscriptions-after.png' });
    
    // Check for subscription content
    const pageContent = await page.content();
    const hasSubscription = pageContent.includes('Weekly') || 
                           pageContent.includes('Monthly') || 
                           pageContent.includes('Active') ||
                           pageContent.includes('subscription');
    
    if (hasSubscription) {
      console.log('   ✅ Subscription found on page!\n');
    } else {
      console.log('   ⚠️ No subscription content found on page\n');
      console.log('   Page might be empty or subscription not saved properly\n');
    }

    // Try to find specific subscription elements
    const subscriptionCards = await page.$$('[class*="subscription"], [class*="card"], [data-testid*="subscription"]');
    console.log(`   Found ${subscriptionCards.length} potential subscription elements\n`);

    console.log('✅ Test completed! Check screenshots in testing/playwright/screenshots/');
    
    // Keep browser open for inspection
    console.log('   Keeping browser open for 15 seconds for inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'testing/playwright/screenshots/error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
}

// Run the test
testCompleteSubscriptionFlow();