#!/usr/bin/env node

/**
 * Visual Test Runner - Osassy's Kitchen
 * 
 * Utility script for managing visual regression tests and baselines.
 * 
 * Usage:
 *   npm run visual:test                    # Run all visual tests
 *   npm run visual:baseline                # Generate new baselines
 *   npm run visual:update                  # Update existing snapshots
 *   npm run visual:compare                 # Compare against baselines
 *   npm run visual:clean                   # Clean baseline directory
 *   npm run visual:report                  # Generate visual test report
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

const VISUAL_CONFIG_PATH = 'tests/e2e/visual.config.ts';
const BASELINE_DIR = 'tests/e2e/visual-baselines';
const RESULTS_DIR = 'tests/visual-results';
const REPORTS_DIR = 'tests/reports';

interface VisualTestOptions {
  browsers?: string[];
  devices?: string[];
  updateSnapshots?: boolean;
  headless?: boolean;
  parallel?: boolean;
  grep?: string;
  threshold?: number;
  debug?: boolean;
}

class VisualTestRunner {
  private options: VisualTestOptions;

  constructor(options: VisualTestOptions = {}) {
    this.options = {
      browsers: ['chromium'],
      devices: ['desktop'],
      headless: true,
      parallel: false,
      threshold: 0.2,
      debug: false,
      ...options,
    };
  }

  /**
   * Build Playwright command with appropriate flags
   */
  private buildPlaywrightCommand(
    action: 'test' | 'show-report',
    testPattern?: string,
    additionalFlags: string[] = []
  ): string {
    const baseCommand = `npx playwright ${action}`;
    const flags = [
      `--config=${VISUAL_CONFIG_PATH}`,
      ...additionalFlags,
    ];

    // Add test pattern if specified
    if (testPattern) {
      flags.push(testPattern);
    }

    // Add browser selection
    if (this.options.browsers) {
      this.options.browsers.forEach(browser => {
        flags.push(`--project=visual-${browser}*`);
      });
    }

    // Add grep pattern if specified
    if (this.options.grep) {
      flags.push(`--grep="${this.options.grep}"`);
    }

    // Add update snapshots flag
    if (this.options.updateSnapshots) {
      flags.push('--update-snapshots');
    }

    // Add headless flag
    if (!this.options.headless) {
      flags.push('--headed');
    }

    // Add parallel execution
    if (this.options.parallel) {
      flags.push('--workers=4');
    } else {
      flags.push('--workers=1');
    }

    // Add debug flags
    if (this.options.debug) {
      flags.push('--debug');
      flags.push('--timeout=0');
    }

    return `${baseCommand} ${flags.join(' ')}`;
  }

  /**
   * Run visual regression tests
   */
  async runVisualTests(): Promise<void> {
    console.log('🔍 Running visual regression tests...');
    console.log(`📊 Configuration: ${VISUAL_CONFIG_PATH}`);
    console.log(`🌐 Browsers: ${this.options.browsers?.join(', ')}`);
    console.log(`📱 Devices: ${this.options.devices?.join(', ')}`);
    
    try {
      const command = this.buildPlaywrightCommand('test', 'specs/visual/visual-regression.spec.ts');
      console.log(`\n🚀 Executing: ${command}\n`);
      
      execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          VISUAL_THRESHOLD: this.options.threshold?.toString(),
          PWDEBUG: this.options.debug ? '1' : '0',
        },
      });
      
      console.log('\n✅ Visual regression tests completed successfully!');
      this.generateSummaryReport();
      
    } catch (error) {
      console.error('\n❌ Visual regression tests failed!');
      console.error('Run `npm run visual:report` to view detailed results.');
      process.exit(1);
    }
  }

  /**
   * Generate new baseline images
   */
  async generateBaselines(): Promise<void> {
    console.log('📸 Generating new baseline images...');
    
    // Ensure baseline directory exists
    this.ensureDirectory(BASELINE_DIR);
    
    try {
      const command = this.buildPlaywrightCommand(
        'test',
        'specs/visual/baseline-generation.spec.ts',
        ['--update-snapshots']
      );
      
      console.log(`\n🚀 Executing: ${command}\n`);
      
      execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          GENERATE_BASELINES: 'true',
          VISUAL_THRESHOLD: this.options.threshold?.toString(),
        },
      });
      
      console.log('\n✅ Baseline generation completed successfully!');
      this.listGeneratedBaselines();
      
    } catch (error) {
      console.error('\n❌ Baseline generation failed!');
      process.exit(1);
    }
  }

  /**
   * Update existing snapshots
   */
  async updateSnapshots(): Promise<void> {
    console.log('🔄 Updating existing visual snapshots...');
    
    try {
      const command = this.buildPlaywrightCommand(
        'test',
        'specs/visual/',
        ['--update-snapshots']
      );
      
      console.log(`\n🚀 Executing: ${command}\n`);
      
      execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          UPDATE_SNAPSHOTS: 'true',
        },
      });
      
      console.log('\n✅ Snapshot update completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Snapshot update failed!');
      process.exit(1);
    }
  }

  /**
   * Compare current state against baselines
   */
  async compareWithBaselines(): Promise<void> {
    console.log('🔄 Comparing current state with baselines...');
    
    if (!fs.existsSync(BASELINE_DIR)) {
      console.error('❌ No baselines found! Run `npm run visual:baseline` first.');
      process.exit(1);
    }
    
    try {
      const command = this.buildPlaywrightCommand('test', 'specs/visual/');
      
      console.log(`\n🚀 Executing: ${command}\n`);
      
      execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          COMPARE_MODE: 'true',
        },
      });
      
      console.log('\n✅ Visual comparison completed successfully!');
      this.generateComparisonReport();
      
    } catch (error) {
      console.error('\n❌ Visual comparison failed!');
      console.log('\nDifferences detected. Check the HTML report for details:');
      this.showReport();
      process.exit(1);
    }
  }

  /**
   * Clean baseline directory
   */
  async cleanBaselines(): Promise<void> {
    console.log('🧹 Cleaning baseline directory...');
    
    if (fs.existsSync(BASELINE_DIR)) {
      fs.rmSync(BASELINE_DIR, { recursive: true, force: true });
      console.log('✅ Baseline directory cleaned successfully!');
    } else {
      console.log('ℹ️ No baseline directory found to clean.');
    }
    
    if (fs.existsSync(RESULTS_DIR)) {
      fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
      console.log('✅ Results directory cleaned successfully!');
    }
  }

  /**
   * Generate and show HTML report
   */
  async showReport(): Promise<void> {
    console.log('📊 Opening visual test report...');
    
    try {
      const command = this.buildPlaywrightCommand('show-report');
      execSync(command, { stdio: 'inherit' });
      
    } catch (error) {
      console.error('❌ Failed to open report.');
      console.log(`Manual path: ${path.join(REPORTS_DIR, 'visual-html/index.html')}`);
    }
  }

  /**
   * Run cross-browser visual tests
   */
  async runCrossBrowserTests(): Promise<void> {
    console.log('🌍 Running cross-browser visual tests...');
    
    const browsers = ['chromium', 'firefox', 'webkit'];
    
    for (const browser of browsers) {
      console.log(`\n🔍 Testing with ${browser}...`);
      
      try {
        const command = this.buildPlaywrightCommand(
          'test',
          'specs/visual/',
          [`--project=visual-${browser}`]
        );
        
        execSync(command, {
          stdio: 'inherit',
          env: {
            ...process.env,
            BROWSER: browser,
          },
        });
        
        console.log(`✅ ${browser} tests completed successfully!`);
        
      } catch (error) {
        console.error(`❌ ${browser} tests failed!`);
      }
    }
  }

  /**
   * Generate summary report
   */
  private generateSummaryReport(): void {
    const reportPath = path.join(REPORTS_DIR, 'visual-summary.md');
    this.ensureDirectory(REPORTS_DIR);
    
    const summary = `# Visual Regression Test Summary

## Test Run Information
- **Date**: ${new Date().toISOString()}
- **Browsers**: ${this.options.browsers?.join(', ')}
- **Devices**: ${this.options.devices?.join(', ')}
- **Threshold**: ${this.options.threshold}

## Results
- **Status**: ✅ Passed
- **Test Config**: ${VISUAL_CONFIG_PATH}
- **Baseline Directory**: ${BASELINE_DIR}
- **Results Directory**: ${RESULTS_DIR}

## Next Steps
1. Review HTML report: \`npm run visual:report\`
2. Update snapshots if needed: \`npm run visual:update\`
3. Compare with baselines: \`npm run visual:compare\`

---
Generated by Visual Test Runner
`;

    fs.writeFileSync(reportPath, summary);
    console.log(`📋 Summary report generated: ${reportPath}`);
  }

  /**
   * Generate comparison report
   */
  private generateComparisonReport(): void {
    console.log('📊 Generating comparison report...');
    // This would be expanded to parse test results and generate detailed comparison report
    console.log('✅ Comparison report available in HTML format.');
  }

  /**
   * List generated baseline files
   */
  private listGeneratedBaselines(): void {
    if (!fs.existsSync(BASELINE_DIR)) {
      console.log('ℹ️ No baseline directory found.');
      return;
    }

    const files = this.getFilesRecursively(BASELINE_DIR, '.png');
    console.log(`\n📁 Generated ${files.length} baseline images:`);
    
    files.slice(0, 10).forEach(file => {
      console.log(`  📸 ${path.relative(BASELINE_DIR, file)}`);
    });
    
    if (files.length > 10) {
      console.log(`  ... and ${files.length - 10} more`);
    }
  }

  /**
   * Utility: Ensure directory exists
   */
  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Utility: Get files recursively
   */
  private getFilesRecursively(dir: string, extension: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}

