Based on the comprehensive analysis, here is the structured markdown document:

---

# Project Analysis: Osassy's Kitchen

## 1. Project Structure and Architecture

The project follows a **Next.js Pages Router** architecture with clear separation of concerns:

```
root/
├── src/
│   ├── pages/              # Next.js pages and API routes
│   │   ├── api/            # RESTful API endpoints
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── user/           # User dashboard pages
│   │   └── subscriptions/  # Subscription management
│   ├── components/         # React components (organized by domain)
│   │   ├── admin/          # Admin-specific components
│   │   ├── user/           # User-specific components
│   │   ├── help/           # Help/Contact components
│   │   ├── Layout/         # Layout components
│   │   └── providers/      # Context providers
│   ├── styles/             # SCSS modules and design system
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and services
│   ├── types/              # TypeScript type definitions
│   ├── context/            # React context providers
│   └── __tests__/          # Unit and integration tests
├── prisma/                 # Database schema and migrations
├── tests/e2e/              # End-to-end tests (Playwright)
└── planning/               # Project documentation
```

**Architecture Highlights:**
- **Pages Router** pattern with API routes for backend
- **Domain-driven component organization** (admin, user, help)
- **Centralized styling** with SCSS modules and a unified theme
- **Custom hooks** for data fetching and state management

---

## 2. Main Technologies and Frameworks

### Core Stack
| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 14.2.23 |
| UI Library | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Database | PostgreSQL + Prisma | 6.12.0 |

### Key Dependencies
| Purpose | Technology |
|---------|------------|
| **Authentication** | NextAuth.js 4.24.11 |
| **Payments** | Stripe (server & React) |
| **Data Fetching** | TanStack React Query 5.84.1 |
| **Real-time** | Socket.IO 4.8.1 |
| **Form Handling** | React Hook Form + Zod |
| **Styling** | SCSS Modules + Bootstrap 5.3 |
| **Image Management** | Cloudinary |
| **Charts** | Recharts + Chart.js |
| **Testing** | Jest 30.0 + Playwright 1.54 |

---

## 3. Key Components and Their Responsibilities

### Admin Components (`/src/components/admin/`)
| Component | Responsibility |
|-----------|----------------|
| `LiveDashboard` | Real-time analytics with WebSocket updates |
| `MenuGrid`, `MenuItemCard`, `MenuItemModal` | Menu item CRUD operations |
| `OrderTable`, `OrderModal`, `BulkActions` | Order management and processing |
| `OrderStats`, `MenuStats` | Dashboard metrics and statistics |

### User Components (`/src/components/user/`)
| Component | Responsibility |
|-----------|----------------|
| `SubscriptionDetails`, `SubscriptionEditor` | Subscription viewing and modification |
| `OrderTracker`, `OrderList`, `OrderCard` | Order tracking and history |
| `AddressManager` | Delivery address management |
| `PaymentMethodList`, `AddPaymentMethod` | Payment method management |
| `ProfileForm` | User profile editing |
| `UserLayout`, `UserSidebar` | User dashboard layout and navigation |

### Shared Components
| Component | Responsibility |
|-----------|----------------|
| `Layout` | Main application wrapper |
| `ModernHeader` | Navigation header |
| `ImageUploader`, `ImageOptimized` | Cloudinary image handling |
| `StripeProvider` | Stripe payment context |
| `WebSocketProvider` | Real-time updates context |
| `LoadingSkeleton`, `MenuErrorBoundary` | Loading states and error handling |

---

## 4. Build and Test Commands

### Development & Build
```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npx tsc --noEmit         # TypeScript type checking
```

### Database Operations
```bash
npm run seed             # Seed database
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Generate Prisma client
```

### Unit Testing (Jest)
```bash
npm test                 # Run all Jest tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report (80% threshold)
```

### E2E Testing (Playwright)
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:debug   # Debug mode
```

### Visual Testing
```bash
npm run visual:test      # Run visual tests
npm run visual:baseline  # Create baseline snapshots
npm run visual:update    # Update snapshots
npm run visual:compare   # Compare against baseline
```

---

## 5. Existing Conventions and Patterns

### File Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserLayout.tsx`, `MenuItemCard.tsx` |
| Pages | kebab-case | `user-profile.tsx`, `how-it-works.tsx` |
| Styles | Module suffix | `Component.module.scss` |
| Hooks | use prefix | `useApi.ts`, `useOrders.ts` |
| Types | Feature name | `user.ts`, `admin.ts` |
| Tests | .test suffix | `Component.test.tsx` |

### Component Pattern
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

### API Response Pattern
```typescript
// Success
{ success: true, data: result }

// Error
{ success: false, error: 'Error message', details?: errors }
```

### React Query Pattern
```typescript
const queryKeys = {
  menuItems: (params?) => ['menu-items', params],
  orders: (params?) => ['orders', params],
};

const useMenuItems = (params?, options?) => {
  return useQuery({
    queryKey: queryKeys.menuItems(params),
    queryFn: () => apiClient.get('/menu-items', params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => failureCount < 2 && error.status >= 500,
  });
};
```

### Design System Variables
| Token | Value |
|-------|-------|
| Primary Color | `#C52D2F` (Deep Red) |
| Secondary Color | `#F1C40F` (Warm Yellow) |
| Accent Color | `#FF6F3C` (Bright Orange) |
| Typography | Inter font family |
| Breakpoint | 768px (mobile) |
| Transitions | fast (150ms), base (200ms), slow (300ms) |

### Key Patterns & Practices
- ✅ **TypeScript strict mode** - No `any` types, explicit interfaces
- ✅ **SCSS Modules** - Scoped styling with BEM-style naming
- ✅ **React Query** - Server state with automatic caching
- ✅ **NextAuth.js** - Role-based access (USER, ADMIN)
- ✅ **Zod validation** - Runtime schema validation for forms
- ✅ **Error boundaries** - Graceful error handling
- ✅ **WebSocket integration** - Real-time updates
- ✅ **80% test coverage threshold** - Enforced via Jest

---

## Project Status

| Metric | Value |
|--------|-------|
| Current Phase | Phase 5 (Contact/Help Page) |
| E2E Tests | 219+ tests |
| Test Pass Rate | ~80% |
| Status | Production-ready |

This is a **mature, well-structured full-stack application** for a Nigerian meal subscription service with comprehensive testing, modern tooling, and clear architectural patterns.