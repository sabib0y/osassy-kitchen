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

## 4. Current Phase: Architectural Refactor

### Status: IN PROGRESS

We are transitioning from the old favourites-based subscription flow to a **plan-first model**.

### What's Changing

| Old Flow | New Flow |
|----------|----------|
| `/menu` with cart | `/meals` (browse-only) |
| Favourite dishes → Create subscription | Choose plan → Select meals |
| Ad-hoc subscription creation | 4-step wizard |

### New Routes to Build

| Route | Status | Description |
|-------|--------|-------------|
| `/meals` | 🔴 TODO | Browse-only meal catalogue |
| `/meal-plans` | 🔴 TODO | Subscription tiers overview |
| `/meal-plans/create` | 🔴 TODO | 4-step subscription wizard |
| `/catering` | 🔴 TODO | Event catering & bulk orders |
| `/faq` | 🔴 TODO | Subscription FAQs |
| `/delivery-areas` | 🔴 TODO | Delivery coverage info |

### Routes to Deprecate/Modify

| Route | Action |
|-------|--------|
| `/menu` | Convert to `/meals` (remove cart functionality) |
| `/subscriptions/create` | Replace with `/meal-plans/create` |

---

## 5. Implementation Roadmap

### Phase 6: Subscription-First Architecture

#### Milestone 6.1: Public Marketing Pages
- [ ] Create `/meals` page (browse-only catalogue)
- [ ] Create `/meal-plans` page (subscription tiers)
- [ ] Create `/catering` page
- [ ] Create `/faq` page
- [ ] Create `/delivery-areas` page
- [ ] Update navigation (Header, Footer)

#### Milestone 6.2: Subscription Wizard
- [ ] Build `/meal-plans/create` with 4-step flow
  - Step 1: Plan selection (3/5/10 meals per week)
  - Step 2: Meal builder (select dishes for plan)
  - Step 3: Delivery details (address, schedule)
  - Step 4: Payment (review + Stripe checkout)
- [ ] Create plan data model (if needed)
- [ ] Update Stripe integration for plan-based billing

#### Milestone 6.3: Homepage Refresh
- [ ] Update hero section with subscription focus
- [ ] Add "How it works" section
- [ ] Add "Why subscribe" section
- [ ] Update CTAs to point to `/meal-plans`

#### Milestone 6.4: Cleanup
- [ ] Remove old `/menu` cart functionality
- [ ] Remove old `/subscriptions/create` page
- [ ] Update all internal links
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

## 7. Database Schema (Key Models)

```prisma
model User {
  id visibleId email name role
  stripeCustomerId address phone
  subscriptions orders favourites
}

model Subscription {
  id userId status
  planName interval price
  stripeSubscriptionId
  items → SubscriptionItem[]
}

model MenuItem {
  id name description price
  imageUrl category
  isVegetarian isSpicy available
}

model Order {
  id userId subscriptionId
  items totalPrice
  deliveryDate status
}
```

---

## 8. API Structure

### Public
- `GET /api/menu-items` — List meals

### Auth
- `POST /api/auth/[...nextauth]` — Authentication

### User (Authenticated)
- `GET/PATCH /api/user/profile`
- `GET/POST/DELETE /api/user/favourites`
- `GET /api/subscriptions`
- `GET /api/orders`

### Subscription
- `POST /api/subscribe` — Create subscription
- `PATCH /api/subscriptions/[id]` — Update subscription

### Admin
- `POST/PATCH/DELETE /api/admin/menu-items`
- `GET /api/admin/orders`
- `GET /api/admin/subscriptions`

### Webhooks
- `POST /api/webhooks/stripe`

---

## 9. Design System

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

## 10. Testing Strategy

- **Unit Tests:** Jest + React Testing Library
- **E2E Tests:** Playwright
- **Coverage Target:** 80%+

### Key Test Flows
- Authentication (login, signup, logout)
- Subscription creation (plan → meals → delivery → payment)
- User dashboard actions
- Admin operations

---

*Last updated: March 14, 2026*
