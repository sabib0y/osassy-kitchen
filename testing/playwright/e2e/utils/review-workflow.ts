import { Page } from '@playwright/test';
import { ScreenshotHelper } from './screenshot-helper';
import fs from 'fs/promises';
import path from 'path';

export interface PageReviewConfig {
  name: string;
  url: string;
  elements?: {
    selector: string;
    name: string;
  }[];
  viewports?: Array<{ width: number; height: number; device: string }>;
  interactions?: Array<{
    action: 'click' | 'hover' | 'focus' | 'type';
    selector: string;
    value?: string;
    screenshot?: string;
  }>;
}

export interface PolishChecklist {
  spacing: boolean;
  typography: boolean;
  colors: boolean;
  shadows: boolean;
  borders: boolean;
  hoverStates: boolean;
  focusStates: boolean;
  loadingStates: boolean;
  errorStates: boolean;
  animations: boolean;
  responsive: boolean;
  accessibility: boolean;
}

export class ReviewWorkflow {
  private screenshotHelper: ScreenshotHelper;
  private reviewPath = path.join(process.cwd(), 'testing/playwright/screenshots/review');

  constructor(private page: Page) {
    this.screenshotHelper = new ScreenshotHelper(page);
  }

  /**
   * Step 1: Capture baseline screenshots
   */
  async captureBaseline(config: PageReviewConfig) {
    console.log(`\n📸 Capturing baseline for: ${config.name}`);
    
    // Navigate to page
    await this.page.goto(config.url, { waitUntil: 'networkidle' });
    await this.screenshotHelper.hideDynamicContent();
    await this.page.waitForTimeout(1000); // Allow page to settle

    // Full page screenshot
    const mainScreenshot = await this.screenshotHelper.captureForReview(
      `${config.name}-full`,
      'baseline'
    );
    console.log(`  ✓ Full page: ${mainScreenshot}`);

    // Element screenshots
    if (config.elements) {
      for (const element of config.elements) {
        const elementScreenshot = await this.screenshotHelper.captureElement(
          element.selector,
          `${config.name}-${element.name}`,
          'review/baseline'
        );
        console.log(`  ✓ Element (${element.name}): ${elementScreenshot}`);
      }
    }

    // Responsive screenshots
    if (config.viewports) {
      for (const viewport of config.viewports) {
        await this.page.setViewportSize(viewport);
        await this.page.waitForTimeout(500);
        const responsiveScreenshot = await this.screenshotHelper.captureForReview(
          `${config.name}-${viewport.device}`,
          'baseline'
        );
        console.log(`  ✓ ${viewport.device}: ${responsiveScreenshot}`);
      }
    }

    // Interaction states
    if (config.interactions) {
      for (const interaction of config.interactions) {
        await this.performInteraction(interaction);
        if (interaction.screenshot) {
          const stateScreenshot = await this.screenshotHelper.captureForReview(
            `${config.name}-${interaction.screenshot}`,
            'baseline'
          );
          console.log(`  ✓ ${interaction.screenshot}: ${stateScreenshot}`);
        }
      }
    }

    return mainScreenshot;
  }

