// Meal Plan Builder Types

export interface DeliveryDetails {
  address: string;
  city: string;
  postcode: string;
  phone: string;
  instructions?: string;
  preferredDay: string;
  preferredTimeSlot: string;
}

export interface MealPlan {
  id: string;
  name: string;
  mealsPerWeek: number;
  pricePerWeek: number;
  description?: string;
}

export interface SelectedMeal {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  price: number;
}

export interface MealPlanBuilderState {
  selectedPlan: MealPlan | null;
  selectedMeals: SelectedMeal[];
  deliveryDetails: DeliveryDetails | null;
}

export const DELIVERY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DeliveryDay = typeof DELIVERY_DAYS[number];

export const WEEKDAY_TIME_SLOTS = [
  '9:00 AM - 12:00 PM',
  '12:00 PM - 3:00 PM',
  '3:00 PM - 6:00 PM',
] as const;

export const SATURDAY_TIME_SLOTS = [
  '10:00 AM - 1:00 PM',
  '1:00 PM - 4:00 PM',
] as const;

export type WeekdayTimeSlot = typeof WEEKDAY_TIME_SLOTS[number];
export type SaturdayTimeSlot = typeof SATURDAY_TIME_SLOTS[number];

// API Request/Response Types
export interface CreateMealPlanSubscriptionRequest {
  planId: string;
  mealIds: string[];
  deliveryDetails: DeliveryDetails;
}

export interface CreateMealPlanSubscriptionResponse {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}
