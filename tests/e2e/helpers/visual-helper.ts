import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Visual Testing Helper - Osassy's Kitchen
 * Utilities for visual regression testing with Playwright
 */

export interface ViewportConfig {
  width: number;
  height: number;
  name: string;
  device?: string;
}

export interface VisualTestOptions {
  threshold?: number;
  mask?: string[];
  clip?: { x: number; y: number; width: number; height: number };
  fullPage?: boolean;
  animations?: 'disabled' | 'allow';
  maxDiffPixels?: number;
  timeout?: number;
}

export class VisualTestHelper {
  private page: Page;
  private testName: string;
  private baselineDir: string;

  constructor(page: Page, testName: string) {
    this.page = page;
    this.testName = testName;
    this.baselineDir = path.join(process.cwd(), 'tests/e2e/visual-baselines');
    this.ensureBaselineDirectory();
  }

  /**
   * Standard viewport configurations for responsive testing
   */
  static readonly VIEWPORTS: Record<string, ViewportConfig> = {
    DESKTOP: { width: 1920, height: 1080, name: 'desktop', device: 'Desktop Chrome' },
    LAPTOP: { width: 1366, height: 768, name: 'laptop', device: 'Laptop Chrome' },
    TABLET: { width: 1024, height: 768, name: 'tablet', device: 'iPad Pro' },
    TABLET_PORTRAIT: { width: 768, height: 1024, name: 'tablet-portrait', device: 'iPad Pro Portrait' },
    MOBILE: { width: 393, height: 851, name: 'mobile', device: 'Pixel 5' },
    MOBILE_SMALL: { width: 375, height: 667, name: 'mobile-small', device: 'iPhone SE' },
    MOBILE_LARGE: { width: 414, height: 896, name: 'mobile-large', device: 'iPhone 11 Pro Max' },
  };

  /**
   * Default visual test options
   */
  static readonly DEFAULT_OPTIONS: VisualTestOptions = {
    threshold: 0.2,
    fullPage: true,
    animations: 'disabled',
    maxDiffPixels: 100,
    timeout: 30000,
  };

  /**
   * Ensure baseline directory exists
   */
  private ensureBaselineDirectory(): void {
    if (!fs.existsSync(this.baselineDir)) {
      fs.mkdirSync(this.baselineDir, { recursive: true });
    }
  }

  /**
   * Wait for page to be fully loaded and stable
   */
  async waitForPageStable(): Promise<void> {
    // Wait for network idle
    await this.page.waitForLoadState('networkidle');
    
    // Wait for any animations to complete
    await this.page.waitForTimeout(500);
    
    // Hide dynamic content that changes between runs
    await this.hideVolatileElements();
    
    // Wait for fonts to load
    await this.page.waitForFunction(() => {
      return document.fonts.ready;
    });
  }

  /**
   * Hide elements that contain dynamic content
   */
  private async hideVolatileElements(): Promise<void> {
    const volatileSelectors = [
      '[data-testid*="timestamp"]',
      '[data-testid*="date"]',
      '[data-testid*="time"]',
      '.timestamp',
      '.live-data',
      '.realtime-counter',
      '[data-volatile]',
      // Add any specific selectors for your app that contain dynamic content
    ];

    for (const selector of volatileSelectors) {
      await this.page.locator(selector).evaluateAll(elements => {
        elements.forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      }).catch(() => {
        // Ignore if elements don't exist
      });
    }
  }

  /**
   * Set viewport and prepare page for screenshot
   */
  async setViewport(viewport: ViewportConfig): Promise<void> {
    await this.page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    
    // Allow page to reflow
    await this.page.waitForTimeout(300);
  }

  /**
   * Take a screenshot and compare with baseline
   */
  async compareScreenshot(
    screenshotName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const mergedOptions = { ...VisualTestHelper.DEFAULT_OPTIONS, ...options };
    
    await this.waitForPageStable();
    
    const screenshotOptions: any = {
      fullPage: mergedOptions.fullPage,
      threshold: mergedOptions.threshold,
      maxDiffPixels: mergedOptions.maxDiffPixels,
      animations: mergedOptions.animations,
    };

    if (mergedOptions.clip) {
      screenshotOptions.clip = mergedOptions.clip;
    }

    if (mergedOptions.mask && mergedOptions.mask.length > 0) {
      screenshotOptions.mask = mergedOptions.mask.map(selector => 
        this.page.locator(selector)
      );
    }

    // Generate screenshot name with test context
    const fullScreenshotName = `${this.testName}-${screenshotName}`;
    
    await expect(this.page).toHaveScreenshot(
      `${fullScreenshotName}.png`,
      screenshotOptions
    );
  }

