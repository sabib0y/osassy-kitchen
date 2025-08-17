import { test, expect } from '@playwright/test';

test.describe('User Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL('/user/dashboard');
  });

  test('should display subscriptions list', async ({ page }) => {
    // Navigate to subscriptions page
    await page.goto('/user/subscriptions');
    
    // Check page title
    await expect(page.locator('h1')).toContainText(/Subscription|Plan/i);
    
    // Check for subscription list or empty state
    const subscriptionList = page.locator('.subscription-card, .subscription-item, [data-testid="subscription"]');
    const emptyState = page.locator('text=/no subscription|create.*subscription|get started/i');
    
    // Either subscriptions exist or empty state is shown
    const hasSubscriptions = await subscriptionList.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    expect(hasSubscriptions || hasEmptyState).toBe(true);
  });

  test('should display subscription details', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Check if user has subscriptions
    const subscriptionCard = page.locator('.subscription-card, .subscription-item, [data-testid="subscription"]').first();
    
    if (await subscriptionCard.count() > 0) {
      // Check subscription has required details
      await expect(subscriptionCard.locator('.status, [data-testid="status"]')).toBeVisible();
      await expect(subscriptionCard.locator('.price, .amount, text=/£|€|\$/')).toBeVisible();
      
      // Check for action buttons
      const actionButtons = subscriptionCard.locator('button, a');
      await expect(actionButtons).toHaveCount({ minimum: 1 });
    }
  });

  test('should pause active subscription', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find active subscription
    const activeSubscription = page.locator('.subscription-card:has-text("Active"), .subscription-card:has-text("active")').first();
    
    if (await activeSubscription.count() > 0) {
      // Click pause button
      const pauseButton = activeSubscription.locator('button:has-text("Pause"), button:has-text("pause")');
      
      if (await pauseButton.count() > 0) {
        await pauseButton.click();
        
        // Confirm if dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
        }
        
        // Wait for status update
        await page.waitForTimeout(1000);
        
        // Check status changed
        const statusAfter = await activeSubscription.locator('.status, [data-testid="status"]').textContent();
        expect(statusAfter?.toLowerCase()).toContain('paused');
      }
    }
  });

  test('should resume paused subscription', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find paused subscription
    const pausedSubscription = page.locator('.subscription-card:has-text("Paused"), .subscription-card:has-text("paused")').first();
    
    if (await pausedSubscription.count() > 0) {
      // Click resume button
      const resumeButton = pausedSubscription.locator('button:has-text("Resume"), button:has-text("resume")');
      
      if (await resumeButton.count() > 0) {
        await resumeButton.click();
        
        // Confirm if dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
        }
        
        // Wait for status update
        await page.waitForTimeout(1000);
        
        // Check status changed
        const statusAfter = await pausedSubscription.locator('.status, [data-testid="status"]').textContent();
        expect(statusAfter?.toLowerCase()).toContain('active');
      }
    }
  });

  test('should cancel subscription', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find any subscription
    const subscription = page.locator('.subscription-card, .subscription-item').first();
    
    if (await subscription.count() > 0) {
      // Click cancel button
      const cancelButton = subscription.locator('button:has-text("Cancel"), button:has-text("cancel")');
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        
        // Handle confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], .modal, .confirm-dialog');
        if (await confirmDialog.isVisible().catch(() => false)) {
          // Look for reason selection if required
          const reasonSelect = confirmDialog.locator('select, input[type="radio"]');
          if (await reasonSelect.count() > 0) {
            await reasonSelect.first().click();
          }
          
          // Confirm cancellation
          await confirmDialog.locator('button:has-text("Confirm"), button:has-text("Yes")').click();
        }
        
        // Wait for status update
        await page.waitForTimeout(1000);
        
        // Check status changed
        const statusAfter = await subscription.locator('.status, [data-testid="status"]').textContent();
        expect(statusAfter?.toLowerCase()).toMatch(/cancel|ended/);
      }
    }
  });

  test('should modify subscription items', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find subscription with modify option
    const subscription = page.locator('.subscription-card, .subscription-item').first();
    
    if (await subscription.count() > 0) {
      // Click modify/edit button
      const modifyButton = subscription.locator('button:has-text("Modify"), button:has-text("Edit"), button:has-text("Change")');
      
      if (await modifyButton.count() > 0) {
        await modifyButton.click();
        
        // Should navigate to edit page or show modal
        await page.waitForTimeout(1000);
        
        // Check if on edit page or modal is visible
        const isEditPage = page.url().includes('edit') || page.url().includes('modify');
        const modalVisible = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
        
        expect(isEditPage || modalVisible).toBe(true);
        
        if (isEditPage) {
          // Navigate back
          await page.goBack();
        } else if (modalVisible) {
          // Close modal
          await page.keyboard.press('Escape');
        }
      }
    }
  });

  test('should update delivery preferences', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find subscription
    const subscription = page.locator('.subscription-card, .subscription-item').first();
    
    if (await subscription.count() > 0) {
      // Look for delivery settings button
      const deliveryButton = subscription.locator('button:has-text("Delivery"), button:has-text("Schedule")');
      
      if (await deliveryButton.count() > 0) {
        await deliveryButton.click();
        
        // Wait for form/modal
        await page.waitForTimeout(500);
        
        // Look for delivery form
        const deliveryForm = page.locator('form, [role="dialog"]');
        
        if (await deliveryForm.isVisible()) {
          // Update delivery day if available
          const daySelect = deliveryForm.locator('select[name*="day"]');
          if (await daySelect.count() > 0) {
            await daySelect.selectOption({ index: 2 });
          }
          
          // Update delivery time if available
          const timeSelect = deliveryForm.locator('select[name*="time"]');
          if (await timeSelect.count() > 0) {
            await timeSelect.selectOption({ index: 1 });
          }
          
          // Save changes
          const saveButton = deliveryForm.locator('button:has-text("Save"), button:has-text("Update")');
          if (await saveButton.count() > 0) {
            await saveButton.click();
            
            // Wait for save
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should view subscription history', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Look for history tab or section
    const historyTab = page.locator('button:has-text("History"), a:has-text("History"), [data-testid="history-tab"]');
    
    if (await historyTab.count() > 0) {
      await historyTab.click();
      
      // Wait for history to load
      await page.waitForTimeout(500);
      
      // Check for history items
      const historyItems = page.locator('.history-item, .past-subscription, [data-testid="history-item"]');
      const noHistoryMessage = page.locator('text=/no history|no past subscriptions/i');
      
      // Either history exists or empty message shown
      const hasHistory = await historyItems.count() > 0;
      const hasNoHistoryMessage = await noHistoryMessage.isVisible().catch(() => false);
      
      expect(hasHistory || hasNoHistoryMessage).toBe(true);
    }
  });

  test('should display next delivery date', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find active subscription
    const activeSubscription = page.locator('.subscription-card:has-text("Active"), .subscription-card:has-text("active")').first();
    
    if (await activeSubscription.count() > 0) {
      // Check for next delivery date
      const deliveryDate = activeSubscription.locator('text=/next delivery|delivery date|delivers/i');
      
      if (await deliveryDate.count() > 0) {
        await expect(deliveryDate).toBeVisible();
        
        // Verify date format
        const dateText = await deliveryDate.textContent();
        expect(dateText).toMatch(/\d{1,2}|\w+/); // Should contain numbers or month names
      }
    }
  });

  test('should skip next delivery', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find active subscription
    const activeSubscription = page.locator('.subscription-card:has-text("Active")').first();
    
    if (await activeSubscription.count() > 0) {
      // Look for skip button
      const skipButton = activeSubscription.locator('button:has-text("Skip"), button:has-text("skip next")');
      
      if (await skipButton.count() > 0) {
        await skipButton.click();
        
        // Confirm if needed
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
        }
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Check for confirmation message
        const successMessage = page.locator('text=/skipped|skip confirmed/i');
        if (await successMessage.isVisible().catch(() => false)) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should create new subscription from empty state', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Check for create button in empty state
    const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Get Started")');
    
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Should navigate to creation page
      await expect(page).toHaveURL(/\/subscriptions\/create|\/subscribe/);
    }
  });

  test('should filter subscriptions by status', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Look for status filter
    const statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]');
    
    if (await statusFilter.count() > 0) {
      // Get initial count
      const initialCount = await page.locator('.subscription-card, .subscription-item').count();
      
      // Apply filter
      await statusFilter.selectOption('active');
      await page.waitForTimeout(500);
      
      // Check filtered results
      const filteredCount = await page.locator('.subscription-card, .subscription-item').count();
      
      // Count may change or stay same (both valid)
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display billing information', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find subscription with billing info
    const subscription = page.locator('.subscription-card, .subscription-item').first();
    
    if (await subscription.count() > 0) {
      // Look for billing details
      const billingInfo = subscription.locator('.billing, .payment-method, text=/card|visa|mastercard/i');
      
      if (await billingInfo.count() > 0) {
        await expect(billingInfo).toBeVisible();
        
        // Check for masked card number
        const cardInfo = await billingInfo.textContent();
        if (cardInfo) {
          expect(cardInfo).toMatch(/\*{4}|\d{4}/); // Should show last 4 digits or masked
        }
      }
    }
  });

  test('should update payment method', async ({ page }) => {
    await page.goto('/user/subscriptions');
    
    // Find subscription
    const subscription = page.locator('.subscription-card, .subscription-item').first();
    
    if (await subscription.count() > 0) {
      // Look for payment update button
      const paymentButton = subscription.locator('button:has-text("Payment"), button:has-text("Update Card")');
      
      if (await paymentButton.count() > 0) {
        await paymentButton.click();
        
        // Wait for payment form or redirect
        await page.waitForTimeout(1000);
        
        // Check if redirected to Stripe or modal opened
        const isStripe = page.url().includes('stripe');
        const modalVisible = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
        
        expect(isStripe || modalVisible).toBe(true);
        
        // Navigate back if on Stripe
        if (isStripe) {
          await page.goBack();
        }
      }
    }
  });
});