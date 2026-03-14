/**
 * Meal Plan Types
 * Types for the meal plan builder wizard
 */

export type PlanType = '3-meals' | '5-meals' | 'family';

export interface MealPlan {
  id: PlanType;
  name: string;
  mealsPerWeek: number;
  pricePerWeek: number;
  description: string;
  popular?: boolean;
}

export interface SelectedMeal {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
}

export interface MealPlanWizardState {
  step: 'plan' | 'meals' | 'delivery' | 'payment';
  selectedPlan: MealPlan | null;
  selectedMeals: SelectedMeal[];
}

export const MEAL_PLANS: MealPlan[] = [
  {
    id: '3-meals',
    name: '3 Meals Per Week',
    mealsPerWeek: 3,
    pricePerWeek: 24.99,
    description: 'Ideal for individuals who want a few ready-made meals each week.',
  },
  {
    id: '5-meals',
    name: '5 Meals Per Week',
    mealsPerWeek: 5,
    pricePerWeek: 39.99,
    description: 'A stronger weekly plan for customers who want more consistent meal coverage.',
    popular: true,
  },
  {
    id: 'family',
    name: 'Family Plan',
    mealsPerWeek: 7,
    pricePerWeek: 59.99,
    description: 'Larger portions or more meals designed for households.',
  },
];