  /**
   * Test multiple viewports for responsive design
   */
  async testResponsiveScreenshots(
    screenshotName: string,
    viewports: ViewportConfig[] = [
      VisualTestHelper.VIEWPORTS.DESKTOP,
      VisualTestHelper.VIEWPORTS.TABLET,
      VisualTestHelper.VIEWPORTS.MOBILE,
    ],
    options: VisualTestOptions = {}
  ): Promise<void> {
    for (const viewport of viewports) {
      await this.setViewport(viewport);
      await this.compareScreenshot(
        `${screenshotName}-${viewport.name}`,
        options
      );
    }
  }

  /**
   * Scroll and capture long pages in sections
   */
  async captureScrollablePage(
    screenshotName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const mergedOptions = { ...VisualTestHelper.DEFAULT_OPTIONS, ...options };
    
    await this.waitForPageStable();
    
    // First, capture the full page
    await this.compareScreenshot(screenshotName, {
      ...mergedOptions,
      fullPage: true,
    });
    
    // Then capture above-the-fold for critical content
    await this.compareScreenshot(`${screenshotName}-above-fold`, {
      ...mergedOptions,
      fullPage: false,
    });
  }

  /**
   * Test component in isolation by focusing on specific element
   */
  async compareComponent(
    selector: string,
    componentName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      throw new Error(`Component ${componentName} not found or not visible`);
    }
    
    await this.waitForPageStable();
    
    await this.compareScreenshot(componentName, {
      ...options,
      clip: boundingBox,
      fullPage: false,
    });
  }

  /**
   * Test hover states for interactive elements
   */
  async compareHoverState(
    selector: string,
    elementName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    
    // Normal state
    await this.compareScreenshot(`${elementName}-normal`, options);
    
    // Hover state
    await element.hover();
    await this.page.waitForTimeout(200); // Allow hover animations
    await this.compareScreenshot(`${elementName}-hover`, options);
  }

  /**
   * Test focus states for accessibility
   */
  async compareFocusState(
    selector: string,
    elementName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    
    // Normal state
    await this.compareScreenshot(`${elementName}-normal`, options);
    
    // Focus state
    await element.focus();
    await this.page.waitForTimeout(100);
    await this.compareScreenshot(`${elementName}-focus`, options);
  }

  /**
   * Test dark mode if supported
   */
  async testDarkMode(
    screenshotName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    // Test light mode first
    await this.compareScreenshot(`${screenshotName}-light`, options);
    
    // Switch to dark mode if toggle exists
    const darkModeToggle = this.page.locator('[data-testid="theme-toggle"], [data-testid="dark-mode-toggle"]');
    
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.click();
      await this.page.waitForTimeout(500); // Allow theme transition
      await this.compareScreenshot(`${screenshotName}-dark`, options);
      
      // Switch back to light mode
      await darkModeToggle.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Generate baseline images (run once to create reference images)
   */
  async generateBaseline(
    screenshotName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    await this.waitForPageStable();
    
    const screenshotPath = path.join(
      this.baselineDir,
      `${this.testName}-${screenshotName}.png`
    );
    
    const screenshotOptions: any = {
      path: screenshotPath,
      fullPage: options.fullPage ?? true,
      animations: options.animations ?? 'disabled',
    };

    if (options.clip) {
      screenshotOptions.clip = options.clip;
    }

    await this.page.screenshot(screenshotOptions);
    console.log(`Baseline image generated: ${screenshotPath}`);
  }

  /**
   * Clear all baseline images for regeneration
   */
  static clearBaselines(): void {
    const baselineDir = path.join(process.cwd(), 'tests/e2e/visual-baselines');
    if (fs.existsSync(baselineDir)) {
      fs.rmSync(baselineDir, { recursive: true, force: true });
    }
  }

  /**
   * Get current viewport size
   */
  async getCurrentViewport(): Promise<{ width: number; height: number }> {
    return await this.page.viewportSize() || { width: 1280, height: 720 };
  }

  /**
   * Wait for specific element to be stable (no layout shifts)
   */
  async waitForElementStable(selector: string, timeout = 5000): Promise<void> {
    const element = this.page.locator(selector);
    let previousBox: any = null;
    let stableCount = 0;
    const requiredStableChecks = 3;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const currentBox = await element.boundingBox();
        
        if (currentBox && previousBox) {
          const isStable = 
            Math.abs(currentBox.x - previousBox.x) < 1 &&
            Math.abs(currentBox.y - previousBox.y) < 1 &&
            Math.abs(currentBox.width - previousBox.width) < 1 &&
            Math.abs(currentBox.height - previousBox.height) < 1;
          
          if (isStable) {
            stableCount++;
            if (stableCount >= requiredStableChecks) {
              return;
            }
          } else {
            stableCount = 0;
          }
        }
        
        previousBox = currentBox;
        await this.page.waitForTimeout(100);
      } catch (error) {
        // Element might not be ready, continue checking
        await this.page.waitForTimeout(100);
      }
    }
    
    throw new Error(`Element ${selector} did not stabilise within ${timeout}ms`);
  }
}

