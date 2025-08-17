import { chromium } from 'playwright';
import path from 'path';

const pages = [
  // Public Pages
  { name: 'homepage', url: '/', auth: false },
  { name: 'blog', url: '/blog', auth: false },
  
  // Auth Pages
  { name: 'login', url: '/login', auth: false },
  { name: 'signup', url: '/signup', auth: false },
  
  // User Pages (require auth)
  { name: 'user-dashboard', url: '/user/dashboard', auth: true },
  { name: 'subscription-create', url: '/subscriptions/create', auth: true },
  { name: 'user-orders', url: '/user/orders', auth: true },
  { name: 'user-profile', url: '/user/profile', auth: true },
  { name: 'user-payments', url: '/user/payments', auth: true },
  { name: 'user-subscriptions', url: '/user/subscriptions', auth: true },
  
  // Admin Pages (require admin auth)
  { name: 'admin-dashboard', url: '/admin/dashboard', auth: true },
  { name: 'admin-orders', url: '/admin/orders', auth: true },
  { name: 'admin-menu', url: '/admin/menu', auth: true },
];

async function captureAllPages() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('📸 Capturing screenshots of all pages...\n');
  
  // Login first if needed
  let loggedIn = false;
  
  for (const pageInfo of pages) {
    try {
      // Login if required and not already logged in
      if (pageInfo.auth && !loggedIn) {
        console.log('🔑 Logging in...');
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'test@test.com');
        await page.fill('input[type="password"]', 'test');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        loggedIn = true;
        console.log('✅ Logged in successfully\n');
      }
      
      console.log(`📸 Capturing: ${pageInfo.name}`);
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for animations to settle
      await page.waitForTimeout(1000);
      
      // Hide dynamic content for consistent screenshots
      await page.addStyleTag({
        content: `
          [data-testid*="timestamp"],
          [data-testid*="date"],
          .timestamp,
          .date-time {
            visibility: hidden !important;
          }
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      });
      
      const screenshotPath = path.join(
        process.cwd(),
        'testing/playwright/screenshots/review/baseline',
        `${pageInfo.name}.png`
      );
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      
      console.log(`  ✅ Saved: ${pageInfo.name}.png`);
      
    } catch (error) {
      console.error(`  ❌ Failed: ${pageInfo.name} - ${error.message}`);
    }
  }
  
  await browser.close();
  
  console.log('\n✨ Screenshot capture complete!');
  console.log('📁 Screenshots saved to: testing/playwright/screenshots/review/baseline/');
}

captureAllPages().catch(console.error);