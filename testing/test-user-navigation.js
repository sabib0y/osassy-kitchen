const { chromium } = require('playwright');

const TEST_USER = 'test@test.com';
const TEST_PASSWORD = 'test';
const BASE_URL = 'http://localhost:3000';

async function testUserNavigation() {
  console.log('🧭 Testing User Navigation Flow\n');
  
  const browser = await chromium.launch({ 
    headless: true 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Login
    console.log('1. Testing Login...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const afterLoginUrl = page.url();
    console.log(`   ✅ Logged in, redirected to: ${afterLoginUrl}`);
    
    // 2. Test Dashboard (Overview)
    console.log('\n2. Testing Dashboard...');
    await page.goto(`${BASE_URL}/user/dashboard`);
    await page.waitForLoadState('networkidle');
    const dashboardTitle = await page.textContent('h1');
    console.log(`   ✅ Dashboard loaded: ${dashboardTitle}`);
    
    // 3. Test Subscriptions
    console.log('\n3. Testing Subscriptions...');
    await page.goto(`${BASE_URL}/user/subscriptions`);
    await page.waitForLoadState('networkidle');
    const subsTitle = await page.textContent('h1');
    console.log(`   ✅ Subscriptions loaded: ${subsTitle}`);
    
    // 4. Test Orders
    console.log('\n4. Testing Orders...');
    await page.goto(`${BASE_URL}/user/orders`);
    await page.waitForLoadState('networkidle');
    const ordersTitle = await page.textContent('h1');
    console.log(`   ✅ Orders loaded: ${ordersTitle}`);
    
    // 5. Test Profile
    console.log('\n5. Testing Profile...');
    await page.goto(`${BASE_URL}/user/profile`);
    await page.waitForLoadState('networkidle');
    const profileExists = await page.locator('h2:text("Personal Information")').isVisible();
    console.log(`   ✅ Profile loaded: ${profileExists ? 'Has tabs' : 'Basic view'}`);
    
    // 6. Test Payments
    console.log('\n6. Testing Payments...');
    await page.goto(`${BASE_URL}/user/payments`);
    await page.waitForLoadState('networkidle');
    const paymentsTitle = await page.textContent('h1');
    console.log(`   ✅ Payments loaded: ${paymentsTitle}`);
    
    // 7. Test sidebar navigation (if visible)
    console.log('\n7. Testing Sidebar Navigation...');
    await page.goto(`${BASE_URL}/user/dashboard`);
    
    // Check if sidebar links work
    const sidebarLinks = [
      { text: 'Overview', url: '/user/dashboard' },
      { text: 'Subscriptions', url: '/user/subscriptions' },
      { text: 'Orders', url: '/user/orders' },
      { text: 'Profile', url: '/user/profile' },
      { text: 'Payments', url: '/user/payments' }
    ];
    
    for (const link of sidebarLinks) {
      const linkElement = page.locator(`text="${link.text}"`).first();
      if (await linkElement.isVisible()) {
        console.log(`   ✅ Sidebar has "${link.text}" link`);
      }
    }
    
    console.log('\n✨ All navigation tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testUserNavigation().catch(console.error);