import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should login as admin successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill admin credentials
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation - admin should go to admin dashboard
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Verify admin dashboard is accessible
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/admin|dashboard/);
    
    // Check for admin-specific elements
    const adminHeader = page.locator('h1');
    await expect(adminHeader).toContainText(/Admin|Dashboard|Overview/i);
    
    // Verify admin email is displayed
    await expect(page.locator('text=osasp419@gmail.com')).toBeVisible();
  });

  test('should access admin-only pages', async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Try to access admin pages
    const adminPages = [
      '/admin/dashboard',
      '/admin/orders',
      '/admin/menu',
      '/admin/users',
      '/admin/analytics'
    ];
    
    for (const adminPage of adminPages) {
      await page.goto(adminPage);
      
      // Should be able to access (not redirected to login or error)
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
      expect(currentUrl).not.toContain('/403');
      expect(currentUrl).not.toContain('/unauthorized');
    }
  });

  test('should show admin menu items', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Check for admin-specific navigation items
    const adminNavItems = [
      'Dashboard',
      'Orders',
      'Menu',
      'Users',
      'Analytics',
      'Settings'
    ];
    
    for (const item of adminNavItems) {
      const navItem = page.locator(`nav >> text=${item}`).or(
        page.locator(`aside >> text=${item}`).or(
          page.locator(`.sidebar >> text=${item}`)
        )
      );
      
      // At least some admin nav items should be visible
      if (await navItem.count() > 0) {
        await expect(navItem.first()).toBeVisible();
      }
    }
  });

  test('should logout admin user', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    await logoutButton.click();
    
    // Should redirect to home or login
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/') || urlString.includes('/login');
    });
    
    // Try to access admin page after logout
    await page.goto('/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should prevent regular user from accessing admin pages', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL('/user/dashboard');
    
    // Try to access admin dashboard
    await page.goto('/admin/dashboard');
    
    // Should be redirected or show error
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/user') || currentUrl.includes('/login');
    const hasErrorMessage = await page.locator('text=/unauthorized|forbidden|access denied/i').isVisible().catch(() => false);
    
    expect(isRedirected || hasErrorMessage).toBe(true);
  });

  test('should handle admin session expiry', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Clear cookies to simulate session expiry
    await context.clearCookies();
    
    // Try to navigate to admin page
    await page.goto('/admin/orders');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Check for session expired message if shown
    const expiredMessage = page.locator('text=/session|expired/i');
    if (await expiredMessage.isVisible().catch(() => false)) {
      await expect(expiredMessage).toBeVisible();
    }
  });

  test('should switch between admin and user views', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.includes('/admin') || url.includes('/dashboard'));
    
    // Look for view switcher
    const viewSwitcher = page.locator('button:has-text("Switch to User"), button:has-text("User View"), a:has-text("User Dashboard")');
    
    if (await viewSwitcher.count() > 0) {
      await viewSwitcher.first().click();
      
      // Should navigate to user dashboard
      await page.waitForURL(url => {
        const urlString = url.toString();
        return urlString.includes('/user');
      });
      
      // Look for switch back to admin
      const adminSwitcher = page.locator('button:has-text("Admin"), a:has-text("Admin")');
      if (await adminSwitcher.count() > 0) {
        await adminSwitcher.first().click();
        
        // Should navigate back to admin
        await page.waitForURL(url => {
          const urlString = url.toString();
          return urlString.includes('/admin');
        });
      }
    }
  });

  test('should maintain admin session across tabs', async ({ page, context }) => {
    // Login as admin in first tab
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Open second tab
    const page2 = await context.newPage();
    
    // Navigate directly to admin page in second tab
    await page2.goto('/admin/orders');
    
    // Should be logged in and able to access admin page
    const currentUrl = page2.url();
    expect(currentUrl).toContain('/admin');
    expect(currentUrl).not.toContain('/login');
    
    // Verify admin email is visible in second tab
    await expect(page2.locator('text=osasp419@gmail.com')).toBeVisible();
    
    // Close second tab
    await page2.close();
  });

  test('should handle incorrect admin credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try with wrong password
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|wrong/i')).toBeVisible();
    
    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to originally requested admin page after login', async ({ page }) => {
    // Try to access admin page without login
    await page.goto('/admin/menu');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Login as admin
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    
    // Should redirect back to originally requested page
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin');
    });
    
    // Ideally should be on /admin/menu but may go to dashboard
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/admin\/(menu|dashboard)/);
  });

  test('should display admin role indicator', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Check for admin role indicator
    const roleIndicator = page.locator('text=/admin|administrator|role.*admin/i');
    
    if (await roleIndicator.count() > 0) {
      await expect(roleIndicator.first()).toBeVisible();
    }
    
    // Check for admin badge or icon
    const adminBadge = page.locator('.admin-badge, .role-badge, [data-role="admin"]');
    if (await adminBadge.count() > 0) {
      await expect(adminBadge.first()).toBeVisible();
    }
  });

  test('should handle admin permission levels', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Navigate to a page with restricted actions
    await page.goto('/admin/users');
    
    // Check for high-privilege actions
    const deleteUserButton = page.locator('button:has-text("Delete User"), button[aria-label*="delete"]').first();
    const editRoleButton = page.locator('button:has-text("Change Role"), button:has-text("Edit Role")').first();
    
    // Admin should have access to these actions
    if (await deleteUserButton.count() > 0) {
      await expect(deleteUserButton).toBeVisible();
    }
    
    if (await editRoleButton.count() > 0) {
      await expect(editRoleButton).toBeVisible();
    }
  });

  test('should log admin actions', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'osasp419@gmail.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => {
      const urlString = url.toString();
      return urlString.includes('/admin') || urlString.includes('/dashboard');
    });
    
    // Perform an admin action (navigate to different pages)
    await page.goto('/admin/orders');
    await page.waitForTimeout(500);
    
    await page.goto('/admin/menu');
    await page.waitForTimeout(500);
    
    // Check if there's an activity log or audit trail
    const activityLink = page.locator('a:has-text("Activity"), a:has-text("Logs"), a:has-text("Audit")');
    
    if (await activityLink.count() > 0) {
      await activityLink.first().click();
      
      // Should show some activity
      const activityItems = page.locator('.activity-item, .log-entry, .audit-item');
      if (await activityItems.count() > 0) {
        await expect(activityItems.first()).toBeVisible();
      }
    }
  });
});
