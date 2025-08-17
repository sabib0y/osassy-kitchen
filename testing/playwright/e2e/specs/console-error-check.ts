import { test, expect, Page } from '@playwright/test';

/**
 * Console Error Detection Test
 * Specifically focuses on detecting Link component errors in the browser console
 */

test.describe('Console Error Detection', () => {
  
  test('Detect Link component errors across key pages', async ({ page }) => {
    const allConsoleErrors: any[] = [];
    const linkErrors: any[] = [];
    
    // Capture all console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorInfo = {
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        };
        
        allConsoleErrors.push(errorInfo);
        
        // Check for Link component specific errors
        const errorText = msg.text().toLowerCase();
        if (errorText.includes('invalid') && errorText.includes('link') ||
            errorText.includes('failed prop type') && errorText.includes('link') ||
            errorText.includes('warning') && errorText.includes('link') ||
            errorText.includes('anchor') && errorText.includes('link') ||
            errorText.includes('button') && errorText.includes('link') ||
            errorText.includes('nested') && errorText.includes('element')) {
          linkErrors.push(errorInfo);
        }
      }
    });
    
    // Test key pages that were previously problematic
    const pagesToTest = [
      { name: 'Homepage', url: 'http://localhost:3000' },
      { name: 'Subscriptions Page', url: 'http://localhost:3000/user/subscriptions' },
      { name: 'Login Page', url: 'http://localhost:3000/login' },
    ];
    
    for (const pageInfo of pagesToTest) {
      console.log(`\n🔍 Testing ${pageInfo.name}...`);
      
      const errorsBefore = allConsoleErrors.length;
      const linkErrorsBefore = linkErrors.length;
      
      await page.goto(pageInfo.url);
      await page.waitForTimeout(3000);
      
      const errorsAfter = allConsoleErrors.length;
      const linkErrorsAfter = linkErrors.length;
      
      const newErrors = errorsAfter - errorsBefore;
      const newLinkErrors = linkErrorsAfter - linkErrorsBefore;
      
      console.log(`   Console errors detected: ${newErrors}`);
      console.log(`   Link errors detected: ${newLinkErrors}`);
      
      if (newLinkErrors > 0) {
        console.log('   ❌ Link errors found on this page!');
        linkErrors.slice(linkErrorsBefore).forEach((error, index) => {
          console.log(`      Error ${index + 1}: ${error.text}`);
        });
      } else {
        console.log('   ✅ No Link errors detected');
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('CONSOLE ERROR DETECTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total console errors detected: ${allConsoleErrors.length}`);
    console.log(`Total Link component errors: ${linkErrors.length}`);
    
    if (linkErrors.length > 0) {
      console.log('\n❌ LINK COMPONENT ERRORS DETECTED:');
      linkErrors.forEach((error, index) => {
        console.log(`\nLink Error ${index + 1}:`);
        console.log(`  Message: ${error.text}`);
        console.log(`  File: ${error.location?.url || 'Unknown'}`);
        console.log(`  Line: ${error.location?.lineNumber || 'Unknown'}`);
        console.log(`  Time: ${error.timestamp}`);
      });
    } else {
      console.log('\n✅ NO LINK COMPONENT ERRORS DETECTED!');
      console.log('All Link components are working correctly.');
    }
    
    // Assert no Link errors
    expect(linkErrors.length, `Found ${linkErrors.length} Link component errors`).toBe(0);
  });
});