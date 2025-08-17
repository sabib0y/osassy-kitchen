import { test, expect } from '@playwright/test';

test.describe('Debug Login', () => {
  test('test manual login with known credentials', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot before login
    await page.screenshot({ path: 'before-login.png' });
    
    // Fill in credentials
    await page.fill('input[type="email"], input#email', 'test@test.com');
    await page.fill('input[type="password"], input#password', 'test');
    
    // Take screenshot after filling
    await page.screenshot({ path: 'after-fill.png' });
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait a bit for any navigation
    await page.waitForTimeout(3000);
    
    // Log where we ended up
    console.log('After login URL:', page.url());
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login.png' });
    
    // Check if we're still on login page
    if (page.url().includes('/login')) {
      // Check for error messages
      const errorMessage = await page.textContent('body');
      console.log('Still on login page. Page content includes:', errorMessage?.substring(0, 500));
    } else {
      console.log('Successfully navigated to:', page.url());
    }
    
    // Don't assert anything - just observe
    expect(true).toBe(true);
  });
});