# Meal Plan Builder UI Specification

## Purpose

The meal plan builder is the core conversion flow for Osassy’s Kitchen. This is the point where a user moves from browsing meals to building an actual subscription.

The page should feel like:

- building a weekly food box
- making a few clear selections
- moving smoothly toward checkout

It should **not** feel like a heavy form or a generic checkout page.

---

# Core UX Principle

Users must choose a plan **before** selecting meals.

This is critical because the selected plan defines:

- how many meals the user can choose
- the subscription price
- the cadence of the delivery
- the selection rules for the builder

Correct flow:

Browse Meals → Choose Plan → Select Meals → Delivery Details → Payment

---

# Builder Flow Structure

The meal plan builder should be structured as a four-step flow:

1. Plan
2. Meals
3. Delivery
4. Payment

Recommended progress indicator:

Plan ✓ → Meals ● → Delivery → Payment

This helps users understand where they are and how much is left.

---

# Step 1 — Plan Selection

## Purpose

The user chooses the subscription structure first.

## Content

Display clear plan cards, for example:

- 3 Meals Per Week
- 5 Meals Per Week
- Family Plan

Each plan card should show:

- plan name
- number of meals included
- weekly price
- short explanation of who the plan is for

### Value Indicators

Each plan card should also include **simple benefit bullets** that reinforce the value of the plan. These should sit directly under the price.

Example structure:

£24.99 / week  
£8.33 per meal

✓ Freshly cooked Nigerian meals  
✓ Flexible weekly meal selection  
✓ Skip or pause anytime

These bullets help users quickly understand the benefit of subscribing and reduce hesitation.

### 3 Meals Per Week
Ideal for individuals who want a few ready-made meals each week.

### 5 Meals Per Week
A stronger weekly plan for customers who want more consistent meal coverage.

### Family Plan
Larger portions or more meals designed for households.

### Price Transparency

To help users evaluate value quickly, each plan card should also show the **price per meal** in addition to the weekly price.

Example:

£39.99 per week  
£7.99 per meal

Displaying price per meal makes it easier for users to compare plans and highlights when larger plans provide better value.

## CTA

Each card should use a button such as:

- Select Plan
- Build This Plan

After a plan is selected, a **primary Continue button** should appear below the plan cards.

Example:

Continue → Choose Your Meals

This ensures the user intentionally confirms their plan before moving to the next step and prevents accidental navigation.

### Reassurance Messaging

Below the plan cards, include a short reassurance line to reduce subscription hesitation.

Example:

You’ll choose your meals on the next step. Skip or pause your plan anytime.

This messaging addresses common concerns around subscriptions and improves conversion.

### Visual Selection Feedback

When a user selects a plan card, the UI should clearly highlight the selected state.

Recommended behaviour:

- stronger border highlight
- subtle background tint
- check icon or "Selected Plan" label

This visual feedback reassures users that their selection has been registered and helps prevent confusion before continuing to the meal selection step.

---

# Step 2 — Meal Selection Builder

## Purpose

Allow users to fill the selected plan with meals.

This is the most important interaction in the product.

## Header

At the top of the meals step, show clear context:

- Build Your Weekly Meal Plan
- Selected plan name
- progress count, for example: `0 / 3 meals selected`

Example header:

Build Your Weekly Meal Plan  
3 Meals Per Week Plan  
0 / 3 meals selected

## Layout

Desktop layout:

- main meal grid on the left
- sticky plan summary panel on the right

Mobile layout:

- meal grid stacked vertically
- sticky summary bar or bottom drawer for selected meals

## Filters

Provide category filters above the grid:

- All Meals
- Rice Dishes
- Soups
- Light Meals
- Sides

Optional future filters:

- Subscriber Favourites
- Spicy
- High Protein

## Meal Cards

Each meal card should contain:

- large food image
- meal name
- short description
- optional tags
- add/select interaction

Example tags:

