/**
 * Meal Plan Wizard - 4-Step Subscription Flow
 * Step 1: Plan Selection
 * Step 2: Meal Builder
 * Step 3: Delivery Details
 * Step 4: Payment & Confirmation
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  X,
  Star,
  Flame,
  Leaf,
  ShoppingBag,
  MapPin,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import PlanCard from '@/components/meal-plans/PlanCard';
import MealDetailModal from '@/components/meals/MealDetailModal';
import prisma from '@/lib/prisma';
import { MealPlan, SelectedMeal, MEAL_PLANS } from '@/types/meal-plan';
import styles from '@/styles/pages/mealPlanCreate.module.scss';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  imageUrl?: string | null;
}

interface DeliveryDetails {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  phone: string;
  deliveryInstructions: string;
  preferredDay: string;
  preferredTimeSlot: string;
}

const DELIVERY_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WEEKDAY_TIME_SLOTS = ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'];
const SATURDAY_TIME_SLOTS = ['10:00 AM - 1:00 PM', '1:00 PM - 4:00 PM'];

interface MealPlanCreateProps {
  menuItems: MenuItem[];
  categories: string[];
  popularIds: string[];
}

type WizardStep = 'plan' | 'meals' | 'delivery' | 'payment';

const STEPS: WizardStep[] = ['plan', 'meals', 'delivery', 'payment'];

const STEP_LABELS: Record<WizardStep, string> = {
  plan: 'Plan',
  meals: 'Meals',
  delivery: 'Delivery',
  payment: 'Payment'
};

const MealPlanCreatePage: React.FC<MealPlanCreateProps> = ({
  menuItems,
  categories,
  popularIds
}) => {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('plan');
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    phone: '',
    deliveryInstructions: '',
    preferredDay: '',
    preferredTimeSlot: ''
  });

  // Filter state (for meals step)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal state
  const [selectedMeal, setSelectedMeal] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);

  // Checkout loading state
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Handle URL query param for pre-selected plan
  useEffect(() => {
    if (router.query.plan && !selectedPlan) {
      const plan = MEAL_PLANS.find(p => p.id === router.query.plan);
      if (plan) {
        setSelectedPlan(plan);
        setCurrentStep('meals');
      }
    }
  }, [router.query.plan, selectedPlan]);

  // Step navigation
  const currentStepIndex = STEPS.indexOf(currentStep);

  const goToStep = (step: WizardStep) => {
    const targetIndex = STEPS.indexOf(step);
    // Allow going back to any previous step or current
    if (targetIndex <= currentStepIndex) {
      setCurrentStep(step);
    }
  };

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  // Plan selection
  const handlePlanSelect = (plan: MealPlan) => {
    if (selectedPlan?.id !== plan.id) {
      setSelectedMeals([]); // Reset meals if plan changes
    }
    setSelectedPlan(plan);
  };

  // Meal selection
  const isPopular = (mealId: string) => popularIds.includes(mealId);

  const isMealSelected = useCallback((mealId: string) => {
    return selectedMeals.some(m => m.id === mealId);
  }, [selectedMeals]);

  const handleToggleMeal = (meal: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedPlan) return;

    if (isMealSelected(meal.id)) {
      setSelectedMeals(prev => prev.filter(m => m.id !== meal.id));
    } else if (selectedMeals.length < selectedPlan.mealsPerWeek) {
      const newMeal: SelectedMeal = {
        id: meal.id,
        name: meal.name,
        category: meal.category,
        imageUrl: meal.imageUrl
      };
      setSelectedMeals(prev => [...prev, newMeal]);
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = menuItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [menuItems, selectedCategory, searchTerm]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Rice': '🍚',
      'Stew': '🍲',
      'Soup': '🥘',
      'Specials': '⭐',
      'Drinks': '🥤',
      'Sides': '🥗',
      'Desserts': '🍰',
      'Light Meals': '🥗'
    };
    return icons[category] || '🍽️';
  };

  // Modal handlers
  const openMealModal = (meal: MenuItem) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  const closeMealModal = () => {
    setIsModalOpen(false);
    setSelectedMeal(null);
  };

  // Delivery form handlers
  const handleDeliveryChange = (field: keyof DeliveryDetails, value: string) => {
    setDeliveryDetails(prev => ({ ...prev, [field]: value }));
  };

  const isDeliveryValid = () => {
    return (
      deliveryDetails.fullName.trim() !== '' &&
      deliveryDetails.addressLine1.trim() !== '' &&
      deliveryDetails.city.trim() !== '' &&
      deliveryDetails.postcode.trim() !== '' &&
      deliveryDetails.phone.trim() !== '' &&
      deliveryDetails.preferredDay.trim() !== '' &&
      deliveryDetails.preferredTimeSlot.trim() !== ''
    );
  };

  const getAvailableTimeSlots = () => {
    if (deliveryDetails.preferredDay === 'Saturday') {
      return SATURDAY_TIME_SLOTS;
    }
    return WEEKDAY_TIME_SLOTS;
  };

  const handleDayChange = (day: string) => {
    setDeliveryDetails(prev => ({
      ...prev,
      preferredDay: day,
      preferredTimeSlot: '' // Reset time slot when day changes
    }));
  };

  // Payment submission - redirect to Stripe checkout
  const handleSubmit = async () => {
    if (!selectedPlan) return;

    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      // Build items array for the API
      const items = selectedMeals.map((meal) => ({
        menuItemId: meal.id,
        quantity: 1,
        frequency: 'weekly' as const,
      }));

      // Call subscribe API with meal plan data
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          pricePerWeek: selectedPlan.pricePerWeek,
          deliveryDetails: {
            fullName: deliveryDetails.fullName,
            addressLine1: deliveryDetails.addressLine1,
            addressLine2: deliveryDetails.addressLine2,
            city: deliveryDetails.city,
            postcode: deliveryDetails.postcode,
            phone: deliveryDetails.phone,
            deliveryInstructions: deliveryDetails.deliveryInstructions,
            preferredDay: deliveryDetails.preferredDay,
            preferredTimeSlot: deliveryDetails.preferredTimeSlot,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error instanceof Error ? error.message : 'Failed to proceed to checkout');
      setIsProcessingCheckout(false);
    }
  };

  // Progress calculations
  const mealsRequired = selectedPlan?.mealsPerWeek || 0;
  const mealsSelected = selectedMeals.length;
  const progressPercent = mealsRequired > 0 ? (mealsSelected / mealsRequired) * 100 : 0;
  const isMealsComplete = mealsSelected >= mealsRequired;

  // Can proceed to next step?
  const canProceed = () => {
    switch (currentStep) {
      case 'plan':
        return selectedPlan !== null;
      case 'meals':
        return isMealsComplete;
      case 'delivery':
        return isDeliveryValid();
      case 'payment':
        return true;
      default:
        return false;
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <>
        <Head>
          <title>Subscription Confirmed - Osassy&apos;s Kitchen</title>
        </Head>
        <Layout pageTitle="Success">
          <div className={styles.successPage}>
            <div className={styles.successContent}>
              <div className={styles.successIcon}>
                <Check size={48} />
              </div>
              <h1>You&apos;re All Set! 🎉</h1>
              <p className={styles.successMessage}>
                Your {selectedPlan?.name} subscription has been confirmed.
              </p>
              <p className={styles.deliveryInfo}>
                Your first delivery is scheduled for <strong>next Tuesday</strong>.
              </p>

              <div className={styles.orderSummary}>
                <h3>Your Weekly Meals</h3>
                <ul>
                  {selectedMeals.map(meal => (
                    <li key={meal.id}>{meal.name}</li>
                  ))}
                </ul>
                <p className={styles.totalPrice}>
                  £{selectedPlan?.pricePerWeek.toFixed(2)}/week
                </p>
              </div>

              <div className={styles.successActions}>
                <button
                  className={styles.primaryBtn}
                  onClick={() => router.push('/user/subscriptions')}
                >
                  Manage My Plan
                </button>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => router.push('/meals')}
                >
                  Browse More Meals
                </button>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>
          {currentStep === 'plan' && 'Choose Your Plan'}
          {currentStep === 'meals' && `Select Meals (${mealsSelected}/${mealsRequired})`}
          {currentStep === 'delivery' && 'Delivery Details'}
          {currentStep === 'payment' && 'Complete Your Order'}
          {' - Osassy\'s Kitchen'}
        </title>
      </Head>

      <Layout pageTitle="Build Your Meal Plan">
        <div className={styles.wizardPage}>
          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = step === currentStep;
              const isClickable = index <= currentStepIndex;

              return (
                <React.Fragment key={step}>
                  <button
                    className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                    onClick={() => isClickable && goToStep(step)}
                    disabled={!isClickable}
                  >
                    <span className={styles.stepCircle}>
                      {isCompleted ? <Check size={16} /> : index + 1}
                    </span>
                    <span className={styles.stepLabel}>{STEP_LABELS[step]}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`${styles.stepConnector} ${isCompleted ? styles.completed : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Content */}
          <div className={styles.stepContent}>
            {/* STEP 1: Plan Selection */}
            {currentStep === 'plan' && (
              <div className={styles.planStep}>
                <div className={styles.stepHeader}>
                  <h1>Choose Your Plan</h1>
                  <p>Select how many meals you would like delivered each week</p>
                </div>

                <div className={styles.planCards}>
                  {MEAL_PLANS.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onSelect={handlePlanSelect}
                      isSelected={selectedPlan?.id === plan.id}
                    />
                  ))}
                </div>

                <p className={styles.reassurance}>
                  <Check size={18} />
                  You&apos;ll choose your meals on the next step. Skip or pause your plan anytime.
                </p>

                {selectedPlan && (
                  <div className={styles.stepActions}>
                    <button className={styles.continueBtn} onClick={goNext}>
                      Continue — Choose Your Meals
                      <ArrowRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Meal Selection */}
            {currentStep === 'meals' && (
              <div className={styles.mealsStep}>
                <div className={styles.mealsLayout}>
                  {/* Main Grid */}
                  <div className={styles.mealsMain}>
                    <div className={styles.mealsHeader}>
                      <button className={styles.backBtn} onClick={goBack}>
                        <ArrowLeft size={18} />
                        Change Plan
                      </button>
                      <div className={styles.headerContent}>
                        <h1>Choose Your Meals</h1>
                        <p>Select {mealsRequired} meals for your {selectedPlan?.name}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className={styles.progressSection}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className={styles.progressText}>
                        <strong>{mealsSelected}</strong> of <strong>{mealsRequired}</strong> meals selected
                      </p>
                    </div>

                    {/* Filters */}
                    <div className={styles.filterSection}>
                      <div className={styles.searchBar}>
                        <Search size={20} />
                        <input
                          type="text"
                          placeholder="Search meals..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button onClick={() => setSearchTerm('')}>
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      <div className={styles.categoryFilters}>
                        <button
                          className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
                          onClick={() => setSelectedCategory('all')}
                        >
                          🍽️ All
                        </button>
                        {categories.map(category => (
                          <button
                            key={category}
                            className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                            onClick={() => setSelectedCategory(category)}
                          >
                            {getCategoryIcon(category)} {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Meals Grid */}
                    <div className={styles.mealsGrid}>
                      {filteredItems.map(meal => {
                        const isSelected = isMealSelected(meal.id);
                        const canAdd = !isSelected && mealsSelected < mealsRequired;

                        return (
                          <div
                            key={meal.id}
                            className={`${styles.mealCard} ${isSelected ? styles.selected : ''}`}
                            onClick={() => openMealModal(meal)}
                          >
                            <div className={styles.cardImage}>
                              {meal.imageUrl ? (
                                <img src={meal.imageUrl} alt={meal.name} />
                              ) : (
                                <div className={styles.placeholder}>
                                  {getCategoryIcon(meal.category)}
                                </div>
                              )}
                              {isSelected && (
                                <div className={styles.selectedOverlay}>
                                  <Check size={24} />
                                </div>
                              )}
                            </div>

                            <div className={styles.cardContent}>
                              <div className={styles.cardHeader}>
                                <h3>{meal.name}</h3>
                                <div className={styles.tags}>
                                  {isPopular(meal.id) && <Star size={12} className={styles.popular} />}
                                  {meal.isSpicy && <Flame size={12} className={styles.spicy} />}
                                  {meal.isVegetarian && <Leaf size={12} className={styles.veg} />}
                                </div>
                              </div>
                              {meal.description && (
                                <p className={styles.description}>
                                  {meal.description.slice(0, 60)}...
                                </p>
                              )}
                            </div>

                            <div className={styles.cardActions}>
                              <span className={styles.price}>£{meal.price.toFixed(2)}</span>
                              <button
                                className={`${styles.addBtn} ${isSelected ? styles.added : ''}`}
                                onClick={(e) => handleToggleMeal(meal, e)}
                                disabled={!canAdd && !isSelected}
                              >
                                {isSelected ? <><Check size={16} /> Added</> : canAdd ? 'Add' : 'Full'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Sidebar */}
                  <aside className={styles.mealsSummary}>
                    <div className={styles.summaryContent}>
                      <h3><ShoppingBag size={20} /> Your Selection</h3>

                      <div className={styles.planInfo}>
                        <span>{selectedPlan?.name}</span>
                        <span>£{selectedPlan?.pricePerWeek.toFixed(2)}/week</span>
                      </div>

                      <div className={styles.progressCircles}>
                        {Array.from({ length: mealsRequired }).map((_, i) => (
                          <div
                            key={i}
                            className={`${styles.circle} ${i < mealsSelected ? styles.filled : ''}`}
                          />
                        ))}
                      </div>

                      <div className={styles.selectedList}>
                        {selectedMeals.map((meal, i) => (
                          <div key={meal.id} className={styles.selectedItem}>
                            <span className={styles.num}>{i + 1}</span>
                            <span className={styles.name}>{meal.name}</span>
                            <button onClick={() => setSelectedMeals(prev => prev.filter(m => m.id !== meal.id))}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {Array.from({ length: mealsRequired - mealsSelected }).map((_, i) => (
                          <div key={`empty-${i}`} className={`${styles.selectedItem} ${styles.empty}`}>
                            <span className={styles.num}>{mealsSelected + i + 1}</span>
                            <span className={styles.emptyText}>Select a meal</span>
                          </div>
                        ))}
                      </div>

                      <button
                        className={styles.continueBtn}
                        onClick={goNext}
                        disabled={!isMealsComplete}
                      >
                        {isMealsComplete ? (
                          <>Continue <ChevronRight size={20} /></>
                        ) : (
                          `Select ${mealsRequired - mealsSelected} more`
                        )}
                      </button>
                    </div>
                  </aside>
                </div>

                {/* Mobile Bottom Bar */}
                <div className={styles.mobileBottomBar}>
                  <div className={styles.mobileProgress}>
                    <div className={styles.mobileProgressBar}>
                      <div style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span>{mealsSelected}/{mealsRequired}</span>
                  </div>
                  <button onClick={goNext} disabled={!isMealsComplete}>
                    {isMealsComplete ? 'Continue' : `${mealsRequired - mealsSelected} more`}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Delivery Details */}
            {currentStep === 'delivery' && (
              <div className={styles.deliveryStep}>
                <div className={styles.stepHeader}>
                  <button className={styles.backBtn} onClick={goBack}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <div className={styles.headerContent}>
                    <h1><MapPin size={28} /> Delivery Details</h1>
                    <p>Where should we deliver your meals?</p>
                  </div>
                </div>

                <div className={styles.deliveryForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      id="fullName"
                      type="text"
                      value={deliveryDetails.fullName}
                      onChange={(e) => handleDeliveryChange('fullName', e.target.value)}
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="addressLine1">Address Line 1 *</label>
                    <input
                      id="addressLine1"
                      type="text"
                      value={deliveryDetails.addressLine1}
                      onChange={(e) => handleDeliveryChange('addressLine1', e.target.value)}
                      placeholder="123 High Street"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="addressLine2">Address Line 2</label>
                    <input
                      id="addressLine2"
                      type="text"
                      value={deliveryDetails.addressLine2}
                      onChange={(e) => handleDeliveryChange('addressLine2', e.target.value)}
                      placeholder="Flat 4B"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="city">City *</label>
                      <input
                        id="city"
                        type="text"
                        value={deliveryDetails.city}
                        onChange={(e) => handleDeliveryChange('city', e.target.value)}
                        placeholder="London"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="postcode">Postcode *</label>
                      <input
                        id="postcode"
                        type="text"
                        value={deliveryDetails.postcode}
                        onChange={(e) => handleDeliveryChange('postcode', e.target.value)}
                        placeholder="SW1A 1AA"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      type="tel"
                      value={deliveryDetails.phone}
                      onChange={(e) => handleDeliveryChange('phone', e.target.value)}
                      placeholder="07123 456789"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="deliveryInstructions">Delivery Instructions</label>
                    <textarea
                      id="deliveryInstructions"
                      value={deliveryDetails.deliveryInstructions}
                      onChange={(e) => handleDeliveryChange('deliveryInstructions', e.target.value)}
                      placeholder="e.g., Ring doorbell, leave with neighbour..."
                      rows={3}
                    />
                  </div>

                  <div className={styles.deliverySchedule}>
                    <h3>Delivery Schedule *</h3>
                    <p className={styles.scheduleHint}>Choose your preferred delivery day and time slot</p>

                    <div className={styles.formGroup}>
                      <label>Preferred Day</label>
                      <div className={styles.daySelector}>
                        {DELIVERY_DAYS.map(day => (
                          <button
                            key={day}
                            type="button"
                            className={`${styles.dayButton} ${deliveryDetails.preferredDay === day ? styles.selected : ''}`}
                            onClick={() => handleDayChange(day)}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    {deliveryDetails.preferredDay && (
                      <div className={styles.formGroup}>
                        <label>Preferred Time Slot</label>
                        <div className={styles.timeSlotSelector}>
                          {getAvailableTimeSlots().map(slot => (
                            <button
                              key={slot}
                              type="button"
                              className={`${styles.timeSlotButton} ${deliveryDetails.preferredTimeSlot === slot ? styles.selected : ''}`}
                              onClick={() => handleDeliveryChange('preferredTimeSlot', slot)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.stepActions}>
                  <button
                    className={styles.continueBtn}
                    onClick={goNext}
                    disabled={!isDeliveryValid()}
                  >
                    Continue to Payment
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Payment */}
            {currentStep === 'payment' && (
              <div className={styles.paymentStep}>
                <div className={styles.stepHeader}>
                  <button className={styles.backBtn} onClick={goBack}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <div className={styles.headerContent}>
                    <h1><CreditCard size={28} /> Review & Pay</h1>
                    <p>Confirm your subscription details</p>
                  </div>
                </div>

                <div className={styles.paymentLayout}>
                  <div className={styles.orderReview}>
                    <div className={styles.reviewSection}>
                      <h3>Your Plan</h3>
                      <div className={styles.reviewItem}>
                        <span>{selectedPlan?.name}</span>
                        <span>£{selectedPlan?.pricePerWeek.toFixed(2)}/week</span>
                      </div>
                    </div>

                    <div className={styles.reviewSection}>
                      <h3>Your Meals</h3>
                      {selectedMeals.map(meal => (
                        <div key={meal.id} className={styles.reviewItem}>
                          <span>{meal.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.reviewSection}>
                      <h3>Delivery Address</h3>
                      <p>
                        {deliveryDetails.fullName}<br />
                        {deliveryDetails.addressLine1}<br />
                        {deliveryDetails.addressLine2 && <>{deliveryDetails.addressLine2}<br /></>}
                        {deliveryDetails.city}, {deliveryDetails.postcode}<br />
                        {deliveryDetails.phone}
                      </p>
                    </div>

                    <div className={styles.totalSection}>
                      <div className={styles.totalRow}>
                        <span>Weekly Total</span>
                        <span className={styles.totalPrice}>£{selectedPlan?.pricePerWeek.toFixed(2)}</span>
                      </div>
                      <p className={styles.billingNote}>
                        You&apos;ll be billed weekly. Cancel or pause anytime.
                      </p>
                    </div>
                  </div>

                  <div className={styles.paymentForm}>
                    <h3>Payment Details</h3>
                    <p className={styles.stripeNote}>
                      Secure payment powered by Stripe
                    </p>

                    <div className={styles.stripeInfo}>
                      <p>You&apos;ll be redirected to Stripe&apos;s secure checkout to complete your payment.</p>
                    </div>

                    {checkoutError && (
                      <div className={styles.errorMessage}>
                        {checkoutError}
                      </div>
                    )}

                    <button
                      className={styles.submitBtn}
                      onClick={handleSubmit}
                      disabled={isProcessingCheckout}
                    >
                      {isProcessingCheckout ? (
                        <>Processing...</>
                      ) : (
                        <>Confirm Subscription — £{selectedPlan?.pricePerWeek.toFixed(2)}/week</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meal Detail Modal */}
        <MealDetailModal
          meal={selectedMeal}
          isOpen={isModalOpen}
          onClose={closeMealModal}
        />
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { available: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const categories = Array.from(new Set(menuItems.map(item => item.category))).sort();
    const popularIds = menuItems.slice(0, 4).map(item => item.id);

    return {
      props: {
        menuItems: JSON.parse(JSON.stringify(menuItems)),
        categories,
        popularIds
      },
      revalidate: false
    };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return {
      props: {
        menuItems: [],
        categories: [],
        popularIds: []
      }
    };
  }
};

export default MealPlanCreatePage;
