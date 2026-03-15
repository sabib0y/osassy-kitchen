# Osassy's Kitchen — Project Plan

## 1. Project Vision

**Osassy's Kitchen** is a **subscription-first Nigerian meal delivery platform**. The site prioritises weekly meal plan subscriptions while supporting one-off orders and event catering.

### Core Product Model
- **Primary:** Weekly meal subscription plans
- **Secondary:** One-off meal trays, bulk orders, event catering

### Primary User Journey
```
Discover → Trust → Choose a Plan → Pick Meals → Checkout → Manage Subscription
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | SCSS Modules, CSS Variables |
| Auth | NextAuth.js |
| Database | PostgreSQL, Prisma ORM |
| Payments | Stripe Billing & Checkout |
| Images | Cloudinary |
| Real-time | Socket.IO |
| Testing | Jest, Playwright |
| Hosting | Vercel |

---

## 3. Architecture Principles

### Subscription-First
All primary CTAs guide users toward starting a meal plan. The homepage sells the service, the meals page inspires, the plan builder converts.

### Intent-Driven Navigation
Navigation matches user intentions:
- Understand the service (Homepage)
- Browse meals (`/meals`)
- Choose a plan (`/meal-plans`)
- Order for events (`/catering`)
- Manage account (User Dashboard)

### Separation of Layers
1. **Marketing Pages** — Discover and convert
2. **Conversion Flow** — Plan creation and checkout
3. **User Dashboard** — Subscription management

---

## 4. Current Phase: Subscription-First Architecture

### Status: NEAR COMPLETE

The subscription-first architecture is largely implemented. Core flows are working end-to-end.

### Implemented Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/meals` | ✅ Done | Browse-only meal catalogue |
| `/meal-plans` | ✅ Done | Subscription tiers overview |
| `/meal-plans/create` | ✅ Done | 4-step subscription wizard with delivery time slots |
| `/user/subscriptions/create` | ✅ Done | Wizard within user dashboard |
| `/user/subscriptions/[id]/resume` | ✅ Done | Resume paused subscription with new delivery schedule |
| `/faq` | ✅ Done | Subscription FAQs |
| `/our-process` | ✅ Done | How the service works |
| `/catering` | 🔴 TODO | Event catering & bulk orders |
| `/delivery-areas` | 🔴 TODO | Delivery coverage info |

### Authentication Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/login` | ✅ Done | Email/password + Google OAuth |
| `/signup` | ✅ Done | Email/password + Google OAuth |
| `/forgot-password` | ✅ Done | Password reset flow |
| `/verify-email` | ✅ Done | Email verification |

### Legacy Routes (To Review)

| Route | Status | Notes |
|-------|--------|-------|
| `/menu` | ⚠️ Legacy | Old cart-based menu, consider removing |
| `/subscriptions/` | ⚠️ Legacy | Old subscription pages, may need cleanup |

---

## 5. Implementation Roadmap

### Phase 6: Subscription-First Architecture

#### Milestone 6.1: Public Marketing Pages ✅ COMPLETE
- [x] Create `/meals` page (browse-only catalogue)
- [x] Create `/meal-plans` page (subscription tiers)
- [x] Create `/faq` page
- [x] Create `/our-process` page (how it works)
- [ ] Create `/catering` page
- [ ] Create `/delivery-areas` page
- [x] Update navigation (Header, Footer)

#### Milestone 6.2: Subscription Wizard ✅ COMPLETE
- [x] Build `/meal-plans/create` with 4-step flow
  - Step 1: Plan selection (3/5/10 meals per week)
  - Step 2: Meal builder (select dishes for plan)
  - Step 3: Delivery details (address, schedule, **time slot**)
  - Step 4: Payment (review + Stripe checkout)
- [x] Build `/user/subscriptions/create` (dashboard wizard)
- [x] Add delivery time slot selection (day + time preferences)
- [x] Update Stripe integration for plan-based billing
- [x] Stripe webhook handles subscription creation + order generation

#### Milestone 6.3: Subscription Management ✅ COMPLETE
- [x] Subscription list page (`/user/subscriptions`)
- [x] Subscription detail page (`/user/subscriptions/[id]`)
- [x] Pause/resume functionality
- [x] Resume flow with new delivery schedule (`/user/subscriptions/[id]/resume`)
- [x] Cancel subscription

#### Milestone 6.4: Authentication ✅ COMPLETE
- [x] Google OAuth integration
- [x] Email/password authentication
- [x] Forgot password flow
- [x] Email verification flow
- [x] Address management (CRUD)

