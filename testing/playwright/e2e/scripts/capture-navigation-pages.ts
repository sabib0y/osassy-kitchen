import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';

const screenshotDir = path.join(process.cwd(), 'testing/playwright/screenshots/review/baseline');

// Pages to capture from main navigation and site structure
const pagesToCapture = [
  // Main Navigation Pages
  { name: 'homepage', url: '/', description: 'Landing page with hero section' },
  { name: 'homepage-services', url: '/#services', description: 'Services section' },
  { name: 'homepage-menu', url: '/#menu', description: 'Menu preview section' },
  { name: 'homepage-contact', url: '/#contact', description: 'Contact section' },
  
  // Subscription Flow
  { name: 'subscriptions-list', url: '/subscriptions', description: 'Subscription landing' },
  { name: 'subscriptions-create', url: '/subscriptions/create', description: 'Create subscription' },
  
  // Blog Pages
  { name: 'blog', url: '/blog', description: 'Blog listing page' },
  { name: 'blog-details', url: '/blog-details', description: 'Blog article page' },
  
  // Auth Pages
  { name: 'login', url: '/login', description: 'Login page' },
  { name: 'signup', url: '/signup', description: 'Sign up page' },
  { name: 'profile', url: '/profile', description: 'User profile (may redirect)' },
  
  // User Dashboard Pages
  { name: 'user-dashboard', url: '/user/dashboard', description: 'User dashboard' },
  { name: 'user-orders', url: '/user/orders', description: 'Order history' },
  { name: 'user-profile', url: '/user/profile', description: 'Profile settings' },
  { name: 'user-payments', url: '/user/payments', description: 'Payment methods' },
  { name: 'user-subscriptions', url: '/user/subscriptions', description: 'Manage subscriptions' },
  
  // Admin Pages  
  { name: 'admin-dashboard', url: '/admin/dashboard', description: 'Admin dashboard' },
  { name: 'admin-orders', url: '/admin/orders', description: 'Order management' },
  { name: 'admin-menu', url: '/admin/menu', description: 'Menu management' },
  
  // Other Pages
  { name: 'success', url: '/success', description: 'Payment success page' },
  { name: 'cancel', url: '/cancel', description: 'Payment cancelled page' },
  { name: 'unauthorized', url: '/unauthorized', description: 'Unauthorized access page' },
];

async function captureAllPages() {
  console.log('🚀 Starting comprehensive page capture...\n');
  console.log(`📸 Will capture ${pagesToCapture.length} pages\n`);
  console.log('=' .repeat(60));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  
  // Disable animations for consistent screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });

  const results = [];
  const capturedScreenshots = [];

  for (const pageInfo of pagesToCapture) {
    console.log(`\n📄 Capturing: ${pageInfo.name}`);
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   ${pageInfo.description}`);
    
    try {
      // Navigate to page
      const response = await page.goto(`http://localhost:3000${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      // Wait a bit for any dynamic content
      await page.waitForTimeout(1000);

      // Check if page loaded successfully
      if (response && response.status() !== 200) {
        console.log(`   ⚠️  Status: ${response.status()}`);
      }

      // Take screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`   ✅ Screenshot saved`);
      
      capturedScreenshots.push({
        name: pageInfo.name,
        url: pageInfo.url,
        description: pageInfo.description,
        path: screenshotPath,
        status: 'captured',
      });

      results.push({
        page: pageInfo.name,
        status: 'success',
        statusCode: response?.status(),
      });

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        page: pageInfo.name,
        status: 'error',
        error: error.message,
      });
    }
  }

  await browser.close();

  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 CAPTURE SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  // Save manifest of captured screenshots
  const manifestPath = path.join(screenshotDir, 'manifest.json');
  await fs.writeFile(
    manifestPath,
    JSON.stringify(capturedScreenshots, null, 2)
  );
  console.log(`\n📋 Manifest saved to: ${manifestPath}`);
  
  // Group results by category
  console.log('\n📁 Pages by Category:');
  console.log('  Main Navigation: homepage, services, menu, contact');
  console.log('  Subscription: subscriptions list & create');
  console.log('  Blog: blog listing & article pages');
  console.log('  Auth: login, signup, profile');
  console.log('  User Dashboard: dashboard, orders, profile, payments');
  console.log('  Admin: dashboard, orders, menu management');
  
  if (failed > 0) {
    console.log('\n⚠️  Failed captures (may need authentication):');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`  - ${r.page}: ${r.error}`);
    });
  }

  console.log('\n✨ Screenshots saved to: testing/playwright/screenshots/review/baseline/');
}

// Run the capture
captureAllPages().catch(console.error);