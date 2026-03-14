/**
 * PlanCard Component
 * Displays a subscription plan tier card with selection CTA
 */

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { MealPlan } from '@/types/meal-plan';
import styles from '@/styles/components/meal-plans/planCard.module.scss';

interface PlanCardProps {
  plan: MealPlan;
  onSelect: (plan: MealPlan) => void;
  isSelected?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, isSelected = false }) => {
  const pricePerMeal = (plan.pricePerWeek / plan.mealsPerWeek).toFixed(2);

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${plan.popular ? styles.popular : ''}`}
    >
      {plan.popular && (
        <div className={styles.popularBadge}>
          <span>Most Popular</span>
        </div>
      )}

      {isSelected && (
        <div className={styles.selectedBadge}>
          <Check size={16} />
          <span>Selected</span>
        </div>
      )}

      <div className={styles.cardContent}>
        <h3 className={styles.planName}>{plan.name}</h3>

        <div className={styles.priceSection}>
          <span className={styles.price}>£{plan.pricePerWeek.toFixed(2)}</span>
          <span className={styles.period}>per week</span>
        </div>

        <p className={styles.pricePerMeal}>£{pricePerMeal} per meal</p>

        <p className={styles.mealsCount}>
          {plan.mealsPerWeek} {plan.mealsPerWeek === 1 ? 'meal' : 'meals'} per week
        </p>

        <ul className={styles.benefits}>
          <li><Check size={16} /> Freshly cooked Nigerian meals</li>
          <li><Check size={16} /> Flexible weekly meal selection</li>
          <li><Check size={16} /> Skip or pause anytime</li>
        </ul>

        <p className={styles.description}>{plan.description}</p>

        <button
          className={`${styles.selectBtn} ${isSelected ? styles.selectedBtn : ''}`}
          onClick={() => onSelect(plan)}
        >
          {isSelected ? (
            <>
              <Check size={18} />
              Selected
            </>
          ) : (
            <>
              Select This Plan
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
