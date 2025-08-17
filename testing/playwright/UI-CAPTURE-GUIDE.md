# 📸 UI Route Capture Guide

This guide explains how to use the comprehensive UI Route Capture script to take screenshots of all pages in the Osassy's Kitchen application.

## 🎯 What It Does

The script automatically captures screenshots of **EVERY** reachable page in the application across multiple viewports:

- **Public Routes**: Homepage, login, signup, blog, etc.
- **User Routes**: Dashboard, subscriptions, orders, profile, etc.
- **Admin Routes**: Admin dashboard, order management, menu management, etc.

### Viewports Captured
- **Desktop**: 1920×1080 (Full desktop experience)
- **Tablet**: 768×1024 (iPad-like experience)
- **Mobile**: 375×667 (iPhone-like experience)

## 🚀 Quick Start

### Prerequisites

1. **Next.js dev server must be running**:
   ```bash
   npm run dev
   ```

2. **Test user must exist in database**:
   - Email: `test@test.com`
   - Password: `test`
   - Should have both regular user and admin access

3. **Playwright must be installed**:
   ```bash
   npm run playwright:install
   ```

### Running the Capture

#### Option 1: Using npm script (Recommended)
```bash
npm run capture:all-ui
```

#### Option 2: Using the simple JavaScript runner
```bash
node testing/simple-ui-capture.js
```

#### Option 3: Direct execution with tsx
```bash
npx tsx testing/playwright/e2e/scripts/capture-all-ui-routes.ts
```

## 📁 Output Structure

Screenshots are saved to timestamped directories:

```
testing/playwright/screenshots/ui-audit/[timestamp]/
├── capture-report.html          # Comprehensive HTML report
├── public/                      # Public pages (no auth required)
│   ├── public-homepage-desktop.png
│   ├── public-homepage-tablet.png
│   ├── public-homepage-mobile.png
│   ├── public-login-desktop.png
│   ├── public-signup-desktop.png
│   └── ...
├── user/                        # Authenticated user pages
│   ├── auth-user-dashboard-desktop.png
│   ├── auth-user-dashboard-tablet.png
│   ├── auth-user-dashboard-mobile.png
│   ├── auth-user-subscriptions-desktop.png
│   ├── auth-subscription-create-desktop.png
│   └── ...
└── admin/                       # Admin-only pages
    ├── admin-dashboard-desktop.png
    ├── admin-dashboard-tablet.png
    ├── admin-orders-desktop.png
    ├── admin-menu-desktop.png
    └── ...
```

## 📋 Routes Captured

### Public Routes (No Authentication)
- **Homepage** (`/`) - Main landing page
- **Login** (`/login`) - User login form
- **Signup** (`/signup`) - User registration
- **Blog** (`/blog`) - Blog listing
- **Blog Details** (`/blog-details`) - Individual post
- **Subscriptions** (`/subscriptions`) - Public plans overview
- **Success** (`/success`) - Payment success page
- **Cancel** (`/cancel`) - Payment cancellation
- **Unauthorized** (`/unauthorized`) - Access denied page

### User Routes (Authentication Required)
- **User Dashboard** (`/user/dashboard`) - Main user dashboard
- **User Profile** (`/user/profile`) - Profile management
- **User Subscriptions** (`/user/subscriptions`) - Subscription management
- **User Orders** (`/user/orders`) - Order history
- **User Payments** (`/user/payments`) - Payment methods
- **Create Subscription** (`/subscriptions/create`) - New subscription flow
- **Profile** (`/profile`) - General profile page

### Admin Routes (Admin Authentication Required)
- **Admin Dashboard** (`/admin/dashboard`) - Admin metrics
- **Admin Orders** (`/admin/orders`) - Order management
- **Admin Menu** (`/admin/menu`) - Menu management

### Development Routes
- **Stripe Test** (`/test-stripe`) - Payment testing page

## ⚙️ Configuration

### Changing Test Credentials

Edit the credentials in `capture-all-ui-routes.ts`:

```typescript
private credentials: AuthCredentials = {
  email: 'your-test@email.com',
  password: 'your-test-password'
};
```

### Adding New Routes

Add routes to the `ALL_ROUTES` array in `capture-all-ui-routes.ts`:

```typescript
{
  name: 'my-new-page',
  path: '/my-new-page',
  category: 'public', // or 'user' or 'admin'
  requiresAuth: false,
  description: 'Description of the page',
  waitForSelector: '.main-content', // Optional: wait for specific element
  skipMobile: false, // Optional: skip mobile screenshots
}
```

### Custom Viewports

Modify the viewports in the constructor:

```typescript
viewports: {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}
```

## 🔧 Advanced Usage

### Environment Variables

- `BASE_URL`: Override the base URL (default: `http://localhost:3000`)

```bash
BASE_URL=http://localhost:3001 npm run capture:all-ui
```

### Debugging Failed Routes

If some routes fail to capture:

1. **Check the console output** for specific error messages
2. **Verify the route exists** by visiting it manually
3. **Check authentication** - ensure test user has proper access
4. **Inspect selectors** - some pages might need updated `waitForSelector`

### Screenshot Quality

The script automatically:
- **Disables animations** for consistent screenshots
- **Hides dynamic content** (timestamps, user IDs)
- **Waits for page load** and network idle
- **Uses full-page screenshots** for complete coverage

## 📊 Report Features

The generated HTML report includes:

- **Summary statistics** (success/failure rates)
- **Route categorization** (public/user/admin)
- **Direct links** to screenshot files
- **Error details** for failed captures
- **Responsive grid layout** for easy browsing

## 🚨 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Ensure test user exists in database
   - Check credentials in the script
   - Verify login form selectors

2. **"Page timeout"**
   - Increase timeout in the script
   - Check if dev server is responding
   - Verify route exists and loads properly

3. **"Selector not found"**
   - Routes might have changed structure
   - Update `waitForSelector` for affected routes
   - Check browser console for errors

4. **Missing screenshots**
   - Check file permissions
   - Verify output directory exists
   - Look for error messages in console

### Debug Mode

For detailed debugging, you can modify the script to run in headed mode:

```typescript
this.browser = await chromium.launch({
  headless: false, // Set to false to see browser
  slowMo: 1000,    // Slow down for observation
});
```

## 🔄 Integration with CI/CD

The script can be integrated into automated workflows:

```yaml
# GitHub Actions example
- name: Capture UI Screenshots
  run: |
    npm run dev &
    sleep 10
    npm run capture:all-ui
    
- name: Upload Screenshots
  uses: actions/upload-artifact@v3
  with:
    name: ui-screenshots
    path: testing/playwright/screenshots/ui-audit/
```

## 📈 Best Practices

1. **Run regularly** to catch UI regressions
2. **Compare with previous captures** for visual diff
3. **Include in PR workflows** for design reviews
4. **Document route changes** when updating the script
5. **Use consistent test data** for reproducible results

## 🤝 Contributing

When adding new routes or features:

1. **Update the routes list** in the main script
2. **Add appropriate selectors** for reliable page detection
3. **Test with different user roles** (public, user, admin)
4. **Update this documentation** with new features
5. **Consider mobile responsiveness** for new routes

---

**Note**: This tool is designed for development and testing purposes. Ensure your test environment has appropriate test data and user accounts set up before running the capture.