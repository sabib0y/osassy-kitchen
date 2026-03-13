# Osassy's Kitchen – Context for Code Assistant LLM

Feed this document to your coding assistant to bring it up to speed on the project vision, current architecture, and the technical roadmap.

---

## 1. Project Purpose & Overview

**Osassy’s Kitchen** is transitioning from a static restaurant site into a **subscription-based meal delivery platform**. Key objectives:

- Enable users to **browse dishes** and **subscribe** to meal plans or individual dishes.
- Manage **recurring billing** and **order generation** automatically.
- Provide both **user-facing** and **admin-facing** UX for subscriptions, orders, and menu management.

---

## 2. Existing Frontend Structure

- **Framework:** Next.js 14 + React 18.
- **UI & Styling:** Bootstrap 5, React-Bootstrap, Sass.
- **Pages & Components:**
  - `Layout`, `Header`, `Footer` wraps all pages.
  - Homepage uses `BannerOne`, `ServiceOne`, `TestimonialsOne`, `PricingOne`, `CtaOne`, and `BrandOne`.
  - Static pages for blog and details under `/blog` and `/blog-details`.
- **Data & Hooks:** Static data in `/src/data/`, custom hooks (`useScroll`, `useActive`) for UI effects.

---

## 3. Tech Stack & Integrations

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| Frontend           | Next.js, React                          |
| Styling            | Bootstrap 5, React-Bootstrap, Sass      |
| Carousel/Animation | Swiper, React-CountUp, VisibilitySensor |
| Auth               | NextAuth.js (or Clerk/Auth0)            |
| Database ORM       | Prisma                                  |
| Database           | PostgreSQL (or Supabase)                |
| Payments           | Stripe Billing & Checkout               |
| Emails/SMS         | Postmark / Twilio / Resend              |
| Hosting            | Vercel                                  |

---

## 4. Backend Architecture & Database Schema

### API Responsibilities:

- **/api/auth**: User signup/login (NextAuth).
- **/api/subscribe**: Create subscriptions via Stripe Checkout.
- **/api/subscriptions/[id]**: Manage subscriptions (pause, cancel).
- **/api/orders**: List and create orders from subscriptions.
- **/api/webhooks/stripe**: Handle Stripe webhook events.
- **/api/menu-items**: CRUD for dishes (admin-only).

### Prisma Models (simplified):

```prisma
model User { id, name, email, passwordHash, stripeCustomerId, address?, phone? }
model Subscription { id, userId, planName, interval, dishes, price, stripeSubscriptionId, status }
enum SubscriptionInterval { WEEKLY MONTHLY }
enum SubscriptionStatus { ACTIVE CANCELLED PAUSED }
model Order { id, userId, subscriptionId?, dishes, totalPrice, deliveryDate, status }
enum OrderStatus { PENDING IN_PROGRESS DELIVERED }
model MenuItem { id, name, description, price, imageUrl, available }
```

---

## 5. Security & Best Practices

- **Transport:** HTTPS + HSTS; secure, HttpOnly, SameSite cookies.
- **Auth:** Battle-tested library (NextAuth.js), MFA support, role-based access.
- **Secrets:** Env vars; Stripe secret only on server.
- **Data:** Hash passwords (bcrypt/argon2); no raw card data; DB encryption.
- **API Safety:** Validate Stripe webhook signatures; rate-limit public endpoints.
- **Monitoring:** Centralized logging, alerts on anomalies.

---

## 6. Technical Roadmap (Living)

### Week 1: Foundation & Authentication

- Backend: Set up Prisma + PostgreSQL; configure NextAuth.js (user, admin roles).
- Frontend: Scaffold `/signup`, `/login`, `/profile`; integrate auth hooks; protect routes.

### Week 2: Subscription Flow & UI

- Backend: Implement `/api/subscribe`; Stripe test & Checkout Sessions.
- Frontend: Build `/subscribe` page; display `MenuItem` cards; integrate Stripe Checkout button.

### Week 3: Stripe Webhooks & Order Generation

- Backend: Webhook handler `/api/webhooks/stripe`; create `Order` on `invoice.paid`.
- Frontend: Develop `/orders` page; list upcoming/past orders with status indicators.

### Week 4: Admin & Menu Management

- Backend: CRUD for `MenuItem` (`/api/menu-items`); secure with admin middleware.
- Frontend: Admin dashboard: Menu Editor, Subscription Oversight, Order Monitor (tables/forms).

### Week 5: Delivery Scheduling & Notifications

- Backend: Calculate `deliveryDate`; integrate Postmark/Twilio.
- Frontend: On `/dashboard`, allow users to view/modify upcoming delivery dates; notification settings.

### Week 6: UI Refinements & Testing

- Frontend: Polish subscription & order flows; add loading/error states.
- Testing: E2E tests (Cypress/Playwright) for core flows.

---

## 7. Current Focus (March 2026)

### Priority 1: Functional Validation
Ensure all buttons, flows, and interactions work correctly before any UI polish.

**Areas to validate:**
- [ ] Authentication flows (login, signup, logout)
- [ ] Subscription creation flow (menu → cart → checkout → success)
- [ ] User dashboard navigation and actions
- [ ] Admin dashboard operations
- [ ] Order management workflows
- [ ] Payment methods management
- [ ] Profile updates

### Priority 2: UI Polish (Parked)
Deferred until functional validation complete:
- Replace placeholder hero images with custom photography
- Fine-tune responsive behaviour on mobile
- Test scroll behaviour across browsers
- Visual consistency pass

### Priority 3: Phase 5 Completion
- Email sending service integration (Nodemailer/SendGrid)
- Rate limiting middleware
- Full E2E test suite run
- Cross-browser testing

---

*Last updated: March 11, 2026*

