import { test, expect } from '@playwright/test';
import { VisualTestHelper, PageVisualHelpers } from '../../helpers/visual-helper';

/**
 * Visual Regression Tests - Osassy's Kitchen
 * 
 * These tests capture screenshots of key pages and compare them against baseline images
 * to detect unintended visual changes. Run with --update-snapshots to regenerate baselines.
 * 
 * Test categories:
 * - Authentication pages (login, signup)
 * - User dashboard and profile
 * - Subscription management
 * - Order management
 * - Admin dashboard and controls
 * - Menu management
 * - Responsive layouts
 */

test.describe('Visual Regression Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });

    visualHelper = new VisualTestHelper(page, 'kitchen-app');
  });

  test.describe('Landing and Public Pages', () => {
    test('landing page visual regression', async ({ page }) => {
      await page.goto('/');
      await visualHelper.waitForPageStable();

      // Test landing page across all viewports
      await visualHelper.testResponsiveScreenshots('landing-page', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.LAPTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.TABLET_PORTRAIT,
        VisualTestHelper.VIEWPORTS.MOBILE,
        VisualTestHelper.VIEWPORTS.MOBILE_SMALL,
      ]);

      // Test hero section
      await visualHelper.compareComponent(
        '[data-testid="hero-section"], .hero, main section:first-child',
        'landing-hero'
      );

      // Test features section
      const featuresSection = page.locator('[data-testid="features-section"], .features');
      if (await featuresSection.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="features-section"], .features',
          'landing-features'
        );
      }
    });

    test('menu page visual regression', async ({ page }) => {
      await page.goto('/menu');
      await visualHelper.waitForPageStable();

      // Test menu page layout
      await visualHelper.testResponsiveScreenshots('public-menu', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test menu categories
      const menuCategories = page.locator('[data-testid="menu-categories"]');
      if (await menuCategories.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="menu-categories"]',
          'menu-categories'
        );
      }

      // Test menu item grid
      const menuGrid = page.locator('[data-testid="menu-items"], .menu-grid');
      if (await menuGrid.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="menu-items"], .menu-grid',
          'public-menu-grid'
        );
      }
    });

    test('how it works page visual regression', async ({ page }) => {
      await page.goto('/how-it-works');
      await visualHelper.waitForPageStable();

      // Test how it works page
      await visualHelper.testResponsiveScreenshots('how-it-works', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test step-by-step sections
      const steps = page.locator('[data-testid="step"], .step');
      const stepCount = await steps.count();
      for (let i = 0; i < Math.min(stepCount, 3); i++) {
        await visualHelper.compareComponent(
          `[data-testid="step"]:nth-child(${i + 1}), .step:nth-child(${i + 1})`,
          `how-it-works-step-${i + 1}`
        );
      }
    });
  });

  test.describe('Authentication Pages', () => {
    test('login page visual regression', async ({ page }) => {
      await page.goto('/login');
      await PageVisualHelpers.prepareLoginPage(page);

      // Test multiple viewports
      await visualHelper.testResponsiveScreenshots('login-page', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test form states
      await visualHelper.compareScreenshot('login-empty-form');

      // Test validation states - individual field errors
      await page.locator('input[type="email"]').fill('invalid-email');
      await page.locator('input[type="email"]').blur();
      await page.waitForTimeout(300);
      await visualHelper.compareScreenshot('login-email-error');

      await page.locator('input[type="password"]').fill('123');
      await page.locator('input[type="password"]').blur();
      await page.waitForTimeout(300);
      await visualHelper.compareScreenshot('login-password-error');

      // Test form submission with errors
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);
      await visualHelper.compareScreenshot('login-validation-errors');

      // Test loading state during authentication
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('validpassword123');
      await visualHelper.compareScreenshot('login-filled-form');

      // Test input focus states
      await visualHelper.compareFocusState(
        'input[type="email"]',
        'login-email-input'
      );
      await visualHelper.compareFocusState(
        'input[type="password"]',
        'login-password-input'
      );

      // Test button hover state
      await visualHelper.compareHoverState(
        'button[type="submit"]',
        'login-submit-button'
      );
    });

    test('signup page visual regression', async ({ page }) => {
      await page.goto('/signup');
      await PageVisualHelpers.prepareLoginPage(page);

      // Test responsive design
      await visualHelper.testResponsiveScreenshots('signup-page', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test form interactions
      await visualHelper.compareScreenshot('signup-empty-form');

      // Test progressive form validation
      await page.locator('input[name="name"]').fill('Te');
      await page.locator('input[name="name"]').blur();
      await page.waitForTimeout(300);
      await visualHelper.compareScreenshot('signup-name-too-short');

      await page.locator('input[name="email"]').fill('invalid-email');
      await page.locator('input[name="email"]').blur();
      await page.waitForTimeout(300);
      await visualHelper.compareScreenshot('signup-invalid-email');

      await page.locator('input[name="password"]').fill('weak');
      await page.locator('input[name="password"]').blur();
      await page.waitForTimeout(300);
      await visualHelper.compareScreenshot('signup-weak-password');

      await page.locator('input[name="confirmPassword"]').fill('different');
      await page.locator('input[name="confirmPassword"]').blur();
      await page.waitForTimeout(300);
      await visualHelper.compareScreenshot('signup-password-mismatch');

      // Test valid form state
      await page.locator('input[name="name"]').fill('Test User');
      await page.locator('input[name="email"]').fill('test@example.com');
      await page.locator('input[name="password"]').fill('password123');
      await page.locator('input[name="confirmPassword"]').fill('password123');
      await visualHelper.compareScreenshot('signup-filled-form');

      // Test form submission loading state
      // Note: This would require intercepting the request to show loading state
      await page.route('**/api/auth/register', async route => {
        await page.waitForTimeout(1000); // Simulate slow network
        await route.continue();
      });
      
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(200);
      await visualHelper.compareScreenshot('signup-loading-state');
    });

    test('unauthorised page visual regression', async ({ page }) => {
      await page.goto('/unauthorized');
      await visualHelper.waitForPageStable();

      await visualHelper.testResponsiveScreenshots('unauthorized-page', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);
    });
  });

  test.describe('User Dashboard', () => {
    test.use({ storageState: 'tests/fixtures/.auth/user.json' });

    test('user dashboard visual regression', async ({ page }) => {
      await page.goto('/user/dashboard');
      await PageVisualHelpers.prepareDashboardPage(page);

      // Test responsive dashboard
      await visualHelper.testResponsiveScreenshots('user-dashboard', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test dashboard components
      await visualHelper.compareComponent(
        '[data-testid="stats-overview"]',
        'dashboard-stats',
        { threshold: 0.3 }
      );

      await visualHelper.compareComponent(
        '[data-testid="recent-orders"]',
        'dashboard-recent-orders',
        { threshold: 0.3 }
      );

      // Test with sidebar collapsed (if applicable)
      const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
      if (await sidebarToggle.count() > 0) {
        await sidebarToggle.click();
        await page.waitForTimeout(300);
        await visualHelper.compareScreenshot('user-dashboard-sidebar-collapsed');
      }
    });

    test('user profile page visual regression', async ({ page }) => {
      await page.goto('/user/profile');
      await visualHelper.waitForPageStable();

      // Test profile layout
      await visualHelper.testResponsiveScreenshots('user-profile', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test profile form sections
      await visualHelper.compareComponent(
        '[data-testid="profile-form"]',
        'profile-form'
      );

      await visualHelper.compareComponent(
        '[data-testid="profile-avatar"]',
        'profile-avatar'
      );
    });

    test('user orders page visual regression', async ({ page }) => {
      await page.goto('/user/orders');
      await PageVisualHelpers.prepareOrdersPage(page);

      // Test orders listing
      await visualHelper.testResponsiveScreenshots('user-orders', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test individual order card
      const firstOrder = page.locator('[data-testid="order-card"]').first();
      if (await firstOrder.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="order-card"]:first-child',
          'order-card'
        );

        // Test order details modal if available
        await firstOrder.click();
        const modal = page.locator('[data-testid="order-modal"]');
        if (await modal.isVisible()) {
          await visualHelper.compareComponent(
            '[data-testid="order-modal"]',
            'order-modal'
          );
          
          // Close modal
          await page.locator('[data-testid="close-modal"]').click();
        }
      }

      // Test empty state if no orders
      const emptyState = page.locator('[data-testid="no-orders"]');
      if (await emptyState.count() > 0) {
        await visualHelper.compareScreenshot('user-orders-empty');
      }
    });
  });

  test.describe('Subscription Management', () => {
    test.use({ storageState: 'tests/fixtures/.auth/user.json' });

    test('subscription create page visual regression', async ({ page }) => {
      await page.goto('/subscriptions/create');
      await visualHelper.waitForPageStable();

      // Test subscription creation flow
      await visualHelper.testResponsiveScreenshots('subscription-create', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test plan selection
      await visualHelper.compareComponent(
        '[data-testid="subscription-plans"]',
        'subscription-plans'
      );

      // Test individual plan card
      const planCard = page.locator('[data-testid="plan-card"]').first();
      if (await planCard.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="plan-card"]:first-child',
          'plan-card'
        );

        // Test selected state
        await planCard.click();
        await visualHelper.compareComponent(
          '[data-testid="plan-card"]:first-child',
          'plan-card-selected'
        );
      }

      // Test customization form
      const customizationForm = page.locator('[data-testid="subscription-form"]');
      if (await customizationForm.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="subscription-form"]',
          'subscription-form'
        );
      }
    });

    test('subscription management page visual regression', async ({ page }) => {
      await page.goto('/user/subscriptions');
      await visualHelper.waitForPageStable();

      // Test subscription management interface
      await visualHelper.testResponsiveScreenshots('subscription-manage', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);

      // Test active subscription card
      const activeSubscription = page.locator('[data-testid="active-subscription"]');
      if (await activeSubscription.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="active-subscription"]',
          'active-subscription'
        );
      }

      // Test subscription history
      const subscriptionHistory = page.locator('[data-testid="subscription-history"]');
      if (await subscriptionHistory.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="subscription-history"]',
          'subscription-history'
        );
      }
    });
  });

  test.describe('Admin Dashboard', () => {
    test.use({ storageState: 'tests/fixtures/.auth/admin.json' });

    test('admin dashboard visual regression', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await PageVisualHelpers.prepareDashboardPage(page);

      // Test admin dashboard layout
      await visualHelper.testResponsiveScreenshots('admin-dashboard', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
      ]);

      // Test individual dashboard widgets
      const widgets = [
        'revenue-widget',
        'orders-widget',
        'customers-widget',
        'analytics-widget'
      ];

      for (const widget of widgets) {
        const element = page.locator(`[data-testid="${widget}"]`);
        if (await element.count() > 0) {
          await visualHelper.compareComponent(
            `[data-testid="${widget}"]`,
            widget
          );
        }
      }

      // Test charts if present
      const chartsContainer = page.locator('[data-testid="dashboard-charts"]');
      if (await chartsContainer.count() > 0) {
        await visualHelper.waitForElementStable('[data-testid="dashboard-charts"]');
        await visualHelper.compareComponent(
          '[data-testid="dashboard-charts"]',
          'dashboard-charts',
          { threshold: 0.4 } // Higher threshold for dynamic charts
        );
      }
    });

    test('admin orders management visual regression', async ({ page }) => {
      await page.goto('/admin/orders');
      await PageVisualHelpers.prepareOrdersPage(page);

      // Test orders management interface
      await visualHelper.testResponsiveScreenshots('admin-orders', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
      ]);

      // Test orders table
      await visualHelper.compareComponent(
        '[data-testid="orders-table"]',
        'admin-orders-table'
      );

      // Test order filters
      const filtersSection = page.locator('[data-testid="orders-filters"]');
      if (await filtersSection.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="orders-filters"]',
          'orders-filters'
        );
      }

      // Test order actions
      const orderRow = page.locator('[data-testid="order-row"]').first();
      if (await orderRow.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="order-row"]:first-child',
          'order-row'
        );
      }
    });

    test('admin menu management visual regression', async ({ page }) => {
      await page.goto('/admin/menu');
      await PageVisualHelpers.prepareMenuPage(page);

      // Test menu management interface
      await visualHelper.testResponsiveScreenshots('admin-menu', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
      ]);

      // Test menu grid
      await visualHelper.compareComponent(
        '[data-testid="menu-grid"]',
        'menu-grid'
      );

      // Test individual menu item card
      const menuItem = page.locator('[data-testid="menu-item-card"]').first();
      if (await menuItem.count() > 0) {
        await visualHelper.compareComponent(
          '[data-testid="menu-item-card"]:first-child',
          'menu-item-card'
        );
      }

      // Test add menu item button
      const addButton = page.locator('[data-testid="add-menu-item"]');
      if (await addButton.count() > 0) {
        await visualHelper.compareHoverState(
          '[data-testid="add-menu-item"]',
          'add-menu-item'
        );
      }

      // Test menu item modal if available
      if (await addButton.count() > 0) {
        await addButton.click();
        const modal = page.locator('[data-testid="menu-item-modal"]');
        if (await modal.isVisible()) {
          await visualHelper.compareComponent(
            '[data-testid="menu-item-modal"]',
            'menu-item-modal'
          );
          
          // Close modal
          await page.locator('[data-testid="close-modal"]').click();
        }
      }
    });
  });

  test.describe('Responsive Layouts', () => {
    test('navigation responsiveness', async ({ page }) => {
      await page.goto('/');
      await visualHelper.waitForPageStable();

      // Test navigation at different breakpoints
      const viewports = [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.LAPTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
        VisualTestHelper.VIEWPORTS.MOBILE_SMALL,
      ];

      for (const viewport of viewports) {
        await visualHelper.setViewport(viewport);
        await visualHelper.compareScreenshot(`navigation-${viewport.name}`);

        // Test mobile menu if applicable
        if (viewport.width < 768) {
          const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
          if (await mobileMenuToggle.count() > 0) {
            await mobileMenuToggle.click();
            await page.waitForTimeout(300);
            await visualHelper.compareScreenshot(`navigation-mobile-open-${viewport.name}`);
            await mobileMenuToggle.click(); // Close menu
          }
        }
      }
    });

    test('footer responsiveness', async ({ page }) => {
      await page.goto('/');
      await visualHelper.waitForPageStable();

      // Scroll to footer
      await page.locator('footer').scrollIntoViewIfNeeded();
      
      await visualHelper.testResponsiveScreenshots('footer', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ], {
        clip: await page.locator('footer').boundingBox() || undefined
      });
    });
  });

  test.describe('Form States and Interactions', () => {
    test('form input states visual regression', async ({ page }) => {
      await page.goto('/signup');
      await visualHelper.waitForPageStable();

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      // Test focus states
      await visualHelper.compareFocusState(
        'input[type="email"]',
        'email-input'
      );

      await visualHelper.compareFocusState(
        'input[type="password"]',
        'password-input'
      );

      // Test error states
      await emailInput.fill('invalid-email');
      await passwordInput.fill('123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);

      await visualHelper.compareScreenshot('form-error-states');

      // Test success states
      await emailInput.fill('valid@example.com');
      await passwordInput.fill('validPassword123');
      await visualHelper.compareScreenshot('form-valid-states');
    });

    test('button states visual regression', async ({ page }) => {
      await page.goto('/login');
      await visualHelper.waitForPageStable();

      const submitButton = page.locator('button[type="submit"]');

      // Test button states
      await visualHelper.compareScreenshot('button-normal');

      await visualHelper.compareHoverState(
        'button[type="submit"]',
        'submit-button'
      );

      await visualHelper.compareFocusState(
        'button[type="submit"]',
        'submit-button'
      );

      // Test disabled state
      await submitButton.evaluate(button => {
        (button as HTMLButtonElement).disabled = true;
      });
      await visualHelper.compareScreenshot('button-disabled');
    });
  });

  test.describe('Loading States', () => {
    test('loading skeletons and spinners', async ({ page }) => {
      // Test loading states by intercepting network requests
      await page.route('**/api/**', route => {
        // Delay API responses to capture loading states
        setTimeout(() => route.continue(), 2000);
      });

      await page.goto('/user/dashboard');
      
      // Capture loading state immediately
      await visualHelper.compareScreenshot('dashboard-loading');

      // Wait for content to load and capture final state
      await page.waitForLoadState('networkidle');
      await visualHelper.compareScreenshot('dashboard-loaded');
    });
  });

  test.describe('Dark Mode (if supported)', () => {
    test('dark mode visual regression', async ({ page }) => {
      await page.goto('/');
      await visualHelper.waitForPageStable();

      // Test dark mode across key pages
      const pages = [
        { path: '/', name: 'home' },
        { path: '/login', name: 'login' },
        { path: '/user/dashboard', name: 'dashboard', auth: true },
      ];

      for (const pageConfig of pages) {
        if (pageConfig.auth) {
          // Set auth state if needed
          await page.goto('/login');
          // Add login logic here if needed for dark mode testing
        }

        await page.goto(pageConfig.path);
        await visualHelper.waitForPageStable();
        await visualHelper.testDarkMode(pageConfig.name);
      }
    });
  });

  test.describe('Error States', () => {
    test('404 page visual regression', async ({ page }) => {
      await page.goto('/non-existent-page');
      await visualHelper.waitForPageStable();

      await visualHelper.testResponsiveScreenshots('404-page', [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ]);
    });

    test('network error states', async ({ page }) => {
      // Simulate network failures
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      await page.goto('/user/dashboard');
      await page.waitForTimeout(2000); // Wait for error states to appear
      
      await visualHelper.compareScreenshot('network-error-state');
    });
  });
});

