# Playwright Testing

This directory contains all Playwright browser automation tests for the Lums Kitchen application.

## Directory Structure

```
testing/playwright/
├── scripts/          # Test scripts
├── screenshots/      # Screenshots captured during tests
├── reports/         # Test reports and logs
└── README.md        # This file
```

## Available Test Scripts

### 1. Subscription Flow Test (`scripts/test-subscription-flow.js`)
Tests the complete happy path for creating a subscription:
- Login with test credentials
- Navigate to subscription page
- Select menu items
- Proceed to Stripe checkout

## Running Tests

From the project root directory:

```bash
# Run subscription flow test
node testing/playwright/scripts/test-subscription-flow.js

# Run with custom options
npx playwright test testing/playwright/scripts/[test-name].js
```

## Test Credentials

Test credentials are stored in: `testing/playwright-test-info.md`
- Email: test@test.com
- Password: test

## Screenshots

All screenshots are automatically saved to `testing/playwright/screenshots/` with descriptive names:
- `login-form.png` - Login page
- `subscription-page-after-login.png` - Subscription page after authentication
- `stripe-checkout.png` - Stripe checkout page
- `error-screenshot.png` - Captured on test failure

## Playwright MCP

Playwright MCP is installed globally and can be started with:
```bash
npx @playwright/mcp
```

Options:
- `--headless false` - Show browser window
- `--browser chrome` - Use specific browser
- `--viewport-size "1920,1080"` - Set viewport size

## Configuration

Tests run with these default settings:
- **Browser**: Chromium
- **Mode**: Headed (visible)
- **Slow Motion**: 500ms (to see actions)
- **Viewport**: 1280x720

## Adding New Tests

1. Create new test file in `scripts/` directory
2. Use the same screenshot path pattern: `testing/playwright/screenshots/[name].png`
3. Follow the existing test structure for consistency
4. Document the test purpose in this README

## Troubleshooting

- Ensure the Next.js dev server is running on `http://localhost:3000`
- Check that test credentials are still valid
- Screenshots help debug failures - check `screenshots/` directory
- Run with `--debug` flag for more verbose output