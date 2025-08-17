import { chromium } from 'playwright';

async function checkConsoleErrors() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true  // Open devtools
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console messages
  const consoleMessages: any[] = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    
    if (msg.type() === 'error') {
      console.error('❌ Console Error:', msg.text());
    } else if (msg.type() === 'warning') {
      console.warn('⚠️ Console Warning:', msg.text());
    } else if (msg.type() === 'log') {
      console.log('📝 Console Log:', msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.error('🔥 Page Error:', error.message);
  });
  
  try {
    // Login first
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to subscription page
    console.log('\nNavigating to subscription page...');
    await page.goto('http://localhost:3000/subscriptions/create');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render
    await page.waitForTimeout(2000);
    
    // Check if menu items are rendered in DOM
    console.log('\n🔍 Checking DOM for menu items...');
    
    // Try different selectors
    const selectors = [
      '.dishCard',
      '[class*="dishCard"]',
      '.menu-item',
      '[data-testid*="menu"]',
      'div[class*="dish"]',
      'div[class*="menu"]'
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✅ Found ${count} elements with selector: ${selector}`);
      }
    }
    
    // Check what's actually in the dishes section
    const dishesSection = await page.locator('[class*="dishesSection"]').first();
    if (await dishesSection.count() > 0) {
      const innerHTML = await dishesSection.innerHTML();
      console.log('\n📦 Dishes section content length:', innerHTML.length);
      
      // Check if there's an empty state message
      const emptyState = await dishesSection.locator('[class*="emptyState"]').count();
      if (emptyState > 0) {
        console.log('  ⚠️ Empty state is showing');
        const emptyText = await dishesSection.locator('[class*="emptyState"]').textContent();
        console.log('  Empty state text:', emptyText);
      }
      
      // Check if loading skeleton is showing
      const skeleton = await dishesSection.locator('[class*="skeleton"]').count();
      if (skeleton > 0) {
        console.log('  ⏳ Loading skeleton is showing');
      }
    }
    
    // Log all console messages at the end
    console.log('\n📋 All Console Messages:');
    consoleMessages.forEach(msg => {
      console.log(`  [${msg.type}] ${msg.text}`);
    });
    
    // Keep browser open
    console.log('\n✨ Check the browser DevTools for more details');
    console.log('Press Ctrl+C to close...');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkConsoleErrors().catch(console.error);