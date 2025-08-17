#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

interface TestSuite {
  name: string;
  pattern: string;
  timeout: number;
  retries: number;
  description: string;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  error?: string;
  reportPath?: string;
}

interface RunnerConfig {
  baseURL: string;
  headless: boolean;
  parallel: boolean;
  browsers: string[];
  outputDir: string;
  reportDir: string;
  maxRetries: number;
  globalTimeout: number;
}

class E2ETestRunner {
  private config: RunnerConfig;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor(config: Partial<RunnerConfig> = {}) {
    this.config = {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      headless: process.env.CI === 'true' || process.env.HEADLESS !== 'false',
      parallel: process.env.PARALLEL !== 'false',
      browsers: process.env.BROWSERS?.split(',') || ['chromium'],
      outputDir: resolve('./tests/reports'),
      reportDir: resolve('./tests/reports'),
      maxRetries: parseInt(process.env.MAX_RETRIES || '2'),
      globalTimeout: parseInt(process.env.GLOBAL_TIMEOUT || '600000'), // 10 minutes
      ...config,
    };

    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [
      this.config.outputDir,
      this.config.reportDir,
      join(this.config.reportDir, 'html'),
      join(this.config.reportDir, 'json'),
      join(this.config.reportDir, 'junit'),
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  private getTestSuites(): TestSuite[] {
    return [
      {
        name: 'Authentication',
        pattern: '**/auth/*.spec.ts',
        timeout: 30000,
        retries: 2,
        description: 'User authentication flow tests',
      },
      {
        name: 'User Management',
        pattern: '**/user/*.spec.ts',
        timeout: 45000,
        retries: 2,
        description: 'User dashboard and profile tests',
      },
      {
        name: 'Admin Features',
        pattern: '**/admin/*.spec.ts',
        timeout: 60000,
        retries: 1,
        description: 'Admin dashboard and management tests',
      },
      {
        name: 'Integration',
        pattern: '**/integration/*.spec.ts',
        timeout: 90000,
        retries: 2,
        description: 'End-to-end integration tests',
      },
      {
        name: 'Error Handling',
        pattern: '**/errors/*.spec.ts',
        timeout: 30000,
        retries: 1,
        description: 'Error scenarios and unhappy paths',
      },
      {
        name: 'Visual Regression',
        pattern: '**/visual/*.spec.ts',
        timeout: 120000,
        retries: 1,
        description: 'Visual regression and UI consistency tests',
      },
    ];
  }

  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    const startTime = Date.now();
    const suiteName = suite.name.toLowerCase().replace(/\s+/g, '-');
    const reportPath = join(this.config.reportDir, 'html', `${suiteName}-report.html`);
    const jsonReportPath = join(this.config.reportDir, 'json', `${suiteName}-results.json`);

    console.log(`\n🧪 Running ${suite.name} tests...`);
    console.log(`   Pattern: ${suite.pattern}`);
    console.log(`   Timeout: ${suite.timeout}ms`);
    console.log(`   Retries: ${suite.retries}`);

    const args = [
      'test',
      '--config=tests/e2e/playwright.config.ts',
      `--grep="${suite.pattern}"`,
      `--timeout=${suite.timeout}`,
      `--retries=${suite.retries}`,
      `--reporter=html,json`,
      `--output-dir=${this.config.outputDir}`,
      '--trace=retain-on-failure',
      '--screenshot=only-on-failure',
      '--video=retain-on-failure',
    ];

    if (this.config.headless) {
      args.push('--headed=false');
    }

    if (!this.config.parallel) {
      args.push('--workers=1');
    }

    // Add browser selection
    if (this.config.browsers.length === 1) {
      args.push(`--project=${this.config.browsers[0]}`);
    }

    try {
      const result = await this.executeCommand('npx', ['playwright', ...args]);
      const duration = Date.now() - startTime;

      if (result.code === 0) {
        console.log(`✅ ${suite.name} tests passed (${(duration / 1000).toFixed(2)}s)`);
        return {
          suite: suite.name,
          passed: true,
          duration,
          reportPath,
        };
      } else {
        console.log(`❌ ${suite.name} tests failed (${(duration / 1000).toFixed(2)}s)`);
        return {
          suite: suite.name,
          passed: false,
          duration,
          error: result.error || 'Test execution failed',
          reportPath,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`💥 ${suite.name} tests crashed (${(duration / 1000).toFixed(2)}s)`);
      return {
        suite: suite.name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeCommand(
    command: string,
    args: string[],
    options: { timeout?: number } = {}
  ): Promise<{ code: number; stdout: string; stderr: string; error?: string }> {
    return new Promise((resolve) => {
      const timeout = options.timeout || this.config.globalTimeout;
      let timeoutId: NodeJS.Timeout;

      const child = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      child.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          code: code || 0,
          stdout,
          stderr,
        });
      });

      child.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          code: 1,
          stdout,
          stderr,
          error: error.message,
        });
      });

