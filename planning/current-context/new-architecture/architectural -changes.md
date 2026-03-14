# Osassy’s Kitchen — Site Architecture Plan

## Overview

Osassy’s Kitchen is transitioning from a restaurant-style website into a **subscription‑first Nigerian meal delivery platform**. The architecture should reflect this by prioritising meal subscriptions while still supporting **one‑off orders** and **event catering**.

The primary user journey should follow this flow:

Discover → Trust → Choose a Plan → Pick Meals → Checkout → Manage Subscription

---

# Core Product Model

## Primary Offering

• Weekly meal subscription plans

## Secondary Offerings

• One‑off meal trays or bulk orders
• Event catering

The website should guide most users toward the subscription flow while still allowing secondary paths for bulk orders and catering.

---

# Architecture Principles

## 1. Subscription‑First

The site should prioritise the subscription experience. All primary calls‑to‑action should encourage users to start or explore a meal plan.

## 2. Intent‑Driven Navigation

Navigation should match the most common user intentions:

• Understand the service
• Browse meals
• Choose a plan
• Order for events
• Manage an account

## 3. Separation of Layers

The site should be organised into three logical layers:

• Marketing pages (discover and convert)
• Conversion flow (plan creation and checkout)
• Authenticated user dashboard

---

# Public Marketing Pages

## /
Homepage

Purpose:

• Explain the service
• Show featured meals
• Build trust
• Guide users into the subscription flow

Sections:

• Hero
• How it works
• Popular dishes
• Why subscribe
• Other ways to order
• Testimonials
• Delivery coverage
• Final call‑to‑action

Primary CTAs:

Start Your Meal Plan
Browse Meals

---

## /meals
Meals Catalogue

Purpose:

• Display all meals available for subscription
• Allow users to browse visually
• Help users understand available dishes

Important rule:

This page is **browse-only**.

Users cannot add meals to a plan here because a plan has not yet been selected.

The page answers the question:

"What meals could I choose for my subscription?"

Typical actions on this page:

• View meal details
• Filter meals by category
• Navigate to the meal plan page

Implementation note:

The `/meals` page and the meal builder should reuse the same visual language and shared UI components where practical, such as meal cards, filters, and meal detail patterns. However, they remain separate product states with different responsibilities.

---

## /meal-plans
Meal Plans Overview

Purpose:

• Explain subscription options
• Present plan tiers
• Start the subscription flow

Example plan tiers:

• 3 meals per week
• 5 meals per week
• Family plan

CTA:

Start Building Your Plan

---

## /catering
Catering and Bulk Orders

Purpose:

• Support event catering
• Support tray or bulk orders

Sections:

• Event catering
• Bulk tray orders
• Catering enquiry form

---

## /faq
Frequently Asked Questions

Purpose:

Answer common subscription concerns:

• How subscriptions work
• Skipping or pausing weeks
• Delivery schedules
• Allergies and ingredients
• Billing questions

---

## /delivery-areas
Delivery Coverage

Purpose:

• Clarify delivery locations
• Reduce friction for new customers

Future enhancement:

Postcode checker.

---

# Subscription Conversion Flow

The core subscription flow should exist under the meal plan creation route.

## /meal-plans/create

The user journey should follow four steps:

1. Choose Plan
2. Select Meals
3. Delivery Details
4. Payment

---

## Step 1 — Plan Selection

The user selects their subscription plan.

The plan defines:

• number of meals
• price
• selection limits
• delivery cadence

---

## Step 2 — Meal Builder

Users select meals for their plan.

The interface should show:

• meal cards with images
• progress indicator (example: 2 / 3 meals selected)
• sticky summary panel

Users can add meals **only after the plan is chosen**.

Implementation note:

The meal builder should visually align with the `/meals` page and reuse shared components where practical, but it remains a separate step in the subscription flow.

---

## Step 3 — Delivery Details

Users enter:

• delivery address
• phone number
• delivery instructions
• preferred delivery day

---

## Step 4 — Payment

Users review their plan and meals before completing checkout via Stripe.

Example summary:

Plan: 3 Meals Weekly

Meals:

• Jollof Rice + Chicken
• Ayamase + Rice
• Egusi + Pounded Yam

Total: £XX per week

---

# Authenticated User Area

Once subscribed, users manage their account through a dashboard.

## /user/dashboard

Overview page showing:

• active subscription
• next delivery
• quick actions

---

## /user/subscriptions

Users can:

• pause
• skip weeks
• cancel
• change meals

---

## /user/orders

Displays:

• order history
• delivery status

---

## /user/payments

Users manage:

• payment methods
• billing history

---

## /user/profile

Users update:

• personal details
• addresses
• preferences

---

# Admin Area

Admin routes manage operations.

## /admin/dashboard

Displays platform metrics:

• subscriptions
• orders
• delivery schedule

---

## /admin/menu

Admin can:

• create meals
• update meals
• upload images
• change pricing

---

## /admin/orders

Manage order status and deliveries.

---

## /admin/subscriptions

View and manage user subscriptions.

---

# Navigation Model

Public navigation:

Home
Meals
Meal Plans
Catering
Login / Sign Up

User navigation (logged in):

Dashboard
Subscriptions
Orders
Payments
Profile

---

# Final Product Position

Osassy’s Kitchen should behave as a **meal subscription platform**, not a traditional restaurant website.

The homepage sells the service.
The meals page inspires users.
The meal plan builder converts users.
The dashboard retains users.
