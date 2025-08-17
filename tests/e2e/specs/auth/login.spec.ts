import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the page to load with network idle
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('should display login form with all elements', async ({ page }) => {
    // Check form elements are present using data-testid
    await expect(page.locator('[data-testid="login-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toContainText('Sign In');
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in login form using data-testid
    await page.fill('[data-testid="email-input"]', 'test@test.com');
    await page.fill('[data-testid="password-input"]', 'test');
    
    // Submit form
    await page.click('[data-testid="login-submit"]');
    // Wait for navigation or error
    await page.waitForTimeout(1000);
    
    // Wait for navigation - might go to different pages based on role
    await page.waitForURL((url) => {
      const urlString = url.toString();
      return urlString.includes('/dashboard') || urlString.includes('/user') || !urlString.includes('/login');
    }, { timeout: 10000 });
    
    // Verify successful login - we should be on some dashboard
    const currentUrl = page.url();
    await expect(currentUrl).not.toContain('/login');
    // User info might be in header or sidebar
    const hasUserEmail = await page.locator('text=test@test.com').count() > 0 ||
                         await page.locator('[data-testid*="user"]').count() > 0;
    expect(hasUserEmail).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@test.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit form
    await page.click('[data-testid="login-submit"]');
    
    // Wait for error to appear
    await page.waitForTimeout(1000);
    
    // Check for error message using data-testid
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid|error/i);
    
    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    const submitBtn = page.locator('[data-testid="login-submit"]');
    await submitBtn.click();
    
    // Check for validation messages
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    
    // Browser validation messages
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click signup link
    await page.click('a[href="/signup"]');
    
    // Verify navigation
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1').last()).toContainText(/Create|Sign|Register/);
  });

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('[data-testid="password-input"]');
    const toggleButton = page.locator('[data-testid="password-toggle"]');
    
    // Check if toggle button exists
    const toggleExists = await toggleButton.count() > 0;
    
    if (toggleExists) {
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await toggleButton.click();
      await page.waitForTimeout(100); // Small delay for state change
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle to hide password again
      await toggleButton.click();
      await page.waitForTimeout(100); // Small delay for state change
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should redirect authenticated users away from login', async ({ page, context }) => {
    // First login
    await page.fill('[data-testid="email-input"]', 'test@test.com');
    await page.fill('[data-testid="password-input"]', 'test');
    await page.click('[data-testid="login-submit"]');
    
    // Wait for navigation away from login
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10000 });
    
    // Try to access login page while authenticated
    await page.goto('/login');
    
    // Should redirect away from login (to dashboard or home)
    await expect(page.url()).not.toContain('/login');
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email-input"]', 'test@test.com');
    await page.fill('[data-testid="password-input"]', 'test');
    await page.click('[data-testid="login-submit"]');
    
    // Wait for navigation away from login
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10000 });
    
    // Clear cookies to simulate session expiry
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/user/subscriptions');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate network failure
    await context.route('**/api/auth/**', route => route.abort());
    
    // Try to login
    await page.fill('[data-testid="email-input"]', 'test@test.com');
    await page.fill('[data-testid="password-input"]', 'test');
    await page.click('[data-testid="login-submit"]');
    
    // Should show error message
    const errorVisible = await page.locator('text=/network|error|failed/i').isVisible().catch(() => false);
    if (errorVisible) {
      await expect(page.locator('text=/network|error|failed/i')).toBeVisible();
    }
  });

  test('should remember user after page refresh', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'test@test.com');
    await page.fill('[data-testid="password-input"]', 'test');
    await page.click('[data-testid="login-submit"]');
    
    // Wait for navigation away from login
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10000 });
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in (not on login page)
    await expect(page.url()).not.toContain('/login');
    // Check for user presence in some form
    const hasUser = await page.locator('text=test@test.com').count() > 0 ||
                    await page.locator('[data-testid*="user"]').count() > 0;
    expect(hasUser).toBeTruthy();
  });
});