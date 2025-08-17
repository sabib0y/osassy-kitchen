import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for baseline generation
 * Cleanup and reporting after baseline generation
 */
async function globalTeardown(config: FullConfig) {
  console.log('🎯 Starting baseline generation teardown...');
  
  const baselineDir = path.join(process.cwd(), 'tests/e2e/specs/visual/visual-regression.spec.ts-snapshots');
  const resultsDir = path.join(process.cwd(), 'tests/baseline-results');
  const reportsDir = path.join(process.cwd(), 'tests/reports');
  
  // Count generated baselines
  let totalBaselines = 0;
  let baselinesByBrowser: Record<string, number> = {};
  
  if (fs.existsSync(baselineDir)) {
    const projects = fs.readdirSync(baselineDir);
    
    for (const project of projects) {
      const projectDir = path.join(baselineDir, project);
      if (fs.statSync(projectDir).isDirectory()) {
        const images = fs.readdirSync(projectDir).filter(file => file.endsWith('.png'));
        baselinesByBrowser[project] = images.length;
        totalBaselines += images.length;
      }
    }
  }
  
  // Generate baseline summary report
  const summaryReport = {
    timestamp: new Date().toISOString(),
    totalBaselines,
    baselinesByBrowser,
    directories: {
      baselines: baselineDir,
      results: resultsDir,
      reports: reportsDir,
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      timezone: process.env.TZ,
    },
  };
  
  // Write summary report
  const summaryPath = path.join(reportsDir, 'baseline-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
  
  // Generate human-readable report
  const readableReport = `
# Baseline Generation Summary

Generated on: ${new Date().toISOString()}

## Statistics
- Total baseline images: ${totalBaselines}
- Browsers tested: ${Object.keys(baselinesByBrowser).length}

## Breakdown by Browser/Project
${Object.entries(baselinesByBrowser)
  .map(([browser, count]) => `- ${browser}: ${count} images`)
  .join('\n')}

## Environment
- Node.js: ${process.version}
- Platform: ${process.platform} ${process.arch}
- Timezone: ${process.env.TZ}

## Directories
- Baselines: ${baselineDir}
- Results: ${resultsDir}
- Reports: ${reportsDir}

## Next Steps
1. Review generated baseline images
2. Commit baselines to version control
3. Run visual regression tests to verify setup
4. Update team documentation if needed

## Usage Commands
\`\`\`bash
# Run visual regression tests against these baselines
npm run test:visual

# Update specific baselines
npm run test:visual -- --update-snapshots --grep "specific-test"

# Generate new baselines for specific browser
BROWSER=chrome npm run test:baseline
\`\`\`
`;
  
  const readableReportPath = path.join(reportsDir, 'baseline-summary.md');
  fs.writeFileSync(readableReportPath, readableReport);
  
  // Clean up temporary files
  const tempFiles = [
    path.join(resultsDir, 'browser-test.png'),
  ];
  
  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
  
  // Verify baseline integrity
  const corruptedBaselines: string[] = [];
  
  if (fs.existsSync(baselineDir)) {
    const checkBaseline = (dir: string) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkBaseline(fullPath);
        } else if (item.endsWith('.png')) {
          // Check if PNG file is valid (has minimum size)
          if (stat.size < 100) { // PNG files should be at least 100 bytes
            corruptedBaselines.push(fullPath);
          }
        }
      }
    };
    
    checkBaseline(baselineDir);
  }
  
  if (corruptedBaselines.length > 0) {
    console.warn('⚠️  Warning: Found potentially corrupted baseline images:');
    corruptedBaselines.forEach(file => console.warn(`   ${file}`));
  }
  
  // Output summary
  console.log('📊 Baseline Generation Summary:');
  console.log(`   Total images: ${totalBaselines}`);
  console.log(`   Browsers: ${Object.keys(baselinesByBrowser).join(', ')}`);
  
  if (corruptedBaselines.length > 0) {
    console.log(`   ⚠️  Corrupted: ${corruptedBaselines.length}`);
  }
  
  console.log(`   Reports: ${summaryPath}`);
  console.log('✅ Baseline generation teardown complete');
  
  // Exit with error code if there were corrupted baselines
  if (corruptedBaselines.length > 0) {
    console.error('❌ Baseline generation completed with errors');
    process.exit(1);
  }
}

export default globalTeardown;