# Phase 4: Frontend UI Implementation
**Osassy's Kitchen - Implementation Plan**
**Status: 60% Complete (9/15 chunks) - Wave 3 Completed**

## Overview
This document outlines the implementation plan for Phase 4. With the backend APIs and database structure now complete, this phase focuses on building the user-facing and admin-facing frontend interfaces. The goal is to create a responsive, intuitive, and feature-rich user experience by connecting to the existing API endpoints.

## Progress Summary (August 8, 2025)
- **Wave 1:** ✅ Complete (API Foundation, Stripe.js, User Layout)
- **Wave 2:** ✅ Complete (Menu API, Checkout Flow, Orders History)
- **Wave 3:** ✅ Complete (Profile Settings, Payment Methods, Subscription Management)
- **Housekeeping:** 🧹 PRIORITY - Test fixes and coverage improvement needed
- **Wave 4:** ⏳ Pending (Image Upload, WebSocket, Real-time Updates)
- **Wave 5:** ⏳ Pending (Visual Refinements, E2E Testing)

## 🧹 Housekeeping Phase (PRIORITY - Before Wave 4)

### Test Quality Improvements Required:
1. **Fix Failing Tests** - 112 tests currently failing
   - Router mock setup issues
   - Multiple element query errors
   - Mock data mismatches
   
2. **Improve Test Coverage** - Current: 43.31%, Target: 80%
   - Add missing unit tests
   - Improve component test coverage
   - Add integration test scenarios
   
3. **Code Quality Fixes**
   - ESLint warnings resolution
   - Consistent mock patterns
   - Test utility standardization

---

## 1. Project Dependencies Installation

### Core Dependencies
```bash
# Data Fetching & State Management
npm install @tanstack/react-query

# Styling & UI Components
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react lucide-react

# Forms
npm install react-hook-form @hookform/resolvers/zod zod

# Tables & Charts (for Admin)
npm install @tanstack/react-table recharts
```

---

## 2. Styling & Theming Setup

### Tailwind CSS Configuration
**File:** `tailwind.config.js`
- Configure Tailwind to scan `src/**/*.{js,ts,jsx,tsx}`.
- Extend the theme with the custom color palettes defined in the UI prompts (warm tones for the user dashboard, professional blue/gray for admin).

### Global Styles
**File:** `src/styles/globals.css`
- Import Tailwind base, components, and utilities.
- Define base styles for fonts and backgrounds.

---

## 3. Implementation Plan by Component

The implementation will follow the priority outlined in the design prompts.

### Task 1: User Dashboard & Profile Page ✅ COMPLETED
- **File:** `src/pages/user/dashboard.tsx` ✅
- **Data Fetching:** Uses fetch API with proper error handling ✅
- **Components:**
    - `SubscriptionCard`: Displays plan details, items, and next delivery date ✅
    - `OrderHistory`: Table view of past orders with status indicators ✅
    - `AccountSettings`: Form to update user profile information ✅
- **Functionality:** Implemented tabs for Overview, Subscriptions, Orders, Profile, and Payments ✅

### Task 1.5: Subscription Creation Page ✅ COMPLETED (August 6, 2025)
- **File:** `src/pages/subscriptions/create.tsx` ✅
- **Styling:** `src/styles/components/subscription-create.module.css` ✅
- **Components:**
    - `DishCard`: Interactive cards with quantity selectors ✅
    - `SearchBar`: Real-time search across dishes ✅
    - `CategoryFilters`: Filter by dish categories ✅
    - `CartSummary`: Sticky panel showing selections and totals ✅
- **Functionality:** 
    - Cart management with add/remove items ✅
    - Real-time price calculations ✅
    - Search and filtering ✅
    - Responsive design ✅
- **Backend API Integration:** ✅ Completed in Wave 2

### Task 1.6: User Profile Management ✅ COMPLETED (Wave 3 - August 8, 2025)
- **File:** `src/pages/user/profile.tsx` ✅
- **Components Created:**
    - `ProfileForm`: Personal information with validation ✅
    - `AddressManager`: Multiple delivery addresses CRUD ✅
    - `NotificationPreferences`: Email/SMS/Push settings ✅
- **Functionality:** Complete profile management with 98.72% test coverage ✅

### Task 1.7: Payment Methods Management ✅ COMPLETED (Wave 3 - August 8, 2025)
- **File:** `src/pages/user/payments.tsx` ✅
- **Components:**
    - `PaymentMethodList`: Display saved cards ✅
    - `AddPaymentMethod`: Stripe Card Element integration ✅
