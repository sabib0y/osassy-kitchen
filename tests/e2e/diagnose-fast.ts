#!/usr/bin/env npx tsx

/**
 * Fast diagnostic script to identify test issues quickly
 */

import { chromium } from '@playwright/test';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'timeout';
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runQuickTest(
  name: string, 
  testFn: () => Promise<void>,
  timeout: number = 3000
): Promise<void> {
  const start = Date.now();
  
  try {
    await Promise.race([
      testFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), timeout)
      )
    ]);
    
    results.push({
      name,
      status: 'pass',
      duration: Date.now() - start
    });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const status = errorMsg === 'TIMEOUT' ? 'timeout' : 'fail';
    
    results.push({
      name,
      status,
      error: errorMsg,
      duration: Date.now() - start
    });
    console.log(`❌ ${name}: ${errorMsg} (${Date.now() - start}ms)`);
  }
}

async function diagnose() {
  console.log('🔍 Running fast diagnostic tests...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test 1: Basic connectivity
  await runQuickTest('Server responds', async () => {
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded' 
    });
    if (!response || response.status() >= 400) {
      throw new Error(`Server returned ${response?.status()}`);
    }
  });
  
  // Test 2: Login page loads
  await runQuickTest('Login page loads', async () => {
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'domcontentloaded' 
    });
    const emailInput = await page.locator('input[type="email"], input#email').count();
    if (emailInput === 0) {
      throw new Error('No email input found');
    }
  });
  
  // Test 3: Multiple H1 check
  await runQuickTest('Check H1 elements', async () => {
    await page.goto('http://localhost:3000/login');
    const h1Count = await page.locator('h1').count();
    if (h1Count > 1) {
      const h1Texts = await page.locator('h1').allTextContents();
      throw new Error(`Found ${h1Count} H1 elements: ${h1Texts.join(', ')}`);
    }
  });
  
  // Test 4: Form submission works
  await runQuickTest('Form can be submitted', async () => {
    await page.goto('http://localhost:3000/login');
    const submitButton = await page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    if (isDisabled) {
      throw new Error('Submit button is disabled by default');
    }
  });
  
  // Test 5: Quick login attempt
  await runQuickTest('Login attempt (valid credentials)', async () => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"], input#email', 'test@test.com');
    await page.fill('input[type="password"], input#password', 'test');
    
    // Just click, don't wait for navigation
    await page.click('button[type="submit"]');
    
    // Quick check - are we still on login after 2 seconds?
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes('/login')) {
      throw new Error('Still on login page after submission');
    }
  }, 5000); // Slightly longer timeout for login
  
  // Test 6: Invalid login error check
  await runQuickTest('Invalid login shows error', async () => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"], input#email', 'invalid@test.com');
    await page.fill('input[type="password"], input#password', 'wrongpass');
    await page.click('button[type="submit"]');
    
    // Wait briefly for error
    await page.waitForTimeout(1000);
    
    // Check for any error-like text
    const pageText = await page.textContent('body');
    const hasError = pageText?.toLowerCase().includes('error') || 
                     pageText?.toLowerCase().includes('invalid') ||
                     pageText?.toLowerCase().includes('incorrect');
    
    if (!hasError) {
      console.log('  ⚠️  No error message found in page text');
    }
  }, 5000);
  
  // Test 7: Signup link exists
  await runQuickTest('Signup link exists', async () => {
    await page.goto('http://localhost:3000/login');
    const signupLink = await page.locator('a[href="/signup"]').count();
    if (signupLink === 0) {
      throw new Error('No signup link found');
    }
  });
  
  // Test 8: Navigation to signup works
  await runQuickTest('Can navigate to signup', async () => {
    await page.goto('http://localhost:3000/login');
    await page.click('a[href="/signup"]');
    await page.waitForURL('**/signup', { timeout: 2000 });
  });
  
  // Test 9: Check for duplicate elements
  await runQuickTest('Check for duplicate email displays', async () => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"], input#email', 'test@test.com');
    await page.fill('input[type="password"], input#password', 'test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const emailCount = await page.locator('text=test@test.com').count();
    if (emailCount > 1) {
      throw new Error(`Email appears ${emailCount} times on page`);
    }
  }, 5000);
  
  await browser.close();
  
  // Summary
  console.log('\n📊 Diagnostic Summary:');
  console.log('═══════════════════════════════════════');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const timedOut = results.filter(r => r.status === 'timeout').length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Timed out: ${timedOut}/${results.length}`);
  console.log(`Total time: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
  
  console.log('\n🔧 Issues to fix:');
  results
    .filter(r => r.status !== 'pass')
    .forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  
  // Generate fix recommendations
  console.log('\n💡 Recommended fixes:');
  
  if (results.find(r => r.name.includes('H1') && r.status === 'fail')) {
    console.log('  1. Use more specific selector: h1:has-text("Welcome Back")');
  }
  
  if (results.find(r => r.name.includes('duplicate email') && r.status === 'fail')) {
    console.log('  2. Use :first selector or more specific locator for email text');
  }
  
  if (results.find(r => r.name.includes('Invalid login') && r.status === 'fail')) {
    console.log('  3. Update error message expectations or use partial text matching');
  }
  
  if (timedOut > 0) {
    console.log('  4. Increase timeouts or optimize selectors for faster execution');
  }
  
  process.exit(failed + timedOut > 0 ? 1 : 0);
}

// Run diagnostics
diagnose().catch(console.error);