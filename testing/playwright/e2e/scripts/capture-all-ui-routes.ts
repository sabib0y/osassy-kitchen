import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

interface Route {
  name: string;
  path: string;
  category: 'public' | 'user' | 'admin';
  requiresAuth: boolean;
  adminRequired?: boolean;
  description: string;
  viewports?: Array<{ width: number; height: number; device: string }>;
  waitForSelector?: string;
  skipMobile?: boolean;
}

interface ScreenshotConfig {
  timestamp: string;
  baseDir: string;
  viewports: {
    desktop: { width: number; height: number };
    tablet: { width: number; height: number };
    mobile: { width: number; height: number };
  };
}

interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Comprehensive list of all routes in the Osassy's Kitchen application
 */
const ALL_ROUTES: Route[] = [
  // Public Routes
  {
    name: 'public-homepage',
    path: '/',
    category: 'public',
    requiresAuth: false,
    description: 'Main landing page with hero section, services, and pricing',
    waitForSelector: '[data-testid="banner-section"], .banner-section, h1',
  },
  {
    name: 'public-login',
    path: '/login',
    category: 'public',
    requiresAuth: false,
    description: 'User login form',
    waitForSelector: 'form, [type="email"]',
  },
  {
    name: 'public-signup',
    path: '/signup',
    category: 'public',
    requiresAuth: false,
    description: 'User registration form',
    waitForSelector: 'form, [type="email"]',
  },
  {
    name: 'public-blog',
    path: '/blog',
    category: 'public',
    requiresAuth: false,
    description: 'Blog listing page',
    waitForSelector: '.blog-container, .blog-grid, .posts-grid',
  },
  {
    name: 'public-blog-details',
    path: '/blog-details',
    category: 'public',
    requiresAuth: false,
    description: 'Individual blog post page',
    waitForSelector: '.blog-detail, .post-content, article',
  },
  {
    name: 'public-subscriptions',
    path: '/subscriptions',
    category: 'public',
    requiresAuth: false,
    description: 'Public subscription plans overview',
    waitForSelector: '.subscription-plans, .pricing-cards, .plans-grid',
  },
  {
    name: 'public-success',
    path: '/success',
    category: 'public',
    requiresAuth: false,
    description: 'Payment success page',
    waitForSelector: '.success-message, .confirmation',
  },
  {
    name: 'public-cancel',
    path: '/cancel',
    category: 'public',
    requiresAuth: false,
    description: 'Payment cancellation page',
    waitForSelector: '.cancel-message, .cancellation',
  },
  {
    name: 'public-unauthorized',
    path: '/unauthorized',
    category: 'public',
    requiresAuth: false,
    description: 'Unauthorized access page',
    waitForSelector: '.unauthorized-message, h1',
  },

  // User Dashboard Routes (Authenticated)
  {
    name: 'auth-user-dashboard',
    path: '/user/dashboard',
    category: 'user',
    requiresAuth: true,
    description: 'User dashboard with stats and recent activity',
    waitForSelector: '.dashboard-content, .stats-grid, .user-dashboard',
  },
  {
    name: 'auth-user-profile',
    path: '/user/profile',
    category: 'user',
    requiresAuth: true,
    description: 'User profile management page',
    waitForSelector: '.profile-form, form',
  },
  {
    name: 'auth-user-subscriptions',
    path: '/user/subscriptions',
    category: 'user',
    requiresAuth: true,
    description: 'User subscription management',
    waitForSelector: '.subscriptions-list, .subscription-cards, .subscriptions-container',
  },
  {
    name: 'auth-user-orders',
    path: '/user/orders',
    category: 'user',
    requiresAuth: true,
    description: 'User order history',
    waitForSelector: '.orders-table, .orders-list, .order-history',
  },
  {
    name: 'auth-user-payments',
    path: '/user/payments',
    category: 'user',
    requiresAuth: true,
    description: 'User payment methods management',
    waitForSelector: '.payment-methods, .payments-section',
  },
  {
    name: 'auth-subscription-create',
    path: '/subscriptions/create',
    category: 'user',
    requiresAuth: true,
    description: 'Create new subscription page',
    waitForSelector: '.menu-grid, .subscription-form, .create-subscription',
  },

  // Profile page (accessible by authenticated users)
  {
    name: 'auth-profile-general',
    path: '/profile',
    category: 'user',
    requiresAuth: true,
    description: 'General profile page',
    waitForSelector: '.profile-content, .profile-info',
  },

  // Admin Routes (Admin Authentication Required)
  {
    name: 'admin-dashboard',
    path: '/admin/dashboard',
    category: 'admin',
    requiresAuth: true,
    adminRequired: true,
    description: 'Admin dashboard with metrics and analytics',
    waitForSelector: '.admin-dashboard, .kpi-cards, .metrics-grid',
    skipMobile: true,
  },
  {
    name: 'admin-orders',
    path: '/admin/orders',
    category: 'admin',
    requiresAuth: true,
    adminRequired: true,
    description: 'Admin order management',
    waitForSelector: '.orders-table, .admin-orders',
    skipMobile: true,
  },
  {
    name: 'admin-menu',
    path: '/admin/menu',
    category: 'admin',
    requiresAuth: true,
    adminRequired: true,
    description: 'Admin menu management',
    waitForSelector: '.menu-management, .menu-items-grid',
    skipMobile: true,
  },

  // Test/Development Routes
  {
    name: 'dev-test-stripe',
    path: '/test-stripe',
    category: 'public',
    requiresAuth: false,
    description: 'Stripe integration testing page',
    waitForSelector: '.stripe-test, .payment-test',
  },
];

