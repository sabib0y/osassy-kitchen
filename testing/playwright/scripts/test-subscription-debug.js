const { chromium } = require('playwright');

async function debugSubscriptions() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    devtools: true  // Open devtools
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });

  // Capture network requests
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        url: request.url(),
        method: request.method()
      });
    }
  });

  // Capture network responses
  const apiResponses = [];
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      apiResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('🔍 Debug mode: Checking subscriptions with detailed logging...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('   ✅ Logged in\n');

    // Clear previous logs
    consoleLogs.length = 0;
    apiCalls.length = 0;
    apiResponses.length = 0;

    // Step 2: Navigate to subscriptions page
    console.log('2️⃣ Navigating to subscriptions page...');
    await page.goto('http://localhost:3000/subscriptions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Print console logs
    console.log('\n📝 Console Logs:');
    if (consoleLogs.length === 0) {
      console.log('   No console messages');
    } else {
      consoleLogs.forEach(log => console.log(`   ${log}`));
    }
    
    // Print API calls
    console.log('\n🌐 API Calls Made:');
    if (apiCalls.length === 0) {
      console.log('   No API calls detected');
    } else {
      apiCalls.forEach(call => console.log(`   ${call.method} ${call.url}`));
    }
    
    // Print API responses
    console.log('\n📥 API Responses:');
    if (apiResponses.length === 0) {
      console.log('   No API responses');
    } else {
      apiResponses.forEach(resp => console.log(`   ${resp.status} ${resp.statusText} - ${resp.url}`));
    }
    
    // Check if React is loaded and what components are rendered
    const reactInfo = await page.evaluate(() => {
      const info = {
        hasReact: false,
        hasReactDOM: false,
        componentsFound: []
      };
      
      // Check for React
      if (window.React) info.hasReact = true;
      if (window.ReactDOM) info.hasReactDOM = true;
      
      // Try to find React components
      const allElements = document.querySelectorAll('*');
      const componentNames = new Set();
      
      allElements.forEach(el => {
        // Check for React internal properties
        const keys = Object.keys(el);
        const reactKey = keys.find(key => key.startsWith('__react'));
        if (reactKey) {
          const className = el.className || el.tagName;
          if (className) componentNames.add(className);
        }
      });
      
      info.componentsFound = Array.from(componentNames).slice(0, 10);
      return info;
    });
    
    console.log('\n⚛️ React Status:');
    console.log(`   React loaded: ${reactInfo.hasReact}`);
    console.log(`   ReactDOM loaded: ${reactInfo.hasReactDOM}`);
    if (reactInfo.componentsFound.length > 0) {
      console.log(`   Components found: ${reactInfo.componentsFound.join(', ')}`);
    }
    
    // Check page source for clues
    const pageSource = await page.content();
    console.log('\n📄 Page Content Analysis:');
    
    if (pageSource.includes('useEffect')) {
      console.log('   ✅ useEffect hook found in source');
    }
    
    if (pageSource.includes('fetchSubscriptions')) {
      console.log('   ✅ fetchSubscriptions function found');
    }
    
    if (pageSource.includes('/api/user/subscriptions')) {
      console.log('   ✅ API endpoint reference found');
    }
    
    // Check for hydration issues
    const hydrationCheck = await page.evaluate(() => {
      const root = document.getElementById('__next');
      return {
        hasNextRoot: !!root,
        rootChildren: root ? root.children.length : 0,
        bodyClasses: document.body.className
      };
    });
    
    console.log('\n🏗️ Next.js Status:');
    console.log(`   Has __next root: ${hydrationCheck.hasNextRoot}`);
    console.log(`   Root children: ${hydrationCheck.rootChildren}`);
    console.log(`   Body classes: ${hydrationCheck.bodyClasses || 'none'}`);
    
    // Try to manually trigger the fetch
    console.log('\n🔧 Attempting manual fetch...');
    const fetchResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/user/subscriptions');
        const data = await response.json();
        return {
          success: true,
          status: response.status,
          data: data
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    if (fetchResult.success) {
      console.log(`   ✅ Manual fetch successful: ${fetchResult.status}`);
      console.log(`   Subscriptions returned: ${fetchResult.data.subscriptions ? fetchResult.data.subscriptions.length : 0}`);
    } else {
      console.log(`   ❌ Manual fetch failed: ${fetchResult.error}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'testing/playwright/screenshots/debug-subscriptions.png' });
    
    console.log('\n✅ Debug completed! Check screenshot and dev tools.');
    console.log('   Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
}

// Run debug
debugSubscriptions();