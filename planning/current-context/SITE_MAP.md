# Osassy's Kitchen — Site Map

## Architecture Overview

Osassy's Kitchen is a **subscription-first Nigerian meal delivery platform**. The site prioritises meal plan subscriptions while supporting one-off orders and event catering.

**Primary User Journey:**
Discover → Trust → Choose a Plan → Pick Meals → Checkout → Manage Subscription

---

## 🌐 Public Marketing Pages

| Route | Description | Purpose |
|-------|-------------|---------|
| `/` | Homepage | Explain service, build trust, guide to subscription flow |
| `/meals` | Meals Catalogue | Browse-only — view available dishes (no cart) |
| `/meal-plans` | Meal Plans Overview | Present subscription tiers, start plan creation |
| `/catering` | Catering & Bulk Orders | Event catering, tray orders, enquiry form |
| `/faq` | Frequently Asked Questions | Answer subscription concerns |
| `/delivery-areas` | Delivery Coverage | Clarify delivery locations |
| `/login` | Login Page | Email/password authentication |
| `/signup` | Sign Up Page | New user registration |
| `/forgot-password` | Password Reset | Reset password flow |
| `/terms` | Terms of Service | Legal terms |
| `/privacy` | Privacy Policy | Data handling policy |
| `/contact` | Contact | Contact form and support enquiries |

---

## 🍽️ Subscription Conversion Flow

The core subscription flow exists under `/meal-plans/create` as a 4-step wizard.

| Step | Route | Description |
|------|-------|-------------|
| 1 | `/meal-plans/create?step=plan` | Choose subscription plan (3/5 meals, family) |
| 2 | `/meal-plans/create?step=meals` | Select meals for the plan |
| 3 | `/meal-plans/create?step=delivery` | Enter delivery details |
| 4 | `/meal-plans/create?step=payment` | Review and pay via Stripe |

### Plan Tiers (Example)
- **Starter:** 3 meals per week
- **Standard:** 5 meals per week
- **Family:** 10 meals per week

---

## 👤 User Dashboard (Authenticated)

| Route | Description | Key Features |
|-------|-------------|--------------|
| `/user/dashboard` | User Dashboard | Overview, next delivery, quick actions |
| `/user/subscriptions` | My Subscriptions | Active plans, pause/skip/cancel |
| `/user/subscriptions/[id]` | Subscription Details | Plan info, change meals |
| `/user/orders` | Order History | Past orders, delivery status |
| `/user/payments` | Payment Methods | Cards, billing history |
| `/user/profile` | User Profile | Personal info, addresses, preferences |

---

## 👨‍💼 Admin Dashboard (Admin Only)

| Route | Description | Key Features |
|-------|-------------|--------------|
| `/admin/dashboard` | Admin Dashboard | Analytics, subscriptions, orders overview |
| `/admin/menu` | Menu Management | Add/edit/delete meals, pricing, images |
| `/admin/orders` | Order Management | Process orders, update status |
| `/admin/subscriptions` | Subscription Management | View/manage user subscriptions |

---

## 💳 Payment Flow

| Route | Description |
|-------|-------------|
| `/success` | Payment Success — confirmation page |
| `/cancel` | Payment Cancelled — return to flow |

---

## 🧭 Navigation Structure

### Public Navigation
```
Home | Meals | Meal Plans | Catering | Login / Sign Up
```

### User Navigation (Logged In)
```
Dashboard | Subscriptions | Orders | Payments | Profile | Logout
```

### Admin Navigation
```
Dashboard | Menu | Orders | Subscriptions | Back to Site
```

---

## 🗺️ Site Hierarchy

```
Root (/)
├── Public Marketing
│   ├── /meals (browse-only catalogue)
│   ├── /meal-plans (subscription tiers)
│   │   └── /meal-plans/create (4-step wizard)
│   ├── /catering (events & bulk)
│   ├── /faq
│   ├── /delivery-areas
│   ├── /contact
│   ├── /terms
│   └── /privacy
│
├── Authentication
│   ├── /login
│   ├── /signup
│   └── /forgot-password
│
├── User Dashboard (Authenticated)
│   ├── /user/dashboard
│   ├── /user/subscriptions
│   │   └── /user/subscriptions/[id]
│   ├── /user/orders
│   ├── /user/payments
│   └── /user/profile
│
└── Admin (Admin Role)
    ├── /admin/dashboard
    ├── /admin/menu
    ├── /admin/orders
    └── /admin/subscriptions
```

---

## 🎨 Design System

### Brand Colours
- **Primary:** #C52D2F (Deep Red)
- **Secondary:** #F1C40F (Warm Yellow)
- **Accent:** #FF6F3C (Bright Orange)
- **Background:** #F9F9F9
- **Text:** #333333

### Typography
- **Font:** Inter, system-ui, -apple-system, sans-serif
- **Headings:** Bold, consistent sizing
- **Body:** Regular weight, readable

### Components
- **Buttons:** Primary, secondary, ghost variants
- **Cards:** Shadow-based with hover effects
- **Forms:** Consistent validation styling
- **Tables:** Sortable with pagination
- **Modals:** Overlay with backdrop blur
- **Progress Indicators:** Step wizards, loading states

---

## 📱 Responsive Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

---

## 📦 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` — NextAuth handlers

### Subscriptions
- `POST /api/subscribe` — Create subscription via Stripe
- `GET /api/subscriptions` — List user subscriptions
- `PATCH /api/subscriptions/[id]` — Update subscription (pause/cancel)

### Orders
- `GET /api/orders` — List user orders
- `POST /api/orders` — Create order

### Menu
- `GET /api/menu-items` — List all menu items
- `POST /api/admin/menu-items` — Create menu item (admin)
- `PATCH /api/admin/menu-items/[id]` — Update menu item (admin)
- `DELETE /api/admin/menu-items/[id]` — Delete menu item (admin)

### User
- `GET /api/user/profile` — Get user profile
- `PATCH /api/user/profile` — Update user profile
- `GET /api/user/favourites` — Get user favourites
- `POST /api/user/favourites` — Add favourite
- `DELETE /api/user/favourites` — Remove favourite

### Webhooks
- `POST /api/webhooks/stripe` — Handle Stripe events

---

*Last updated: March 14, 2026*