#### Milestone 6.5: Remaining Work 🔴 TODO
- [ ] Create `/catering` page
- [ ] Create `/delivery-areas` page
- [ ] Remove legacy `/menu` cart functionality
- [ ] Clean up old `/subscriptions/` pages
- [ ] Homepage refresh (subscription-focused hero)
- [ ] Run full E2E test suite

---

## 6. Completed Phases

### Phase 1: Foundation ✅
- Prisma + PostgreSQL setup
- NextAuth.js authentication
- User/Admin role system

### Phase 2: Subscription Flow ✅
- Stripe integration
- Basic subscription creation
- Checkout flow

### Phase 3: Webhooks & Orders ✅
- Stripe webhook handler
- Order generation on payment
- Order history

### Phase 4: Admin & Menu ✅
- Menu CRUD
- Admin dashboard
- Order management

### Phase 5: Production Polish ✅
- Help/Contact page
- Footer/navigation fixes
- E2E test suite (219+ tests)
- Build optimisation

---

## 7. Deferred Features

Features planned but not yet implemented:

| Feature | Description | Blocked By |
|---------|-------------|------------|
| Email notifications | Send transactional emails (order confirmation, delivery reminders, etc.) | DNS verification for Resend |
| Notification preferences persistence | Save user email preferences to database and check before sending | Email notifications |
| `/catering` page | Event catering & bulk orders | — |
| `/delivery-areas` page | Delivery coverage info | — |

### Known Bugs

See `planning/current-context/BUG_TRACKER.md` for active issues:
- BUG-001: Sign-out not syncing across browser tabs (High)
- BUG-002: Meal Plans nav link skips process explainer page (Low)
- BUG-003: Delivery time slots need business validation (Medium)

---

## 8. Database Schema (Key Models)

```prisma
model User {
  id visibleId email name role
  stripeCustomerId phone
  subscriptions orders favourites
  addresses → Address[]
}

model Address {
  id userId
  label street city state postcode country
  isDefault
}

model Subscription {
  id visibleId userId status
  planName interval price
  stripeSubscriptionId
  items → SubscriptionItem[]

  // Delivery preferences (new)
  deliveryAddress deliveryInstructions
  preferredDeliveryDay preferredDeliveryTime
  deliveryTimeSlotStart deliveryTimeSlotEnd
  nextDeliveryDate
}

model MenuItem {
  id name description price
  imageUrl category
  isVegetarian isSpicy available
}

model Order {
  id visibleId userId subscriptionId
  items totalPrice
  deliveryDate deliveryTimeSlot status
}
```

---

## 9. API Structure

### Public
- `GET /api/menu-items` — List meals

### Auth
- `POST /api/auth/[...nextauth]` — Authentication (email/password + Google OAuth)
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password with token
- `POST /api/auth/verify-email` — Verify email address

### User (Authenticated)
- `GET/PATCH /api/user/profile` — User profile management
- `GET/POST/DELETE /api/user/favourites` — Favourite meals
- `GET/POST /api/user/addresses` — Address list and create
- `GET/PATCH/DELETE /api/user/addresses/[id]` — Address CRUD
- `GET /api/user/subscriptions` — List user subscriptions
- `GET/PATCH /api/user/subscriptions/[id]` — Subscription detail + pause/resume/cancel
- `GET /api/user/orders` — Order history
- `GET/PATCH /api/user/notification-preferences` — Email preferences

### Subscription
- `POST /api/subscribe` — Create subscription (Stripe checkout)

### Admin
- `POST/PATCH/DELETE /api/admin/menu-items` — Menu CRUD
- `GET /api/admin/orders` — All orders
- `GET /api/admin/subscriptions` — All subscriptions

### Webhooks
- `POST /api/webhooks/stripe` — Stripe webhook (subscription created, payment succeeded, etc.)

### Utility
- `POST /api/contact` — Contact form submission
- `POST /api/upload` — Image upload (Cloudinary)
- `GET/POST /api/socket` — WebSocket connection

---

## 10. Design System

### Brand Colours
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

---

## 11. Testing Strategy

- **Unit Tests:** Jest + React Testing Library
- **E2E Tests:** Playwright
- **Coverage Target:** 80%+

### Key Test Flows
- Authentication (login, signup, logout)
- Subscription creation (plan → meals → delivery → payment)
- User dashboard actions
- Admin operations

---

## 12. Recent Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| DeliveryStep component | 66 | ✅ Passing |
| Subscribe API | 40 | ✅ Passing |
| Stripe webhook | 8+ | ✅ Passing |
| Address API | 49 | ✅ Passing |
| E2E suite | 219+ | ~80% passing |

---

*Last updated: March 15, 2026*