  /**
   * Step 2: Generate review report
   */
  async generateReviewReport(pageName: string): Promise<string> {
    const reportPath = path.join(this.reviewPath, 'reports', `${pageName}-review.html`);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>UI Review: ${pageName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 2px solid #C52D2F; padding-bottom: 10px; }
    .review-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin: 20px 0; }
    .screenshot-card { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .screenshot-card img { width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .screenshot-card h3 { margin: 10px 0; color: #666; font-size: 14px; }
    .checklist { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .checklist h2 { color: #C52D2F; margin-bottom: 15px; }
    .checklist-item { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    .checklist-item:last-child { border-bottom: none; }
    .status { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .status.pending { background: #FFF3CD; color: #856404; }
    .status.approved { background: #D4EDDA; color: #155724; }
    .status.needs-work { background: #F8D7DA; color: #721C24; }
  </style>
</head>
<body>
  <h1>🎨 UI Review: ${pageName}</h1>
  
  <div class="checklist">
    <h2>Polish Checklist</h2>
    <div class="checklist-item">
      <span>✨ Spacing & Alignment</span>
      <span class="status pending">Pending Review</span>
    </div>
    <div class="checklist-item">
      <span>📝 Typography Hierarchy</span>
      <span class="status pending">Pending Review</span>
    </div>
    <div class="checklist-item">
      <span>🎨 Color Consistency</span>
      <span class="status pending">Pending Review</span>
    </div>
    <div class="checklist-item">
      <span>📱 Responsive Design</span>
      <span class="status pending">Pending Review</span>
    </div>
    <div class="checklist-item">
      <span>🎯 Interactive States</span>
      <span class="status pending">Pending Review</span>
    </div>
    <div class="checklist-item">
      <span>⚡ Animations & Transitions</span>
      <span class="status pending">Pending Review</span>
    </div>
    <div class="checklist-item">
      <span>♿ Accessibility</span>
      <span class="status pending">Pending Review</span>
    </div>
  </div>

  <h2>📸 Current Screenshots</h2>
  <div class="review-grid">
    <!-- Screenshots will be inserted here -->
  </div>
  
  <script>
    // This will be populated with actual screenshot paths
    const screenshots = [];
    
    const grid = document.querySelector('.review-grid');
    screenshots.forEach(screenshot => {
      const card = document.createElement('div');
      card.className = 'screenshot-card';
      card.innerHTML = \`
        <h3>\${screenshot.name}</h3>
        <img src="\${screenshot.path}" alt="\${screenshot.name}" />
      \`;
      grid.appendChild(card);
    });
  </script>
</body>
</html>`;

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, html);
    
    return reportPath;
  }

  /**
   * Step 3: Apply polish based on feedback
   */
  async applyPolish(pageName: string, polish: Partial<PolishChecklist>) {
    console.log(`\n🎨 Applying polish to: ${pageName}`);
    
    // This will be called after you review and provide feedback
    // The actual polish implementation will be done in the component files
    
    const polishLog = {
      page: pageName,
      timestamp: new Date().toISOString(),
      applied: polish,
    };

    const logPath = path.join(this.reviewPath, 'polish-log.json');
    let logs = [];
    
    try {
      const existing = await fs.readFile(logPath, 'utf-8');
      logs = JSON.parse(existing);
    } catch (e) {
      // File doesn't exist yet
    }
    
    logs.push(polishLog);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    
    return polishLog;
  }

  /**
   * Step 4: Capture polished version
   */
  async capturePolished(config: PageReviewConfig) {
    console.log(`\n📸 Capturing polished version for: ${config.name}`);
    
    // Same as baseline but saves to 'polished' folder
    await this.page.goto(config.url, { waitUntil: 'networkidle' });
    await this.screenshotHelper.hideDynamicContent();
    await this.page.waitForTimeout(1000);

    const mainScreenshot = await this.screenshotHelper.captureForReview(
      `${config.name}-full`,
      'polished'
    );
    
    console.log(`  ✓ Polished version captured: ${mainScreenshot}`);
    return mainScreenshot;
  }

  /**
   * Step 5: Mark as approved
   */
  async markApproved(pageName: string) {
    console.log(`\n✅ Marking ${pageName} as approved`);
    
    // Copy from polished to approved
    const polishedPath = path.join(this.reviewPath, 'polished', `${pageName}-full.png`);
    const approvedPath = path.join(this.reviewPath, 'approved', `${pageName}-full.png`);
    
    await fs.mkdir(path.dirname(approvedPath), { recursive: true });
    await fs.copyFile(polishedPath, approvedPath);
    
    // Update status
    const statusPath = path.join(this.reviewPath, 'approval-status.json');
    let status = {};
    
    try {
      const existing = await fs.readFile(statusPath, 'utf-8');
      status = JSON.parse(existing);
    } catch (e) {
      // File doesn't exist yet
    }
    
    status[pageName] = {
      approved: true,
      timestamp: new Date().toISOString(),
      screenshotPath: approvedPath,
    };
    
    await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
    
    return approvedPath;
  }

  /**
   * Helper: Perform interaction
   */
  private async performInteraction(interaction: any) {
    const element = this.page.locator(interaction.selector);
    
    switch (interaction.action) {
      case 'click':
        await element.click();
        break;
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
      case 'type':
        await element.fill(interaction.value || '');
        break;
    }
    
    await this.page.waitForTimeout(500); // Let interaction settle
  }
}