- Subscriber Favourite ⭐
- Most Ordered 🔥
- Spicy 🌶

## Card Interaction

Before selection:

- button: `Add to Plan`

After selection:

- state changes to `Added ✓`
- or show quantity controls if duplicates are allowed

If duplicates are allowed, use:

- minus button
- current quantity
- plus button

## Progress Feedback

The progress count must update live.

Examples:

- 1 / 3 meals selected
- 2 / 3 meals selected
- 3 / 3 meals selected ✓

This progress indicator is critical because it gives users momentum and clarity.

---

# Step 2a — Sticky Plan Summary

## Purpose

Keep users oriented while selecting meals.

## Desktop behaviour

A sticky sidebar should show:

- selected plan name
- selected meals
- current progress
- next CTA

Example:

Your Weekly Plan

- Jollof Rice + Chicken
- Ayamase + Rice

2 / 3 meals selected

Button:

Continue →

## Mobile behaviour

Use a sticky bottom summary bar showing:

- meal count selected
- compact CTA button

Example:

2 / 3 meals selected  |  Continue

---

# Step 2b — Meal Detail View

When a user clicks a meal image or title, open a modal or detail drawer.

The detail view should include:

- large meal image
- full description
- ingredients
- spice level
- optional nutrition info
- allergy notes if available

CTA:

Add to Plan

This lets users inspect meals without leaving the builder flow.

---

# Step 3 — Delivery Details

## Purpose

Collect fulfilment information after the meal plan has been built.

## Fields

- delivery address
- phone number
- delivery instructions
- preferred delivery day or slot

Optional future fields:

- gate or buzzer info
- recurring delivery preference

## UX rule

This step should be clean and short. Only ask for what is necessary.

CTA:

Continue to Payment

---

# Step 4 — Payment

## Purpose

Allow the user to review the plan and complete the subscription.

## Summary content

Display:

- selected plan name
- weekly price
- selected meals
- delivery summary

Example:

Plan: 3 Meals Weekly  
Meals:
- Jollof Rice + Chicken
- Ayamase + Rice
- Egusi + Pounded Yam

Total: £XX per week

CTA:

Confirm Subscription

Payment should be handled with Stripe.

---

# Success State

After successful payment, show a clear confirmation screen.

Content should include:

- confirmation message
- first delivery timing if known
- CTA to dashboard
- CTA to browse more meals

Example:

You’re all set 🎉

Your first delivery is scheduled for Tuesday, 14 May.

Buttons:

- Manage My Plan
- Browse Meals

---

# UX Behaviour Rules

1. Users cannot select meals until a plan has been chosen.
2. The selected plan controls the meal limit.
3. Progress must always be visible during meal selection.
4. The plan summary should remain visible while the user builds their plan.
5. The experience should feel visual and lightweight, not like filling a long form.

---

# Visual Design Notes

## General tone

The page should feel:

- modern
- premium
- food-led
- easy to complete

## Recommended interaction details

- large food imagery
- hover lift on meal cards
- slight image zoom on hover
- soft shadows
- clear selected states
- subtle completion feedback when the meal limit is reached

## Important emotional framing

The user should feel like they are:

**building their weekly box**

—not configuring a complex subscription product.

---

# Suggested Layout Summary

## Desktop

- compact top navigation
- page header with plan context
- progress indicator
- sticky filter row
- meal grid (left)
- sticky plan summary (right)

## Mobile

- simplified header
- progress visible near top
- stacked meal cards
- sticky bottom summary bar

---

# Future Enhancements

These are not required for MVP but are worth considering later:

- allow users to swap meals week to week
- pre-highlight subscriber favourites
- show dietary preference filters
- show estimated prep or delivery timing
- allow extras or add-ons

---

# Final Product Role

The meal plan builder is the most important product screen in the subscription flow.

If it feels easy, visual, and satisfying, users will move into checkout with far less friction.

If it feels confusing or form-heavy, conversion will drop.
