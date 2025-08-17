# Visual Regression Testing Guide

This guide covers the comprehensive visual regression testing setup for Osassy's Kitchen application, designed to catch unintended visual changes and ensure consistent UI across different browsers and devices.

## Overview

Our visual regression testing suite captures screenshots of key pages and components, comparing them against baseline images to detect visual differences. The tests cover:

- **All major pages**: Landing, authentication, user dashboard, admin panels
- **Responsive layouts**: Desktop, tablet, mobile viewports
- **Component states**: Hover, focus, disabled, error, loading
- **Form validation**: Empty, invalid, valid states
- **Modal and dialog states**: Open, closed, different content
- **Cross-browser consistency**: Chrome, Firefox, Safari, Edge
- **Theme variations**: Light mode, dark mode, high contrast
- **Error states**: 404, network errors, timeouts
- **Loading states**: Skeletons, spinners, progress indicators

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Ensure the application is running
npm run dev
```

### Basic Usage

```bash
# Run all visual regression tests
./tests/e2e/scripts/run-visual-tests.sh

# Generate baseline images (first time setup)
./tests/e2e/scripts/run-visual-tests.sh -m baseline -g

# Update specific snapshots
./tests/e2e/scripts/run-visual-tests.sh -m update -p "login"

# Debug tests in headed mode
./tests/e2e/scripts/run-visual-tests.sh -h -d -p "dashboard"
```

## Configuration

### Environment Variables

Set these environment variables to control test behaviour:

```bash
# Generate new baseline images
GENERATE_BASELINES=true

# Update existing snapshots
UPDATE_SNAPSHOTS=true

# Set custom threshold for comparisons (0.0-1.0)
VISUAL_THRESHOLD=0.2

# Run tests in headed mode for debugging
HEADLESS=false

# Slow down actions for debugging (milliseconds)
SLOW_MO=1000

# Enable verbose logging
DEBUG_VISUAL=true

# Skip cross-browser tests for faster execution
SKIP_CROSS_BROWSER=true

# Set specific browser for testing
BROWSER=chrome

# Set viewport size for testing
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
```

### Test Configuration Files

- **`visual.config.ts`**: Main configuration for visual tests
- **`visual-helper.ts`**: Utility functions for visual testing
- **`visual-regression.spec.ts`**: Main test file with all visual tests

## Test Structure

### Test Categories

1. **Landing and Public Pages**
   - Home page
   - Menu page
   - How it works page
   - 404 page

2. **Authentication Pages**
   - Login page (all states)
   - Signup page (validation states)
   - Unauthorized page

3. **User Dashboard**
   - Main dashboard
   - Profile page
   - Orders page
   - Subscriptions page

4. **Subscription Management**
   - Create subscription flow
   - Manage subscriptions
   - Plan selection states

5. **Admin Dashboard**
   - Admin overview
   - Orders management
   - Menu management

6. **Checkout Flow**
   - Checkout process
   - Payment forms
   - Success/cancel pages

7. **Modal and Dialog States**
   - Profile modals
   - Confirmation dialogs
   - Upload modals

8. **Form States**
   - Empty forms
   - Validation errors
   - Success states
   - Loading states

9. **Error States**
   - Network errors
   - Timeout errors
   - 404 errors
   - Empty states

10. **Responsive Design**
    - Navigation across breakpoints
    - Grid layouts
    - Typography scaling
    - Form responsiveness

## Browser and Device Coverage

### Supported Browsers
- **Chrome** (Primary)
- **Firefox**
- **Safari/WebKit**
- **Microsoft Edge**

### Viewport Sizes
- **Desktop**: 1920x1080
- **Laptop**: 1366x768
- **Tablet**: 1024x768 (portrait and landscape)
- **Mobile**: 393x851 (various sizes)
- **Mobile Small**: 375x667

### Device-Specific Testing
- **High DPI displays**: 2x scale factor
- **Touch devices**: Mobile and tablet
- **Print media**: Print stylesheets

## Running Tests

### Command Line Options

```bash
# Test all browsers and viewports
./run-visual-tests.sh

# Test specific browser
./run-visual-tests.sh -b chrome

# Test specific viewport
./run-visual-tests.sh -v mobile

# Test multiple browsers
./run-visual-tests.sh -b chrome,firefox

# Test with pattern matching
./run-visual-tests.sh -p "auth|login"

