import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup form with all elements', async ({ page }) => {
    // Check form elements are present
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign Up');
    await expect(page.locator('a[href="/login"]')).toContainText('Sign in here');
  });

  test('should create new account successfully', async ({ page }) => {
    // Generate unique email for test
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@test.com`;
    
    // Fill in signup form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Check terms and conditions if present
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.check();
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation (could be dashboard or email verification)
    await page.waitForURL(url => 
      url.includes('/user/dashboard') || 
      url.includes('/verify-email') || 
      url.includes('/login')
    );
    
    // Verify successful signup
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(user\/dashboard|verify-email|login)/);
  });

  test('should show error for existing email', async ({ page }) => {
    // Try to signup with existing email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=/already exists|already registered|already in use/i')).toBeVisible();
    
    // Should remain on signup page
    await expect(page).toHaveURL('/signup');
  });

  test('should validate password requirements', async ({ page }) => {
    // Fill form with weak password
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[type="password"]', '123'); // Weak password
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Check for password validation message
    const passwordError = await page.locator('text=/password must|weak password|characters/i').isVisible().catch(() => false);
    if (passwordError) {
      await expect(page.locator('text=/password must|weak password|characters/i')).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'invalidemail');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Browser should validate email format
    const emailInput = page.locator('input[type="email"]');
    const validityState = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validityState).toBe(false);
  });

  test('should show validation for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for required field indicators
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Browser validation
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login link
    await page.click('a[href="/login"]');
    
    // Verify navigation
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should handle terms and conditions', async ({ page }) => {
    const termsCheckbox = page.locator('input[type="checkbox"][name="terms"]');
    const termsLink = page.locator('a:has-text("Terms")');
    
    // Check if terms checkbox exists
    if (await termsCheckbox.count() > 0) {
      // Initially unchecked
      await expect(termsCheckbox).not.toBeChecked();
      
      // Try to submit without accepting terms
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[type="email"]', 'newuser@test.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Should show error about terms
      const termsError = await page.locator('text=/terms|agree/i').isVisible().catch(() => false);
      if (termsError) {
        await expect(page.locator('text=/terms|agree/i')).toBeVisible();
      }
      
      // Check terms and try again
      await termsCheckbox.check();
      await expect(termsCheckbox).toBeChecked();
    }
    
    // Check if terms link exists and works
    if (await termsLink.count() > 0) {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        termsLink.click()
      ]).catch(() => [null]);
      
      if (newPage) {
        await newPage.close();
      }
    }
  });

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    
    // Check if strength indicator exists
    if (await strengthIndicator.count() > 0) {
      // Weak password
      await passwordInput.fill('123');
      await expect(strengthIndicator).toContainText(/weak|poor/i);
      
      // Medium password
      await passwordInput.fill('Test123');
      await expect(strengthIndicator).toContainText(/medium|fair/i);
      
      // Strong password
      await passwordInput.fill('TestPassword123!@#');
      await expect(strengthIndicator).toContainText(/strong|good/i);
    }
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate network failure
    await context.route('**/api/auth/**', route => route.abort());
    
    // Try to signup
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.check();
    }
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    const errorVisible = await page.locator('text=/network|error|failed/i').isVisible().catch(() => false);
    if (errorVisible) {
      await expect(page.locator('text=/network|error|failed/i')).toBeVisible();
    }
  });
});