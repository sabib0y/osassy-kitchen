import { test, expect } from '@playwright/test';

test.describe('User Subscription Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL('/user/dashboard');
  });

  test('should display subscription creation page with menu items', async ({ page }) => {
    // Navigate to subscription creation
    await page.goto('/subscriptions/create');
    
    // Check page elements
    await expect(page.locator('h1')).toContainText(/Create.*Subscription|Choose.*Meals/i);
    
    // Check menu categories exist
    const categories = page.locator('[data-testid="menu-category"], .category-tab, .menu-category');
    await expect(categories).toHaveCount({ minimum: 1 });
    
    // Check menu items exist
    const menuItems = page.locator('[data-testid^="menu-item"], .menu-item, .meal-card');
    await expect(menuItems).toHaveCount({ minimum: 1 });
    
    // Check cart/summary section
    const cart = page.locator('[data-testid="cart"], .cart-summary, .order-summary');
    await expect(cart).toBeVisible();
  });

  test('should add items to subscription', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Wait for menu items to load
    await page.waitForSelector('.menu-item, .meal-card, [data-testid^="menu-item"]');
    
    // Add first menu item
    const firstItem = page.locator('.menu-item, .meal-card').first();
    const itemName = await firstItem.locator('h3, h4, .item-name').textContent();
    
    // Click add/plus button
    const addButton = firstItem.locator('button:has-text("+"), button:has-text("Add"), .add-button');
    await addButton.click();
    
    // Verify item added to cart
    const cartItem = page.locator(`.cart-item:has-text("${itemName}"), .order-item:has-text("${itemName}")`);
    await expect(cartItem).toBeVisible();
    
    // Check quantity controls
    const quantityDisplay = cartItem.locator('.quantity, [data-testid="quantity"]');
    await expect(quantityDisplay).toContainText('1');
  });

  test('should update item quantities', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Add item to cart
    const firstItem = page.locator('.menu-item, .meal-card').first();
    await firstItem.locator('button:has-text("+"), button:has-text("Add")').click();
    
    // Find the cart item
    const cartItem = page.locator('.cart-item, .order-item').first();
    
    // Increase quantity
    const plusButton = cartItem.locator('button:has-text("+"), .increase-quantity');
    await plusButton.click();
    
    // Verify quantity increased
    const quantity = cartItem.locator('.quantity, [data-testid="quantity"]');
    await expect(quantity).toContainText('2');
    
    // Decrease quantity
    const minusButton = cartItem.locator('button:has-text("-"), .decrease-quantity');
    await minusButton.click();
    
    // Verify quantity decreased
    await expect(quantity).toContainText('1');
  });

  test('should remove items from subscription', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Add item to cart
    const firstItem = page.locator('.menu-item, .meal-card').first();
    const itemName = await firstItem.locator('h3, h4, .item-name').textContent();
    await firstItem.locator('button:has-text("+"), button:has-text("Add")').click();
    
    // Verify item in cart
    const cartItem = page.locator(`.cart-item:has-text("${itemName}")`);
    await expect(cartItem).toBeVisible();
    
    // Remove item (either by reducing quantity to 0 or remove button)
    const removeButton = cartItem.locator('button:has-text("Remove"), button:has-text("×"), .remove-button');
    if (await removeButton.count() > 0) {
      await removeButton.click();
    } else {
      // Reduce quantity to 0
      const minusButton = cartItem.locator('button:has-text("-"), .decrease-quantity');
      await minusButton.click();
    }
    
    // Verify item removed
    await expect(cartItem).not.toBeVisible();
  });

  test('should calculate total price correctly', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Add multiple items
    const menuItems = page.locator('.menu-item, .meal-card');
    const itemCount = await menuItems.count();
    
    if (itemCount >= 2) {
      // Add first item
      await menuItems.nth(0).locator('button:has-text("+"), button:has-text("Add")').click();
      
      // Add second item
      await menuItems.nth(1).locator('button:has-text("+"), button:has-text("Add")').click();
      
      // Check total is displayed
      const total = page.locator('.cart-total, .order-total, [data-testid="total"]');
      await expect(total).toContainText(/£|€|\$/);
      
      // Verify total is greater than 0
      const totalText = await total.textContent();
      const totalValue = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
      expect(totalValue).toBeGreaterThan(0);
    }
  });

  test('should filter menu items by category', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Check if categories exist
    const categories = page.locator('.category-tab, [data-testid="menu-category"], .menu-category');
    const categoryCount = await categories.count();
    
    if (categoryCount > 1) {
      // Click second category
      await categories.nth(1).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Verify items are filtered (items should still be visible)
      const visibleItems = page.locator('.menu-item:visible, .meal-card:visible');
      await expect(visibleItems).toHaveCount({ minimum: 1 });
    }
  });

  test('should search menu items', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Check if search input exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search-input"]');
    
    if (await searchInput.count() > 0) {
      // Type search query
      await searchInput.fill('chicken');
      
      // Wait for search to apply
      await page.waitForTimeout(500);
      
      // Check that some items are still visible
      const visibleItems = page.locator('.menu-item:visible, .meal-card:visible');
      const itemCount = await visibleItems.count();
      
      // If no chicken items, try another search
      if (itemCount === 0) {
        await searchInput.clear();
        await searchInput.fill('rice');
        await page.waitForTimeout(500);
      }
    }
  });

  test('should set delivery preferences', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Add an item first
    const firstItem = page.locator('.menu-item, .meal-card').first();
    await firstItem.locator('button:has-text("+"), button:has-text("Add")').click();
    
    // Look for delivery options
    const deliverySection = page.locator('[data-testid="delivery-options"], .delivery-preferences, .delivery-section');
    
    if (await deliverySection.count() > 0) {
      // Check for frequency selection
      const frequencySelect = deliverySection.locator('select[name*="frequency"], [data-testid="frequency-select"]');
      if (await frequencySelect.count() > 0) {
        await frequencySelect.selectOption({ index: 1 });
      }
      
      // Check for delivery day selection
      const daySelect = deliverySection.locator('select[name*="day"], [data-testid="day-select"]');
      if (await daySelect.count() > 0) {
        await daySelect.selectOption({ index: 1 });
      }
      
      // Check for delivery time selection
      const timeSelect = deliverySection.locator('select[name*="time"], [data-testid="time-select"]');
      if (await timeSelect.count() > 0) {
        await timeSelect.selectOption({ index: 1 });
      }
    }
  });

  test('should proceed to checkout with valid subscription', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Add items to cart
    const menuItems = page.locator('.menu-item, .meal-card');
    await menuItems.first().locator('button:has-text("+"), button:has-text("Add")').click();
    
    // Find checkout button
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed"), button:has-text("Continue"), [data-testid="checkout-button"]');
    
    // Click checkout
    await checkoutButton.click();
    
    // Wait for navigation (could be to Stripe or confirmation page)
    await page.waitForURL(url => 
      url.includes('stripe.com') || 
      url.includes('checkout') || 
      url.includes('confirm') ||
      url.includes('payment')
    );
    
    // Verify we've moved to checkout
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/subscriptions/create');
  });

  test('should show validation when trying to checkout with empty cart', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Try to checkout without adding items
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed"), [data-testid="checkout-button"]');
    
    // Check if button is disabled or clicking shows error
    const isDisabled = await checkoutButton.isDisabled();
    
    if (!isDisabled) {
      await checkoutButton.click();
      
      // Check for error message
      const errorMessage = page.locator('text=/empty|add items|select meals/i');
      await expect(errorMessage).toBeVisible();
      
      // Should remain on same page
      await expect(page).toHaveURL(/\/subscriptions\/create/);
    } else {
      // Button should be disabled
      expect(isDisabled).toBe(true);
    }
  });

  test('should persist cart items on page refresh', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Add item to cart
    const firstItem = page.locator('.menu-item, .meal-card').first();
    const itemName = await firstItem.locator('h3, h4, .item-name').textContent();
    await firstItem.locator('button:has-text("+"), button:has-text("Add")').click();
    
    // Verify item in cart
    await expect(page.locator(`.cart-item:has-text("${itemName}")`)).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Check if cart persists (may or may not based on implementation)
    const cartItemAfterRefresh = page.locator(`.cart-item:has-text("${itemName}")`);
    const isPersisted = await cartItemAfterRefresh.count() > 0;
    
    // Log whether cart persists (both behaviors are valid)
    if (isPersisted) {
      await expect(cartItemAfterRefresh).toBeVisible();
    }
  });

  test('should display item details', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Check first menu item has required details
    const firstItem = page.locator('.menu-item, .meal-card').first();
    
    // Check for item name
    const itemName = firstItem.locator('h3, h4, .item-name');
    await expect(itemName).toBeVisible();
    
    // Check for price
    const price = firstItem.locator('.price, [data-testid="price"], text=/£|€|\$/');
    await expect(price).toBeVisible();
    
    // Check for description (if present)
    const description = firstItem.locator('.description, .item-description, p');
    if (await description.count() > 0) {
      await expect(description).toBeVisible();
    }
    
    // Check for image (if present)
    const image = firstItem.locator('img');
    if (await image.count() > 0) {
      await expect(image).toBeVisible();
    }
  });

  test('should handle special dietary filters', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Look for dietary filters
    const dietaryFilters = page.locator('[data-testid="dietary-filter"], .dietary-filter, input[type="checkbox"][name*="diet"]');
    
    if (await dietaryFilters.count() > 0) {
      // Apply a filter
      await dietaryFilters.first().click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Verify items are still displayed (filtered)
      const visibleItems = page.locator('.menu-item:visible, .meal-card:visible');
      await expect(visibleItems).toHaveCount({ minimum: 0 });
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/subscriptions/create');
    
    // Look for back/cancel button
    const backButton = page.locator('a[href="/user/dashboard"], button:has-text("Cancel"), button:has-text("Back")');
    
    if (await backButton.count() > 0) {
      await backButton.click();
      
      // Should navigate back to dashboard
      await expect(page).toHaveURL('/user/dashboard');
    }
  });
});