/**
 * Page-specific helpers for common testing scenarios
 */
export class PageVisualHelpers {
  /**
   * Login page specific helpers
   */
  static async prepareLoginPage(page: Page): Promise<void> {
    // Clear any existing form data
    await page.locator('input[type="email"]').fill('');
    await page.locator('input[type="password"]').fill('');
    
    // Ensure consistent state
    await page.waitForLoadState('networkidle');
  }

  /**
   * Dashboard page specific helpers
   */
  static async prepareDashboardPage(page: Page): Promise<void> {
    // Wait for dashboard widgets to load
    await page.waitForSelector('[data-testid="dashboard-content"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Hide time-sensitive elements
    await page.locator('[data-testid*="live-"]').evaluateAll(elements => {
      elements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    }).catch(() => {});
  }

  /**
   * Orders page specific helpers
   */
  static async prepareOrdersPage(page: Page): Promise<void> {
    // Wait for orders table to load
    await page.waitForSelector('[data-testid="orders-table"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Standardise order timestamps for visual consistency
    await page.locator('[data-testid*="order-time"]').evaluateAll(elements => {
      elements.forEach((el, index) => {
        (el as HTMLElement).textContent = `Order Time ${index + 1}`;
      });
    }).catch(() => {});
  }

  /**
   * Menu management page specific helpers
   */
  static async prepareMenuPage(page: Page): Promise<void> {
    // Wait for menu items to load
    await page.waitForSelector('[data-testid="menu-grid"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Ensure images are loaded
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    });
  }

  /**
   * Enhanced checkout page helpers
   */
  static async prepareCheckoutPage(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
    
    // Wait for payment form to be ready
    await page.waitForSelector('form, [data-testid="checkout-form"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => {});
    
    // Clear any pre-filled data for consistency
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      await inputs.nth(i).fill('');
    }

    // Hide any dynamic pricing that might change
    await page.locator('[data-testid*="dynamic-price"], .dynamic-price').evaluateAll(elements => {
      elements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    }).catch(() => {});
  }

  /**
   * Enhanced subscription page helpers
   */
  static async prepareSubscriptionPage(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
    
    // Wait for subscription plans to load
    await page.waitForSelector('[data-testid="subscription-plans"], .subscription-plans', {
      state: 'visible',
      timeout: 10000
    }).catch(() => {});
    
    // Reset any selected plans for consistency
    await page.locator('.plan-selected, .selected').evaluateAll(elements => {
      elements.forEach(el => {
        el.classList.remove('plan-selected', 'selected', 'active');
      });
    }).catch(() => {});

    // Standardise pricing display
    await page.locator('[data-testid*="price"], .price').evaluateAll(elements => {
      elements.forEach((el, index) => {
        (el as HTMLElement).textContent = `£${(index + 1) * 10}.99`;
      });
    }).catch(() => {});
  }

  /**
   * Enhanced modal preparation
   */
  static async prepareModal(page: Page, modalSelector: string): Promise<void> {
    const modal = page.locator(modalSelector);
    
    if (await modal.isVisible()) {
      // Wait for modal animations to complete
      await page.waitForTimeout(500);
      
      // Ensure modal is fully rendered
      await page.waitForFunction(
        (selector) => {
          const modalEl = document.querySelector(selector);
          return modalEl && modalEl.getBoundingClientRect().height > 0;
        },
        modalSelector
      );

      // Hide any loading states within the modal
      await modal.locator('.loading, .spinner').evaluateAll(elements => {
        elements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      }).catch(() => {});
    }
  }
}