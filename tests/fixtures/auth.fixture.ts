/**
 * Authentication Fixtures for E2E Tests
 * Provides reusable authentication contexts and utilities
 */

import { test as base, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export interface AuthFixtures {
  authenticatedPage: Page;
  adminPage: Page;
  loginAsUser: (email: string, password: string) => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context with saved storage state
    const storageStatePath = path.join(__dirname, '.auth', 'user.json');
    const context = await browser.newContext({
      storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    // Create a new context with admin storage state
    const storageStatePath = path.join(__dirname, '.auth', 'admin.json');
    const context = await browser.newContext({
      storageState: fs.existsSync(storageStatePath) ? storageStatePath : undefined,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  loginAsUser: async ({ page }, use) => {
    const login = async (email: string, password: string) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForURL('**/user/dashboard', { timeout: 10000 });
      
      // Verify we're logged in
      await expect(page.locator('[data-testid="user-header"]')).toBeVisible();
    };
    await use(login);
  },

  loginAsAdmin: async ({ page }, use) => {
    const loginAdmin = async () => {
      await page.goto('/login');
      await page.fill('input[name="email"]', process.env.ADMIN_EMAIL || 'admin@osassyskitchen.com');
      await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD || 'Admin123!');
      await page.click('button[type="submit"]');
      
      // Wait for admin dashboard
      await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
      
      // Verify we're in admin area
      await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible();
    };
    await use(loginAdmin);
  },

  logout: async ({ page }, use) => {
    const logout = async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL('**/login');
    };
    await use(logout);
  },
});

export { expect } from '@playwright/test';

/**
 * Setup authentication states for different user types
 */
export async function setupAuth(page: Page, userType: 'user' | 'admin') {
  const email = userType === 'admin' 
    ? process.env.ADMIN_EMAIL || 'admin@osassyskitchen.com'
    : process.env.TEST_USER_EMAIL || 'testuser@example.com';
  
  const password = userType === 'admin'
    ? process.env.ADMIN_PASSWORD || 'Admin123!'
    : process.env.TEST_USER_PASSWORD || 'Test123!';

  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  const expectedUrl = userType === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  await page.waitForURL(`**${expectedUrl}`, { timeout: 10000 });
  
  // Save storage state
  const storageStatePath = path.join(__dirname, '.auth', `${userType}.json`);
  await page.context().storageState({ path: storageStatePath });
}

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(cookie => cookie.name === 'next-auth.session-token');
}

/**
 * Helper to get current user info from page
 */
export async function getCurrentUser(page: Page) {
  const response = await page.request.get('/api/user/profile');
  if (response.ok()) {
    return await response.json();
  }
  return null;
}