# Sequential execution (not parallel)
./run-visual-tests.sh -s

# Headed mode with debugging
./run-visual-tests.sh -h -d
```

### Playwright Commands

```bash
# Direct Playwright commands
npx playwright test --config=tests/e2e/visual.config.ts

# Update snapshots
npx playwright test visual-regression --update-snapshots

# Generate baselines
GENERATE_BASELINES=true npx playwright test visual-regression --grep "Generate Baselines"

# Run specific test group
npx playwright test visual-regression --grep "Authentication"

# Debug specific test
npx playwright test visual-regression --grep "login" --debug

# Test specific browser project
npx playwright test visual-regression --project=visual-chrome-desktop
```

## Baseline Management

### Initial Setup

```bash
# Generate baseline images for all pages
GENERATE_BASELINES=true ./run-visual-tests.sh -m baseline

# Generate baselines for specific pages
GENERATE_BASELINES=true ./run-visual-tests.sh -m baseline -p "dashboard"
```

### Updating Baselines

```bash
# Update all snapshots
./run-visual-tests.sh -m update -u

# Update specific snapshots
./run-visual-tests.sh -m update -u -p "login"

# Update for specific browser
./run-visual-tests.sh -m update -u -b firefox
```

### Baseline Storage

Baseline images are stored in:
```
tests/
├── e2e/
│   ├── specs/
│   │   └── visual/
│   │       └── visual-regression.spec.ts-snapshots/
│   │           ├── chrome-desktop/
│   │           ├── chrome-mobile/
│   │           ├── firefox/
│   │           └── webkit/
```

## Debugging Failed Tests

### Visual Diff Analysis

When tests fail, Playwright generates:
1. **Expected image**: Original baseline
2. **Actual image**: Current screenshot
3. **Diff image**: Highlighted differences

### Debug Workflow

1. **Run in headed mode**:
   ```bash
   ./run-visual-tests.sh -h -d -p "failing-test"
   ```

2. **Check HTML report**:
   ```bash
   npx playwright show-report tests/reports/visual-html
   ```

3. **Analyse differences**:
   - Look at diff images in the report
   - Check if changes are intentional
   - Verify responsive behaviour

4. **Common issues**:
   - **Dynamic content**: Timestamps, random IDs
   - **Loading states**: Async content loading
   - **Font loading**: Web fonts not fully loaded
   - **Animation timing**: CSS animations not disabled
   - **Image loading**: Images not fully loaded

### Troubleshooting

```bash
# Clear all baselines and regenerate
rm -rf tests/e2e/specs/visual/visual-regression.spec.ts-snapshots/
GENERATE_BASELINES=true ./run-visual-tests.sh -m baseline

# Test single page in debug mode
./run-visual-tests.sh -h -d -s -p "specific-page"

# Check for console errors
npx playwright test visual-regression --grep "specific-test" --reporter=list
```

## Best Practices

### Writing Visual Tests

1. **Prepare pages consistently**:
   ```typescript
   await PageVisualHelpers.prepareLoginPage(page);
   await visualHelper.waitForPageStable();
   ```

2. **Hide dynamic content**:
   ```typescript
   await visualHelper.hideVolatileElements();
   ```

3. **Test multiple states**:
   ```typescript
   // Test normal, hover, and focus states
   await visualHelper.compareScreenshot('component-normal');
   await visualHelper.compareHoverState(selector, 'component');
   await visualHelper.compareFocusState(selector, 'component');
   ```

4. **Use appropriate thresholds**:
   ```typescript
   // Strict for static content
   await visualHelper.compareScreenshot('static-page', { threshold: 0.1 });
   
   // Relaxed for dynamic content
   await visualHelper.compareScreenshot('dashboard', { threshold: 0.4 });
   ```

### Naming Conventions

- **Test names**: `page-state-viewport` (e.g., `login-form-desktop`)
- **Component tests**: `component-state` (e.g., `button-hover`)
- **Error states**: `page-error-type` (e.g., `dashboard-network-error`)

### Performance Optimization

1. **Skip cross-browser for development**:
   ```bash
   SKIP_CROSS_BROWSER=true ./run-visual-tests.sh
   ```

2. **Test specific sections**:
   ```bash
   ./run-visual-tests.sh -p "auth" -b chrome -v desktop
   ```

3. **Parallel execution** (default):
   ```bash
   ./run-visual-tests.sh # Runs in parallel
   ```

## CI/CD Integration

### GitHub Actions

```yaml
name: Visual Regression Tests
on: [push, pull_request]
jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run start &
      - run: ./tests/e2e/scripts/run-visual-tests.sh -b chrome -v desktop,mobile
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-test-results
          path: tests/reports/