class UIRouteCapture {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: ScreenshotConfig;
  private credentials: AuthCredentials = {
    email: 'test@test.com',
    password: 'test'
  };
  private baseURL: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
    this.config = {
      timestamp,
      baseDir: path.join(process.cwd(), 'testing/playwright/screenshots/ui-audit', timestamp),
      viewports: {
        desktop: { width: 1920, height: 1080 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 667 },
      },
    };
  }

  /**
   * Initialize browser and context
   */
  async init(): Promise<void> {
    console.log('🚀 Initializing UI Route Capture...\n');
    
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewports.desktop,
      deviceScaleFactor: 1,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
    });

    this.page = await this.context.newPage();

    // Create directories
    await fs.mkdir(this.config.baseDir, { recursive: true });
    await fs.mkdir(path.join(this.config.baseDir, 'public'), { recursive: true });
    await fs.mkdir(path.join(this.config.baseDir, 'user'), { recursive: true });
    await fs.mkdir(path.join(this.config.baseDir, 'admin'), { recursive: true });

    console.log(`📁 Screenshots will be saved to: ${this.config.baseDir}\n`);
  }

  /**
   * Authenticate user for protected routes
   */
  async authenticate(isAdmin: boolean = false): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      console.log(`🔐 Authenticating ${isAdmin ? 'admin' : 'regular'} user...`);
      
      // Navigate to login page
      await this.page.goto(`${this.baseURL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for login form
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      
      // Fill credentials
      await this.page.fill('input[type="email"], input[name="email"]', this.credentials.email);
      await this.page.fill('input[type="password"], input[name="password"]', this.credentials.password);
      
      // Submit form
      const submitButton = this.page.locator('button[type="submit"], input[type="submit"], .login-button, .btn-primary');
      await submitButton.click();

      // Wait for navigation after login
      await this.page.waitForTimeout(2000);
      
      // Check if we're redirected (indicates successful login)
      const currentUrl = this.page.url();
      const isLoggedIn = !currentUrl.includes('/login') || 
                        currentUrl.includes('/dashboard') || 
                        currentUrl.includes('/user/') ||
                        currentUrl.includes('/admin/');

      if (isLoggedIn) {
        console.log('✅ Authentication successful');
        return true;
      } else {
        console.log('❌ Authentication failed - still on login page');
        return false;
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return false;
    }
  }

  /**
   * Capture screenshot for a specific route and viewport
   */
  async captureRouteScreenshot(
    route: Route, 
    viewportType: 'desktop' | 'tablet' | 'mobile'
  ): Promise<string | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      const viewport = this.config.viewports[viewportType];
      await this.page.setViewportSize(viewport);
      
      // Navigate to the route
      const fullUrl = `${this.baseURL}${route.path}`;
      await this.page.goto(fullUrl, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });

      // Wait for specific selector if provided
      if (route.waitForSelector) {
        try {
          await this.page.waitForSelector(route.waitForSelector, { timeout: 5000 });
        } catch (e) {
          // Continue even if specific selector not found
          console.log(`  ⚠️  Warning: Selector '${route.waitForSelector}' not found, proceeding anyway`);
        }
      }

      // Wait a bit for page to settle
      await this.page.waitForTimeout(1000);

      // Hide dynamic content for consistent screenshots
      await this.hideDynamicContent();

      // Generate filename
      const filename = `${route.name}-${viewportType}.png`;
      const screenshotPath = path.join(this.config.baseDir, route.category, filename);

      // Take screenshot
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled',
      });

      console.log(`    ✅ ${viewportType}: ${filename}`);
      return screenshotPath;

    } catch (error) {
      console.error(`    ❌ Error capturing ${viewportType}:`, error);
      return null;
    }
  }

  /**
   * Hide dynamic content for consistent screenshots
   */
  private async hideDynamicContent(): Promise<void> {
    if (!this.page) return;

    await this.page.addStyleTag({
      content: `
        /* Hide timestamps and dynamic dates */
        [data-testid*="timestamp"],
        [data-testid*="date"],
        .timestamp,
        .date-time,
        .last-updated,
        .created-at,
        .updated-at {
          visibility: hidden !important;
        }
        
        /* Hide dynamic IDs and user-specific content */
        [data-testid*="user-id"],
        [data-testid*="order-id"],
        .user-specific,
        .dynamic-id {
          opacity: 0.3 !important;
        }

        /* Disable animations for consistent screenshots */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }

        /* Hide loading states */
        .loading-spinner,
        .skeleton,
        .shimmer {
          display: none !important;
        }
      `,
    });
  }

  /**
   * Capture all routes for a specific category
   */
  async captureRouteCategory(
    routes: Route[], 
    requiresAuth: boolean = false, 
    isAdmin: boolean = false
  ): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const categoryName = isAdmin ? 'admin' : (requiresAuth ? 'authenticated user' : 'public');
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📸 CAPTURING ${categoryName.toUpperCase()} ROUTES`);
    console.log(`${'='.repeat(60)}`);

    let isAuthenticated = false;
    if (requiresAuth && !isAuthenticated) {
      isAuthenticated = await this.authenticate(isAdmin);
      if (!isAuthenticated) {
        console.error(`❌ Failed to authenticate for ${categoryName} routes`);
        return;
      }
    }

    for (const route of routes) {
      console.log(`\n📄 Processing: ${route.name}`);
      console.log(`   Path: ${route.path}`);
      console.log(`   Description: ${route.description}`);

      const viewports = route.skipMobile 
        ? ['desktop' as const, 'tablet' as const]
        : ['desktop' as const, 'tablet' as const, 'mobile' as const];

      for (const viewportType of viewports) {
        await this.captureRouteScreenshot(route, viewportType);
      }
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(results: Array<{ route: Route; status: string; error?: string }>): Promise<void> {
    const reportPath = path.join(this.config.baseDir, 'capture-report.html');
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>UI Route Capture Report - ${this.config.timestamp}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 3px solid #C52D2F; padding-bottom: 10px; }
    .summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-number { font-size: 2em; font-weight: bold; color: #C52D2F; }
    .route-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
    .route-card { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .route-card h3 { margin: 0 0 10px 0; color: #333; }
    .route-path { font-family: monospace; background: #f8f9fa; padding: 5px 8px; border-radius: 4px; font-size: 0.9em; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
    .status.success { background: #d4edda; color: #155724; }
    .status.error { background: #f8d7da; color: #721c24; }
    .category { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.7em; margin-bottom: 8px; }
    .category.public { background: #e3f2fd; color: #0d47a1; }
    .category.user { background: #f3e5f5; color: #4a148c; }
    .category.admin { background: #ffecb3; color: #e65100; }
    .viewports { margin-top: 10px; }
    .viewport-link { display: inline-block; margin: 2px; padding: 4px 8px; background: #e9ecef; border-radius: 4px; text-decoration: none; font-size: 0.8em; }
    .viewport-link:hover { background: #dee2e6; }
  </style>
</head>
<body>
  <h1>🎨 UI Route Capture Report</h1>
  
  <div class="summary">
    <h2>📊 Capture Summary</h2>
    <p><strong>Timestamp:</strong> ${this.config.timestamp}</p>
    <p><strong>Base URL:</strong> ${this.baseURL}</p>
    <p><strong>Total Routes:</strong> ${results.length}</p>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">${successful}</div>
        <div>Successful</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${failed}</div>
        <div>Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Math.round((successful / results.length) * 100)}%</div>
        <div>Success Rate</div>
      </div>
    </div>
  </div>

  <div class="route-grid">
    ${results.map(result => `
      <div class="route-card">
        <span class="category ${result.route.category}">${result.route.category}</span>
        <h3>${result.route.name}</h3>
        <div class="route-path">${result.route.path}</div>
        <p>${result.route.description}</p>
        <div class="status ${result.status}">${result.status.toUpperCase()}</div>
        ${result.error ? `<p style="color: #721c24; font-size: 0.9em;">${result.error}</p>` : ''}
        
        <div class="viewports">
          <strong>Screenshots:</strong><br>
          ${result.status === 'success' ? `
            <a href="${result.route.category}/${result.route.name}-desktop.png" class="viewport-link" target="_blank">Desktop</a>
            <a href="${result.route.category}/${result.route.name}-tablet.png" class="viewport-link" target="_blank">Tablet</a>
            ${!result.route.skipMobile ? `<a href="${result.route.category}/${result.route.name}-mobile.png" class="viewport-link" target="_blank">Mobile</a>` : ''}
          ` : 'No screenshots available'}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="summary">
    <h2>📁 File Structure</h2>
    <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto;">
${this.config.baseDir}/
├── capture-report.html
├── public/
│   ├── public-homepage-desktop.png
│   ├── public-homepage-tablet.png
│   ├── public-homepage-mobile.png
│   └── ...
├── user/
│   ├── auth-user-dashboard-desktop.png
│   ├── auth-user-dashboard-tablet.png
│   ├── auth-user-dashboard-mobile.png
│   └── ...
└── admin/
    ├── admin-dashboard-desktop.png
    ├── admin-dashboard-tablet.png
    └── ...
    </pre>
  </div>
</body>
</html>`;

    await fs.writeFile(reportPath, html);
    console.log(`\n📄 Report generated: ${reportPath}`);
  }

  /**
   * Main execution method
   */
  async captureAllRoutes(): Promise<void> {
    const results: Array<{ route: Route; status: string; error?: string }> = [];

    try {
      await this.init();

      // Group routes by authentication requirements
      const publicRoutes = ALL_ROUTES.filter(r => !r.requiresAuth);
      const userRoutes = ALL_ROUTES.filter(r => r.requiresAuth && !r.adminRequired);
      const adminRoutes = ALL_ROUTES.filter(r => r.requiresAuth && r.adminRequired);

      // Capture public routes (no authentication needed)
      if (publicRoutes.length > 0) {
        await this.captureRouteCategory(publicRoutes, false, false);
        publicRoutes.forEach(route => results.push({ route, status: 'success' }));
      }

      // Capture user routes (authentication needed)
      if (userRoutes.length > 0) {
        await this.captureRouteCategory(userRoutes, true, false);
        userRoutes.forEach(route => results.push({ route, status: 'success' }));
      }

      // Capture admin routes (admin authentication needed)
      if (adminRoutes.length > 0) {
        console.log(`\n⚠️  Admin routes require admin credentials. Using test account: ${this.credentials.email}`);
        await this.captureRouteCategory(adminRoutes, true, true);
        adminRoutes.forEach(route => results.push({ route, status: 'success' }));
      }

      // Generate comprehensive report
      await this.generateReport(results);

      console.log(`\n${'='.repeat(60)}`);
      console.log('🎉 UI ROUTE CAPTURE COMPLETED SUCCESSFULLY');
      console.log(`${'='.repeat(60)}`);
      console.log(`📁 Screenshots saved to: ${this.config.baseDir}`);
      console.log(`📄 View report: ${path.join(this.config.baseDir, 'capture-report.html')}`);
      console.log(`\n📊 Summary:`);
      console.log(`   • Total routes: ${ALL_ROUTES.length}`);
      console.log(`   • Public routes: ${publicRoutes.length}`);
      console.log(`   • User routes: ${userRoutes.length}`);
      console.log(`   • Admin routes: ${adminRoutes.length}`);
      console.log(`   • Viewports: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)`);

    } catch (error) {
      console.error('\n❌ Capture process failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

// Execute the capture
async function main() {
  console.log('🎨 Osassy\'s Kitchen - UI Route Capture Tool');
  console.log('=' .repeat(60));
  console.log('This tool captures screenshots of ALL pages in the application');
  console.log('across multiple viewports (desktop, tablet, mobile)');
  console.log('=' .repeat(60));

  const capture = new UIRouteCapture();
  
  try {
    await capture.captureAllRoutes();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { UIRouteCapture, ALL_ROUTES };