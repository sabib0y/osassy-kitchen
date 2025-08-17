import { chromium } from '@playwright/test';
import { ReviewWorkflow, PageReviewConfig } from '../utils/review-workflow';

/**
 * Pages to review in order of priority
 */
const pagesToReview: PageReviewConfig[] = [
  // Authentication Pages (First Impression)
  {
    name: 'login',
    url: '/login',
    elements: [
      { selector: 'form', name: 'form' },
      { selector: '[type="submit"]', name: 'submit-button' },
    ],
    viewports: [
      { width: 375, height: 667, device: 'mobile' },
      { width: 768, height: 1024, device: 'tablet' },
    ],
    interactions: [
      { action: 'focus', selector: 'input[type="email"]', screenshot: 'email-focused' },
      { action: 'type', selector: 'input[type="email"]', value: 'invalid-email', screenshot: 'validation-error' },
    ],
  },
  {
    name: 'signup',
    url: '/signup',
    elements: [
      { selector: 'form', name: 'form' },
      { selector: '[type="submit"]', name: 'submit-button' },
    ],
    viewports: [
      { width: 375, height: 667, device: 'mobile' },
      { width: 768, height: 1024, device: 'tablet' },
    ],
  },
  {
    name: 'forgot-password',
    url: '/forgot-password',
    elements: [
      { selector: 'form', name: 'form' },
    ],
    viewports: [
      { width: 375, height: 667, device: 'mobile' },
    ],
  },

  // User Dashboard & Core Flows
  {
    name: 'user-dashboard',
    url: '/user/dashboard',
    elements: [
      { selector: '.stats-grid', name: 'stats-cards' },
      { selector: '.sidebar', name: 'navigation' },
    ],
    viewports: [
      { width: 375, height: 667, device: 'mobile' },
      { width: 768, height: 1024, device: 'tablet' },
    ],
  },
  {
    name: 'subscription-create',
    url: '/subscriptions/create',
    elements: [
      { selector: '.menu-grid', name: 'menu-items' },
      { selector: '.cart-summary', name: 'cart' },
    ],
    viewports: [
      { width: 375, height: 667, device: 'mobile' },
      { width: 768, height: 1024, device: 'tablet' },
    ],
    interactions: [
      { action: 'click', selector: '.add-to-cart:first-of-type', screenshot: 'item-selected' },
    ],
  },
  {
    name: 'user-orders',
    url: '/user/orders',
    elements: [
      { selector: '.orders-list', name: 'orders-table' },
      { selector: '.filters', name: 'filters' },
    ],
    viewports: [
      { width: 375, height: 667, device: 'mobile' },
    ],
  },
  {
    name: 'user-profile',
    url: '/user/profile',
    elements: [
      { selector: 'form', name: 'profile-form' },
    ],
    viewports: [
      { width: 375, height: 667, device: 'mobile' },
    ],
  },

  // Admin Pages
  {
    name: 'admin-dashboard',
    url: '/admin/dashboard',
    elements: [
      { selector: '.kpi-cards', name: 'metrics' },
      { selector: '.recent-orders', name: 'orders-table' },
      { selector: '.sidebar', name: 'navigation' },
    ],
    viewports: [
      { width: 768, height: 1024, device: 'tablet' },
    ],
  },
  {
    name: 'admin-orders',
    url: '/admin/orders',
    elements: [
      { selector: '.order-table', name: 'table' },
      { selector: '.filters', name: 'filters' },
    ],
  },
  {
    name: 'admin-menu',
    url: '/admin/menu',
    elements: [
      { selector: '.menu-grid', name: 'menu-items' },
      { selector: '.menu-filters', name: 'filters' },
    ],
  },
];

async function captureAllBaselines() {
  console.log('🚀 Starting baseline capture process...\n');
  console.log('This will capture the current state of all pages for review.');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  
  // Set up authentication if needed
  // await context.addCookies([...]); 
  
  const page = await context.newPage();
  const workflow = new ReviewWorkflow(page);

  const results = [];

  for (const pageConfig of pagesToReview) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${pageConfig.name}`);
      console.log(`${'='.repeat(60)}`);
      
      const screenshot = await workflow.captureBaseline(pageConfig);
      const report = await workflow.generateReviewReport(pageConfig.name);
      
      results.push({
        page: pageConfig.name,
        status: 'captured',
        screenshot,
        report,
      });
      
      console.log(`\n✅ Successfully captured ${pageConfig.name}`);
      
    } catch (error) {
      console.error(`\n❌ Error capturing ${pageConfig.name}:`, error);
      results.push({
        page: pageConfig.name,
        status: 'error',
        error: error.message,
      });
    }
  }

  await browser.close();

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CAPTURE SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'captured').length;
  const failed = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\nFailed pages:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`  - ${r.page}: ${r.error}`);
    });
  }
  
  console.log('\n📁 Screenshots saved to: testing/playwright/screenshots/review/baseline/');
  console.log('📄 Review reports saved to: testing/playwright/screenshots/review/reports/');
  console.log('\n🎯 Next step: Review the baseline screenshots and provide feedback for polish');
}

// Run the capture
captureAllBaselines().catch(console.error);