      // Set timeout
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);

        resolve({
          code: 1,
          stdout,
          stderr,
          error: `Test suite timed out after ${timeout}ms`,
        });
      }, timeout);
    });
  }

  private async runHealthCheck(): Promise<boolean> {
    console.log('🔍 Running health check...');

    try {
      const result = await this.executeCommand('curl', [
        '-f',
        '-s',
        '--max-time',
        '10',
        this.config.baseURL,
      ], { timeout: 15000 });

      if (result.code === 0) {
        console.log('✅ Application is running and accessible');
        return true;
      } else {
        console.log('❌ Application health check failed');
        console.log('   Make sure the application is running on', this.config.baseURL);
        return false;
      }
    } catch (error) {
      console.log('💥 Health check crashed:', error);
      return false;
    }
  }

  private generateSummaryReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    const summary = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      config: this.config,
      summary: {
        total,
        passed,
        failed,
        successRate: total > 0 ? (passed / total) * 100 : 0,
      },
      results: this.results,
    };

    // Write JSON summary
    const summaryPath = join(this.config.reportDir, 'test-summary.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Write HTML summary
    const htmlSummary = this.generateHTMLSummary(summary);
    const htmlPath = join(this.config.reportDir, 'index.html');
    writeFileSync(htmlPath, htmlSummary);

    console.log('\n📊 Test Execution Summary');
    console.log('=' .repeat(50));
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Total Suites: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${summary.summary.successRate.toFixed(1)}%`);
    console.log('');
    console.log('📁 Reports generated:');
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   JSON: ${summaryPath}`);

    if (failed > 0) {
      console.log('\n❌ Failed test suites:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   • ${r.suite}: ${r.error || 'Unknown error'}`);
        });
    }
  }

  private generateHTMLSummary(summary: any): string {
    const statusClass = summary.summary.failed === 0 ? 'success' : 'failure';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Test Results Summary</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: #2d3748; color: white; padding: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header .subtitle { opacity: 0.8; margin-top: 5px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 20px; }
        .stat { text-align: center; padding: 20px; border-radius: 6px; background: #f8f9fa; }
        .stat.success { background: #d4edda; color: #155724; }
        .stat.failure { background: #f8d7da; color: #721c24; }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.8; }
        .results { padding: 20px; }
        .suite { margin-bottom: 15px; padding: 15px; border-radius: 6px; border-left: 4px solid #ddd; }
        .suite.passed { border-left-color: #28a745; background: #d4edda; }
        .suite.failed { border-left-color: #dc3545; background: #f8d7da; }
        .suite-name { font-weight: bold; margin-bottom: 5px; }
        .suite-duration { font-size: 0.9em; opacity: 0.7; }
        .suite-error { margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 4px; font-family: monospace; font-size: 0.85em; }
        .footer { padding: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>E2E Test Results</h1>
            <div class="subtitle">Generated on ${new Date(summary.timestamp).toLocaleString()}</div>
        </div>
        
        <div class="stats">
            <div class="stat ${statusClass}">
                <div class="stat-value">${summary.summary.total}</div>
                <div class="stat-label">Total Suites</div>
            </div>
            <div class="stat success">
                <div class="stat-value">${summary.summary.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat ${summary.summary.failed > 0 ? 'failure' : ''}">
                <div class="stat-value">${summary.summary.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${summary.summary.successRate.toFixed(1)}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat">
                <div class="stat-value">${(summary.duration / 1000).toFixed(1)}s</div>
                <div class="stat-label">Total Duration</div>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Suite Results</h2>
            ${summary.results.map((result: TestResult) => `
                <div class="suite ${result.passed ? 'passed' : 'failed'}">
                    <div class="suite-name">${result.suite}</div>
                    <div class="suite-duration">Duration: ${(result.duration / 1000).toFixed(2)}s</div>
                    ${result.error ? `<div class="suite-error">${result.error}</div>` : ''}
                    ${result.reportPath ? `<div style="margin-top: 10px;"><a href="${result.reportPath}">View detailed report</a></div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <strong>Configuration:</strong><br>
            Base URL: ${summary.config.baseURL}<br>
            Browsers: ${summary.config.browsers.join(', ')}<br>
            Parallel: ${summary.config.parallel ? 'Yes' : 'No'}<br>
            Headless: ${summary.config.headless ? 'Yes' : 'No'}
        </div>
    </div>
</body>
</html>`;
  }

  async run(): Promise<boolean> {
    this.startTime = Date.now();
    
    console.log('🚀 Starting E2E Test Runner');
    console.log('Configuration:');
    console.log(`   Base URL: ${this.config.baseURL}`);
    console.log(`   Browsers: ${this.config.browsers.join(', ')}`);
    console.log(`   Parallel: ${this.config.parallel}`);
    console.log(`   Headless: ${this.config.headless}`);
    console.log(`   Max Retries: ${this.config.maxRetries}`);

    // Health check
    const isHealthy = await this.runHealthCheck();
    if (!isHealthy) {
      console.log('\n💥 Aborting test run due to failed health check');
      return false;
    }

    const testSuites = this.getTestSuites();

    if (this.config.parallel) {
      console.log('\n🔀 Running test suites in parallel...');
      const promises = testSuites.map(suite => this.runTestSuite(suite));
      this.results = await Promise.all(promises);
    } else {
      console.log('\n⏭️  Running test suites sequentially...');
      for (const suite of testSuites) {
        const result = await this.runTestSuite(suite);
        this.results.push(result);
      }
    }

    this.generateSummaryReport();

    const allPassed = this.results.every(r => r.passed);
    return allPassed;
  }
}

// CLI execution
if (require.main === module) {
  const runner = new E2ETestRunner();
  
  runner.run()
    .then((success) => {
      if (success) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Some tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Test runner crashed:', error);
      process.exit(1);
    });
}

export { E2ETestRunner, TestResult, RunnerConfig };