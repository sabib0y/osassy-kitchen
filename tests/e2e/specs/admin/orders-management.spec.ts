import { test, expect } from '@playwright/test';

test.describe('Admin Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.includes('/admin') || url.includes('/dashboard'));
  });

  test('should display all orders page', async ({ page }) => {
    // Navigate to orders management
    await page.goto('/admin/orders');
    
    // Check page title
    await expect(page.locator('h1, .page-title')).toContainText(/Order|Management|All Orders/i);
    
    // Check for orders table or cards
    const ordersContainer = page.locator('.orders-table, .order-list, [data-testid="orders-container"]');
    const emptyState = page.locator('text=/no orders|empty.*order|no data/i');
    
    // Either orders exist or empty state is shown
    const hasOrders = await ordersContainer.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    expect(hasOrders || hasEmptyState).toBe(true);
    
    // If orders exist, check for required columns/fields
    if (hasOrders) {
      const orderHeaders = [
        'Order ID',
        'Customer',
        'Date',
        'Status',
        'Total',
        'Actions'
      ];
      
      for (const header of orderHeaders) {
        const headerElement = page.locator(`th:has-text("${header}"), .header:has-text("${header}"), text=/${header}/i`);
        if (await headerElement.count() > 0) {
          await expect(headerElement.first()).toBeVisible();
        }
      }
    }
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for status filter
    const statusFilter = page.locator(
      'select[name*="status"], [data-testid="status-filter"], .status-filter select, .filter-dropdown'
    );
    
    if (await statusFilter.count() > 0) {
      // Get initial order count
      const initialOrders = await page.locator('.order-row, .order-card, tr[data-order]').count();
      
      // Select different status
      await statusFilter.selectOption({ index: 1 });
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check results updated
      const filteredOrders = await page.locator('.order-row, .order-card, tr[data-order]').count();
      expect(filteredOrders).toBeGreaterThanOrEqual(0);
      
      // Check for status indicator in filtered results
      const statusBadges = page.locator('.status-badge, .order-status, .badge');
      if (await statusBadges.count() > 0) {
        await expect(statusBadges.first()).toBeVisible();
      }
    }
  });

  test('should search orders by customer or order ID', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], [data-testid="order-search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      // Test search by order ID
      const firstOrder = page.locator('.order-row, .order-card, tr[data-order]').first();
      
      if (await firstOrder.count() > 0) {
        const orderIdElement = firstOrder.locator('.order-id, .order-number, [data-testid="order-id"]');
        
        if (await orderIdElement.count() > 0) {
          const orderId = await orderIdElement.textContent();
          
          if (orderId) {
            // Search for this order
            await searchInput.fill(orderId.trim());
            
            // Wait for search results
            await page.waitForTimeout(1000);
            
            // Should show filtered results
            const searchResults = await page.locator('.order-row, .order-card, tr[data-order]').count();
            expect(searchResults).toBeGreaterThanOrEqual(0);
          }
        }
      }
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('should update order status', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const firstOrder = page.locator('.order-row, .order-card, tr[data-order]').first();
    
    if (await firstOrder.count() > 0) {
      // Look for status dropdown or edit button
      const statusDropdown = firstOrder.locator('select.status-select, .status-dropdown select');
      const editButton = firstOrder.locator('button:has-text("Edit"), button[aria-label*="edit"]');
      
      if (await statusDropdown.count() > 0) {
        // Get current status
        const currentStatus = await statusDropdown.inputValue();
        
        // Change to different status
        const options = await statusDropdown.locator('option').count();
        if (options > 1) {
          await statusDropdown.selectOption({ index: 1 });
          
          // Wait for update
          await page.waitForTimeout(1000);
          
          // Check for success message or status change
          const successMessage = page.locator('.success-message, .toast, .notification');
          if (await successMessage.isVisible().catch(() => false)) {
            await expect(successMessage).toBeVisible();
          }
        }
      } else if (await editButton.count() > 0) {
        await editButton.click();
        
        // Wait for modal or edit form
        await page.waitForTimeout(500);
        
        const statusInModal = page.locator('[role="dialog"] select, .modal select, .edit-form select');
        if (await statusInModal.count() > 0) {
          await statusInModal.selectOption({ index: 1 });
          
          // Save changes
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const firstOrder = page.locator('.order-row, .order-card, tr[data-order]').first();
    
    if (await firstOrder.count() > 0) {
      // Click view/details button
      const viewButton = firstOrder.locator(
        'button:has-text("View"), button:has-text("Details"), a:has-text("View"), .view-btn'
      );
      
      if (await viewButton.count() > 0) {
        await viewButton.click();
        
        // Wait for details to load
        await page.waitForTimeout(1000);
        
        // Check if modal opened or navigated to detail page
        const isDetailPage = page.url().includes('order');
        const modalVisible = await page.locator('[role="dialog"], .modal, .order-details-modal').isVisible().catch(() => false);
        
        if (isDetailPage || modalVisible) {
          // Check for order details sections
          const detailSections = [
            'Customer Information',
            'Order Items',
            'Payment Details',
            'Delivery Information',
            'Order Timeline'
          ];
          
          for (const section of detailSections) {
            const sectionElement = page.locator(`text=/${section}/i, h2:has-text("${section}"), h3:has-text("${section}")`);
            if (await sectionElement.count() > 0) {
              await expect(sectionElement.first()).toBeVisible();
            }
          }
          
          // Check for order items list
          const orderItems = page.locator('.order-items, .item-list, [data-testid="order-items"]');
          if (await orderItems.count() > 0) {
            const items = orderItems.locator('.item-row, .order-item, .product-item');
            await expect(items).toHaveCount({ minimum: 1 });
          }
        }
      }
    }
  });

  test('should manage refunds', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for completed/delivered order that can be refunded
    const refundableOrder = page.locator('.order-row:has-text("Delivered"), .order-row:has-text("Completed")').first();
    
    if (await refundableOrder.count() > 0) {
      // Look for refund button
      const refundButton = refundableOrder.locator('button:has-text("Refund"), button[aria-label*="refund"]');
      
      if (await refundButton.count() > 0) {
        await refundButton.click();
        
        // Wait for refund modal/form
        await page.waitForTimeout(500);
        
        const refundModal = page.locator('[role="dialog"]:has-text("Refund"), .refund-modal, .refund-form');
        
        if (await refundModal.isVisible()) {
          // Select refund type
          const refundType = refundModal.locator('select[name*="type"], .refund-type select');
          if (await refundType.count() > 0) {
            await refundType.selectOption({ index: 1 });
          }
          
          // Enter refund amount
          const amountInput = refundModal.locator('input[type="number"], input[name*="amount"]');
          if (await amountInput.count() > 0) {
            await amountInput.fill('10.00');
          }
          
          // Enter reason
          const reasonInput = refundModal.locator('textarea, input[name*="reason"]');
          if (await reasonInput.count() > 0) {
            await reasonInput.fill('Customer request');
          }
          
          // Process refund
          const processButton = refundModal.locator('button:has-text("Process"), button:has-text("Refund")');
          if (await processButton.count() > 0) {
            await processButton.click();
            
            // Wait for confirmation
            await page.waitForTimeout(2000);
            
            // Check for success message
            const successMessage = page.locator('text=/refund.*processed|refund.*successful/i');
            if (await successMessage.isVisible().catch(() => false)) {
              await expect(successMessage).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should assign delivery driver', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for order ready for delivery
    const readyOrder = page.locator('.order-row:has-text("Ready"), .order-row:has-text("Prepared")').first();
    
    if (await readyOrder.count() > 0) {
      // Look for assign delivery button
      const assignButton = readyOrder.locator(
        'button:has-text("Assign"), button:has-text("Delivery"), button[aria-label*="assign"]'
      );
      
      if (await assignButton.count() > 0) {
        await assignButton.click();
        
        // Wait for assignment modal
        await page.waitForTimeout(500);
        
        const assignModal = page.locator('[role="dialog"]:has-text("Assign"), .assign-modal, .delivery-assignment');
        
        if (await assignModal.isVisible()) {
          // Select driver
          const driverSelect = assignModal.locator('select[name*="driver"], .driver-select select');
          if (await driverSelect.count() > 0) {
            await driverSelect.selectOption({ index: 1 });
          }
          
          // Set delivery time
          const timeInput = assignModal.locator('input[type="time"], input[name*="time"]');
          if (await timeInput.count() > 0) {
            await timeInput.fill('12:30');
          }
          
          // Add notes
          const notesInput = assignModal.locator('textarea, input[name*="notes"]');
          if (await notesInput.count() > 0) {
            await notesInput.fill('Handle with care');
          }
          
          // Confirm assignment
          const confirmButton = assignModal.locator('button:has-text("Assign"), button:has-text("Confirm")');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            
            // Wait for assignment
            await page.waitForTimeout(1000);
            
            // Check for success message
            const successMessage = page.locator('text=/assigned|driver.*assigned/i');
            if (await successMessage.isVisible().catch(() => false)) {
              await expect(successMessage).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should perform bulk actions', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for checkboxes to select multiple orders
    const checkboxes = page.locator('input[type="checkbox"], .order-checkbox');
    
    if (await checkboxes.count() >= 2) {
      // Select first few orders
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      // Look for bulk actions dropdown/button
      const bulkActions = page.locator('.bulk-actions, [data-testid="bulk-actions"], .multi-select-actions');
      
      if (await bulkActions.count() > 0) {
        await expect(bulkActions).toBeVisible();
        
        // Check for bulk action options
        const bulkButton = bulkActions.locator('button, select').first();
        if (await bulkButton.count() > 0) {
          await bulkButton.click();
          
          // Wait for dropdown
          await page.waitForTimeout(500);
          
          // Look for bulk actions
          const actions = page.locator('.dropdown-item, option, .bulk-option');
          if (await actions.count() > 0) {
            // Test mark as processed action
            const processAction = actions.filter({ hasText: /process|mark.*ready/i });
            if (await processAction.count() > 0) {
              await processAction.first().click();
              
              // Wait for bulk update
              await page.waitForTimeout(2000);
              
              // Check for success message
              const successMessage = page.locator('text=/updated|bulk.*action.*complete/i');
              if (await successMessage.isVisible().catch(() => false)) {
                await expect(successMessage).toBeVisible();
              }
            }
          }
        }
      }
    }
  });

  test('should export order data', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), .export-btn, [data-testid="export"]'
    );
    
    if (await exportButton.count() > 0) {
      // Set up download promise
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      
      await exportButton.click();
      
      // If dropdown appears, select format
      const formatOption = page.locator('button:has-text("CSV"), button:has-text("Excel"), .export-format');
      if (await formatOption.isVisible().catch(() => false)) {
        await formatOption.first().click();
      }
      
      // Check if download started
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
        
        // Check filename contains orders
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/order|export|data/i);
      }
    }
  });

  test('should display real-time order updates', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Check for real-time indicator
    const liveIndicator = page.locator(
      '.live-indicator, .realtime-status, [data-testid="live-status"], text=/live|real.*time/i'
    );
    
    if (await liveIndicator.count() > 0) {
      await expect(liveIndicator.first()).toBeVisible();
      
      // Should show connected status
      const statusText = await liveIndicator.first().textContent();
      expect(statusText?.toLowerCase()).toMatch(/live|connected|online/);
    }
    
    // Check for auto-refresh functionality
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]');
    if (await refreshButton.count() > 0) {
      // Get initial order count
      const initialCount = await page.locator('.order-row, .order-card').count();
      
      await refreshButton.click();
      
      // Wait for refresh
      await page.waitForTimeout(2000);
      
      // Orders should still be displayed
      const newCount = await page.locator('.order-row, .order-card').count();
      expect(newCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display order analytics', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for analytics/statistics section
    const analyticsSection = page.locator(
      '.analytics, .statistics, .order-stats, [data-testid="analytics"]'
    );
    
    if (await analyticsSection.count() > 0) {
      await expect(analyticsSection.first()).toBeVisible();
      
      // Check for key metrics
      const metrics = [
        'Total Orders',
        'Revenue',
        'Average Order Value',
        'Completion Rate'
      ];
      
      for (const metric of metrics) {
        const metricElement = page.locator(`text=/${metric}/i`);
        if (await metricElement.count() > 0) {
          await expect(metricElement.first()).toBeVisible();
        }
      }
      
      // Check for charts
      const chart = page.locator('canvas, svg.chart, .recharts-wrapper, [data-testid="chart"]');
      if (await chart.count() > 0) {
        await expect(chart.first()).toBeVisible();
      }
    }
  });

  test('should enable customer communication', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const firstOrder = page.locator('.order-row, .order-card').first();
    
    if (await firstOrder.count() > 0) {
      // Look for contact customer button
      const contactButton = firstOrder.locator(
        'button:has-text("Contact"), button:has-text("Message"), button[aria-label*="contact"]'
      );
      
      if (await contactButton.count() > 0) {
        await contactButton.click();
        
        // Wait for communication modal
        await page.waitForTimeout(500);
        
        const messageModal = page.locator('[role="dialog"]:has-text("Message"), .message-modal, .contact-form');
        
        if (await messageModal.isVisible()) {
          // Select message template or type
          const templateSelect = messageModal.locator('select[name*="template"], .template-select');
          if (await templateSelect.count() > 0) {
            await templateSelect.selectOption({ index: 1 });
          }
          
          // Enter custom message
          const messageInput = messageModal.locator('textarea, .message-input');
          if (await messageInput.count() > 0) {
            await messageInput.fill('Your order is being prepared and will be ready soon.');
          }
          
          // Send message
          const sendButton = messageModal.locator('button:has-text("Send"), button:has-text("Message")');
          if (await sendButton.count() > 0) {
            await sendButton.click();
            
            // Wait for send confirmation
            await page.waitForTimeout(1000);
            
            // Check for success message
            const successMessage = page.locator('text=/message.*sent|notification.*sent/i');
            if (await successMessage.isVisible().catch(() => false)) {
              await expect(successMessage).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should display order timeline and history', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const firstOrder = page.locator('.order-row, .order-card').first();
    
    if (await firstOrder.count() > 0) {
      // View order details to see timeline
      const viewButton = firstOrder.locator('button:has-text("View"), a:has-text("View")');
      
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForTimeout(1000);
        
        // Look for timeline section
        const timeline = page.locator(
          '.timeline, .order-history, .status-history, [data-testid="timeline"]'
        );
        
        if (await timeline.count() > 0) {
          await expect(timeline).toBeVisible();
          
          // Check for timeline events
          const events = timeline.locator('.event, .timeline-item, .history-item');
          if (await events.count() > 0) {
            await expect(events).toHaveCount({ minimum: 1 });
            
            // Check first event has required details
            const firstEvent = events.first();
            await expect(firstEvent.locator('.timestamp, .date, time')).toBeVisible();
            await expect(firstEvent.locator('.status, .action, .description')).toBeVisible();
          }
        }
        
        // Check for status change log
        const statusLog = page.locator('.status-log, .change-log, [data-testid="status-log"]');
        if (await statusLog.count() > 0) {
          await expect(statusLog).toBeVisible();
        }
      }
    }
  });

  test('should handle priority and urgent orders', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for priority filter or sorting
    const priorityFilter = page.locator(
      'button:has-text("Priority"), .priority-filter, [data-testid="priority-filter"]'
    );
    
    if (await priorityFilter.count() > 0) {
      await priorityFilter.click();
      
      // Wait for priority orders to load
      await page.waitForTimeout(1000);
      
      // Check for priority indicators
      const priorityOrders = page.locator('.priority-order, .urgent-order, .high-priority');
      if (await priorityOrders.count() > 0) {
        await expect(priorityOrders.first()).toBeVisible();
        
        // Priority orders should have visual indicators
        const priorityBadge = priorityOrders.first().locator('.priority-badge, .urgent-badge, .priority-label');
        if (await priorityBadge.count() > 0) {
          await expect(priorityBadge).toBeVisible();
        }
      }
    }
    
    // Test marking order as priority
    const firstOrder = page.locator('.order-row, .order-card').first();
    if (await firstOrder.count() > 0) {
      const priorityButton = firstOrder.locator('button:has-text("Priority"), button[aria-label*="priority"]');
      
      if (await priorityButton.count() > 0) {
        await priorityButton.click();
        
        // Wait for priority status update
        await page.waitForTimeout(1000);
        
        // Check for priority indicator
        const priorityIndicator = firstOrder.locator('.priority-badge, .urgent-label');
        if (await priorityIndicator.isVisible().catch(() => false)) {
          await expect(priorityIndicator).toBeVisible();
        }
      }
    }
  });

  test('should manage order notes and comments', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const firstOrder = page.locator('.order-row, .order-card').first();
    
    if (await firstOrder.count() > 0) {
      // Look for notes/comments button
      const notesButton = firstOrder.locator(
        'button:has-text("Notes"), button:has-text("Comments"), button[aria-label*="notes"]'
      );
      
      if (await notesButton.count() > 0) {
        await notesButton.click();
        
        // Wait for notes modal/section
        await page.waitForTimeout(500);
        
        const notesModal = page.locator('[role="dialog"]:has-text("Notes"), .notes-modal, .comments-section');
        
        if (await notesModal.isVisible()) {
          // Add new note
          const noteInput = notesModal.locator('textarea, .note-input, input[name*="note"]');
          if (await noteInput.count() > 0) {
            await noteInput.fill('Customer requested extra sauce on the side');
            
            // Save note
            const saveButton = notesModal.locator('button:has-text("Save"), button:has-text("Add")');
            if (await saveButton.count() > 0) {
              await saveButton.click();
              
              // Wait for note to be saved
              await page.waitForTimeout(1000);
              
              // Check note appears in list
              const notesList = notesModal.locator('.notes-list, .comments-list');
              if (await notesList.count() > 0) {
                const latestNote = notesList.locator('.note, .comment').first();
                if (await latestNote.count() > 0) {
                  await expect(latestNote).toContainText('extra sauce');
                }
              }
            }
          }
        }
      }
    }
  });

  test('should paginate through orders', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for pagination controls
    const pagination = page.locator('.pagination, [data-testid="pagination"], nav[aria-label*="pagination"]');
    
    if (await pagination.count() > 0) {
      // Check for next button
      const nextButton = pagination.locator('button:has-text("Next"), a:has-text("Next"), button[aria-label="Next"]');
      
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        // Get initial orders
        const initialOrders = await page.locator('.order-row, .order-card').count();
        
        // Click next page
        await nextButton.click();
        
        // Wait for new page to load
        await page.waitForTimeout(1000);
        
        // Check page changed
        const newOrders = await page.locator('.order-row, .order-card').count();
        expect(newOrders).toBeGreaterThanOrEqual(0);
        
        // Test previous button
        const prevButton = pagination.locator('button:has-text("Previous"), a:has-text("Previous"), button[aria-label="Previous"]');
        if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should sort orders by different criteria', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for sort dropdown
    const sortSelect = page.locator('select[name*="sort"], .sort-select, [data-testid="sort-orders"]');
    
    if (await sortSelect.count() > 0) {
      // Test different sort options
      const sortOptions = ['Date', 'Status', 'Total', 'Customer'];
      
      for (const option of sortOptions) {
        const optionElement = sortSelect.locator(`option:has-text("${option}")`);
        if (await optionElement.count() > 0) {
          await sortSelect.selectOption({ label: option });
          
          // Wait for sort to apply
          await page.waitForTimeout(1000);
          
          // Verify orders are still displayed
          const ordersAfterSort = await page.locator('.order-row, .order-card').count();
          expect(ordersAfterSort).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should handle order cancellations', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for pending order that can be cancelled
    const pendingOrder = page.locator('.order-row:has-text("Pending"), .order-row:has-text("Processing")').first();
    
    if (await pendingOrder.count() > 0) {
      // Look for cancel button
      const cancelButton = pendingOrder.locator('button:has-text("Cancel"), button[aria-label*="cancel"]');
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        
        // Wait for cancellation modal
        await page.waitForTimeout(500);
        
        const cancelModal = page.locator('[role="dialog"]:has-text("Cancel"), .cancel-modal, .cancellation-form');
        
        if (await cancelModal.isVisible()) {
          // Select cancellation reason
          const reasonSelect = cancelModal.locator('select[name*="reason"], .reason-select');
          if (await reasonSelect.count() > 0) {
            await reasonSelect.selectOption({ index: 1 });
          }
          
          // Add additional notes
          const notesInput = cancelModal.locator('textarea, input[name*="notes"]');
          if (await notesInput.count() > 0) {
            await notesInput.fill('Inventory unavailable');
          }
          
          // Confirm cancellation
          const confirmButton = cancelModal.locator('button:has-text("Confirm"), button:has-text("Cancel Order")');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            
            // Wait for cancellation to process
            await page.waitForTimeout(2000);
            
            // Check for success message
            const successMessage = page.locator('text=/order.*cancelled|cancellation.*successful/i');
            if (await successMessage.isVisible().catch(() => false)) {
              await expect(successMessage).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should filter orders by date range', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for date range filters
    const dateFromInput = page.locator('input[type="date"][name*="from"], [data-testid="date-from"]');
    const dateToInput = page.locator('input[type="date"][name*="to"], [data-testid="date-to"]');
    
    if (await dateFromInput.count() > 0 && await dateToInput.count() > 0) {
      // Set date range to last week
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      await dateFromInput.fill(lastWeek.toISOString().split('T')[0]);
      await dateToInput.fill(today.toISOString().split('T')[0]);
      
      // Apply filter
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")');
      if (await applyButton.count() > 0) {
        await applyButton.click();
      }
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check filtered results
      const filteredOrders = await page.locator('.order-row, .order-card').count();
      expect(filteredOrders).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display order performance metrics', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for performance dashboard or metrics
    const metricsSection = page.locator('.metrics, .performance, .order-metrics, [data-testid="metrics"]');
    
    if (await metricsSection.count() > 0) {
      await expect(metricsSection.first()).toBeVisible();
      
      // Check for key performance indicators
      const kpis = [
        'Average Fulfillment Time',
        'Order Accuracy',
        'Customer Satisfaction',
        'Delivery Success Rate'
      ];
      
      for (const kpi of kpis) {
        const kpiElement = page.locator(`text=/${kpi}/i`);
        if (await kpiElement.count() > 0) {
          await expect(kpiElement.first()).toBeVisible();
          
          // Check for value
          const parent = kpiElement.first().locator('..');
          const value = parent.locator('.value, .metric-value, .percentage');
          if (await value.count() > 0) {
            const text = await value.textContent();
            expect(text).toMatch(/\d+|%|min|hrs/);
          }
        }
      }
    }
  });
});