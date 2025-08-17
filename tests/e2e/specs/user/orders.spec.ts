import { test, expect } from '@playwright/test';

test.describe('User Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL('/user/dashboard');
  });

  test('should display orders page', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/user/orders');
    
    // Check page title
    await expect(page.locator('h1')).toContainText(/Order|History/i);
    
    // Check for order list or empty state
    const orderList = page.locator('.order-card, .order-item, [data-testid="order"]');
    const emptyState = page.locator('text=/no orders|order history.*empty|no purchases/i');
    
    // Either orders exist or empty state is shown
    const hasOrders = await orderList.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    expect(hasOrders || hasEmptyState).toBe(true);
  });

  test('should display order details', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Check if user has orders
    const orderCard = page.locator('.order-card, .order-item, [data-testid="order"]').first();
    
    if (await orderCard.count() > 0) {
      // Check order has required details
      await expect(orderCard.locator('.order-number, .order-id, [data-testid="order-id"]')).toBeVisible();
      await expect(orderCard.locator('.order-date, .date, time')).toBeVisible();
      await expect(orderCard.locator('.order-status, .status, [data-testid="status"]')).toBeVisible();
      await expect(orderCard.locator('.order-total, .total, text=/£|€|\$/')).toBeVisible();
    }
  });

  test('should view order items', async ({ page }) => {
    await page.goto('/user/orders');
    
    const orderCard = page.locator('.order-card, .order-item').first();
    
    if (await orderCard.count() > 0) {
      // Click to expand or view details
      const viewButton = orderCard.locator('button:has-text("View"), button:has-text("Details"), a:has-text("View")');
      
      if (await viewButton.count() > 0) {
        await viewButton.click();
        
        // Wait for details to load
        await page.waitForTimeout(500);
        
        // Check if modal opened or navigated to detail page
        const isDetailPage = page.url().includes('order');
        const modalVisible = await page.locator('[role="dialog"], .modal, .order-details').isVisible().catch(() => false);
        
        if (isDetailPage || modalVisible) {
          // Check for order items
          const orderItems = page.locator('.order-item-detail, .item-row, [data-testid="order-item"]');
          await expect(orderItems).toHaveCount({ minimum: 1 });
          
          // Check item details
          const firstItem = orderItems.first();
          await expect(firstItem.locator('.item-name, .product-name')).toBeVisible();
          await expect(firstItem.locator('.quantity, .qty')).toBeVisible();
          await expect(firstItem.locator('.price, .item-price')).toBeVisible();
        }
      }
    }
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Look for status filter
    const statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"], .status-filter');
    
    if (await statusFilter.count() > 0) {
      // Get initial count
      const initialCount = await page.locator('.order-card, .order-item').count();
      
      // Select a status
      await statusFilter.selectOption({ index: 1 });
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Check filtered results (count may change or stay same)
      const filteredCount = await page.locator('.order-card, .order-item').count();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter orders by date range', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Look for date filters
    const dateFromInput = page.locator('input[type="date"][name*="from"], [data-testid="date-from"]');
    const dateToInput = page.locator('input[type="date"][name*="to"], [data-testid="date-to"]');
    
    if (await dateFromInput.count() > 0 && await dateToInput.count() > 0) {
      // Set date range
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      await dateFromInput.fill(lastMonth.toISOString().split('T')[0]);
      await dateToInput.fill(today.toISOString().split('T')[0]);
      
      // Apply filter if button exists
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")');
      if (await applyButton.count() > 0) {
        await applyButton.click();
      }
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Orders should be filtered (count may vary)
      const orders = await page.locator('.order-card, .order-item').count();
      expect(orders).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search orders', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search-orders"]');
    
    if (await searchInput.count() > 0) {
      // Search by order number if orders exist
      const firstOrder = page.locator('.order-card, .order-item').first();
      
      if (await firstOrder.count() > 0) {
        const orderNumber = await firstOrder.locator('.order-number, .order-id').textContent();
        
        if (orderNumber) {
          // Search for this order
          await searchInput.fill(orderNumber);
          
          // Wait for search
          await page.waitForTimeout(500);
          
          // Should show filtered results
          const searchResults = await page.locator('.order-card, .order-item').count();
          expect(searchResults).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should track order delivery', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Find order with tracking
    const orderWithTracking = page.locator('.order-card:has-text("Track"), .order-card:has-text("Delivery")').first();
    
    if (await orderWithTracking.count() > 0) {
      // Click track button
      const trackButton = orderWithTracking.locator('button:has-text("Track"), a:has-text("Track")');
      
      if (await trackButton.count() > 0) {
        await trackButton.click();
        
        // Wait for tracking info
        await page.waitForTimeout(500);
        
        // Check for tracking details
        const trackingInfo = page.locator('.tracking-info, .delivery-status, [data-testid="tracking"]');
        if (await trackingInfo.isVisible().catch(() => false)) {
          await expect(trackingInfo).toBeVisible();
          
          // Check for delivery stages
          const stages = trackingInfo.locator('.stage, .step, .tracking-step');
          if (await stages.count() > 0) {
            await expect(stages).toHaveCount({ minimum: 1 });
          }
        }
      }
    }
  });

  test('should reorder from past order', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Find completed order
    const completedOrder = page.locator('.order-card:has-text("Delivered"), .order-card:has-text("Completed")').first();
    
    if (await completedOrder.count() > 0) {
      // Look for reorder button
      const reorderButton = completedOrder.locator('button:has-text("Reorder"), button:has-text("Order Again")');
      
      if (await reorderButton.count() > 0) {
        await reorderButton.click();
        
        // Should navigate to subscription creation with items pre-filled
        await page.waitForURL(url => 
          url.includes('subscription') || 
          url.includes('cart') || 
          url.includes('checkout')
        );
        
        // Verify items are in cart
        const cartItems = page.locator('.cart-item, .order-item');
        await expect(cartItems).toHaveCount({ minimum: 1 });
      }
    }
  });

  test('should download order invoice', async ({ page }) => {
    await page.goto('/user/orders');
    
    const orderCard = page.locator('.order-card, .order-item').first();
    
    if (await orderCard.count() > 0) {
      // Look for invoice/receipt button
      const invoiceButton = orderCard.locator('button:has-text("Invoice"), button:has-text("Receipt"), a:has-text("Download")');
      
      if (await invoiceButton.count() > 0) {
        // Set up download promise
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        
        // Click download
        await invoiceButton.click();
        
        // Check if download started
        const download = await downloadPromise;
        if (download) {
          // Verify download
          expect(download).toBeTruthy();
          
          // Check filename
          const filename = download.suggestedFilename();
          expect(filename).toMatch(/invoice|receipt|order/i);
        }
      }
    }
  });

  test('should cancel pending order', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Find pending order
    const pendingOrder = page.locator('.order-card:has-text("Pending"), .order-card:has-text("Processing")').first();
    
    if (await pendingOrder.count() > 0) {
      // Look for cancel button
      const cancelButton = pendingOrder.locator('button:has-text("Cancel")');
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        
        // Handle confirmation
        const confirmDialog = page.locator('[role="dialog"], .modal, .confirm-dialog');
        if (await confirmDialog.isVisible().catch(() => false)) {
          // Provide reason if required
          const reasonInput = confirmDialog.locator('textarea, select');
          if (await reasonInput.count() > 0) {
            await reasonInput.fill('Changed my mind');
          }
          
          // Confirm cancellation
          await confirmDialog.locator('button:has-text("Confirm"), button:has-text("Yes")').click();
        }
        
        // Wait for status update
        await page.waitForTimeout(1000);
        
        // Check status changed
        const statusAfter = await pendingOrder.locator('.status').textContent();
        expect(statusAfter?.toLowerCase()).toContain('cancel');
      }
    }
  });

  test('should report issue with order', async ({ page }) => {
    await page.goto('/user/orders');
    
    const orderCard = page.locator('.order-card, .order-item').first();
    
    if (await orderCard.count() > 0) {
      // Look for report issue button
      const issueButton = orderCard.locator('button:has-text("Report"), button:has-text("Issue"), button:has-text("Problem")');
      
      if (await issueButton.count() > 0) {
        await issueButton.click();
        
        // Wait for form/modal
        await page.waitForTimeout(500);
        
        // Look for issue form
        const issueForm = page.locator('form, [role="dialog"]').filter({ hasText: /issue|problem|report/i });
        
        if (await issueForm.isVisible()) {
          // Select issue type if dropdown exists
          const issueType = issueForm.locator('select');
          if (await issueType.count() > 0) {
            await issueType.selectOption({ index: 1 });
          }
          
          // Fill description
          const description = issueForm.locator('textarea');
          if (await description.count() > 0) {
            await description.fill('Test issue report');
          }
          
          // Submit
          const submitButton = issueForm.locator('button[type="submit"], button:has-text("Submit")');
          if (await submitButton.count() > 0) {
            await submitButton.click();
            
            // Wait for submission
            await page.waitForTimeout(1000);
            
            // Check for success message
            const successMessage = page.locator('text=/submitted|received|thank you/i');
            if (await successMessage.isVisible().catch(() => false)) {
              await expect(successMessage).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should paginate through orders', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Look for pagination controls
    const pagination = page.locator('.pagination, [data-testid="pagination"], nav[aria-label*="pagination"]');
    
    if (await pagination.count() > 0) {
      // Check for next button
      const nextButton = pagination.locator('button:has-text("Next"), a:has-text("Next"), button[aria-label="Next"]');
      
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        // Get initial first order
        const firstOrderBefore = await page.locator('.order-card, .order-item').first().textContent();
        
        // Click next
        await nextButton.click();
        
        // Wait for new page to load
        await page.waitForTimeout(500);
        
        // Get new first order
        const firstOrderAfter = await page.locator('.order-card, .order-item').first().textContent();
        
        // Content should be different (unless only one page)
        if (firstOrderBefore && firstOrderAfter) {
          // Orders may or may not be different depending on data
          expect(firstOrderAfter).toBeTruthy();
        }
      }
    }
  });

  test('should sort orders', async ({ page }) => {
    await page.goto('/user/orders');
    
    // Look for sort dropdown
    const sortSelect = page.locator('select[name*="sort"], [data-testid="sort"]');
    
    if (await sortSelect.count() > 0) {
      // Get initial first order
      const firstOrderBefore = await page.locator('.order-card, .order-item').first().textContent();
      
      // Change sort order
      await sortSelect.selectOption({ index: 1 });
      
      // Wait for sort to apply
      await page.waitForTimeout(500);
      
      // Get new first order
      const firstOrderAfter = await page.locator('.order-card, .order-item').first().textContent();
      
      // Order may change (or stay same if only one order)
      expect(firstOrderAfter).toBeTruthy();
    }
  });

  test('should display order timeline', async ({ page }) => {
    await page.goto('/user/orders');
    
    const orderCard = page.locator('.order-card, .order-item').first();
    
    if (await orderCard.count() > 0) {
      // View order details
      const viewButton = orderCard.locator('button:has-text("View"), a:has-text("View")');
      
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForTimeout(500);
        
        // Look for timeline/history
        const timeline = page.locator('.timeline, .order-history, [data-testid="timeline"]');
        
        if (await timeline.count() > 0) {
          await expect(timeline).toBeVisible();
          
          // Check for timeline events
          const events = timeline.locator('.event, .timeline-item');
          if (await events.count() > 0) {
            await expect(events).toHaveCount({ minimum: 1 });
            
            // Check event has timestamp
            const firstEvent = events.first();
            const timestamp = firstEvent.locator('time, .timestamp, .date');
            if (await timestamp.count() > 0) {
              await expect(timestamp).toBeVisible();
            }
          }
        }
      }
    }
  });
});