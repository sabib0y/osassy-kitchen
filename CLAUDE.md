# Osassy's Kitchen - Project Guide

A Nigerian meal subscription service built with Next.js, TypeScript, Prisma, and Stripe.

## Working Documents

**Primary Planning Doc (Google Docs):** https://docs.google.com/document/d/1bR3tfq0WvNgYkKHg_dVxoovnVIbHOTWmKrkeL2oq92E/edit?tab=t.0

Use `gws docs documents get --params '{"documentId": "1bR3tfq0WvNgYkKHg_dVxoovnVIbHOTWmKrkeL2oq92E"}'` to fetch contents.

## Project Overview

**Status**: Production-ready (Phase 4 Complete)
- 219+ E2E tests with 80% pass rate
- Full authentication & subscription management
- Admin dashboard with analytics
- User dashboard with order tracking
- Real-time updates via WebSockets
- Image upload with Cloudinary

## Test Credentials

**Admin:**
- Email: `admin@osassyskitchen.com`
- Password: `admin123`

**Test User:** (create via sign-up or seed)
- Email: `test@example.com`
- Password: `password123`

## Tech Stack

- **Framework**: Next.js 13+ (Pages Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Styling**: SCSS Modules
- **Testing**: Jest, Playwright
- **Real-time**: Socket.IO
- **Images**: Cloudinary

## Build & Development Commands

**IMPORTANT:** Always run the dev server on port 3000. If port 3000 is in use, kill the process first:
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null; npm run dev
```

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Build
npm run build        # Production build
npm start            # Start production server

# Testing
npm test             # Run Jest unit tests
npm run test:watch   # Jest watch mode
npm run test:e2e     # Run Playwright E2E tests
npm run test:fast    # Fast E2E tests (10s timeout)

# Database
npx prisma migrate dev    # Run migrations
npx prisma db seed        # Seed database
npx prisma studio         # Open Prisma Studio

# Type Checking
npx tsc --noEmit         # Check TypeScript errors

# Linting
npm run lint             # Run ESLint
```

## Project Structure

```
src/
├── pages/              # Next.js pages (routes)
│   ├── api/           # API endpoints
│   ├── admin/         # Admin dashboard pages
│   ├── user/          # User dashboard pages
│   └── subscriptions/ # Subscription pages
├── components/        # React components
│   ├── admin/         # Admin-specific components
│   ├── user/          # User-specific components
│   └── help/          # Help/Contact components
├── styles/            # SCSS modules
│   ├── components/    # Component styles
│   └── pages/         # Page styles
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
└── data/              # Static data & constants

planning/              # Project documentation
├── current-context/   # Active planning docs
└── phase-*-*.md      # Phase implementation plans
```

## Brand Design System

### Colours
```scss
--primary: #C52D2F;      // Deep Red
--secondary: #F1C40F;    // Warm Yellow
--accent: #FF6F3C;       // Bright Orange
--background: #F9F9F9;
--text: #333333;
```

### Typography
```scss
font-family: Inter, system-ui, -apple-system, sans-serif;
```

### Component Patterns
- **Cards**: Shadow-based with hover effects
- **Buttons**: Primary, secondary, ghost variants
- **Forms**: Consistent validation styling
- **Tables**: Sortable with pagination
- **Modals**: Overlay with backdrop blur

## Coding Conventions

### File Naming
- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Pages**: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- **Styles**: `componentName.module.scss`
- **Types**: `featureName.ts`
- **Hooks**: `useFeatureName.ts`

### Component Structure
```typescript
import React, { useState } from 'react';
import styles from './Component.module.scss';

interface ComponentProps {
  title: string;
  onAction?: () => void;
}

const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  const [state, setState] = useState<string>('');

  return (
    <div className={styles.container}>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

### SCSS Modules
```scss
// Use CSS variables
.container {
  background: var(--background);
  padding: 1.5rem;
  border-radius: 8px;
}

// Responsive design
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
```

### TypeScript
- **Avoid `any` type** - Use proper interfaces
- **Export interfaces** in dedicated type files
- **Use union types** for specific values
- **Optional chaining** for safe property access

## Authentication Flow

```typescript
// Protected page pattern
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // Check role for admin pages
  if (session.user.role !== 'ADMIN') {
    return { redirect: { destination: '/unauthorized', permanent: false } };
  }

  return { props: { user: session.user } };
};
```

## API Patterns

### Standard Response
```typescript
// Success
return res.status(200).json({ success: true, data: result });

// Error
return res.status(400).json({ success: false, error: 'Error message' });

// Validation error
return res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: errors
});
```

### Authentication Check
```typescript
import { getToken } from 'next-auth/jwt';

const token = await getToken({ req });
if (!token) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## Database Patterns

### Prisma Queries
```typescript
// Include relations
const subscription = await prisma.subscription.findUnique({
  where: { id },
  include: {
    items: { include: { menuItem: true } },
    orders: { orderBy: { createdAt: 'desc' } }
  }
});

// Pagination
const orders = await prisma.order.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

## Testing Strategy

### Component Tests (Jest)
```typescript
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="submit"]');
  await expect(page).toHaveURL('/user/dashboard');
});
```

## Common Workflows

### Adding a New Page
1. Create page file in `src/pages/`
2. Create SCSS module in `src/styles/pages/`
3. Add route to navigation
4. Add authentication if needed
5. Write tests

### Adding a New Component
1. Create component in `src/components/`
2. Create SCSS module
3. Define TypeScript interfaces
4. Write unit tests
5. Document props and usage

### Adding API Endpoint
1. Create file in `src/pages/api/`
2. Add authentication check
3. Validate input with Zod
4. Handle errors properly
5. Write API tests

## Environment Variables

Required in `.env.local`:
```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

## Deployment Checklist

- [ ] All tests passing (`npm test` and `npm run test:e2e`)
- [ ] TypeScript builds without errors (`npx tsc --noEmit`)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Stripe webhooks configured
- [ ] Image upload tested
- [ ] Performance optimised

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make atomic commits
git add .
git commit -m "feat: add feature description"

# Push and create PR
git push origin feature/feature-name
```

## Troubleshooting

### Common Issues

**Build errors**: Check TypeScript errors with `npx tsc --noEmit`
**Auth not working**: Verify `NEXTAUTH_SECRET` is set
**Stripe webhook failing**: Check webhook secret and endpoint
**Database errors**: Run `npx prisma generate` after schema changes
**Tests failing**: Clear Jest cache with `npm test -- --clearCache`

## Resources

- **Planning**: `/planning/` directory
- **Progress Log**: `/planning/current-context/PROGRESS_LOG.md`
- **Site Map**: `/planning/current-context/SITE_MAP.md`
- **Bug Tracker**: `/planning/current-context/BUG_TRACKER.md`
- **API Docs**: See individual API route files
- **Design System**: `/src/styles/unified-theme.scss`

## Bug Reporting

When a user mentions logging a bug or reports an issue, check and update the Bug Tracker at `/planning/current-context/BUG_TRACKER.md`:
1. Assign the next available BUG-XXX ID
2. Fill in severity, affected area, steps to reproduce
3. Update the statistics table
4. When a bug is fixed, move it to the "Fixed Bugs" section with resolution notes

---

**Last Updated**: December 19, 2025
**Current Phase**: Phase 5 - Contact/Help Page Implementation
