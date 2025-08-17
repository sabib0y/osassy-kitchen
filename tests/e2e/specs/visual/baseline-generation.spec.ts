import { test, expect } from '@playwright/test';
import { VisualTestHelper, PageVisualHelpers } from '../../helpers/visual-helper';

/**
 * Baseline Generation Tests - Osassy's Kitchen
 * 
 * This test suite generates baseline images for visual regression testing.
 * 
 * Usage:
 * - Generate all baselines: npx playwright test baseline-generation --config=tests/e2e/visual.config.ts --update-snapshots
 * - Generate specific page: npx playwright test baseline-generation --grep "Login Page" --update-snapshots
 * - Regenerate after changes: npx playwright test baseline-generation --update-snapshots
 * 
 * Environment Variables:
 * - GENERATE_BASELINES=true - Enable baseline generation mode
 * - VISUAL_DEBUG=true - Enable debug logging
 */

// Skip baseline generation unless explicitly enabled
test.describe.configure({ mode: 'serial' });

const BASELINE_PAGES = [
  {
    name: 'Landing Page',
    path: '/',
    requiresAuth: false,
    requiresAdmin: false,
    prepare: null,
  },
  {
    name: 'Login Page',
    path: '/login',
    requiresAuth: false,
    requiresAdmin: false,
    prepare: PageVisualHelpers.prepareLoginPage,
  },
  {
    name: 'Signup Page',
    path: '/signup',
    requiresAuth: false,
    requiresAdmin: false,
    prepare: PageVisualHelpers.prepareLoginPage,
  },
  {
    name: 'How It Works',
    path: '/how-it-works',
    requiresAuth: false,
    requiresAdmin: false,
    prepare: null,
  },
  {
    name: 'Menu Page',
    path: '/menu',
    requiresAuth: false,
    requiresAdmin: false,
    prepare: null,
  },
  {
    name: '404 Page',
    path: '/non-existent-page',
    requiresAuth: false,
    requiresAdmin: false,
    prepare: null,
  },
  {
    name: 'User Dashboard',
    path: '/user/dashboard',
    requiresAuth: true,
    requiresAdmin: false,
    prepare: PageVisualHelpers.prepareDashboardPage,
  },
  {
    name: 'User Profile',
    path: '/user/profile',
    requiresAuth: true,
    requiresAdmin: false,
    prepare: null,
  },
  {
    name: 'User Orders',
    path: '/user/orders',
    requiresAuth: true,
    requiresAdmin: false,
    prepare: PageVisualHelpers.prepareOrdersPage,
  },
  {
    name: 'User Subscriptions',
    path: '/user/subscriptions',
    requiresAuth: true,
    requiresAdmin: false,
    prepare: null,
  },
  {
    name: 'Create Subscription',
    path: '/subscriptions/create',
    requiresAuth: true,
    requiresAdmin: false,
    prepare: null,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin/dashboard',
    requiresAuth: true,
    requiresAdmin: true,
    prepare: PageVisualHelpers.prepareDashboardPage,
  },
  {
    name: 'Admin Orders',
    path: '/admin/orders',
    requiresAuth: true,
    requiresAdmin: true,
    prepare: PageVisualHelpers.prepareOrdersPage,
  },
  {
    name: 'Admin Menu',
    path: '/admin/menu',
    requiresAuth: true,
    requiresAdmin: true,
    prepare: PageVisualHelpers.prepareMenuPage,
  },
];

const RESPONSIVE_VIEWPORTS = [
  VisualTestHelper.VIEWPORTS.DESKTOP,
  VisualTestHelper.VIEWPORTS.TABLET,
  VisualTestHelper.VIEWPORTS.MOBILE,
];

