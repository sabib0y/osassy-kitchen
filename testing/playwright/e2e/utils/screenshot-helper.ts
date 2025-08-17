import { Page } from '@playwright/test';
import path from 'path';

export class ScreenshotHelper {
  private basePath = path.join(process.cwd(), 'testing/playwright/screenshots');

  constructor(private page: Page) {}

  /**
   * Capture screenshot for review workflow
   */
  async captureForReview(
    name: string,
    stage: 'baseline' | 'polished' | 'approved',
    options?: {
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
      mask?: string[];
    }
  ) {
    const screenshotPath = path.join(this.basePath, 'review', stage, `${name}.png`);
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: options?.fullPage ?? true,
      clip: options?.clip,
      mask: options?.mask ? await this.page.locator(options.mask.join(', ')).all() : undefined,
      animations: 'disabled',
    });

    return screenshotPath;
  }

  /**
   * Capture test result screenshot
   */
  async captureTestResult(
    name: string,
    category: 'happy-paths' | 'error-states' | 'responsive',
    options?: {
      fullPage?: boolean;
      viewport?: { width: number; height: number };
    }
  ) {
    if (options?.viewport) {
      await this.page.setViewportSize(options.viewport);
    }

    const screenshotPath = path.join(
      this.basePath,
      'test-results',
      category,
      `${name}.png`
    );

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: options?.fullPage ?? true,
      animations: 'disabled',
    });

    return screenshotPath;
  }

  /**
   * Capture element screenshot
   */
  async captureElement(selector: string, name: string, folder: string) {
    const element = await this.page.locator(selector);
    const screenshotPath = path.join(this.basePath, folder, `${name}.png`);
    
    await element.screenshot({
      path: screenshotPath,
      animations: 'disabled',
    });

    return screenshotPath;
  }

  /**
   * Wait for animations to complete before screenshot
   */
  async waitForAnimations() {
    await this.page.evaluate(() => {
      return Promise.all(
        Array.from(document.getAnimations()).map(animation => animation.finished)
      );
    });
  }

  /**
   * Hide dynamic content for consistent screenshots
   */
  async hideDynamicContent() {
    await this.page.addStyleTag({
      content: `
        /* Hide timestamps and dynamic dates */
        [data-testid*="timestamp"],
        [data-testid*="date"],
        .timestamp,
        .date-time {
          visibility: hidden !important;
        }
        
        /* Disable animations */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
  }

  /**
   * Compare screenshots for visual regression
   */
  async compareWithBaseline(name: string) {
    const baselinePath = path.join(this.basePath, 'visual-regression', 'baseline', `${name}.png`);
    const currentPath = path.join(this.basePath, 'visual-regression', 'current', `${name}.png`);
    
    await this.page.screenshot({
      path: currentPath,
      fullPage: true,
      animations: 'disabled',
    });

    // Visual comparison will be handled by Playwright's built-in comparison
    return { baselinePath, currentPath };
  }
}