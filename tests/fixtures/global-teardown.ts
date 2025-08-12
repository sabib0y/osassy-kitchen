/**
 * Global Teardown for Playwright Tests
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up test artifacts if needed
    const authDir = path.join(__dirname, '.auth');
    
    // Optionally clean up auth states (comment out to preserve between runs)
    // if (fs.existsSync(authDir)) {
    //   fs.rmSync(authDir, { recursive: true, force: true });
    //   console.log('Cleaned up authentication states');
    // }
    
    // Clean up test data from database if needed
    // await cleanupTestData();
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

/**
 * Clean up test data from database
 */
async function cleanupTestData() {
  // Add cleanup logic here if needed
  // For example, removing test users, orders, etc.
  console.log('Test data cleanup completed');
}

export default globalTeardown;