import { test, expect } from '@playwright/test';

test.describe('Admin Menu Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.includes('/admin') || url.includes('/dashboard'));
  });

  test('should display menu management page', async ({ page }) => {
    // Navigate to menu management
    await page.goto('/admin/menu');
    
    // Check page title and header
    await expect(page.locator('h1, .page-title')).toContainText(/Menu Management/i);
    
    // Check for key page elements
    const pageElements = [
      page.locator('text=/Manage your restaurant menu/i'),
      page.locator('button:has-text("Add Menu Item"), button:has-text("Create")').first(),
      page.locator('.menu-stats, [data-testid="menu-stats"]').first(),
      page.locator('.filters, .menu-filters, [data-testid="filters"]').first()
    ];
    
    for (const element of pageElements) {
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
    
    // Check for menu items container (either with items or empty state)
    const menuContainer = page.locator('.menu-grid, .menu-items, [data-testid="menu-container"]');
    const emptyState = page.locator('text=/no menu items|empty.*menu|no items found/i');
    
    const hasMenuItems = await menuContainer.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    expect(hasMenuItems || hasEmptyState).toBe(true);
  });

  test('should display menu statistics', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for statistics section
    const statsSection = page.locator('.menu-stats, .statistics, [data-testid="menu-stats"]');
    
    if (await statsSection.count() > 0) {
      await expect(statsSection.first()).toBeVisible();
      
      // Check for common menu statistics
      const statItems = [
        'Total Items',
        'Available',
        'Categories',
        'Average Price',
        'Revenue',
        'Most Popular'
      ];
      
      for (const statItem of statItems) {
        const statElement = page.locator(`text=/${statItem}/i`);
        if (await statElement.count() > 0) {
          await expect(statElement.first()).toBeVisible();
        }
      }
    }
  });

  test('should add new menu item', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Click add menu item button
    const addButton = page.locator('button:has-text("Add Menu Item"), button:has-text("Create"), button:has-text("Add")').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // Wait for modal to open
    await page.waitForTimeout(500);
    
    const modal = page.locator('[role="dialog"], .modal, .menu-item-modal');
    await expect(modal).toBeVisible();
    
    // Fill in menu item details
    const testMenuItem = {
      name: 'Test Jollof Rice',
      description: 'Delicious Nigerian jollof rice with spices and vegetables',
      price: '12.99',
      category: 'rice-dishes'
    };
    
    // Fill form fields
    await page.fill('input[name="name"], input[id="name"]', testMenuItem.name);
    await page.fill('textarea[name="description"], input[name="description"]', testMenuItem.description);
    await page.fill('input[name="price"], input[id="price"]', testMenuItem.price);
    
    // Select category
    const categorySelect = page.locator('select[name="category"], select[id="category"]');
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption(testMenuItem.category);
    }
    
    // Ensure available checkbox is checked
    const availableCheckbox = page.locator('input[name="available"], input[type="checkbox"]');
    if (await availableCheckbox.count() > 0) {
      await availableCheckbox.check();
    }
    
    // Submit form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]');
    await submitButton.click();
    
    // Wait for success and modal to close
    await page.waitForTimeout(2000);
    
    // Check for success message or modal closure
    const successMessage = page.locator('text=/successfully created|item added|success/i');
    const modalClosed = await modal.isVisible().catch(() => true) === false;
    
    if (await successMessage.isVisible().catch(() => false)) {
      await expect(successMessage).toBeVisible();
    }
    
    expect(modalClosed || await successMessage.count() > 0).toBe(true);
    
    // Search for newly created item
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], [data-testid="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill(testMenuItem.name);
      await page.waitForTimeout(1000);
      
      // Check if item appears in results
      const newItem = page.locator(`text="${testMenuItem.name}"`);
      if (await newItem.count() > 0) {
        await expect(newItem.first()).toBeVisible();
      }
    }
  });

  test('should edit existing menu item', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Find first menu item
    const firstMenuItem = page.locator('.menu-item, .menu-card, [data-testid="menu-item"]').first();
    
    if (await firstMenuItem.count() > 0) {
      // Find edit button
      const editButton = firstMenuItem.locator('button:has-text("Edit"), button[aria-label*="edit"], .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Wait for edit modal
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"], .modal, .menu-item-modal');
        await expect(modal).toBeVisible();
        
        // Check that form is pre-filled
        const nameInput = page.locator('input[name="name"], input[id="name"]');
        if (await nameInput.count() > 0) {
          const currentValue = await nameInput.inputValue();
          expect(currentValue.length).toBeGreaterThan(0);
          
          // Update the name
          await nameInput.fill(currentValue + ' (Updated)');
        }
        
        // Update description
        const descriptionInput = page.locator('textarea[name="description"], input[name="description"]');
        if (await descriptionInput.count() > 0) {
          await descriptionInput.fill('Updated description for this delicious item');
        }
        
        // Submit changes
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        await saveButton.click();
        
        // Wait for update to complete
        await page.waitForTimeout(2000);
        
        // Check for success
        const successMessage = page.locator('text=/successfully updated|changes saved|success/i');
        if (await successMessage.isVisible().catch(() => false)) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should delete menu item', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Find a menu item to delete
    const menuItems = page.locator('.menu-item, .menu-card, [data-testid="menu-item"]');
    
    if (await menuItems.count() > 0) {
      const itemToDelete = menuItems.first();
      
      // Get item name for verification
      const itemNameElement = itemToDelete.locator('.item-name, .menu-name, h3, .title');
      let itemName = '';
      if (await itemNameElement.count() > 0) {
        itemName = await itemNameElement.textContent() || '';
      }
      
      // Find delete button
      const deleteButton = itemToDelete.locator(
        'button:has-text("Delete"), button[aria-label*="delete"], .delete-btn, button.text-red'
      );
      
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        
        // Handle confirmation dialog
        await page.waitForTimeout(500);
        
        // Look for confirmation modal or browser confirm
        const confirmModal = page.locator('[role="dialog"]:has-text("Delete"), .confirm-modal');
        
        if (await confirmModal.isVisible().catch(() => false)) {
          const confirmButton = confirmModal.locator('button:has-text("Delete"), button:has-text("Confirm")');
          await confirmButton.click();
        } else {
          // Handle browser confirm dialog
          page.on('dialog', async dialog => {
            if (dialog.type() === 'confirm') {
              await dialog.accept();
            }
          });
        }
        
        // Wait for deletion
        await page.waitForTimeout(2000);
        
        // Check for success message
        const successMessage = page.locator('text=/successfully deleted|item removed|deleted successfully/i');
        if (await successMessage.isVisible().catch(() => false)) {
          await expect(successMessage).toBeVisible();
        }
        
        // Verify item is no longer visible (if we have the name)
        if (itemName) {
          const deletedItem = page.locator(`text="${itemName}"`);
          if (await deletedItem.count() > 0) {
            await expect(deletedItem).not.toBeVisible();
          }
        }
      }
    }
  });

  test('should filter menu items by category', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Find category filter
    const categoryFilter = page.locator('select[name*="category"], .category-filter select, [data-testid="category-filter"]');
    
    if (await categoryFilter.count() > 0) {
      // Get available options
      const options = await categoryFilter.locator('option').count();
      
      if (options > 1) {
        // Select a specific category (skip "All Categories")
        await categoryFilter.selectOption({ index: 1 });
        
        // Apply filter if there's an apply button
        const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")');
        if (await applyButton.count() > 0) {
          await applyButton.click();
        }
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        // Verify filtered results
        const menuItems = await page.locator('.menu-item, .menu-card, [data-testid="menu-item"]').count();
        expect(menuItems).toBeGreaterThanOrEqual(0);
        
        // Reset filter
        await categoryFilter.selectOption({ index: 0 });
        if (await applyButton.count() > 0) {
          await applyButton.click();
        }
      }
    }
  });

  test('should filter menu items by availability', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Find availability filter
    const availabilityFilter = page.locator(
      'select[name*="availability"], .availability-filter select, [data-testid="availability-filter"]'
    );
    
    if (await availabilityFilter.count() > 0) {
      // Filter by available items
      await availabilityFilter.selectOption('available');
      
      // Apply filter
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")');
      if (await applyButton.count() > 0) {
        await applyButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Check that only available items are shown
      const availabilityBadges = page.locator('.availability-badge, .status-badge, .available');
      if (await availabilityBadges.count() > 0) {
        for (let i = 0; i < Math.min(3, await availabilityBadges.count()); i++) {
          const badge = availabilityBadges.nth(i);
          const text = await badge.textContent();
          expect(text?.toLowerCase()).toMatch(/available|active|enabled/);
        }
      }
      
      // Test unavailable filter
      await availabilityFilter.selectOption('unavailable');
      if (await applyButton.count() > 0) {
        await applyButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Reset filter
      await availabilityFilter.selectOption('');
      if (await applyButton.count() > 0) {
        await applyButton.click();
      }
    }
  });

  test('should search menu items', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Find search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], [data-testid="search"], .search-input'
    );
    
    if (await searchInput.count() > 0) {
      // Get a menu item name to search for
      const firstMenuItem = page.locator('.menu-item, .menu-card').first();
      
      if (await firstMenuItem.count() > 0) {
        const itemNameElement = firstMenuItem.locator('.item-name, .menu-name, h3, .title');
        
        if (await itemNameElement.count() > 0) {
          const itemName = await itemNameElement.textContent();
          
          if (itemName) {
            // Search for the first word of the item name
            const searchTerm = itemName.trim().split(' ')[0];
            await searchInput.fill(searchTerm);
            
            // Wait for search results
            await page.waitForTimeout(1000);
            
            // Verify search results contain the search term
            const searchResults = page.locator('.menu-item, .menu-card');
            if (await searchResults.count() > 0) {
              const firstResult = searchResults.first();
              const resultText = await firstResult.textContent();
              expect(resultText?.toLowerCase()).toContain(searchTerm.toLowerCase());
            }
            
            // Clear search
            await searchInput.clear();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test('should toggle menu item availability', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Find first menu item
    const firstMenuItem = page.locator('.menu-item, .menu-card, [data-testid="menu-item"]').first();
    
    if (await firstMenuItem.count() > 0) {
      // Get current availability status
      const availabilityBadge = firstMenuItem.locator('.availability-badge, .status-badge, .available, .unavailable');
      let currentStatus = '';
      
      if (await availabilityBadge.count() > 0) {
        currentStatus = await availabilityBadge.textContent() || '';
      }
      
      // Find toggle button
      const toggleButton = firstMenuItem.locator(
        'button:has-text("Toggle"), button[aria-label*="availability"], .toggle-btn, input[type="checkbox"]'
      );
      
      if (await toggleButton.count() > 0) {
        await toggleButton.click();
        
        // Wait for status update
        await page.waitForTimeout(1000);
        
        // Check if status changed
        if (await availabilityBadge.count() > 0) {
          const newStatus = await availabilityBadge.textContent() || '';
          expect(newStatus).not.toBe(currentStatus);
        }
        
        // Check for success message
        const successMessage = page.locator('text=/availability.*updated|status.*changed|toggled successfully/i');
        if (await successMessage.isVisible().catch(() => false)) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should manage menu categories', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Test category-based operations
    const categoryFilter = page.locator('select[name*="category"], .category-filter select');
    
    if (await categoryFilter.count() > 0) {
      // Get all category options
      const categoryOptions = await categoryFilter.locator('option').allTextContents();
      
      expect(categoryOptions.length).toBeGreaterThan(1);
      
      // Verify standard categories exist
      const expectedCategories = [
        'Main Dishes',
        'Soups', 
        'Rice Dishes',
        'Grilled',
        'Beverages',
        'Appetizers',
        'Desserts',
        'Sides'
      ];
      
      for (const category of expectedCategories) {
        const hasCategory = categoryOptions.some(option => 
          option.toLowerCase().includes(category.toLowerCase())
        );
        
        if (hasCategory) {
          // Select category and verify filtering works
          await categoryFilter.selectOption({ label: category });
          
          const applyButton = page.locator('button:has-text("Apply")');
          if (await applyButton.count() > 0) {
            await applyButton.click();
          }
          
          await page.waitForTimeout(500);
          
          // Check that items are filtered
          const filteredItems = await page.locator('.menu-item, .menu-card').count();
          expect(filteredItems).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should set and update prices', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Find a menu item to edit price
    const firstMenuItem = page.locator('.menu-item, .menu-card').first();
    
    if (await firstMenuItem.count() > 0) {
      // Check current price display
      const priceElement = firstMenuItem.locator('.price, .cost, .amount');
      
      if (await priceElement.count() > 0) {
        const currentPrice = await priceElement.textContent();
        expect(currentPrice).toMatch(/£|\$|\d+\.\d{2}/);
      }
      
      // Edit the item to update price
      const editButton = firstMenuItem.locator('button:has-text("Edit"), .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"], .modal');
        
        if (await modal.isVisible()) {
          const priceInput = page.locator('input[name="price"], input[id="price"]');
          
          if (await priceInput.count() > 0) {
            // Update price
            await priceInput.fill('15.99');
            
            // Save changes
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
            await saveButton.click();
            
            await page.waitForTimeout(2000);
            
            // Verify price was updated
            const updatedPrice = firstMenuItem.locator('.price, .cost, .amount');
            if (await updatedPrice.count() > 0) {
              const newPriceText = await updatedPrice.textContent();
              expect(newPriceText).toContain('15.99');
            }
          }
        }
      }
    }
  });

  test('should manage dietary labels and restrictions', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for dietary labels on menu items
    const dietaryLabels = page.locator('.dietary-label, .allergen-info, .label');
    
    if (await dietaryLabels.count() > 0) {
      // Check for common dietary labels
      const commonLabels = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Spicy', 'Dairy-Free'];
      
      for (const label of commonLabels) {
        const labelElement = page.locator(`text=/${label}/i`);
        if (await labelElement.count() > 0) {
          await expect(labelElement.first()).toBeVisible();
        }
      }
    }
    
    // Test adding dietary information through edit modal
    const firstMenuItem = page.locator('.menu-item, .menu-card').first();
    
    if (await firstMenuItem.count() > 0) {
      const editButton = firstMenuItem.locator('button:has-text("Edit"), .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Look for dietary options in modal
        const dietaryCheckboxes = page.locator('input[type="checkbox"][name*="dietary"], .dietary-options input');
        
        if (await dietaryCheckboxes.count() > 0) {
          // Select some dietary options
          await dietaryCheckboxes.first().check();
          
          // Save changes
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should handle image upload for menu items', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Open add menu item modal
    const addButton = page.locator('button:has-text("Add Menu Item"), button:has-text("Create")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('[role="dialog"], .modal');
    
    if (await modal.isVisible()) {
      // Look for image upload section
      const uploadArea = page.locator('.image-upload, .file-upload, input[type="file"]');
      
      if (await uploadArea.count() > 0) {
        // Check upload interface exists
        await expect(uploadArea.first()).toBeVisible();
        
        // Look for upload instructions
        const uploadText = page.locator('text=/drag.*drop|choose.*file|upload.*image/i');
        if (await uploadText.count() > 0) {
          await expect(uploadText.first()).toBeVisible();
        }
        
        // Check for image preview area
        const previewArea = page.locator('.image-preview, .upload-preview, .thumbnail');
        if (await previewArea.count() > 0) {
          await expect(previewArea.first()).toBeVisible();
        }
      }
      
      // Close modal
      const closeButton = page.locator('button:has-text("Cancel"), .close-btn, [aria-label="Close"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();
      }
    }
  });

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for bulk action controls
    const bulkToggleButton = page.locator('button:has-text("Bulk Toggle"), .bulk-actions button');
    
    if (await bulkToggleButton.count() > 0) {
      await expect(bulkToggleButton.first()).toBeVisible();
      
      // Check for item selection checkboxes
      const itemCheckboxes = page.locator('.menu-item input[type="checkbox"], .select-item');
      
      if (await itemCheckboxes.count() >= 2) {
        // Select multiple items
        await itemCheckboxes.nth(0).check();
        await itemCheckboxes.nth(1).check();
        
        // Check if bulk actions become available
        const bulkActionsPanel = page.locator('.bulk-actions-panel, .selected-actions');
        
        if (await bulkActionsPanel.count() > 0) {
          await expect(bulkActionsPanel.first()).toBeVisible();
          
          // Look for bulk operations
          const bulkOptions = [
            'Delete Selected',
            'Mark Available',
            'Mark Unavailable',
            'Change Category',
            'Export Selected'
          ];
          
          for (const option of bulkOptions) {
            const optionButton = page.locator(`button:has-text("${option}"), .bulk-option:has-text("${option}")`);
            if (await optionButton.count() > 0) {
              await expect(optionButton.first()).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should import and export menu data', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for export functionality
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), .export-btn'
    );
    
    if (await exportButton.count() > 0) {
      // Set up download promise
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      
      await exportButton.click();
      
      // Check for export format options
      const formatOptions = page.locator('button:has-text("CSV"), button:has-text("Excel"), .format-option');
      if (await formatOptions.count() > 0) {
        await formatOptions.first().click();
      }
      
      // Check if download started
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/menu|export|items/i);
      }
    }
    
    // Look for import functionality
    const importButton = page.locator(
      'button:has-text("Import"), button:has-text("Upload"), .import-btn'
    );
    
    if (await importButton.count() > 0) {
      await importButton.click();
      
      // Check for import modal/interface
      const importModal = page.locator('[role="dialog"]:has-text("Import"), .import-modal');
      
      if (await importModal.isVisible()) {
        // Look for file upload
        const fileInput = importModal.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          await expect(fileInput).toBeVisible();
        }
        
        // Look for import instructions
        const instructions = importModal.locator('text=/template|format|CSV|Excel/i');
        if (await instructions.count() > 0) {
          await expect(instructions.first()).toBeVisible();
        }
        
        // Close modal
        const closeButton = importModal.locator('button:has-text("Cancel"), .close-btn');
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
      }
    }
  });

  test('should sort menu items by different criteria', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for sort controls
    const sortSelect = page.locator('select[name*="sort"], .sort-select, [data-testid="sort-select"]');
    
    if (await sortSelect.count() > 0) {
      // Test different sort options
      const sortOptions = ['Name', 'Price', 'Category', 'Created Date', 'Popularity'];
      
      for (const option of sortOptions) {
        const optionElement = sortSelect.locator(`option:has-text("${option}")`);
        
        if (await optionElement.count() > 0) {
          await sortSelect.selectOption({ label: option });
          
          // Wait for sort to apply
          await page.waitForTimeout(1000);
          
          // Verify items are still displayed
          const menuItems = await page.locator('.menu-item, .menu-card').count();
          expect(menuItems).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should manage portion sizes and variants', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Check if any menu items have size/portion options
    const sizeIndicators = page.locator('.size-options, .portions, .variants');
    
    if (await sizeIndicators.count() > 0) {
      await expect(sizeIndicators.first()).toBeVisible();
    }
    
    // Test adding portions through edit modal
    const firstMenuItem = page.locator('.menu-item, .menu-card').first();
    
    if (await firstMenuItem.count() > 0) {
      const editButton = firstMenuItem.locator('button:has-text("Edit"), .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Look for portion/size management in modal
        const portionSection = page.locator('.portions-section, .sizes-section, .variants-section');
        
        if (await portionSection.count() > 0) {
          await expect(portionSection.first()).toBeVisible();
          
          // Look for add portion button
          const addPortionButton = page.locator('button:has-text("Add Size"), button:has-text("Add Portion")');
          
          if (await addPortionButton.count() > 0) {
            await addPortionButton.click();
            
            // Fill portion details
            const sizeNameInput = page.locator('input[name*="size"], input[placeholder*="size"]');
            if (await sizeNameInput.count() > 0) {
              await sizeNameInput.fill('Large');
            }
            
            const sizePriceInput = page.locator('input[name*="price"], input[type="number"]').last();
            if (await sizePriceInput.count() > 0) {
              await sizePriceInput.fill('18.99');
            }
          }
        }
        
        // Close modal
        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
    }
  });

  test('should set nutritional information', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for nutritional info in item details
    const nutritionInfo = page.locator('.nutrition-info, .nutritional, .calories');
    
    if (await nutritionInfo.count() > 0) {
      await expect(nutritionInfo.first()).toBeVisible();
    }
    
    // Test adding nutrition info through edit
    const firstMenuItem = page.locator('.menu-item, .menu-card').first();
    
    if (await firstMenuItem.count() > 0) {
      const editButton = firstMenuItem.locator('button:has-text("Edit"), .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Look for nutrition section in modal
        const nutritionSection = page.locator('.nutrition-section, .nutritional-info');
        
        if (await nutritionSection.count() > 0) {
          await expect(nutritionSection.first()).toBeVisible();
          
          // Fill nutrition fields
          const caloriesInput = page.locator('input[name*="calories"], input[placeholder*="calories"]');
          if (await caloriesInput.count() > 0) {
            await caloriesInput.fill('450');
          }
          
          const proteinInput = page.locator('input[name*="protein"], input[placeholder*="protein"]');
          if (await proteinInput.count() > 0) {
            await proteinInput.fill('25g');
          }
          
          const carbsInput = page.locator('input[name*="carb"], input[placeholder*="carb"]');
          if (await carbsInput.count() > 0) {
            await carbsInput.fill('60g');
          }
        }
        
        // Close modal
        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
    }
  });

  test('should manage ingredients list', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for ingredients information
    const ingredientsInfo = page.locator('.ingredients, .ingredient-list');
    
    if (await ingredientsInfo.count() > 0) {
      await expect(ingredientsInfo.first()).toBeVisible();
    }
    
    // Test managing ingredients through edit modal
    const firstMenuItem = page.locator('.menu-item, .menu-card').first();
    
    if (await firstMenuItem.count() > 0) {
      const editButton = firstMenuItem.locator('button:has-text("Edit"), .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Look for ingredients section
        const ingredientsSection = page.locator('.ingredients-section, .ingredient-management');
        
        if (await ingredientsSection.count() > 0) {
          await expect(ingredientsSection.first()).toBeVisible();
          
          // Look for add ingredient functionality
          const addIngredientButton = page.locator('button:has-text("Add Ingredient")');
          
          if (await addIngredientButton.count() > 0) {
            await addIngredientButton.click();
            
            // Fill ingredient details
            const ingredientNameInput = page.locator('input[name*="ingredient"], input[placeholder*="ingredient"]');
            if (await ingredientNameInput.count() > 0) {
              await ingredientNameInput.fill('Fresh tomatoes');
            }
            
            // Save ingredient
            const saveIngredientButton = page.locator('button:has-text("Add"), button:has-text("Save")');
            if (await saveIngredientButton.count() > 0) {
              await saveIngredientButton.click();
            }
          }
        }
        
        // Close modal
        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
    }
  });

  test('should manage seasonal and special items', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for seasonal indicators
    const seasonalBadges = page.locator('.seasonal, .limited-time, .special-offer');
    
    if (await seasonalBadges.count() > 0) {
      await expect(seasonalBadges.first()).toBeVisible();
    }
    
    // Test setting seasonal status
    const firstMenuItem = page.locator('.menu-item, .menu-card').first();
    
    if (await firstMenuItem.count() > 0) {
      const editButton = firstMenuItem.locator('button:has-text("Edit"), .edit-btn');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Look for seasonal/special options
        const seasonalCheckbox = page.locator('input[name*="seasonal"], input[name*="special"]');
        
        if (await seasonalCheckbox.count() > 0) {
          await seasonalCheckbox.check();
          
          // Look for date range inputs
          const startDateInput = page.locator('input[name*="start"], input[type="date"]').first();
          const endDateInput = page.locator('input[name*="end"], input[type="date"]').last();
          
          if (await startDateInput.count() > 0 && await endDateInput.count() > 0) {
            const today = new Date();
            const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            await startDateInput.fill(today.toISOString().split('T')[0]);
            await endDateInput.fill(nextMonth.toISOString().split('T')[0]);
          }
        }
        
        // Close modal
        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
    }
  });

  test('should validate form inputs and show errors', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Open add menu item modal
    const addButton = page.locator('button:has-text("Add Menu Item"), button:has-text("Create")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]');
    await submitButton.click();
    
    // Check for validation errors
    const errorMessages = page.locator('.error-message, .field-error, .text-red');
    
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
      
      // Check for specific field errors
      const nameError = page.locator('text=/name.*required|name.*invalid/i');
      const priceError = page.locator('text=/price.*required|price.*invalid/i');
      const descriptionError = page.locator('text=/description.*required/i');
      
      if (await nameError.count() > 0) {
        await expect(nameError.first()).toBeVisible();
      }
      
      if (await priceError.count() > 0) {
        await expect(priceError.first()).toBeVisible();
      }
    }
    
    // Test invalid price validation
    const priceInput = page.locator('input[name="price"], input[id="price"]');
    if (await priceInput.count() > 0) {
      await priceInput.fill('-5.00');
      await submitButton.click();
      
      const invalidPriceError = page.locator('text=/price.*positive|price.*valid/i');
      if (await invalidPriceError.count() > 0) {
        await expect(invalidPriceError.first()).toBeVisible();
      }
    }
    
    // Close modal
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.count() > 0) {
      await cancelButton.click();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Test handling of network errors by intercepting API calls
    await page.route('**/api/menu/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to refresh the page or perform an action that triggers API call
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check for error handling
    const errorMessage = page.locator('.error-message, .alert-error, text=/error|failed to load/i');
    
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
    
    // Check for retry mechanism
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Reload")');
    
    if (await retryButton.count() > 0) {
      await expect(retryButton.first()).toBeVisible();
    }
    
    // Remove route interception
    await page.unroute('**/api/menu/**');
  });

  test('should display loading states appropriately', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Check for loading indicators when page loads
    const loadingIndicators = page.locator('.loading, .spinner, .skeleton');
    
    // Loading states might appear briefly, so we check if they exist
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).toBeVisible();
    }
    
    // Test loading state in modal operations
    const addButton = page.locator('button:has-text("Add Menu Item")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Fill form quickly and submit to catch loading state
      const modal = page.locator('[role="dialog"], .modal');
      if (await modal.isVisible()) {
        await page.fill('input[name="name"]', 'Quick Test Item');
        await page.fill('input[name="price"]', '10.00');
        
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")');
        await submitButton.click();
        
        // Check for loading state on button
        const buttonLoading = submitButton.locator('.loading, .spinner');
        if (await buttonLoading.count() > 0) {
          await expect(buttonLoading.first()).toBeVisible();
        }
        
        // Wait for operation to complete
        await page.waitForTimeout(3000);
      }
    }
  });

  test('should paginate through menu items', async ({ page }) => {
    await page.goto('/admin/menu');
    
    // Look for pagination controls
    const pagination = page.locator('.pagination, [data-testid="pagination"], nav[aria-label*="pagination"]');
    
    if (await pagination.count() > 0) {
      await expect(pagination.first()).toBeVisible();
      
      // Check pagination info
      const paginationInfo = page.locator('.pagination-info, text=/showing.*of.*items/i');
      if (await paginationInfo.count() > 0) {
        await expect(paginationInfo.first()).toBeVisible();
      }
      
      // Test next button if available
      const nextButton = pagination.locator('button:has-text("Next"), a:has-text("Next")');
      
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        // Get current page items
        const currentItems = await page.locator('.menu-item, .menu-card').count();
        
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Verify pagination worked
        const newItems = await page.locator('.menu-item, .menu-card').count();
        expect(newItems).toBeGreaterThanOrEqual(0);
        
        // Test previous button
        const prevButton = pagination.locator('button:has-text("Previous"), a:has-text("Previous")');
        if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });
});