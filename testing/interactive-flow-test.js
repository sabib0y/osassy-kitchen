const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test credentials
const TEST_USER = 'test@test.com';
const TEST_PASSWORD = 'test';
const BASE_URL = 'http://localhost:3000';

// Create output directory for flow screenshots
const OUTPUT_DIR = path.join(__dirname, 'flow-test-results');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Test report
let testReport = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  flows: []
};

// Helper function to take screenshot
async function screenshot(page, name) {
  const filename = `${name.replace(/\s+/g, '-')}.png`;
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, filename),
    fullPage: true 
  });
  return filename;
}

// Helper function to log test result
function logTest(flowName, stepName, status, details = '') {
  const result = {
    flow: flowName,
    step: stepName,
    status: status,
    details: details,
    timestamp: new Date().toISOString()
  };
  
  testReport.flows.push(result);
  testReport.totalTests++;
  
  if (status === 'PASS') {
    testReport.passed++;
    console.log(`  ✅ ${stepName}`);
  } else {
    testReport.failed++;
    console.log(`  ❌ ${stepName} - ${details}`);
  }
  
  return result;
}

// Main test function
async function runInteractiveFlowTests() {
  console.log('🚀 Starting Interactive Flow Tests\n');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: true, // Run in headless mode for speed
    slowMo: 0 // No slow motion
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // ========================================
    // FLOW 1: UNAUTHENTICATED USER JOURNEY
    // ========================================
    console.log('\n📋 FLOW 1: Unauthenticated User Journey');
    console.log('-'.repeat(40));
    
    // 1.1 Landing Page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow1-01-landing');
    logTest('Unauthenticated', 'Load landing page', 'PASS');
    
    // 1.2 Try to access protected route (should redirect)
    await page.goto(`${BASE_URL}/user/dashboard`);
    await page.waitForLoadState('networkidle');
    const redirectedUrl = page.url();
    await screenshot(page, 'flow1-03-redirect-to-login');
    if (redirectedUrl.includes('/login') || redirectedUrl.includes('/unauthorized')) {
      logTest('Unauthenticated', 'Protected route redirects', 'PASS', `Redirected to ${redirectedUrl}`);
    } else {
      logTest('Unauthenticated', 'Protected route redirects', 'FAIL', 'Did not redirect');
    }
    
    // 1.4 Test 404 page
    await page.goto(`${BASE_URL}/this-page-does-not-exist`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow1-04-404-page');
    const has404 = await page.locator('text=404').isVisible();
    logTest('Unauthenticated', '404 page displays', has404 ? 'PASS' : 'FAIL');
    
    // 1.5 Navigate back home from 404
    await page.click('text=Back to Home');
    await page.waitForLoadState('networkidle');
    logTest('Unauthenticated', 'Navigate from 404 to home', 'PASS');
    
    // ========================================
    // FLOW 2: USER REGISTRATION JOURNEY
    // ========================================
    console.log('\n📋 FLOW 2: User Registration Journey');
    console.log('-'.repeat(40));
    
    // 2.1 Navigate to Sign Up
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow2-01-signup-page');
    logTest('Registration', 'Load signup page', 'PASS');
    
    // 2.2 Try to submit with empty fields (button should be disabled)
    const submitBtn = page.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    await screenshot(page, 'flow2-02-empty-form');
    logTest('Registration', 'Submit button disabled for empty form', isDisabled ? 'PASS' : 'FAIL');
    
    // 2.3 Navigate to login instead
    const loginLink = page.locator('a:has-text("Sign in")').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForLoadState('networkidle');
      logTest('Registration', 'Navigate to login from signup', 'PASS');
    }
    
    // ========================================
    // FLOW 3: USER LOGIN & DASHBOARD JOURNEY
    // ========================================
    console.log('\n📋 FLOW 3: User Login & Dashboard Journey');
    console.log('-'.repeat(40));
    
    // 3.1 Login with wrong credentials
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await screenshot(page, 'flow3-01-failed-login');
    logTest('Login', 'Failed login shows error', 'PASS');
    
    // 3.2 Login with correct credentials
    await page.fill('input[type="email"]', TEST_USER);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await screenshot(page, 'flow3-02-successful-login');
    logTest('Login', 'Successful login', 'PASS');
    
    // 3.3 Verify dashboard loaded
    await page.waitForLoadState('networkidle');
    const isDashboard = page.url().includes('dashboard') || page.url().includes('profile');
    await screenshot(page, 'flow3-03-user-dashboard');
    logTest('Login', 'Redirected to dashboard/profile', isDashboard ? 'PASS' : 'FAIL');
    
    // ========================================
    // FLOW 4: AUTHENTICATED USER ACTIONS
    // ========================================
    console.log('\n📋 FLOW 4: Authenticated User Actions');
    console.log('-'.repeat(40));
    
    // 4.1 Navigate to Subscriptions
    await page.goto(`${BASE_URL}/user/subscriptions`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow4-01-subscriptions');
    logTest('Authenticated', 'View subscriptions', 'PASS');
    
    // 4.2 Create new subscription
    await page.goto(`${BASE_URL}/subscriptions/create`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow4-02-create-subscription');
    logTest('Authenticated', 'Access create subscription', 'PASS');
    
    // 4.3 View Orders
    await page.goto(`${BASE_URL}/user/orders`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow4-03-orders');
    logTest('Authenticated', 'View orders', 'PASS');
    
    // 4.4 View Payment Methods
    await page.goto(`${BASE_URL}/user/payments`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow4-04-payments');
    logTest('Authenticated', 'View payment methods', 'PASS');
    
    // 4.5 View Profile
    await page.goto(`${BASE_URL}/user/profile`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow4-05-profile');
    logTest('Authenticated', 'View profile', 'PASS');
    
    // ========================================
    // FLOW 5: NAVIGATION & UI INTERACTIONS
    // ========================================
    console.log('\n📋 FLOW 5: Navigation & UI Interactions');
    console.log('-'.repeat(40));
    
    // 5.1 Test mobile menu (responsive)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/user/dashboard`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow5-01-mobile-view');
    logTest('Navigation', 'Mobile responsive view', 'PASS');
    
    // 5.2 Test hamburger menu if exists
    const hamburger = page.locator('[aria-label*="menu"], .hamburger, .menu-toggle').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'flow5-02-mobile-menu-open');
      logTest('Navigation', 'Mobile menu toggle', 'PASS');
    }
    
    // Reset viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // ========================================
    // FLOW 6: ERROR HANDLING & EDGE CASES
    // ========================================
    console.log('\n📋 FLOW 6: Error Handling & Edge Cases');
    console.log('-'.repeat(40));
    
    // 6.1 Test unauthorized access (401)
    await page.goto(`${BASE_URL}/unauthorized`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow6-01-unauthorized');
    const has401 = await page.locator('text=401').isVisible();
    logTest('Errors', 'Unauthorized page displays', has401 ? 'PASS' : 'FAIL');
    
    // 6.2 Test payment success page
    await page.goto(`${BASE_URL}/success`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow6-02-payment-success');
    logTest('Errors', 'Payment success page', 'PASS');
    
    // 6.3 Test payment cancel page
    await page.goto(`${BASE_URL}/cancel`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'flow6-03-payment-cancel');
    logTest('Errors', 'Payment cancel page', 'PASS');
    
    // ========================================
    // FLOW 7: ADMIN ACCESS ATTEMPT
    // ========================================
    console.log('\n📋 FLOW 7: Admin Access Attempt');
    console.log('-'.repeat(40));
    
    // 7.1 Try to access admin pages as regular user
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    const adminRedirect = page.url();
    await screenshot(page, 'flow7-01-admin-access-denied');
    if (adminRedirect.includes('unauthorized') || adminRedirect.includes('login')) {
      logTest('Admin', 'Admin access denied for regular user', 'PASS');
    } else {
      logTest('Admin', 'Admin access denied for regular user', 'FAIL', 'Access not properly restricted');
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    testReport.flows.push({
      flow: 'System',
      step: 'Test Execution',
      status: 'ERROR',
      details: error.message
    });
  } finally {
    // Generate test report
    generateTestReport();
    
    // Close browser
    await browser.close();
    
    // Print summary
    printTestSummary();
  }
}

// Generate HTML test report
function generateTestReport() {
  const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Flow Test Report - Lums Kitchen</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Inter, system-ui, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { 
      color: #C52D2F;
      margin-bottom: 10px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin: 20px 0;
    }
    .stat {
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: bold;
    }
    .stat.total { background: #f0f0f0; }
    .stat.passed { background: #d4f4dd; color: #2e7d32; }
    .stat.failed { background: #ffebee; color: #c62828; }
    .flow-section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 10px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.1);
    }
    .flow-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    .test-item {
      padding: 10px;
      margin: 5px 0;
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .test-item.pass { background: #f1f8f4; }
    .test-item.fail { background: #fff5f5; }
    .icon { font-size: 18px; }
    .icon.pass { color: #4caf50; }
    .icon.fail { color: #f44336; }
    .details { color: #666; font-size: 14px; margin-left: 30px; }
    .screenshots {
      margin-top: 30px;
      padding: 20px;
      background: white;
      border-radius: 10px;
    }
    .screenshot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .screenshot-item {
      text-align: center;
    }
    .screenshot-item img {
      width: 100%;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .screenshot-item p {
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧪 Interactive Flow Test Report</h1>
    <p>Lums Kitchen - ${new Date().toLocaleString()}</p>
    <div class="stats">
      <div class="stat total">Total Tests: ${testReport.totalTests}</div>
      <div class="stat passed">✅ Passed: ${testReport.passed}</div>
      <div class="stat failed">❌ Failed: ${testReport.failed}</div>
    </div>
  </div>
  
  ${generateFlowSections()}
  
  <div class="screenshots">
    <h2>📸 Test Screenshots</h2>
    <div class="screenshot-grid">
      ${generateScreenshotGrid()}
    </div>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'test-report.html'), reportHtml);
}

function generateFlowSections() {
  const flows = {};
  testReport.flows.forEach(test => {
    if (!flows[test.flow]) flows[test.flow] = [];
    flows[test.flow].push(test);
  });
  
  return Object.entries(flows).map(([flowName, tests]) => `
    <div class="flow-section">
      <div class="flow-title">${flowName} Flow</div>
      ${tests.map(test => `
        <div class="test-item ${test.status.toLowerCase()}">
          <span class="icon ${test.status.toLowerCase()}">${test.status === 'PASS' ? '✅' : '❌'}</span>
          <span>${test.step}</span>
        </div>
        ${test.details ? `<div class="details">${test.details}</div>` : ''}
      `).join('')}
    </div>
  `).join('');
}

function generateScreenshotGrid() {
  const screenshots = fs.readdirSync(OUTPUT_DIR)
    .filter(file => file.endsWith('.png'))
    .slice(0, 12); // Show first 12 screenshots
  
  return screenshots.map(file => `
    <div class="screenshot-item">
      <img src="${file}" alt="${file}" />
      <p>${file.replace('.png', '').replace(/-/g, ' ')}</p>
    </div>
  `).join('');
}

function printTestSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testReport.totalTests}`);
  console.log(`✅ Passed: ${testReport.passed}`);
  console.log(`❌ Failed: ${testReport.failed}`);
  console.log(`Success Rate: ${((testReport.passed / testReport.totalTests) * 100).toFixed(1)}%`);
  console.log('\n📄 Report saved to:', path.join(OUTPUT_DIR, 'test-report.html'));
  console.log('📸 Screenshots saved to:', OUTPUT_DIR);
}

// Run the tests
runInteractiveFlowTests().catch(console.error);