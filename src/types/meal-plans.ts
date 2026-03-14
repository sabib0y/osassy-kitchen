// Meal Plan Builder Types

export interface DeliveryDetails {
  address: string;
  city: string;
  postcode: string;
  phone: string;
  instructions?: string;
  preferredDay: string;
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
