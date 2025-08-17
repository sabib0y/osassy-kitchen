/**
 * Test Utilities for E2E Tests
 * Common utilities, helpers, and selectors for Playwright tests
 */

import { Page, Locator, expect } from '@playwright/test';
import { testUsers, testPaymentMethods, waitTimes } from '../fixtures/data.fixture';

/**
 * Common selectors used throughout the application
 */
export const selectors = {
  // Authentication
  auth: {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    confirmPasswordInput: 'input[name="confirmPassword"]',
    firstNameInput: 'input[name="firstName"]',
    lastNameInput: 'input[name="lastName"]',
    submitButton: 'button[type="submit"]',
    loginForm: 'form[data-testid="login-form"], form',
    signupForm: 'form[data-testid="signup-form"], form',
    logoutButton: '[data-testid="logout-button"]',
    userMenu: '[data-testid="user-menu"]',
  },

  // Navigation
  nav: {
    header: '[data-testid="header"], header, .header',
    sidebar: '[data-testid="sidebar"], .sidebar',
    userHeader: '[data-testid="user-header"]',
    adminLayout: '[data-testid="admin-layout"]',
    mainContent: 'main, [role="main"], .main-content',
    breadcrumb: '[data-testid="breadcrumb"], .breadcrumb',
  },

  // Dashboard
  dashboard: {
    userDashboard: '[data-testid="user-dashboard"], .user-dashboard, .dashboard',
    adminDashboard: '[data-testid="admin-dashboard"], .admin-dashboard',
    statsCards: '[data-testid="stats-card"], .stat-card, .stats-card',
    recentOrders: '[data-testid="recent-orders"]',
    quickActions: '[data-testid="quick-actions"]',
  },

  // Forms
  forms: {
    input: 'input, textarea, select',
    textInput: 'input[type="text"], input[type="email"], input[type="password"]',
    submitButton: 'button[type="submit"]',
    cancelButton: 'button[type="button"]:has-text("Cancel")',
    saveButton: 'button:has-text("Save")',
    editButton: 'button:has-text("Edit")',
    deleteButton: 'button:has-text("Delete")',
  },

  // Modals and dialogs
  modals: {
    modal: '[data-testid="modal"], .modal, [role="dialog"]',
    modalOverlay: '[data-testid="modal-overlay"], .modal-overlay',
    modalTitle: '[data-testid="modal-title"], .modal-title, .modal-header h1, .modal-header h2',
    modalContent: '[data-testid="modal-content"], .modal-content, .modal-body',
    modalClose: '[data-testid="modal-close"], .modal-close, button:has-text("×")',
    confirmButton: 'button:has-text("Confirm"), button:has-text("Yes")',
    cancelButton: 'button:has-text("Cancel"), button:has-text("No")',
  },

  // Subscription specific
  subscription: {
    planCard: '[data-testid="plan-card"], .plan-card',
    subscribeButton: 'button:has-text("Subscribe")',
    cancelSubscriptionButton: 'button:has-text("Cancel Subscription")',
    subscriptionStatus: '[data-testid="subscription-status"]',
    planFeatures: '[data-testid="plan-features"], .plan-features',
    pricingInfo: '[data-testid="pricing-info"], .pricing-info',
  },

  // Payment
  payment: {
    cardNumberInput: 'input[name="cardNumber"], [data-testid="card-number"]',
    expiryInput: 'input[name="expiry"], [data-testid="card-expiry"]',
    cvcInput: 'input[name="cvc"], [data-testid="card-cvc"]',
    nameOnCardInput: 'input[name="nameOnCard"], [data-testid="card-name"]',
    billingZipInput: 'input[name="billingZip"], [data-testid="billing-zip"]',
    paymentForm: '[data-testid="payment-form"], .payment-form',
    stripeFrame: 'iframe[name^="__privateStripeFrame"]',
  },

  // Orders
  orders: {
    orderCard: '[data-testid="order-card"], .order-card',
    orderStatus: '[data-testid="order-status"], .order-status',
    orderTotal: '[data-testid="order-total"], .order-total',
    orderItems: '[data-testid="order-items"], .order-items',
    orderDate: '[data-testid="order-date"], .order-date',
  },

  // Menu items
  menu: {
    menuItem: '[data-testid="menu-item"], .menu-item',
    menuItemName: '[data-testid="menu-item-name"], .menu-item-name',
    menuItemPrice: '[data-testid="menu-item-price"], .menu-item-price',
    menuItemDescription: '[data-testid="menu-item-description"], .menu-item-description',
    addToCartButton: 'button:has-text("Add to Cart")',
    quantityInput: 'input[name="quantity"], [data-testid="quantity"]',
  },

  // Loading states
  loading: {
    spinner: '[data-testid="loading"], .spinner, .loading',
    skeleton: '[data-testid="skeleton"], .skeleton',
    loadingButton: 'button[disabled], button.loading',
  },

  // Notifications and alerts
  notifications: {
    toast: '[data-testid="toast"], .toast, .notification',
    alert: '[data-testid="alert"], .alert',
    errorMessage: '[data-testid="error"], .error, .error-message',
    successMessage: '[data-testid="success"], .success, .success-message',
  },
};

