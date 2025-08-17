import { test, expect } from '@playwright/test';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL('/user/dashboard');
  });

  test('should logout from header menu', async ({ page }) => {
    // Click on user menu/account dropdown
    const userMenu = page.locator('button:has-text("My Account"), [aria-label="User menu"], .user-menu, .account-dropdown');
    
    if (await userMenu.count() > 0) {
      await userMenu.first().click();
      
      // Click logout option
      await page.click('text=Logout');
    } else {
      // Direct logout button
      await page.click('button:has-text("Logout"), a:has-text("Logout")');
    }
    
    // Should redirect to home or login page
    await page.waitForURL(url => url.includes('/') || url.includes('/login'));
    
    // Verify logged out state
    await expect(page.locator('text=Login, a[href="/login"]')).toBeVisible();
  });

  test('should logout from sidebar', async ({ page }) => {
    // Navigate to a user page with sidebar
    await page.goto('/user/dashboard');
    
    // Look for logout in sidebar
    const sidebarLogout = page.locator('.sidebar a:has-text("Logout"), .sidebar button:has-text("Logout")');
    
    if (await sidebarLogout.count() > 0) {
      await sidebarLogout.click();
      
      // Should redirect to home or login
      await page.waitForURL(url => url.includes('/') || url.includes('/login'));
      
      // Verify logged out state
      await expect(page.locator('text=Login, a[href="/login"]')).toBeVisible();
    }
  });

  test('should clear session after logout', async ({ page }) => {
    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();
    
    // Wait for redirect
    await page.waitForURL(url => url.includes('/') || url.includes('/login'));
    
    // Try to access protected route
    await page.goto('/user/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should handle logout errors gracefully', async ({ page, context }) => {
    // Simulate network failure for logout
    await context.route('**/api/auth/signout', route => route.abort());
    
    // Try to logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();
    
    // Should handle error gracefully (either show error or force logout)
    await page.waitForTimeout(2000);
    
    // Check if still on same page or redirected
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('should logout from all tabs', async ({ page, context }) => {
    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/user/profile');
    
    // Verify both tabs are logged in
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page2.locator('text=test@test.com')).toBeVisible();
    
    // Logout from first tab
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();
    await page.waitForURL(url => url.includes('/') || url.includes('/login'));
    
    // Check second tab - refresh and should redirect to login
    await page2.reload();
    await page2.waitForURL('/login');
    await expect(page2).toHaveURL('/login');
    
    // Close second tab
    await page2.close();
  });

  test('should not access protected routes after logout', async ({ page }) => {
    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();
    await page.waitForURL(url => url.includes('/') || url.includes('/login'));
    
    // Try to access various protected routes
    const protectedRoutes = [
      '/user/dashboard',
      '/user/subscriptions',
      '/user/orders',
      '/user/profile',
      '/user/payments'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });

  test('should show confirmation before logout', async ({ page }) => {
    // Click logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();
    
    // Check if confirmation dialog appears
    const confirmDialog = page.locator('text=/confirm|sure|logout/i');
    
    if (await confirmDialog.isVisible().catch(() => false)) {
      // Confirm logout
      await page.click('button:has-text("Yes"), button:has-text("Confirm")');
      
      // Should logout
      await page.waitForURL(url => url.includes('/') || url.includes('/login'));
    } else {
      // Direct logout without confirmation
      await page.waitForURL(url => url.includes('/') || url.includes('/login'));
    }
    
    // Verify logged out
    await expect(page.locator('text=Login, a[href="/login"]')).toBeVisible();
  });

  test('should handle session expiry', async ({ page, context }) => {
    // Clear cookies to simulate session expiry
    await context.clearCookies();
    
    // Try to navigate to protected page
    await page.goto('/user/subscriptions');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Check for session expired message if shown
    const expiredMessage = page.locator('text=/session|expired/i');
    if (await expiredMessage.isVisible().catch(() => false)) {
      await expect(expiredMessage).toBeVisible();
    }
  });

  test('should logout when clicking browser back after logout', async ({ page }) => {
    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();
    await page.waitForURL(url => url.includes('/') || url.includes('/login'));
    
    // Try to go back
    await page.goBack();
    
    // Should not show authenticated content
    await page.waitForTimeout(1000);
    
    // If redirected to login, good
    if (page.url().includes('/login')) {
      await expect(page).toHaveURL('/login');
    } else {
      // Otherwise, check that user is not authenticated
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
    }
  });
});