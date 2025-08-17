import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';

const screenshotDir = path.join(process.cwd(), 'testing/playwright/screenshots/review/baseline');

// Priority pages to capture quickly
const pagesToCapture = [
  // Core Public Pages
  { name: 'homepage', url: '/', description: 'Landing page' },
  { name: 'subscriptions', url: '/subscriptions', description: 'Subscription page' },
  { name: 'blog', url: '/blog', description: 'Blog listing' },
  
  // Auth Flow
  { name: 'login', url: '/login', description: 'Login page' },
  { name: 'signup', url: '/signup', description: 'Sign up page' },
  
  // User Area
  { name: 'user-dashboard', url: '/user/dashboard', description: 'User dashboard' },
  { name: 'user-orders', url: '/user/orders', description: 'Order history' },
  { name: 'subscription-create', url: '/subscriptions/create', description: 'Create subscription' },
  
  // Admin Area
  { name: 'admin-dashboard', url: '/admin/dashboard', description: 'Admin dashboard' },
  { name: 'admin-orders', url: '/admin/orders', description: 'Order management' },
];

async function capturePages() {
  console.log('🚀 Quick capture of main pages...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  
  // Reduce timeout and use domcontentloaded instead of networkidle
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(5000);

  const results = [];

  for (const pageInfo of pagesToCapture) {
    console.log(`📸 ${pageInfo.name}: ${pageInfo.url}`);
    
    try {
      // Navigate with shorter timeout and less strict wait
      await page.goto(`http://localhost:3000${pageInfo.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      });

      // Quick wait for basic rendering
      await page.waitForTimeout(500);

      // Take screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false, // Just viewport for speed
      });

      console.log(`   ✅ Captured`);
      results.push({ page: pageInfo.name, status: 'success' });

    } catch (error: any) {
      console.log(`   ⚠️  Skipped (${error.message.split('\n')[0]})`);
      results.push({ page: pageInfo.name, status: 'skipped' });
    }
  }

  await browser.close();

  console.log('\n📊 Summary:');
  console.log(`✅ Captured: ${results.filter(r => r.status === 'success').length}/${results.length}`);
  console.log('📁 Screenshots saved to: testing/playwright/screenshots/review/baseline/');
}

capturePages().catch(console.error);