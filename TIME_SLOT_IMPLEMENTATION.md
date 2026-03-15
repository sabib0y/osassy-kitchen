# Time Slot Selection Implementation

## Overview
Added time slot selection functionality to the DeliveryStep component, allowing users to select their preferred delivery time after choosing a delivery day.

## Changes Made

### 1. Type Definitions (`/src/types/meal-plans.ts`)

**Added to DeliveryDetails interface:**
- `preferredTimeSlot: string` - Required field for delivery time selection

**New constants:**
- `WEEKDAY_TIME_SLOTS` - Available time slots for Monday-Friday:
  - 9:00 AM - 12:00 PM
  - 12:00 PM - 3:00 PM
  - 3:00 PM - 6:00 PM

- `SATURDAY_TIME_SLOTS` - Available time slots for Saturday:
  - 10:00 AM - 1:00 PM
  - 1:00 PM - 4:00 PM

**New types:**
- `WeekdayTimeSlot`
- `SaturdayTimeSlot`

### 2. Component Updates (`/src/components/meals/DeliveryStep.tsx`)

**New imports:**
- `useMemo` from React
- `Clock` icon from lucide-react
- `WEEKDAY_TIME_SLOTS` and `SATURDAY_TIME_SLOTS` from types

**State management:**
- Added `preferredTimeSlot` to form data initialisation
- Added `preferredTimeSlot` to ValidationErrors interface
- Added validation for required time slot field

**New functionality:**
- `availableTimeSlots` computed via useMemo - dynamically shows correct time slots based on selected day
- Time slot resets when delivery day changes
- Time slot validation in form submission

**UI additions:**
- Time slot selection grid (only shown after day selection)
- Clickable time slot buttons with active state styling
- Helper text indicating weekday vs Saturday delivery windows
- Clock icon for visual consistency

### 3. Styling (`/src/styles/components/meals/deliveryStep.module.scss`)

**New styles:**
- `.timeSlotGrid` - Responsive grid layout for time slot buttons
- `.timeSlotButton` - Base styling for time slot selection buttons
- `.timeSlotButtonActive` - Active state styling (red background, white text)
- `.timeSlotIcon` - Icon colour management

**Features:**
- Responsive design (single column on mobile)
- Hover effects with border colour change
- Active state with primary colour background
- Smooth transitions

### 4. Test Updates

**Files updated:**
- `/src/__tests__/components/meal-plans/DeliveryStep.test.tsx`
- `/src/__tests__/components/meal-plans/PaymentStep.test.tsx`
- `/src/__tests__/components/meal-plans/SuccessStep.test.tsx`

**Changes:**
- Fixed import paths (meal-plans → meals)
- Added `preferredTimeSlot` to all DeliveryDetails mock objects
- Updated prop names (deliveryDetails → initialData, onUpdate → onBack)
- Corrected label text in assertions

## User Flow

1. User selects a preferred delivery day from dropdown
2. Time slot selection appears below the day selector
3. Available time slots adjust based on selected day (weekday vs Saturday)
4. User clicks a time slot button to select it
5. Selected button shows active state (red background)
6. If user changes delivery day, time slot resets
7. Form validates both day and time slot before allowing continuation

## Validation Rules

- Delivery day is required
- Time slot is required
- Time slot must be selected after day is chosen
- Changing the delivery day clears the previously selected time slot

## Technical Notes

- Time slots are conditionally rendered (only show after day selection)
- Uses button elements for better accessibility
- Type-safe implementation with TypeScript
- Follows existing design patterns and component structure
- Maintains consistency with brand colours and spacing
