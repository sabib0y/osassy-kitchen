const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs/promises');

const screenshotDir = path.join(process.cwd(), 'testing/playwright/screenshots/ui-audit-quick');

// Key pages for UI review
const pagesToCapture = [
  // Public pages
  { name: 'homepage', url: '/', description: 'Homepage' },
  { name: 'login', url: '/login', description: 'Login page' },
  { name: 'signup', url: '/signup', description: 'Signup page' },
  
  // User authenticated pages (requires login)
  { name: 'user-dashboard', url: '/user/dashboard', description: 'User Dashboard', requiresAuth: true },
  { name: 'user-subscriptions', url: '/user/subscriptions', description: 'User Subscriptions', requiresAuth: true },
  { name: 'create-subscription', url: '/subscriptions/create', description: 'Create Subscription', requiresAuth: true },
  { name: 'user-orders', url: '/user/orders', description: 'User Orders', requiresAuth: true },
  { name: 'user-profile', url: '/user/profile', description: 'User Profile', requiresAuth: true },
  
  // Admin pages (requires admin login)
  { name: 'admin-dashboard', url: '/admin/dashboard', description: 'Admin Dashboard', requiresAdmin: true },
];

async function createScreenshotDirectory() {
  try {
    await fs.mkdir(screenshotDir, { recursive: true });
    console.log(`📁 Created screenshot directory: ${screenshotDir}`);
  } catch (error) {
    console.log(`📁 Screenshot directory exists: ${screenshotDir}`);
  }
}

async function loginAsUser(page, email, password, userType = 'user') {
  console.log(`🔐 Logging in as ${userType}...`);
  
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    
    // Click login button
    await page.click('button[type="submit"], .btn-primary, [role="button"]:has-text("Login")');
    
    // Wait for redirect or successful login
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/profile') || currentUrl.includes('/user/') || currentUrl.includes('/admin/') || currentUrl.includes('/dashboard')) {
      console.log(`✅ Successfully logged in as ${userType}`);
      return true;
    } else {
      console.log(`⚠️ Login may have failed, current URL: ${currentUrl}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Login failed: ${error.message}`);
    return false;
  }
}

async function captureScreenshot(page, pageInfo) {
  try {
    console.log(`📸 Capturing ${pageInfo.name}: ${pageInfo.url}`);
    
    await page.goto(`http://localhost:3000${pageInfo.url}`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });
    
    // Wait for page to settle
    await page.waitForTimeout(1500);
    
    // Take full-page screenshot
    const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    
    console.log(`   ✅ Saved to ${pageInfo.name}.png`);
    return { page: pageInfo.name, status: 'success' };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message.split('\n')[0]}`);
    return { page: pageInfo.name, status: 'failed', error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Quick UI Audit...\n');
  
  // Create screenshot directory
  await createScreenshotDirectory();
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);
  
  const results = [];
  let isLoggedIn = false;
  
  // Capture public pages first
  console.log('📋 Capturing public pages...');
  for (const pageInfo of pagesToCapture.filter(p => !p.requiresAuth && !p.requiresAdmin)) {
    const result = await captureScreenshot(page, pageInfo);
    results.push(result);
  }
  
  // Login and capture authenticated pages
  console.log('\n📋 Capturing authenticated pages...');
  isLoggedIn = await loginAsUser(page, 'test@test.com', 'test', 'user');
  
  if (isLoggedIn) {
    for (const pageInfo of pagesToCapture.filter(p => p.requiresAuth)) {
      const result = await captureScreenshot(page, pageInfo);
      results.push(result);
    }
  } else {
    console.log('⚠️ Skipping authenticated pages due to login failure');
    for (const pageInfo of pagesToCapture.filter(p => p.requiresAuth)) {
      results.push({ page: pageInfo.name, status: 'skipped', error: 'Login failed' });
    }
  }
  
  // Login as admin and capture admin pages
  console.log('\n📋 Capturing admin pages...');
  const isAdminLoggedIn = await loginAsUser(page, 'admin@osassyskitchen.com', 'admin123', 'admin');
  
  if (isAdminLoggedIn) {
    for (const pageInfo of pagesToCapture.filter(p => p.requiresAdmin)) {
      const result = await captureScreenshot(page, pageInfo);
      results.push(result);
    }
  } else {
    console.log('⚠️ Skipping admin pages due to admin login failure');
    for (const pageInfo of pagesToCapture.filter(p => p.requiresAdmin)) {
      results.push({ page: pageInfo.name, status: 'skipped', error: 'Admin login failed' });
    }
  }
  
  await browser.close();
  
  // Print summary
  console.log('\n📊 UI Audit Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  
  console.log(`✅ Captured: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Skipped: ${skipped}`);
  console.log(`📁 Screenshots saved to: ${screenshotDir}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed pages:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`   - ${r.page}: ${r.error}`);
    });
  }
  
  if (skipped > 0) {
    console.log('\n⚠️ Skipped pages:');
    results.filter(r => r.status === 'skipped').forEach(r => {
      console.log(`   - ${r.page}: ${r.error}`);
    });
  }
  
  console.log('\n🎯 Next steps:');
  console.log('1. Review screenshots in the ui-audit-quick folder');
  console.log('2. Identify pages needing UI polish');
  console.log('3. Make necessary improvements');
  console.log('4. Re-run this script to verify changes');
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});