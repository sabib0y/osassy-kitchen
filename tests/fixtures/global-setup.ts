/**
 * Global Setup for Playwright Tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { setupAuth } from './auth.fixture';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.test') });

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  
  try {
    // Setup user authentication state
    console.log('Setting up user authentication...');
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    
    // Check if test user exists, create if not
    await ensureTestUser(userPage, baseURL as string);
    await setupAuth(userPage, 'user');
    await userContext.close();
    
    // Setup admin authentication state
    console.log('Setting up admin authentication...');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Check if admin user exists
    await ensureAdminUser(adminPage, baseURL as string);
    await setupAuth(adminPage, 'admin');
    await adminContext.close();
    
    // Setup test data
    console.log('Setting up test data...');
    await setupTestData(baseURL as string);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Ensure test user exists in the database
 */
async function ensureTestUser(page: any, baseURL: string) {
  const testUserEmail = process.env.TEST_USER_EMAIL || 'test@test.com';
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'test';
  
  try {
    // Try to login first
    console.log(`Attempting to login as user: ${testUserEmail}`);
    await page.goto(`${baseURL}/login`);
    
    // Wait for page to load
    await page.waitForSelector('input[type="email"], input#email, input[name="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"], input#email, input[name="email"]', testUserEmail);
    await page.fill('input[type="password"], input#password, input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    
    // Wait for either success or error
    try {
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
      console.log('User login successful.');
    } catch (navError) {
      // Check if we got an error message instead
      const errorMessage = await page.locator('text=Invalid email or password').isVisible().catch(() => false);
      if (errorMessage) {
        console.log('User login failed - invalid credentials. User may not exist.');
        // Try to create user
        await page.goto(`${baseURL}/signup`);
        await page.waitForSelector('input[name="firstName"]', { timeout: 5000 });
        
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'User');
        await page.fill('input[name="email"]', testUserEmail);
        await page.fill('input[name="password"]', testUserPassword);
        await page.fill('input[name="confirmPassword"]', testUserPassword);
        await page.click('button[type="submit"]');
        
        // Wait for signup to complete
        await page.waitForURL('**/user/dashboard', { timeout: 15000 });
        console.log('Test user created successfully.');
      } else {
        console.log('User login failed but no error message found. Current URL:', page.url());
      }
    }
  } catch (error) {
    console.log('Test user setup failed:', error);
    console.log('Current URL:', page.url());
  }
}

/**
 * Ensure admin user exists in the database
 */
async function ensureAdminUser(page: any, baseURL: string) {
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'osasp419@gmail.com';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'test';
  
  try {
    // Try to login as admin
    console.log(`Attempting to login as admin: ${adminEmail}`);
    await page.goto(`${baseURL}/login`);
    
    // Wait for page to load
    await page.waitForSelector('input[type="email"], input#email, input[name="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"], input#email, input[name="email"]', adminEmail);
    await page.fill('input[type="password"], input#password, input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for either success or error
    try {
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
      console.log('Admin login successful.');
    } catch (navError) {
      console.log('Admin user login failed. Please ensure admin user exists with correct credentials.');
      console.log('Current URL:', page.url());
    }
  } catch (error) {
    console.log('Admin user setup failed:', error);
    console.log('Current URL:', page.url());
  }
}

/**
 * Setup initial test data
 */
async function setupTestData(baseURL: string) {
  try {
    // You can add API calls here to setup test data
    // For example, creating test menu items, subscriptions, etc.
    console.log('Test data setup completed');
  } catch (error) {
    console.log('Test data setup error:', error);
  }
}

export default globalSetup;
