# Meals Page UI Specification

## Purpose

The `/meals` page acts as a **browse-only catalogue** of meals available for subscription. It allows users to explore dishes visually and understand what they could choose for their meal plan.

Important rule:

Users **cannot add meals to a plan from this page**.

Meal selection only happens **after a plan has been chosen** in the meal plan builder.

This page answers the question:

> "What meals are available for my subscription?"

---

# Page Layout

The page should follow a modern product catalogue layout.

Structure:

Hero Section
↓
Category Filters
↓
Meals Grid
↓
Subscription Call-To-Action

---

# Hero Section

Purpose:

Orient users when they land on the meals page.

Content:

Headline:

Explore Our Meals

Subtext:

Browse authentic Nigerian dishes available for your weekly meal plan.

Primary CTA:

Start Your Meal Plan

Secondary CTA:

View Meal Plans

---

# Category Filters

Users should be able to quickly filter meals.

Recommended categories:

All Meals
Rice Dishes
Soups
Light Meals
Sides

Future optional filters:

Popular
Subscriber Favourites
Spicy

Filters should be **sticky on scroll**.

---

# Meals Grid

Main catalogue of meals.

The grid should start immediately after the category filters so users can quickly scan the available dishes without extra sections.

Responsive grid layout:

Desktop: 3 columns
Tablet: 2 columns
Mobile: 1 column

Each meal card should contain:

• Large food image
• Meal name
• Short description
• Optional tags

Example tags:

Subscriber Favourite ⭐
Most Ordered 🔥
Spicy 🌶

These tags help highlight popular dishes without requiring a separate "featured meals" section. This keeps the page focused on browsing while still guiding user attention.

Primary button:

View Meal

Important:

The button **must not say "Add to Plan"** because the user has not selected a plan yet.

---

# Meal Detail View

When a meal card is clicked, open either:

• a modal
or
• a dedicated meal detail page

Content should include:

• large meal image
• full description
• ingredients
• spice level
• optional nutrition info

CTA:

Start a Meal Plan to Choose This Dish

This CTA should route to:

`/meal-plans`

---

# Subscription Reminder Section

Insert a conversion section after the first set of meals.

Example content:

Ready to Build Your Weekly Meal Plan?

Choose your favourite Nigerian dishes and get them delivered fresh every week.

CTA:

Start Your Meal Plan

---

# UX Behaviour Rules

1. Meals page is browse-only.
2. Users cannot add meals to a plan here.
3. Meal selection happens only after plan selection.
4. CTAs should direct users toward the meal plan builder.

Correct flow:

Browse Meals → Choose Meal Plan → Select Meals → Checkout

---

# Visual Design Notes

Recommended interaction details:

• Card hover lift
• Slight image zoom on hover
• Soft shadows for depth
• Consistent food photography style

These interactions make the page feel modern and premium.

---

# Key UX Principle

This page should feel like **food discovery**, not checkout.

Users should feel hungry and curious.

The actual meal selection logic belongs in the **meal plan builder flow**.