// CLI Setup
program
  .name('visual-test-runner')
  .description('Visual regression testing utility for Osassy\'s Kitchen')
  .version('1.0.0');

program
  .command('test')
  .description('Run visual regression tests')
  .option('-b, --browsers <browsers>', 'Browsers to test (comma-separated)', 'chromium')
  .option('-d, --devices <devices>', 'Devices to test (comma-separated)', 'desktop')
  .option('-g, --grep <pattern>', 'Test pattern to match')
  .option('-t, --threshold <threshold>', 'Visual diff threshold', '0.2')
  .option('--headed', 'Run tests in headed mode')
  .option('--parallel', 'Run tests in parallel')
  .option('--debug', 'Enable debug mode')
  .action(async (options) => {
    const runner = new VisualTestRunner({
      browsers: options.browsers.split(','),
      devices: options.devices.split(','),
      grep: options.grep,
      threshold: parseFloat(options.threshold),
      headless: !options.headed,
      parallel: options.parallel,
      debug: options.debug,
    });
    
    await runner.runVisualTests();
  });

program
  .command('baseline')
  .description('Generate new baseline images')
  .option('-b, --browsers <browsers>', 'Browsers to test (comma-separated)', 'chromium')
  .option('--headed', 'Run in headed mode for debugging')
  .action(async (options) => {
    const runner = new VisualTestRunner({
      browsers: options.browsers.split(','),
      headless: !options.headed,
      updateSnapshots: true,
    });
    
    await runner.generateBaselines();
  });

program
  .command('update')
  .description('Update existing snapshots')
  .option('-g, --grep <pattern>', 'Test pattern to match')
  .action(async (options) => {
    const runner = new VisualTestRunner({
      grep: options.grep,
      updateSnapshots: true,
    });
    
    await runner.updateSnapshots();
  });

program
  .command('compare')
  .description('Compare current state with baselines')
  .option('-t, --threshold <threshold>', 'Visual diff threshold', '0.2')
  .action(async (options) => {
    const runner = new VisualTestRunner({
      threshold: parseFloat(options.threshold),
    });
    
    await runner.compareWithBaselines();
  });

program
  .command('clean')
  .description('Clean baseline and result directories')
  .action(async () => {
    const runner = new VisualTestRunner();
    await runner.cleanBaselines();
  });

program
  .command('report')
  .description('Open visual test report')
  .action(async () => {
    const runner = new VisualTestRunner();
    await runner.showReport();
  });

program
  .command('cross-browser')
  .description('Run cross-browser visual tests')
  .action(async () => {
    const runner = new VisualTestRunner();
    await runner.runCrossBrowserTests();
  });

// Handle CLI execution
if (require.main === module) {
  program.parse();
}

export { VisualTestRunner };