/**
 * Baseline Generation Tests
 * 
 * These tests are used to generate initial baseline images.
 * Run with: npx playwright test --grep "Generate Baselines" --update-snapshots
 */
test.describe('Generate Baselines', () => {
  test.skip(() => !process.env.GENERATE_BASELINES, 'Skipping baseline generation');

  test('generate all baseline images', async ({ page }) => {
    const visualHelper = new VisualTestHelper(page, 'baseline');

    const testPages = [
      { path: '/login', name: 'login', prepare: PageVisualHelpers.prepareLoginPage },
      { path: '/signup', name: 'signup', prepare: PageVisualHelpers.prepareLoginPage },
      { path: '/user/dashboard', name: 'user-dashboard', prepare: PageVisualHelpers.prepareDashboardPage, auth: true },
      { path: '/user/orders', name: 'user-orders', prepare: PageVisualHelpers.prepareOrdersPage, auth: true },
      { path: '/user/profile', name: 'user-profile', auth: true },
      { path: '/subscriptions/create', name: 'subscription-create', auth: true },
      { path: '/user/subscriptions', name: 'subscription-manage', auth: true },
      { path: '/admin/dashboard', name: 'admin-dashboard', prepare: PageVisualHelpers.prepareDashboardPage, admin: true },
      { path: '/admin/orders', name: 'admin-orders', prepare: PageVisualHelpers.prepareOrdersPage, admin: true },
      { path: '/admin/menu', name: 'admin-menu', prepare: PageVisualHelpers.prepareMenuPage, admin: true },
    ];

    for (const pageConfig of testPages) {
      console.log(`Generating baselines for ${pageConfig.name}...`);
      
      if (pageConfig.auth || pageConfig.admin) {
        // Set appropriate auth context
        const authFile = pageConfig.admin ? 
          'tests/fixtures/.auth/admin.json' : 
          'tests/fixtures/.auth/user.json';
        // Note: You'll need to implement auth state loading here
      }

      await page.goto(pageConfig.path);
      
      if (pageConfig.prepare) {
        await pageConfig.prepare(page);
      } else {
        await visualHelper.waitForPageStable();
      }

      // Generate baselines for multiple viewports
      const viewports = [
        VisualTestHelper.VIEWPORTS.DESKTOP,
        VisualTestHelper.VIEWPORTS.TABLET,
        VisualTestHelper.VIEWPORTS.MOBILE,
      ];

      for (const viewport of viewports) {
        await visualHelper.setViewport(viewport);
        await visualHelper.generateBaseline(`${pageConfig.name}-${viewport.name}`);
      }
    }

    console.log('Baseline generation complete!');
  });
});