- **Functionality:** PCI-compliant payment method CRUD with Stripe ✅

### Task 1.8: Subscription Management ✅ COMPLETED (Wave 3 - August 8, 2025)
- **Files:** `src/pages/user/subscriptions/[id].tsx` and `index.tsx` ✅
- **Components:**
    - `SubscriptionDetails`: Comprehensive subscription view ✅
    - `SubscriptionEditor`: Edit items and quantities ✅
- **Functionality:** Pause/resume, cancel, edit with optimistic updates ✅

### Task 2: Admin Dashboard & Layout
- **File:** `src/pages/admin/dashboard.tsx`
- **Shared Layout:** Create a reusable `AdminLayout` component (`src/components/admin/shared/AdminLayout.tsx`) with a sidebar for navigation.
- **Data Fetching:** Fetch analytics from `/api/admin/dashboard`.
- **Components:**
    - `StatsCard`: Reusable component to display key metrics (e.g., revenue, new users).
    - `RevenueChart`: A line or bar chart from `recharts` to visualize revenue trends.
    - `OrderSummary`: A small table showing the latest orders.

### Task 3: Admin Menu Management
- **File:** `src/pages/admin/menu.tsx`
- **Data Fetching:** Fetch all menu items from `/api/admin/menu-items`.
- **Components:**
    - `MenuGrid`: A grid layout displaying `MenuItemCard` components.
    - `MenuItemCard`: Shows item image, name, price, and availability status.
    - `MenuEditorModal`: A form (using React Hook Form) for creating and editing menu items, including image upload functionality.
- **Functionality:** Implement CRUD operations (Create, Read, Update, Soft Delete) for menu items.

### Task 4: Admin Order Management
- **File:** `src/pages/admin/orders.tsx`
- **Data Fetching:** Fetch all orders from `/api/admin/orders`.
- **Components:**
    - `OrderTable`: A data table built with `@tanstack/react-table` to display all orders.
    - `OrderModal`: A detailed view of a single order, allowing status updates.
- **Functionality:** Implement sorting, filtering (by status, date), pagination, and bulk actions (e.g., mark multiple orders as "Delivered").

### Task 5: Admin Subscription Management
- **File:** `src/pages/admin/subscriptions.tsx`
- **Data Fetching:** Fetch all subscriptions from `/api/admin/subscriptions`.
- **Components:**
    - `SubscriptionTable`: A data table to display all user subscriptions.
- **Functionality:** Allow admins to view subscription details, see user information, and manage subscription status (pause, cancel).

---

## 4. Testing & Validation Checklist

### ✅ Wave 1-3 Completed Items:
- [x] **User Dashboard:**
    - [x] User's subscriptions and orders are displayed correctly.
    - [x] Loading and error states are handled gracefully.
    - [x] Links to manage subscriptions work.
- [x] **Subscription Creation Page:**
    - [x] Dish cards display with images and descriptions.
    - [x] Quantity selectors work correctly.
    - [x] Search and filtering functions properly.
    - [x] Cart summary updates in real-time.
    - [x] Responsive design works on all screen sizes.
    - [x] Backend API integration completed.
    - [x] Stripe checkout flow working.
- [x] **User Profile Management:**
    - [x] Personal information form with validation.
    - [x] Multiple delivery addresses CRUD.
    - [x] Notification preferences working.
    - [x] 98.72% test coverage achieved.
- [x] **Payment Methods:**
    - [x] Stripe Card Element integrated.
    - [x] Add/remove payment methods working.
    - [x] PCI compliance maintained.
- [x] **Subscription Management:**
    - [x] View/edit subscriptions functional.
    - [x] Pause/resume functionality working.
    - [x] Cancellation flow complete.
    - [x] Optimistic updates implemented.
- [x] **Admin Dashboard:**
    - [x] Route is protected and accessible only by `ADMIN` role.
    - [x] Analytics data is displayed with mock data.
- [x] **Menu Management:**
    - [x] Admins can create, view, edit, and disable menu items.
    - [ ] Image uploads are successful.
- [x] **Order Management:**
    - [x] All orders are displayed in the table.
    - [x] Admins can filter, sort, and update order statuses.
- [x] **Responsiveness:**
    - [x] All pages are fully responsive and functional on mobile devices.
