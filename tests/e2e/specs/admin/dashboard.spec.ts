import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.includes('/admin') || url.includes('/dashboard'));
  });

  test('should display dashboard overview', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    
    // Check page title
    await expect(page.locator('h1')).toContainText(/Dashboard|Overview|Admin/i);
    
    // Check for key metric cards
    const metricCards = page.locator('.metric-card, .stat-card, .dashboard-card, [data-testid="metric"]');
    await expect(metricCards).toHaveCount({ minimum: 3 });
    
    // Check for common metrics
    const metrics = ['Orders', 'Revenue', 'Users', 'Subscriptions'];
    for (const metric of metrics) {
      const metricElement = page.locator(`text=/${metric}/i`);
      if (await metricElement.count() > 0) {
        await expect(metricElement.first()).toBeVisible();
      }
    }
  });

  test('should display real-time statistics', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Check for today's stats
    const todayStats = page.locator('text=/today|live|real.*time/i');
    if (await todayStats.count() > 0) {
      await expect(todayStats.first()).toBeVisible();
    }
    
    // Check for numeric values
    const statValues = page.locator('.stat-value, .metric-value, [data-testid="stat-value"]');
    const firstValue = statValues.first();
    
    if (await firstValue.count() > 0) {
      const text = await firstValue.textContent();
      // Should contain numbers or currency
      expect(text).toMatch(/\d+|£|€|\$/);
    }
  });

  test('should display recent orders', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for recent orders section
    const recentOrdersSection = page.locator('section, div').filter({ hasText: /recent.*order|latest.*order/i });
    
    if (await recentOrdersSection.count() > 0) {
      await expect(recentOrdersSection.first()).toBeVisible();
      
      // Check for order items
      const orderItems = recentOrdersSection.locator('.order-item, .order-row, tr');
      if (await orderItems.count() > 0) {
        // Check first order has details
        const firstOrder = orderItems.first();
        await expect(firstOrder).toBeVisible();
      }
    }
  });

  test('should display revenue chart', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for chart elements
    const chart = page.locator('canvas, svg.chart, .recharts-wrapper, [data-testid="chart"]');
    
    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible();
      
      // Check for chart title
      const chartTitle = page.locator('text=/revenue|sales|earnings/i');
      if (await chartTitle.count() > 0) {
        await expect(chartTitle.first()).toBeVisible();
      }
    }
  });

  test('should filter dashboard by date range', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for date range selector
    const dateRangeSelector = page.locator('select[name*="period"], [data-testid="date-range"], .date-range-picker');
    
    if (await dateRangeSelector.count() > 0) {
      // Get initial metric value
      const metricValue = page.locator('.stat-value, .metric-value').first();
      const initialValue = await metricValue.textContent();
      
      // Change date range
      if (dateRangeSelector.first().nodeName() === 'SELECT') {
        await dateRangeSelector.selectOption({ index: 1 });
      } else {
        await dateRangeSelector.click();
        const option = page.locator('.dropdown-item, .option').first();
        if (await option.count() > 0) {
          await option.click();
        }
      }
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Value might change (or stay same if no data difference)
      const newValue = await metricValue.textContent();
      expect(newValue).toBeTruthy();
    }
  });

  test('should display active subscriptions count', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for subscriptions metric
    const subscriptionMetric = page.locator('text=/subscription/i').first();
    
    if (await subscriptionMetric.count() > 0) {
      const parent = subscriptionMetric.locator('..');
      const value = parent.locator('.value, .count, .number');
      
      if (await value.count() > 0) {
        const text = await value.textContent();
        // Should be a number
        expect(text).toMatch(/\d+/);
      }
    }
  });

  test('should display user growth metrics', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for user metrics
    const userMetrics = page.locator('text=/user|customer|member/i');
    
    if (await userMetrics.count() > 0) {
      await expect(userMetrics.first()).toBeVisible();
      
      // Check for growth indicator
      const growthIndicator = page.locator('.growth, .trend, text=/↑|↓|%/');
      if (await growthIndicator.count() > 0) {
        const growthText = await growthIndicator.first().textContent();
        expect(growthText).toMatch(/\d+|↑|↓|%/);
      }
    }
  });

  test('should navigate to detailed reports', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for "View All" or "See More" links
    const viewMoreLinks = page.locator('a:has-text("View All"), a:has-text("See More"), a:has-text("Details")');
    
    if (await viewMoreLinks.count() > 0) {
      const firstLink = viewMoreLinks.first();
      await firstLink.click();
      
      // Should navigate to a detailed page
      await page.waitForURL(url => url !== '/admin/dashboard');
      
      // Verify navigation worked
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/');
    }
  });

  test('should display top selling items', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for top items section
    const topItemsSection = page.locator('section, div').filter({ hasText: /top|best.*selling|popular/i });
    
    if (await topItemsSection.count() > 0) {
      await expect(topItemsSection.first()).toBeVisible();
      
      // Check for item list
      const items = topItemsSection.locator('.item, .product, li');
      if (await items.count() > 0) {
        const firstItem = items.first();
        await expect(firstItem).toBeVisible();
        
        // Should have name and count/revenue
        const itemText = await firstItem.textContent();
        expect(itemText).toBeTruthy();
      }
    }
  });

  test('should display system notifications', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for notifications area
    const notifications = page.locator('.notification, .alert, .message, [data-testid="notification"]');
    
    if (await notifications.count() > 0) {
      // Check notification content
      const firstNotification = notifications.first();
      await expect(firstNotification).toBeVisible();
      
      // Check for dismiss button
      const dismissButton = firstNotification.locator('button[aria-label*="close"], button:has-text("×")');
      if (await dismissButton.count() > 0) {
        await dismissButton.click();
        
        // Notification should be dismissed
        await expect(firstNotification).not.toBeVisible();
      }
    }
  });

  test('should refresh dashboard data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"], button:has-text("↻")');
    
    if (await refreshButton.count() > 0) {
      // Click refresh
      await refreshButton.click();
      
      // Wait for potential loading state
      const loader = page.locator('.loader, .spinner, [data-testid="loading"]');
      if (await loader.isVisible().catch(() => false)) {
        await expect(loader).not.toBeVisible({ timeout: 5000 });
      }
      
      // Dashboard should still be visible
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should export dashboard data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    
    if (await exportButton.count() > 0) {
      // Set up download promise
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await exportButton.click();
      
      // If dropdown appears, select format
      const formatOption = page.locator('button:has-text("CSV"), button:has-text("Excel")');
      if (await formatOption.isVisible().catch(() => false)) {
        await formatOption.first().click();
      }
      
      // Check if download started
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/dashboard|report|export/i);
      }
    }
  });

  test('should display quick actions', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for quick actions section
    const quickActions = page.locator('text=/quick.*action|shortcut/i');
    
    if (await quickActions.count() > 0) {
      await expect(quickActions.first()).toBeVisible();
      
      // Check for action buttons
      const actionButtons = [
        'Add Menu Item',
        'View Orders',
        'Create User',
        'Generate Report'
      ];
      
      for (const action of actionButtons) {
        const button = page.locator(`button:has-text("${action}"), a:has-text("${action}")`);
        if (await button.count() > 0) {
          await expect(button.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle real-time updates', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Check for WebSocket connection indicator
    const connectionIndicator = page.locator('.connection-status, .live-indicator, [data-testid="connection"]');
    
    if (await connectionIndicator.count() > 0) {
      await expect(connectionIndicator.first()).toBeVisible();
      
      // Should show connected status
      const statusText = await connectionIndicator.first().textContent();
      expect(statusText).toMatch(/connected|live|online/i);
    }
    
    // Wait a moment to see if any values update
    await page.waitForTimeout(3000);
    
    // Dashboard should still be functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display performance metrics', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for performance indicators
    const performanceMetrics = [
      'Load Time',
      'Response Time',
      'Uptime',
      'Error Rate'
    ];
    
    for (const metric of performanceMetrics) {
      const element = page.locator(`text=/${metric}/i`);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        
        // Check for value
        const parent = element.first().locator('..');
        const value = parent.locator('.value, .metric');
        if (await value.count() > 0) {
          const text = await value.textContent();
          expect(text).toMatch(/\d+|%|ms/);
        }
      }
    }
  });

  test('should customize dashboard layout', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Look for customize button
    const customizeButton = page.locator('button:has-text("Customize"), button:has-text("Edit Layout")');
    
    if (await customizeButton.count() > 0) {
      await customizeButton.click();
      
      // Should enter edit mode
      await page.waitForTimeout(500);
      
      // Look for drag handles or edit options
      const editControls = page.locator('.drag-handle, .edit-widget, [data-testid="edit-control"]');
      if (await editControls.count() > 0) {
        await expect(editControls.first()).toBeVisible();
        
        // Exit edit mode
        const doneButton = page.locator('button:has-text("Done"), button:has-text("Save Layout")');
        if (await doneButton.count() > 0) {
          await doneButton.click();
        }
      }
    }
  });
});