```

### Baseline Storage

For CI/CD, consider storing baselines in:
- **Git LFS**: For version-controlled baselines
- **Cloud storage**: S3, Azure Blob, Google Cloud
- **Artifact storage**: CI/CD artifact repositories

## Common Issues and Solutions

### Dynamic Content

**Problem**: Tests fail due to changing timestamps or IDs

**Solution**:
```typescript
// Hide volatile elements
await page.locator('[data-testid*="timestamp"]').evaluateAll(elements => {
  elements.forEach(el => el.style.visibility = 'hidden');
});

// Or mask them
await visualHelper.compareScreenshot('page', {
  mask: ['[data-testid="timestamp"]', '.live-data']
});
```

### Font Loading

**Problem**: Inconsistent text rendering

**Solution**:
```typescript
// Wait for fonts to load
await page.waitForFunction(() => document.fonts.ready);
```

### Image Loading

**Problem**: Images not fully loaded

**Solution**:
```typescript
// Wait for all images to load
await page.waitForFunction(() => {
  const images = Array.from(document.querySelectorAll('img'));
  return images.every(img => img.complete && img.naturalHeight !== 0);
});
```

### Animation Issues

**Problem**: CSS animations causing inconsistencies

**Solution**:
```typescript
// Disable animations globally
await page.addInitScript(() => {
  const style = document.createElement('style');
  style.innerHTML = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `;
  document.head.appendChild(style);
});
```

## Reporting and Analysis

### HTML Reports

The test suite generates comprehensive HTML reports with:
- Side-by-side image comparisons
- Diff highlighting
- Test execution details
- Browser/viewport breakdown

Access via: `tests/reports/visual-html/index.html`

### JSON Reports

Structured data for programmatic analysis:
```json
{
  "stats": {
    "total": 150,
    "passed": 147,
    "failed": 3,
    "duration": 45000
  },
  "tests": [...]
}
```

### Continuous Monitoring

Set up alerts for:
- Failed visual tests in CI/CD
- Baseline drift over time
- Performance regressions
- Cross-browser inconsistencies

## Advanced Features

### Custom Matchers

```typescript
// Custom threshold per test
await expect(page).toHaveScreenshot('custom.png', {
  threshold: 0.1,
  maxDiffPixels: 50
});
```

### Component Testing

```typescript
// Test specific components
await visualHelper.compareComponent(
  '[data-testid="header"]',
  'navigation-header',
  { threshold: 0.1 }
);
```

### Responsive Testing

```typescript
// Test across all viewports
await visualHelper.testResponsiveScreenshots('landing-page', [
  VisualTestHelper.VIEWPORTS.DESKTOP,
  VisualTestHelper.VIEWPORTS.TABLET,
  VisualTestHelper.VIEWPORTS.MOBILE
]);
```

### Error State Testing

```typescript
// Test various error scenarios
await visualHelper.testErrorStates('dashboard', '/user/dashboard');
```

## Maintenance

### Regular Tasks

1. **Review failed tests weekly**
2. **Update baselines after UI changes**
3. **Clean up outdated baselines**
4. **Monitor test execution time**
5. **Update browser versions quarterly**

### Baseline Cleanup

```bash
# Remove unused baselines
find tests/e2e/specs/visual -name "*.png" -mtime +30 -delete

# Compress baseline directory
tar -czf baselines-backup-$(date +%Y%m%d).tar.gz tests/e2e/specs/visual/
```

## Support and Troubleshooting

### Getting Help

1. **Check this guide** for common issues
2. **Review HTML reports** for visual diffs
3. **Run tests in debug mode** for detailed analysis
4. **Check browser console** for JavaScript errors
5. **Verify network conditions** affect loading

### Contact Information

For technical support or questions about visual regression testing:
- **Team Lead**: [Your Name]
- **Documentation**: This guide
- **Issue Tracker**: GitHub Issues
- **CI/CD Pipeline**: [Your CI/CD System]

---

This visual regression testing setup ensures consistent UI quality across all browsers and devices while providing comprehensive coverage of user interactions and edge cases.