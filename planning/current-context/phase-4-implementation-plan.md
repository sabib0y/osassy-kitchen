# Phase 4: Frontend UI Implementation
**Osassy's Kitchen - Implementation Plan**

## Overview
This document outlines the implementation plan for Phase 4. With the backend APIs and database structure now complete, this phase focuses on building the user-facing and admin-facing frontend interfaces. The goal is to create a responsive, intuitive, and feature-rich user experience by connecting to the existing API endpoints.

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
- **Pending:** Backend API integration (next session)

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
    - [ ] Backend API integration (pending).
    - [ ] Stripe checkout flow (pending).
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
