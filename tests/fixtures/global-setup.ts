/**
 * Global Setup for Playwright Tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { setupAuth } from './auth.fixture';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

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
  const testUserEmail = process.env.TEST_USER_EMAIL || 'testuser@example.com';
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'Test123!';
  
  try {
    // Try to login first
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    
    // Check if login was successful
    const response = await page.waitForResponse(
      (resp: any) => resp.url().includes('/api/auth') && resp.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);
    
    if (!response) {
      // User doesn't exist, create it
      console.log('Creating test user...');
      await page.goto(`${baseURL}/signup`);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.fill('input[name="confirmPassword"]', testUserPassword);
      await page.click('button[type="submit"]');
      
      // Wait for signup to complete
      await page.waitForURL('**/user/dashboard', { timeout: 10000 });
    }
  } catch (error) {
    console.log('Test user setup:', error);
  }
}

/**
 * Ensure admin user exists in the database
 */
async function ensureAdminUser(page: any, baseURL: string) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@osassyskitchen.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  
  try {
    // Try to login as admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Check if login was successful
    const response = await page.waitForResponse(
      (resp: any) => resp.url().includes('/api/auth') && resp.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);
    
    if (!response) {
      console.log('Admin user not found. Please create admin user manually.');
    }
  } catch (error) {
    console.log('Admin user setup:', error);
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