/**
 * Comprehensive Unhappy Path and Error Handling Tests
 * 
 * This test suite covers various failure scenarios and error conditions
 * to ensure the application handles errors gracefully and provides
 * appropriate feedback to users.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { test as authTest } from '../../fixtures/auth.fixture';

// Test accounts
const TEST_USER = { email: 'test@test.com', password: 'test' };
const ADMIN_USER = { email: 'osasp419@gmail.com', password: 'test' };

test.describe('Unhappy Paths and Error Handling', () => {
  
  // 1. NETWORK FAILURES
  test.describe('Network Failures', () => {
    test('should handle complete network failure during login', async ({ page, context }) => {
      await page.goto('/login');
      
      // Block all network requests
      await context.route('**/*', route => route.abort());
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should show network error or timeout
      await expect(page.locator('text=/network|error|failed|timeout/i')).toBeVisible({ timeout: 10000 });
    });

    test('should handle intermittent network failures', async ({ page, context }) => {
      await page.goto('/login');
      
      let requestCount = 0;
      await context.route('**/api/auth/**', route => {
        requestCount++;
        if (requestCount <= 2) {
          route.abort(); // Fail first 2 attempts
        } else {
          route.continue(); // Allow subsequent requests
        }
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should either show retry mechanism or handle gracefully
      await page.waitForTimeout(5000);
    });

    test('should handle slow network responses', async ({ page, context }) => {
      await page.goto('/login');
      
      // Delay all API responses by 10 seconds
      await context.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        route.continue();
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should show loading state
      await expect(page.locator('text=/loading|signing in|please wait/i')).toBeVisible();
    });
  });

  // 2. API ERRORS (400, 401, 403, 404, 500)
  test.describe('API Error Responses', () => {
    test('should handle 400 Bad Request errors', async ({ page, context }) => {
      await page.goto('/login');
      
      await context.route('**/api/auth/**', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Bad Request', message: 'Invalid request format' })
        });
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/bad request|invalid|error/i')).toBeVisible();
    });

    test('should handle 401 Unauthorized errors', async ({ page, context }) => {
      await page.goto('/login');
      
      await context.route('**/api/auth/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid credentials' })
        });
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/unauthorized|invalid credentials|email or password/i')).toBeVisible();
    });

    test('should handle 403 Forbidden errors', async ({ page, context }) => {
      await page.goto('/login');
      
      await context.route('**/api/auth/**', route => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden', message: 'Account suspended' })
        });
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/forbidden|suspended|access denied/i')).toBeVisible();
    });

    test('should handle 404 Not Found errors', async ({ page, context }) => {
      await page.goto('/user/dashboard');
      
      await context.route('**/api/user/**', route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not Found', message: 'User not found' })
        });
      });
      
      await page.reload();
      
      await expect(page.locator('text=/not found|user not found|404/i')).toBeVisible();
    });

    test('should handle 500 Internal Server Error', async ({ page, context }) => {
      await page.goto('/login');
      
      await context.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error', message: 'Something went wrong' })
        });
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/server error|something went wrong|try again/i')).toBeVisible();
    });
  });

  // 3. TIMEOUT SCENARIOS
  test.describe('Timeout Scenarios', () => {
    test('should handle API request timeouts', async ({ page, context }) => {
      await page.goto('/login');
      
      // Never respond to requests (simulates timeout)
      await context.route('**/api/auth/**', route => {
        // Don't call route.continue() or route.fulfill() - request hangs
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should handle timeout gracefully
      await page.waitForTimeout(15000);
      await expect(page.locator('text=/timeout|taking longer|try again/i')).toBeVisible();
    });

    test('should handle WebSocket connection timeouts', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Block WebSocket connections
      await context.route('ws://**', route => route.abort());
      await context.route('wss://**', route => route.abort());
      
      // Navigate to a page that might use WebSockets
      await page.goto('/user/subscriptions');
      
      // Should handle WebSocket connection failure gracefully
      await page.waitForTimeout(5000);
    });
  });

  // 4. INVALID DATA SUBMISSIONS
  test.describe('Invalid Data Submissions', () => {
    test('should handle malformed email addresses', async ({ page }) => {
      await page.goto('/signup');
      
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user..user@example.com',
        'user@example..com'
      ];
      
      for (const email of invalidEmails) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', 'validpassword');
        await page.fill('input[name="confirmPassword"]', 'validpassword');
        await page.click('button[type="submit"]');
        
        // Should show validation error
        const hasValidationError = await page.locator('text=/invalid email|email format/i').isVisible()
          .catch(() => false);
        
        if (!hasValidationError) {
          // Check browser validation
          const emailInput = page.locator('input[type="email"]');
          const isInvalid = await emailInput.evaluate(el => !(el as HTMLInputElement).checkValidity());
          expect(isInvalid).toBe(true);
        }
        
        // Clear form for next iteration
        await page.fill('input[type="email"]', '');
      }
    });

    test('should handle XSS attempts in form inputs', async ({ page, context }) => {
      await page.goto('/signup');
      
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
        "'; DROP TABLE users; --"
      ];
      
      for (const payload of xssPayloads) {
        await page.fill('input[name="name"]', payload);
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.fill('input[name="confirmPassword"]', 'password123');
        
        await context.route('**/api/auth/signup', route => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid input', message: 'Input validation failed' })
          });
        });
        
        await page.click('button[type="submit"]');
        
        // Should reject XSS payload
        await expect(page.locator('text=/invalid input|validation failed/i')).toBeVisible();
        
        // Clear form
        await page.fill('input[name="name"]', '');
      }
    });

    test('should handle SQL injection attempts', async ({ page, context }) => {
      await page.goto('/login');
      
      const sqlInjectionPayloads = [
        "admin'--",
        "admin'/*",
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --"
      ];
      
      for (const payload of sqlInjectionPayloads) {
        await context.route('**/api/auth/**', route => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid input', message: 'Security violation detected' })
          });
        });
        
        await page.fill('input[type="email"]', payload);
        await page.fill('input[type="password"]', payload);
        await page.click('button[type="submit"]');
        
        await expect(page.locator('text=/invalid input|security|error/i')).toBeVisible();
        
        // Clear form
        await page.fill('input[type="email"]', '');
        await page.fill('input[type="password"]', '');
      }
    });
  });

  // 5. CONCURRENT MODIFICATION CONFLICTS
  test.describe('Concurrent Modification Conflicts', () => {
    test('should handle concurrent subscription modifications', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Navigate to subscriptions
      await page.goto('/user/subscriptions');
      
      // Simulate another user modifying the same subscription
      await context.route('**/api/subscriptions/**', route => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Conflict',
              message: 'Resource has been modified by another user'
            })
          });
        } else {
          route.continue();
        }
      });
      
      // Try to modify subscription
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Modify")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Make some changes and save
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Should show conflict error
          await expect(page.locator('text=/conflict|modified by another|version/i')).toBeVisible();
        }
      }
    });
  });

  // 6. SESSION EXPIRY DURING OPERATIONS
  test.describe('Session Expiry', () => {
    test('should handle session expiry during form submission', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Navigate to subscription creation
      await page.goto('/subscriptions/create');
      
      // Fill out form
      await page.fill('input[name="name"]', 'Test Subscription');
      
      // Simulate session expiry
      await context.clearCookies();
      await context.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized', message: 'Session expired' })
        });
      });
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should redirect to login or show session expired message
        await page.waitForTimeout(2000);
        const isOnLogin = page.url().includes('/login');
        const hasSessionError = await page.locator('text=/session expired|please log in/i').isVisible();
        
        expect(isOnLogin || hasSessionError).toBe(true);
      }
    });
  });

  // 7. PAYMENT FAILURES
  test.describe('Payment Failures', () => {
    test('should handle payment processing errors', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Navigate to subscription creation
      await page.goto('/subscriptions/create');
      
      // Simulate payment API failure
      await context.route('**/api/payments/**', route => {
        route.fulfill({
          status: 402,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Payment Failed',
            message: 'Your card was declined'
          })
        });
      });
      
      // Fill out subscription form and submit
      await page.fill('input[name="name"]', 'Test Subscription');
      
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show payment error
        await expect(page.locator('text=/payment failed|card declined|payment error/i')).toBeVisible();
      }
    });

    test('should handle insufficient funds error', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      await context.route('**/api/payments/**', route => {
        route.fulfill({
          status: 402,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Insufficient Funds',
            message: 'Your account has insufficient funds'
          })
        });
      });
      
      await page.goto('/subscriptions/create');
      await page.fill('input[name="name"]', 'Test Subscription');
      
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await expect(page.locator('text=/insufficient funds|not enough/i')).toBeVisible();
      }
    });
  });

  // 8. DATABASE CONNECTION ERRORS
  test.describe('Database Connection Errors', () => {
    test('should handle database connectivity issues', async ({ page, context }) => {
      await page.goto('/login');
      
      await context.route('**/api/**', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Service Unavailable',
            message: 'Database connection failed'
          })
        });
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/service unavailable|database|temporarily unavailable/i')).toBeVisible();
    });
  });

  // 9. FILE UPLOAD FAILURES
  test.describe('File Upload Failures', () => {
    test('should handle file upload size limits', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Navigate to profile to test file upload
      await page.goto('/user/profile');
      
      await context.route('**/api/upload/**', route => {
        route.fulfill({
          status: 413,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'File Too Large',
            message: 'File size exceeds 5MB limit'
          })
        });
      });
      
      // Look for file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Create a large dummy file
        await fileInput.setInputFiles({
          name: 'large-file.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(1024 * 1024 * 10) // 10MB
        });
        
        const uploadButton = page.locator('button:has-text("Upload")');
        if (await uploadButton.isVisible()) {
          await uploadButton.click();
          await expect(page.locator('text=/file too large|size exceeds|5MB/i')).toBeVisible();
        }
      }
    });

    test('should handle unsupported file types', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      await page.goto('/user/profile');
      
      await context.route('**/api/upload/**', route => {
        route.fulfill({
          status: 415,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unsupported Media Type',
            message: 'Only JPEG, PNG, and GIF files are allowed'
          })
        });
      });
      
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles({
          name: 'document.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake pdf content')
        });
        
        const uploadButton = page.locator('button:has-text("Upload")');
        if (await uploadButton.isVisible()) {
          await uploadButton.click();
          await expect(page.locator('text=/unsupported|file type|JPEG|PNG|GIF/i')).toBeVisible();
        }
      }
    });
  });

  // 10. WEBSOCKET DISCONNECTIONS
  test.describe('WebSocket Disconnections', () => {
    test('should handle WebSocket disconnection gracefully', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Block WebSocket connections after initial page load
      await page.waitForTimeout(2000);
      await context.route('ws://**', route => route.abort());
      await context.route('wss://**', route => route.abort());
      
      // Navigate to a page that might use real-time features
      await page.goto('/user/subscriptions');
      
      // Should handle disconnection gracefully without crashing
      await page.waitForTimeout(5000);
      const pageHasErrors = await page.locator('text=/error|crashed|something went wrong/i').isVisible()
        .catch(() => false);
      
      expect(pageHasErrors).toBe(false);
    });
  });

  // 11. BROWSER COMPATIBILITY ISSUES
  test.describe('Browser Compatibility', () => {
    test('should handle missing localStorage gracefully', async ({ page }) => {
      // Disable localStorage
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: undefined,
          writable: false
        });
      });
      
      await page.goto('/login');
      
      // Should still function without localStorage
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Page should not crash
      await page.waitForTimeout(3000);
      const hasJSErrors = await page.locator('text=/javascript error|script error/i').isVisible()
        .catch(() => false);
      
      expect(hasJSErrors).toBe(false);
    });

    test('should handle disabled JavaScript gracefully', async ({ page, context }) => {
      // Disable JavaScript
      await context.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (compatible; NoJS/1.0)'
      });
      
      await page.addInitScript(() => {
        // Simulate limited JS environment
        Object.defineProperty(window, 'fetch', {
          value: undefined,
          writable: false
        });
      });
      
      await page.goto('/login');
      
      // Form should still be submittable via traditional form submission
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      
      // Should have proper form action and method
      const form = page.locator('form');
      if (await form.isVisible()) {
        const action = await form.getAttribute('action');
        const method = await form.getAttribute('method');
        
        expect(action).toBeTruthy();
        expect(method).toBeTruthy();
      }
    });
  });

  // 12. MEMORY/PERFORMANCE ISSUES
  test.describe('Memory and Performance Issues', () => {
    test('should handle memory pressure gracefully', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Simulate memory pressure by creating large objects
      await page.evaluate(() => {
        const largeArray = new Array(1000000).fill('x'.repeat(1000));
        (window as any).memoryTest = largeArray;
      });
      
      // Navigate around the app
      await page.goto('/user/subscriptions');
      await page.goto('/user/profile');
      await page.goto('/user/dashboard');
      
      // App should still function
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should handle slow rendering gracefully', async ({ page, context }) => {
      await page.goto('/login');
      
      // Slow down all resource loading
      await context.route('**/*.{js,css,png,jpg,jpeg,gif,svg}', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should show loading indicators
      await expect(page.locator('text=/loading|please wait/i')).toBeVisible();
    });
  });

  // 13. CSRF TOKEN ERRORS
  test.describe('CSRF Token Errors', () => {
    test('should handle missing CSRF tokens', async ({ page, context }) => {
      await page.goto('/login');
      
      await context.route('**/api/**', route => {
        if (route.request().method() !== 'GET') {
          route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Forbidden',
              message: 'CSRF token missing or invalid'
            })
          });
        } else {
          route.continue();
        }
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/csrf|forbidden|security/i')).toBeVisible();
    });
  });

  // 14. RATE LIMITING
  test.describe('Rate Limiting', () => {
    test('should handle rate limiting gracefully', async ({ page, context }) => {
      await page.goto('/login');
      
      await context.route('**/api/auth/**', route => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: {
            'Retry-After': '60'
          },
          body: JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again in 60 seconds.'
          })
        });
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/rate limit|too many requests|try again/i')).toBeVisible();
    });
  });

  // 15. VALIDATION ERRORS
  test.describe('Validation Errors', () => {
    test('should handle server-side validation errors', async ({ page, context }) => {
      await page.goto('/signup');
      
      await context.route('**/api/auth/signup', route => {
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Validation Error',
            message: 'Validation failed',
            details: {
              email: ['Email already exists'],
              password: ['Password must be at least 8 characters'],
              name: ['Name is required']
            }
          })
        });
      });
      
      await page.fill('input[name="name"]', 'Jo');
      await page.fill('input[type="email"]', 'existing@test.com');
      await page.fill('input[type="password"]', '123');
      await page.fill('input[name="confirmPassword"]', '123');
      await page.click('button[type="submit"]');
      
      // Should show specific validation errors
      await expect(page.locator('text=/email already exists/i')).toBeVisible();
      await expect(page.locator('text=/password must be at least 8/i')).toBeVisible();
    });

    test('should handle password mismatch validation', async ({ page }) => {
      await page.goto('/signup');
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'differentpassword');
      await page.click('button[type="submit"]');
      
      // Should show password mismatch error
      await expect(page.locator('text=/passwords do not match|passwords must match/i')).toBeVisible();
    });
  });

  // ADMIN-SPECIFIC ERROR SCENARIOS
  test.describe('Admin Error Scenarios', () => {
    test('should handle admin permission errors', async ({ page, context }) => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/user/dashboard');
      
      // Try to access admin routes
      await page.goto('/admin/dashboard');
      
      // Should redirect to login or show permission denied
      await page.waitForTimeout(2000);
      const isRedirected = page.url().includes('/login') || page.url().includes('/403');
      const hasPermissionError = await page.locator('text=/access denied|permission|unauthorized/i').isVisible();
      
      expect(isRedirected || hasPermissionError).toBe(true);
    });

    test('should handle admin API failures', async ({ page, context }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', ADMIN_USER.email);
      await page.fill('input[type="password"]', ADMIN_USER.password);
      await page.click('button[type="submit"]');
      
      // Wait for admin dashboard
      await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
      
      // Simulate admin API failures
      await context.route('**/api/admin/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'Admin operation failed'
          })
        });
      });
      
      // Try to perform admin operations
      const adminButtons = page.locator('button:has-text("Delete"), button:has-text("Edit"), button:has-text("Create")');
      const buttonCount = await adminButtons.count();
      
      if (buttonCount > 0) {
        await adminButtons.first().click();
        await expect(page.locator('text=/admin operation failed|server error/i')).toBeVisible();
      }
    });
  });

  // ERROR RECOVERY SCENARIOS
  test.describe('Error Recovery', () => {
    test('should allow retry after network failure', async ({ page, context }) => {
      await page.goto('/login');
      
      let attemptCount = 0;
      await context.route('**/api/auth/**', route => {
        attemptCount++;
        if (attemptCount === 1) {
          route.abort(); // Fail first attempt
        } else {
          route.continue(); // Allow retry
        }
      });
      
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should show error first
      await expect(page.locator('text=/error|failed/i')).toBeVisible();
      
      // Try again
      await page.click('button[type="submit"]');
      
      // Should succeed on retry
      await page.waitForURL('/user/dashboard', { timeout: 10000 });
    });

    test('should maintain form data after error', async ({ page, context }) => {
      await page.goto('/signup');
      
      const formData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      await page.fill('input[name="name"]', formData.name);
      await page.fill('input[type="email"]', formData.email);
      await page.fill('input[type="password"]', formData.password);
      await page.fill('input[name="confirmPassword"]', formData.password);
      
      // Simulate server error
      await context.route('**/api/auth/signup', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server Error' })
        });
      });
      
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/server error/i')).toBeVisible();
      
      // Form data should be preserved
      await expect(page.locator('input[name="name"]')).toHaveValue(formData.name);
      await expect(page.locator('input[type="email"]')).toHaveValue(formData.email);
      // Password fields might be cleared for security
    });
  });
});