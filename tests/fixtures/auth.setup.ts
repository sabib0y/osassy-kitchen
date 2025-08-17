/**
 * Authentication Setup for E2E Tests
 * Sets up authentication states for user and admin accounts
 * This file is executed as a dependency for projects requiring authentication
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { testUsers } from './data.fixture';

const authDir = path.join(__dirname, '.auth');
const userFile = path.join(authDir, 'user.json');
const adminFile = path.join(authDir, 'admin.json');

/**
 * Setup user authentication state
 */
setup('authenticate as user', async ({ page }) => {
  console.log('🔑 Setting up user authentication...');
  
  // Ensure .auth directory exists
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to login page
  await page.goto('/login');
  
  // Check if page loaded correctly
  await expect(page.locator('h1, h2')).toContainText(/sign in|login/i);
  
  // Fill in login credentials
  await page.fill('input[name="email"]', testUsers.existingUser.email);
  await page.fill('input[name="password"]', testUsers.existingUser.password);
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for successful login - should redirect to user dashboard
  await page.waitForURL('**/user/dashboard', { timeout: 15000 });
  
  // Verify we're logged in by checking for user-specific elements
  await expect(page.locator('[data-testid="user-header"], [data-testid="user-dashboard"], .user-dashboard, .dashboard')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: userFile });
  
  console.log('✅ User authentication state saved');
});

/**
 * Setup admin authentication state
 */
setup('authenticate as admin', async ({ page }) => {
  console.log('🔑 Setting up admin authentication...');
  
  // Ensure .auth directory exists
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to login page
  await page.goto('/login');
  
  // Check if page loaded correctly
  await expect(page.locator('h1, h2')).toContainText(/sign in|login/i);
  
  // Fill in admin credentials
  await page.fill('input[name="email"]', testUsers.adminUser.email);
  await page.fill('input[name="password"]', testUsers.adminUser.password);
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for successful login - should redirect to admin dashboard
  await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
  
  // Verify we're in the admin area
  await expect(page.locator('[data-testid="admin-layout"], [data-testid="admin-dashboard"], .admin-dashboard, .admin-layout')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: adminFile });
  
  console.log('✅ Admin authentication state saved');
});

/**
 * Setup test for creating a new user account if needed
 */
setup('ensure test user exists', async ({ page }) => {
  console.log('👤 Ensuring test user exists...');
  
  try {
    // Try to login with test user credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.existingUser.email);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.click('button[type="submit"]');
    
    // If login successful, user exists
    await page.waitForURL('**/user/dashboard', { timeout: 10000 });
    console.log('✅ Test user already exists');
    
  } catch (error) {
    // User doesn't exist, create new account
    console.log('Creating new test user account...');
    
    await page.goto('/signup');
    
    // Fill signup form
    await page.fill('input[name="firstName"]', testUsers.existingUser.firstName);
    await page.fill('input[name="lastName"]', testUsers.existingUser.lastName);
    await page.fill('input[name="email"]', testUsers.existingUser.email);
    await page.fill('input[name="password"]', testUsers.existingUser.password);
    await page.fill('input[name="confirmPassword"]', testUsers.existingUser.password);
    
    // Submit signup form
    await page.click('button[type="submit"]');
    
    // Wait for successful signup
    await page.waitForURL('**/user/dashboard', { timeout: 15000 });
    
    console.log('✅ Test user account created successfully');
  }
});

/**
 * Setup test for verifying admin user exists
 */
setup('verify admin user exists', async ({ page }) => {
  console.log('👑 Verifying admin user exists...');
  
  try {
    // Try to login with admin credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.adminUser.email);
    await page.fill('input[name="password"]', testUsers.adminUser.password);
    await page.click('button[type="submit"]');
    
    // If login successful, admin exists
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('✅ Admin user verified');
    
  } catch (error) {
    console.log('⚠️  Admin user not found. Please ensure admin user exists in the database.');
    console.log('Expected credentials:', {
      email: testUsers.adminUser.email,
      password: testUsers.adminUser.password
    });
    
    // Don't throw error as this might be expected in development
  }
});

/**
 * Utility function to clean up auth states
 */
export function cleanupAuthStates() {
  if (fs.existsSync(userFile)) {
    fs.unlinkSync(userFile);
  }
  if (fs.existsSync(adminFile)) {
    fs.unlinkSync(adminFile);
  }
  console.log('🧹 Authentication states cleaned up');
}

/**
 * Utility function to check if auth states exist
 */
export function authStatesExist() {
  return {
    user: fs.existsSync(userFile),
    admin: fs.existsSync(adminFile),
  };
}

/**
 * Utility function to force re-authentication
 */
export function forceReauth() {
  cleanupAuthStates();
  console.log('🔄 Authentication states cleared - will re-authenticate on next run');
}