test.describe('Baseline Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent baselines
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        
        /* Disable CSS transitions globally */
        .transition-all,
        .transition,
        [class*="transition-"] {
          transition: none !important;
        }
        
        /* Disable loading spinners and skeletons */
        .animate-spin,
        .animate-pulse,
        [class*="animate-"] {
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
    });

    // Set consistent datetime for reproducible screenshots
    await page.addInitScript(() => {
      // Override Date to return consistent timestamps
      const mockDate = new Date('2024-01-15T12:00:00.000Z');
      const OriginalDate = Date;
      
      (global as any).Date = class extends OriginalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate.getTime());
          } else {
            super(...args);
          }
        }
        
        static now() {
          return mockDate.getTime();
        }
        
        static parse(dateString: string) {
          return OriginalDate.parse(dateString);
        }
        
        static UTC(...args: any[]) {
          return OriginalDate.UTC(...args);
        }
      };
    });
  });

  // Generate baselines for public pages (no authentication required)
  test.describe('Public Pages', () => {
    BASELINE_PAGES.filter(page => !page.requiresAuth).forEach(pageConfig => {
      test(`Generate baseline for ${pageConfig.name}`, async ({ page }) => {
        const visualHelper = new VisualTestHelper(page, 'baseline');
        
        console.log(`📸 Generating baselines for ${pageConfig.name} at ${pageConfig.path}`);
        
        await page.goto(pageConfig.path);
        
        if (pageConfig.prepare) {
          await pageConfig.prepare(page);
        } else {
          await visualHelper.waitForPageStable();
        }
        
        // Generate responsive baselines
        for (const viewport of RESPONSIVE_VIEWPORTS) {
          await visualHelper.setViewport(viewport);
          
          const screenshotName = `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}`;
          await visualHelper.compareScreenshot(screenshotName, {
            threshold: 0.1,
            maxDiffPixels: 50,
          });
          
          console.log(`  ✓ Generated ${viewport.name} baseline`);
        }
      });
    });
  });

  // Generate baselines for authenticated user pages
  test.describe('User Pages', () => {
    test.use({ storageState: 'tests/fixtures/.auth/user.json' });
    
    BASELINE_PAGES.filter(page => page.requiresAuth && !page.requiresAdmin).forEach(pageConfig => {
      test(`Generate baseline for ${pageConfig.name}`, async ({ page }) => {
        const visualHelper = new VisualTestHelper(page, 'baseline');
        
        console.log(`📸 Generating baselines for ${pageConfig.name} at ${pageConfig.path}`);
        
        await page.goto(pageConfig.path);
        
        if (pageConfig.prepare) {
          await pageConfig.prepare(page);
        } else {
          await visualHelper.waitForPageStable();
        }
        
        // Generate responsive baselines
        for (const viewport of RESPONSIVE_VIEWPORTS) {
          await visualHelper.setViewport(viewport);
          
          const screenshotName = `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}`;
          await visualHelper.compareScreenshot(screenshotName, {
            threshold: 0.1,
            maxDiffPixels: 50,
          });
          
          console.log(`  ✓ Generated ${viewport.name} baseline`);
        }
      });
    });
  });

  // Generate baselines for admin pages
  test.describe('Admin Pages', () => {
    test.use({ storageState: 'tests/fixtures/.auth/admin.json' });
    
    BASELINE_PAGES.filter(page => page.requiresAdmin).forEach(pageConfig => {
      test(`Generate baseline for ${pageConfig.name}`, async ({ page }) => {
        const visualHelper = new VisualTestHelper(page, 'baseline');
        
        console.log(`📸 Generating baselines for ${pageConfig.name} at ${pageConfig.path}`);
        
        await page.goto(pageConfig.path);
        
        if (pageConfig.prepare) {
          await pageConfig.prepare(page);
        } else {
          await visualHelper.waitForPageStable();
        }
        
        // Generate responsive baselines (admin pages typically desktop-focused)
        const adminViewports = [
          VisualTestHelper.VIEWPORTS.DESKTOP,
          VisualTestHelper.VIEWPORTS.TABLET,
        ];
        
        for (const viewport of adminViewports) {
          await visualHelper.setViewport(viewport);
          
          const screenshotName = `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}`;
          await visualHelper.compareScreenshot(screenshotName, {
            threshold: 0.1,
            maxDiffPixels: 50,
          });
          
          console.log(`  ✓ Generated ${viewport.name} baseline`);
        }
      });
    });
  });

  // Generate component-specific baselines
  test.describe('Component Baselines', () => {
    test.use({ storageState: 'tests/fixtures/.auth/user.json' });
    
    test('Generate form component baselines', async ({ page }) => {
      const visualHelper = new VisualTestHelper(page, 'components');
      
      await page.goto('/login');
      await PageVisualHelpers.prepareLoginPage(page);
      
      // Form states
      await visualHelper.compareScreenshot('form-empty-state');
      
      // Fill form
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await visualHelper.compareScreenshot('form-filled-state');
      
      // Error state
      await page.locator('input[type="email"]').fill('invalid-email');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);
      await visualHelper.compareScreenshot('form-error-state');
      
      console.log('✓ Generated form component baselines');
    });
    
    test('Generate navigation component baselines', async ({ page }) => {
      const visualHelper = new VisualTestHelper(page, 'components');
      
      await page.goto('/user/dashboard');
      await visualHelper.waitForPageStable();
      
      // Test responsive navigation
      for (const viewport of RESPONSIVE_VIEWPORTS) {
        await visualHelper.setViewport(viewport);
        
        const component = page.locator('nav, header').first();
        if (await component.count() > 0) {
          await visualHelper.compareComponent(
            'nav, header',
            `navigation-${viewport.name}`,
            { threshold: 0.1 }
          );
        }
        
        // Test mobile menu if applicable
        if (viewport.width < 768) {
          const mobileToggle = page.locator('[data-testid*="menu"], [data-testid*="toggle"], .mobile-menu-toggle').first();
          if (await mobileToggle.count() > 0) {
            await mobileToggle.click();
            await page.waitForTimeout(300);
            await visualHelper.compareScreenshot(`mobile-menu-open-${viewport.name}`);
          }
        }
      }
      
      console.log('✓ Generated navigation component baselines');
    });
    
    test('Generate button state baselines', async ({ page }) => {
      const visualHelper = new VisualTestHelper(page, 'components');
      
      await page.goto('/login');
      await visualHelper.waitForPageStable();
      
      const button = page.locator('button[type="submit"]').first();
      
      if (await button.count() > 0) {
        // Normal state
        await visualHelper.compareComponent('button[type="submit"]', 'button-normal');
        
        // Hover state
        await button.hover();
        await page.waitForTimeout(200);
        await visualHelper.compareComponent('button[type="submit"]', 'button-hover');
        
        // Focus state
        await button.focus();
        await page.waitForTimeout(100);
        await visualHelper.compareComponent('button[type="submit"]', 'button-focus');
        
        // Disabled state
        await button.evaluate(btn => (btn as HTMLButtonElement).disabled = true);
        await visualHelper.compareComponent('button[type="submit"]', 'button-disabled');
      }
      
      console.log('✓ Generated button state baselines');
    });
  });

  // Cross-browser baseline generation
  test.describe('Cross-Browser Baselines', () => {
    test('Generate critical path baselines for Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');
      
      const visualHelper = new VisualTestHelper(page, 'firefox');
      
      const criticalPages = [
        { path: '/', name: 'home' },
        { path: '/login', name: 'login' },
        { path: '/signup', name: 'signup' },
      ];
      
      for (const pageConfig of criticalPages) {
        await page.goto(pageConfig.path);
        await visualHelper.waitForPageStable();
        
        await visualHelper.compareScreenshot(`${pageConfig.name}-firefox`, {
          threshold: 0.3, // Higher threshold for cross-browser differences
        });
      }
      
      console.log('✓ Generated Firefox baselines');
    });
    
    test('Generate critical path baselines for Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');
      
      const visualHelper = new VisualTestHelper(page, 'safari');
      
      const criticalPages = [
        { path: '/', name: 'home' },
        { path: '/login', name: 'login' },
        { path: '/signup', name: 'signup' },
      ];
      
      for (const pageConfig of criticalPages) {
        await page.goto(pageConfig.path);
        await visualHelper.waitForPageStable();
        
        await visualHelper.compareScreenshot(`${pageConfig.name}-safari`, {
          threshold: 0.3, // Higher threshold for cross-browser differences
        });
      }
      
      console.log('✓ Generated Safari baselines');
    });
  });

  // Dark mode baselines (if supported)
  test.describe('Dark Mode Baselines', () => {
    test('Generate dark mode baselines', async ({ page }) => {
      const visualHelper = new VisualTestHelper(page, 'dark-mode');
      
      const pagesForDarkMode = [
        { path: '/', name: 'home' },
        { path: '/login', name: 'login' },
      ];
      
      for (const pageConfig of pagesForDarkMode) {
        await page.goto(pageConfig.path);
        await visualHelper.waitForPageStable();
        
        // Try to enable dark mode
        const darkModeToggle = page.locator('[data-testid*="theme"], [data-testid*="dark"]').first();
        
        if (await darkModeToggle.count() > 0) {
          await darkModeToggle.click();
          await page.waitForTimeout(500);
          
          await visualHelper.compareScreenshot(`${pageConfig.name}-dark`, {
            threshold: 0.2,
          });
          
          console.log(`✓ Generated dark mode baseline for ${pageConfig.name}`);
        } else {
          console.log(`⚠ No dark mode toggle found for ${pageConfig.name}`);
        }
      }
    });
  });
});

// Utility test for cleaning up old baselines
test.describe('Baseline Cleanup', () => {
  test.skip(() => !process.env.CLEAN_BASELINES, 'Skipping baseline cleanup');
  
  test('Clean old baseline images', async () => {
    console.log('🧹 Cleaning old baseline images...');
    VisualTestHelper.clearBaselines();
    console.log('✓ Baseline cleanup complete');
  });
});