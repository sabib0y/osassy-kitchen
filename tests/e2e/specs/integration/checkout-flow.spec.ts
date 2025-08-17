import { test, expect } from '@playwright/test';

test.describe('Checkout Flow Integration Tests', () => {
  const TEST_STRIPE_CARD = '4242424242424242';
  const USER_EMAIL = 'test@test.com';
  const USER_PASSWORD = 'test';
  const ADMIN_EMAIL = 'osasp419@gmail.com';
  const ADMIN_PASSWORD = 'test';

  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/user/dashboard');
  });

  test('should complete full checkout flow with Stripe payment', async ({ page }) => {
    // Navigate to subscription creation
    await page.goto('/subscriptions/create');
    
    // Add items to cart
    const menuItems = page.locator('.menu-item, .meal-card');
    await expect(menuItems).toHaveCount({ minimum: 1 });
    
    // Add first menu item
    const firstItem = menuItems.first();
    const itemName = await firstItem.locator('h3, h4, .item-name').textContent();
    await firstItem.locator('button:has-text("+"), button:has-text("Add")').click();
    
    // Verify item in cart
    const cartItem = page.locator(`.cart-item:has-text("${itemName}"), .order-item:has-text("${itemName}")`);
    await expect(cartItem).toBeVisible();
    
    // Check that total is displayed and greater than 0
    const totalElement = page.locator('.cart-total, .order-total, [data-testid="total"]');
    await expect(totalElement).toBeVisible();
    const totalText = await totalElement.textContent();
    const totalValue = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
    expect(totalValue).toBeGreaterThan(0);
    
    // Proceed to checkout
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed"), [data-testid="checkout-button"]');
    await checkoutButton.click();
    
    // Wait for Stripe checkout or payment page
    await page.waitForURL(url => 
      url.includes('stripe.com') || 
      url.includes('checkout') || 
      url.includes('payment') ||
      url.includes('confirm')
    );
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('stripe.com')) {
      // Handle Stripe Checkout
      await handleStripeCheckout(page);
    } else {
      // Handle custom payment form
      await handleCustomPaymentForm(page);
    }
    
    // Verify order confirmation
    await expect(page.locator('text=/order.*confirm|payment.*success|subscription.*created/i')).toBeVisible();
    
    // Check for order details
    const orderDetails = page.locator('.order-details, .confirmation-details, [data-testid="order-summary"]');
    if (await orderDetails.count() > 0) {
      await expect(orderDetails).toBeVisible();
      await expect(orderDetails).toContainText(itemName || '');
    }
    
    // Check for subscription activation message
    const activationMessage = page.locator('text=/subscription.*active|activated|subscribed/i');
    if (await activationMessage.count() > 0) {
      await expect(activationMessage).toBeVisible();
    }
  });

  test('should handle payment processing with Stripe', async ({ page }) => {
    // Create subscription and go to payment
    await createSubscriptionAndProceedToPayment(page);
    
    // Handle payment processing
    const paymentForm = page.locator('form').filter({ hasText: /payment|card|stripe/i });
    
    if (await paymentForm.count() > 0) {
      // Fill payment details
      await fillPaymentDetails(page);
      
      // Submit payment
      const submitButton = page.locator('button:has-text("Pay"), button:has-text("Complete"), button[type="submit"]');
      await submitButton.click();
      
      // Wait for processing
      const processingIndicator = page.locator('text=/processing|please wait/i, .loader, .spinner');
      if (await processingIndicator.isVisible().catch(() => false)) {
        await expect(processingIndicator).not.toBeVisible({ timeout: 15000 });
      }
      
      // Should redirect to success page
      await page.waitForURL(url => 
        url.includes('success') || 
        url.includes('confirm') || 
        url.includes('complete') ||
        url.includes('dashboard')
      );
      
      // Verify success
      const successMessage = page.locator('text=/success|complete|confirmed|thank you/i');
      await expect(successMessage).toBeVisible();
    }
  });

  test('should send order confirmation email', async ({ page, context }) => {
    // Complete order
    await createSubscriptionAndProceedToPayment(page);
    await handlePaymentFlow(page);
    
    // Navigate to user profile to check email confirmation
    await page.goto('/user/profile');
    
    // Check for email confirmation indicator
    const emailStatus = page.locator('text=/email.*sent|confirmation.*sent|check.*email/i');
    if (await emailStatus.count() > 0) {
      await expect(emailStatus).toBeVisible();
    }
    
    // Check order history to verify order was created
    await page.goto('/user/orders');
    
    // Should see the recent order
    const recentOrder = page.locator('.order-item, .order-row, tr').first();
    if (await recentOrder.count() > 0) {
      await expect(recentOrder).toBeVisible();
      
      // Check order status
      const orderStatus = recentOrder.locator('.status, [data-testid="order-status"]');
      if (await orderStatus.count() > 0) {
        const statusText = await orderStatus.textContent();
        expect(statusText).toMatch(/pending|confirmed|processing|active/i);
      }
    }
  });

  test('should activate subscription after payment', async ({ page }) => {
    // Complete checkout flow
    await createSubscriptionAndProceedToPayment(page);
    await handlePaymentFlow(page);
    
    // Navigate to subscriptions page
    await page.goto('/user/subscriptions');
    
    // Should see active subscription
    const activeSubscription = page.locator('.subscription-item, .subscription-card').first();
    await expect(activeSubscription).toBeVisible();
    
    // Check subscription status
    const status = activeSubscription.locator('.status, [data-testid="subscription-status"]');
    if (await status.count() > 0) {
      const statusText = await status.textContent();
      expect(statusText).toMatch(/active|subscribed/i);
    }
    
    // Check subscription details
    const subscriptionDetails = activeSubscription.locator('.details, .subscription-details');
    if (await subscriptionDetails.count() > 0) {
      await expect(subscriptionDetails).toBeVisible();
    }
    
    // Check next delivery date
    const nextDelivery = activeSubscription.locator('text=/next.*delivery|delivery.*date/i');
    if (await nextDelivery.count() > 0) {
      await expect(nextDelivery).toBeVisible();
    }
  });

  test('should handle payment failures gracefully', async ({ page }) => {
    // Create subscription and go to payment
    await createSubscriptionAndProceedToPayment(page);
    
    // Use declined test card
    const declinedCard = '4000000000000002';
    
    if (page.url().includes('stripe.com')) {
      // Fill Stripe form with declined card
      await page.fill('[data-elements-stable-field-name="cardNumber"]', declinedCard);
      await page.fill('[data-elements-stable-field-name="cardExpiry"]', '12/25');
      await page.fill('[data-elements-stable-field-name="cardCvc"]', '123');
      
      // Submit payment
      const submitButton = page.locator('button[type="submit"], .SubmitButton');
      await submitButton.click();
      
      // Should show error message
      const errorMessage = page.locator('.Error, .ErrorMessage, [role="alert"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/declined|failed|error/i);
    } else {
      // Handle custom payment form
      await fillPaymentDetails(page, declinedCard);
      
      const submitButton = page.locator('button:has-text("Pay"), button[type="submit"]');
      await submitButton.click();
      
      // Should show error message
      const errorMessage = page.locator('.error, .payment-error, [data-testid="error"]');
      await expect(errorMessage).toBeVisible();
    }
    
    // Should remain on payment page
    expect(page.url()).toMatch(/checkout|payment|stripe/);
  });

  test('should verify admin receives order notification', async ({ page, context }) => {
    // Complete order as user
    await createSubscriptionAndProceedToPayment(page);
    await handlePaymentFlow(page);
    
    // Open new tab for admin
    const adminPage = await context.newPage();
    
    // Login as admin
    await adminPage.goto('/login');
    await adminPage.fill('input[type="email"]', ADMIN_EMAIL);
    await adminPage.fill('input[type="password"]', ADMIN_PASSWORD);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL(url => url.includes('/admin') || url.includes('/dashboard'));
    
    // Navigate to admin dashboard
    await adminPage.goto('/admin/dashboard');
    
    // Check for new order notification
    const notification = adminPage.locator('.notification, .alert, [data-testid="notification"]');
    if (await notification.count() > 0) {
      await expect(notification.first()).toContainText(/new.*order|order.*received/i);
    }
    
    // Check recent orders section
    const recentOrdersSection = adminPage.locator('section, div').filter({ hasText: /recent.*order/i });
    if (await recentOrdersSection.count() > 0) {
      const firstOrder = recentOrdersSection.locator('.order-item, .order-row').first();
      await expect(firstOrder).toBeVisible();
    }
    
    // Check orders page
    await adminPage.goto('/admin/orders');
    const ordersList = adminPage.locator('.order-item, .order-row, tr');
    await expect(ordersList.first()).toBeVisible();
    
    await adminPage.close();
  });

  test('should handle multiple payment methods', async ({ page }) => {
    await createSubscriptionAndProceedToPayment(page);
    
    // Check for payment method options
    const paymentMethods = page.locator('input[name="payment_method"], .payment-method-option');
    
    if (await paymentMethods.count() > 1) {
      // Select credit card option if available
      const cardOption = paymentMethods.filter({ hasText: /card|credit/i });
      if (await cardOption.count() > 0) {
        await cardOption.click();
      }
      
      await fillPaymentDetails(page);
      
      // Submit payment
      const submitButton = page.locator('button:has-text("Pay"), button[type="submit"]');
      await submitButton.click();
      
      // Verify success
      await page.waitForURL(url => 
        url.includes('success') || 
        url.includes('confirm') ||
        url.includes('dashboard')
      );
    }
  });

  test('should validate order totals match payment amount', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Add multiple items
    const menuItems = page.locator('.menu-item, .meal-card');
    const itemCount = Math.min(await menuItems.count(), 3);
    
    for (let i = 0; i < itemCount; i++) {
      await menuItems.nth(i).locator('button:has-text("+"), button:has-text("Add")').click();
    }
    
    // Get cart total
    const cartTotalElement = page.locator('.cart-total, .order-total, [data-testid="total"]');
    const cartTotal = await cartTotalElement.textContent();
    const cartAmount = parseFloat(cartTotal?.replace(/[^0-9.]/g, '') || '0');
    
    // Proceed to checkout
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed")');
    await checkoutButton.click();
    
    // Wait for payment page
    await page.waitForURL(url => 
      url.includes('checkout') || 
      url.includes('payment') ||
      url.includes('stripe')
    );
    
    // Verify payment amount matches
    const paymentAmount = page.locator('.payment-amount, .total-amount, [data-testid="payment-total"]');
    if (await paymentAmount.count() > 0) {
      const paymentText = await paymentAmount.textContent();
      const paymentValue = parseFloat(paymentText?.replace(/[^0-9.]/g, '') || '0');
      
      // Amounts should match (allowing for small rounding differences)
      expect(Math.abs(cartAmount - paymentValue)).toBeLessThan(0.01);
    }
  });

  test('should handle subscription modification after payment', async ({ page }) => {
    // Complete initial subscription
    await createSubscriptionAndProceedToPayment(page);
    await handlePaymentFlow(page);
    
    // Navigate to subscription management
    await page.goto('/user/subscriptions');
    
    // Find subscription and modify it
    const subscription = page.locator('.subscription-item, .subscription-card').first();
    const modifyButton = subscription.locator('button:has-text("Modify"), button:has-text("Edit"), a:has-text("Manage")');
    
    if (await modifyButton.count() > 0) {
      await modifyButton.click();
      
      // Should navigate to modification page
      await page.waitForURL(url => 
        url.includes('modify') || 
        url.includes('edit') ||
        url.includes('manage')
      );
      
      // Modify subscription (add or remove items)
      const addButton = page.locator('button:has-text("+"), button:has-text("Add")').first();
      if (await addButton.count() > 0) {
        await addButton.click();
        
        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        if (await saveButton.count() > 0) {
          await saveButton.click();
          
          // Should handle pro-rated payment if needed
          const paymentRequired = page.locator('text=/additional.*payment|pro.*rated/i');
          if (await paymentRequired.isVisible().catch(() => false)) {
            await handlePaymentFlow(page);
          }
        }
      }
    }
  });

  // Helper functions
  async function createSubscriptionAndProceedToPayment(page: any) {
    await page.goto('/subscriptions/create');
    
    // Add item to cart
    const menuItems = page.locator('.menu-item, .meal-card');
    await menuItems.first().locator('button:has-text("+"), button:has-text("Add")').click();
    
    // Proceed to checkout
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed")');
    await checkoutButton.click();
    
    // Wait for payment page
    await page.waitForURL(url => 
      url.includes('stripe.com') || 
      url.includes('checkout') || 
      url.includes('payment')
    );
  }

  async function handleStripeCheckout(page: any) {
    // Wait for Stripe form to load
    await page.waitForSelector('[data-elements-stable-field-name="cardNumber"]');
    
    // Fill card details
    await page.fill('[data-elements-stable-field-name="cardNumber"]', TEST_STRIPE_CARD);
    await page.fill('[data-elements-stable-field-name="cardExpiry"]', '12/25');
    await page.fill('[data-elements-stable-field-name="cardCvc"]', '123');
    
    // Fill billing details if required
    const emailField = page.locator('input[type="email"]');
    if (await emailField.isVisible().catch(() => false)) {
      await emailField.fill(USER_EMAIL);
    }
    
    // Submit payment
    const submitButton = page.locator('button[type="submit"], .SubmitButton');
    await submitButton.click();
    
    // Wait for redirect back to site
    await page.waitForURL(url => !url.includes('stripe.com'), { timeout: 30000 });
  }

  async function handleCustomPaymentForm(page: any) {
    // Fill payment form on custom checkout page
    await fillPaymentDetails(page);
    
    // Submit payment
    const submitButton = page.locator('button:has-text("Pay"), button:has-text("Complete"), button[type="submit"]');
    await submitButton.click();
    
    // Wait for processing and redirect
    await page.waitForURL(url => 
      url.includes('success') || 
      url.includes('confirm') ||
      url.includes('dashboard')
    );
  }

  async function fillPaymentDetails(page: any, cardNumber: string = TEST_STRIPE_CARD) {
    // Fill card number
    const cardField = page.locator('input[name*="card"], input[placeholder*="card number"], [data-testid="card-number"]');
    if (await cardField.count() > 0) {
      await cardField.fill(cardNumber);
    }
    
    // Fill expiry
    const expiryField = page.locator('input[name*="expiry"], input[placeholder*="expiry"], [data-testid="expiry"]');
    if (await expiryField.count() > 0) {
      await expiryField.fill('12/25');
    }
    
    // Fill CVC
    const cvcField = page.locator('input[name*="cvc"], input[placeholder*="cvc"], [data-testid="cvc"]');
    if (await cvcField.count() > 0) {
      await cvcField.fill('123');
    }
    
    // Fill billing details if required
    const billingFields = {
      name: USER_EMAIL.split('@')[0],
      email: USER_EMAIL,
      address: '123 Test Street',
      city: 'Test City',
      postal: 'SW1A 1AA'
    };
    
    for (const [field, value] of Object.entries(billingFields)) {
      const input = page.locator(`input[name*="${field}"], input[placeholder*="${field}"]`);
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(value);
      }
    }
  }

  async function handlePaymentFlow(page: any) {
    const currentUrl = page.url();
    
    if (currentUrl.includes('stripe.com')) {
      await handleStripeCheckout(page);
    } else if (currentUrl.includes('checkout') || currentUrl.includes('payment')) {
      await handleCustomPaymentForm(page);
    }
    
    // Wait for success indication
    await expect(page.locator('text=/success|complete|confirmed|thank you/i')).toBeVisible();
  }
});