/**
 * Wait utilities for common scenarios
 */
export class WaitUtils {
  constructor(private page: Page) {}

  /**
   * Wait for page to be ready (no loading spinners)
   */
  async waitForPageReady(timeout = waitTimes.medium) {
    await this.page.waitForLoadState('networkidle');
    await this.page.locator(selectors.loading.spinner).waitFor({ state: 'hidden', timeout: timeout }).catch(() => {});
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(url?: string, timeout = waitTimes.long) {
    if (url) {
      await this.page.waitForURL(url, { timeout });
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Wait for modal to appear
   */
  async waitForModal(timeout = waitTimes.medium) {
    await this.page.locator(selectors.modals.modal).waitFor({ timeout });
  }

  /**
   * Wait for modal to disappear
   */
  async waitForModalToClose(timeout = waitTimes.medium) {
    await this.page.locator(selectors.modals.modal).waitFor({ state: 'hidden', timeout });
  }

  /**
   * Wait for notification to appear
   */
  async waitForNotification(type: 'success' | 'error' | 'toast' = 'toast', timeout = waitTimes.medium) {
    const selector = type === 'success' ? selectors.notifications.successMessage :
                    type === 'error' ? selectors.notifications.errorMessage :
                    selectors.notifications.toast;
    await this.page.locator(selector).waitFor({ timeout });
  }

  /**
   * Wait for element to be stable (not moving/changing)
   */
  async waitForElementStable(locator: Locator, timeout = waitTimes.short) {
    await locator.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(timeout); // Simple wait for stability
  }
}

/**
 * Form utilities for filling out common forms
 */
export class FormUtils {
  constructor(private page: Page) {}

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string) {
    await this.page.fill(selectors.auth.emailInput, email);
    await this.page.fill(selectors.auth.passwordInput, password);
  }

  /**
   * Fill signup form
   */
  async fillSignupForm(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    await this.page.fill(selectors.auth.firstNameInput, userData.firstName);
    await this.page.fill(selectors.auth.lastNameInput, userData.lastName);
    await this.page.fill(selectors.auth.emailInput, userData.email);
    await this.page.fill(selectors.auth.passwordInput, userData.password);
    await this.page.fill(selectors.auth.confirmPasswordInput, userData.password);
  }

  /**
   * Fill payment form (Stripe)
   */
  async fillPaymentForm(paymentData = testPaymentMethods.validCard) {
    // Fill card number (might be in iframe)
    try {
      const cardFrame = this.page.frameLocator(selectors.payment.stripeFrame);
      await cardFrame.locator('input[name="cardnumber"]').fill(paymentData.number);
      await cardFrame.locator('input[name="exp-date"]').fill(`${paymentData.exp_month}/${paymentData.exp_year.slice(-2)}`);
      await cardFrame.locator('input[name="cvc"]').fill(paymentData.cvc);
    } catch {
      // Fallback to regular form fields
      await this.page.fill(selectors.payment.cardNumberInput, paymentData.number);
      await this.page.fill(selectors.payment.expiryInput, `${paymentData.exp_month}/${paymentData.exp_year.slice(-2)}`);
      await this.page.fill(selectors.payment.cvcInput, paymentData.cvc);
    }

    // Fill name and zip if present
    if (await this.page.locator(selectors.payment.nameOnCardInput).isVisible()) {
      await this.page.fill(selectors.payment.nameOnCardInput, paymentData.name);
    }
    if (await this.page.locator(selectors.payment.billingZipInput).isVisible()) {
      await this.page.fill(selectors.payment.billingZipInput, paymentData.zipCode);
    }
  }

  /**
   * Submit form and wait for response
   */
  async submitForm(waitForNavigation = true) {
    await this.page.click(selectors.forms.submitButton);
    if (waitForNavigation) {
      await this.page.waitForLoadState('networkidle');
    }
  }
}

/**
 * Authentication utilities
 */
export class AuthUtils {
  constructor(private page: Page) {}

  /**
   * Login as user
   */
  async loginAsUser(email = testUsers.existingUser.email, password = testUsers.existingUser.password) {
    await this.page.goto('/login');
    const formUtils = new FormUtils(this.page);
    await formUtils.fillLoginForm(email, password);
    await formUtils.submitForm();
    await this.page.waitForURL('**/user/dashboard', { timeout: waitTimes.long });
  }

  /**
   * Login as admin
   */
  async loginAsAdmin(email = testUsers.adminUser.email, password = testUsers.adminUser.password) {
    await this.page.goto('/login');
    const formUtils = new FormUtils(this.page);
    await formUtils.fillLoginForm(email, password);
    await formUtils.submitForm();
    await this.page.waitForURL('**/admin/dashboard', { timeout: waitTimes.long });
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click(selectors.auth.userMenu);
    await this.page.click(selectors.auth.logoutButton);
    await this.page.waitForURL('**/login');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const cookies = await this.page.context().cookies();
    return cookies.some(cookie => cookie.name.includes('session') || cookie.name.includes('auth'));
  }
}

/**
 * Navigation utilities
 */
export class NavigationUtils {
  constructor(private page: Page) {}

  /**
   * Navigate to user dashboard
   */
  async goToUserDashboard() {
    await this.page.goto('/user/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to admin dashboard
   */
  async goToAdminDashboard() {
    await this.page.goto('/admin/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to subscriptions page
   */
  async goToSubscriptions() {
    await this.page.goto('/user/subscriptions');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to create subscription page
   */
  async goToCreateSubscription() {
    await this.page.goto('/subscriptions/create');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to profile page
   */
  async goToProfile() {
    await this.page.goto('/user/profile');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate using sidebar menu (if available)
   */
  async navigateViaMenu(menuItem: string) {
    const sidebar = this.page.locator(selectors.nav.sidebar);
    if (await sidebar.isVisible()) {
      await sidebar.locator(`text=${menuItem}`).click();
    } else {
      // Try hamburger menu
      await this.page.click('button[data-testid="menu-toggle"], .hamburger, .menu-toggle').catch(() => {});
      await this.page.locator(`text=${menuItem}`).click();
    }
    await this.page.waitForLoadState('networkidle');
  }
}

/**
 * Assertion utilities for common checks
 */
export class AssertionUtils {
  constructor(private page: Page) {}

  /**
   * Assert user is on dashboard
   */
  async assertOnUserDashboard() {
    await expect(this.page).toHaveURL(/.*\/user\/dashboard/);
    await expect(this.page.locator(selectors.dashboard.userDashboard)).toBeVisible();
  }

  /**
   * Assert user is on admin dashboard
   */
  async assertOnAdminDashboard() {
    await expect(this.page).toHaveURL(/.*\/admin\/dashboard/);
    await expect(this.page.locator(selectors.dashboard.adminDashboard)).toBeVisible();
  }

  /**
   * Assert user is logged in
   */
  async assertLoggedIn() {
    const authUtils = new AuthUtils(this.page);
    const isLoggedIn = await authUtils.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  }

  /**
   * Assert user is logged out
   */
  async assertLoggedOut() {
    await expect(this.page).toHaveURL(/.*\/login/);
  }

  /**
   * Assert notification appeared
   */
  async assertNotification(message?: string, type: 'success' | 'error' = 'success') {
    const selector = type === 'success' ? selectors.notifications.successMessage : selectors.notifications.errorMessage;
    const notification = this.page.locator(selector);
    await expect(notification).toBeVisible();
    if (message) {
      await expect(notification).toContainText(message);
    }
  }

  /**
   * Assert modal is open
   */
  async assertModalOpen(title?: string) {
    await expect(this.page.locator(selectors.modals.modal)).toBeVisible();
    if (title) {
      await expect(this.page.locator(selectors.modals.modalTitle)).toContainText(title);
    }
  }

  /**
   * Assert modal is closed
   */
  async assertModalClosed() {
    await expect(this.page.locator(selectors.modals.modal)).not.toBeVisible();
  }
}

/**
 * Data generation utilities
 */
export class DataUtils {
  /**
   * Generate random test email
   */
  static generateTestEmail(): string {
    const timestamp = Date.now();
    return `test-user-${timestamp}@example.com`;
  }

  /**
   * Generate random user data
   */
  static generateUserData() {
    const timestamp = Date.now();
    return {
      firstName: `Test${timestamp}`,
      lastName: 'User',
      email: this.generateTestEmail(),
      password: 'TestPass123!',
    };
  }

  /**
   * Get formatted date for testing
   */
  static getFormattedDate(date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get future date for testing
   */
  static getFutureDate(daysFromNow = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }
}

/**
 * Screenshot utilities for visual testing
 */
export class ScreenshotUtils {
  constructor(private page: Page) {}

  /**
   * Take full page screenshot
   */
  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({
      path: `tests/test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Take element screenshot
   */
  async takeElementScreenshot(selector: string, name: string) {
    await this.page.locator(selector).screenshot({
      path: `tests/test-results/screenshots/${name}.png`,
    });
  }
}

/**
 * Create test utility instances for a page
 */
export function createTestUtils(page: Page) {
  return {
    wait: new WaitUtils(page),
    form: new FormUtils(page),
    auth: new AuthUtils(page),
    nav: new NavigationUtils(page),
    assert: new AssertionUtils(page),
    screenshot: new ScreenshotUtils(page),
    data: DataUtils,
    selectors,
  };
}

/**
 * Custom expect matchers for common assertions
 */
export const customExpect = {
  /**
   * Expect element to be loading
   */
  async toBeLoading(locator: Locator) {
    await expect(locator).toHaveAttribute('disabled');
    await expect(locator).toContainText(/loading|saving|processing/i);
  },

  /**
   * Expect form to be valid
   */
  async toBeValidForm(page: Page) {
    const invalidInputs = page.locator('input:invalid, select:invalid, textarea:invalid');
    await expect(invalidInputs).toHaveCount(0);
  },

  /**
   * Expect page to be accessible (basic check)
   */
  async toBeAccessible(page: Page) {
    // Check for basic accessibility requirements
    await expect(page.locator('html')).toHaveAttribute('lang');
    await expect(page.locator('title')).not.toBeEmpty();
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }
  },
};

/**
 * Retry utilities for flaky operations
 */
export class RetryUtils {
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}

// Export everything for easy importing
export * from '../fixtures/data.fixture';