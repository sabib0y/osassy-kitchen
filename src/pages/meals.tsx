/**
 * Meals Page - Unified Browse & Builder Experience
 * Users can explore dishes (Browse Mode) or build a meal plan (Builder Mode)
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Flame,
  Leaf,
  Star,
  ArrowRight,
  Search,
  X,
  Check,
  ShoppingBag,
  ChevronRight,
  MapPin,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import PlanCard from '@/components/meal-plans/PlanCard';
import prisma from '@/lib/prisma';
import { MealPlan, SelectedMeal, MEAL_PLANS } from '@/types/meal-plan';
import styles from '@/styles/pages/meals.module.scss';

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
  region?: string | null;
  allergens?: string[];
  keyIngredients?: string[];
}

interface MealsPageProps {
  menuItems: MenuItem[];
  categories: string[];
  popularIds: string[];
}

type PageMode = 'browse' | 'builder';

const STORAGE_KEY = 'osassy-meal-builder-state';

interface BuilderState {
  mode: PageMode;
  selectedPlan: MealPlan | null;
  selectedMeals: SelectedMeal[];
}

const MealsPage: React.FC<MealsPageProps> = ({ menuItems, categories, popularIds }) => {
  const router = useRouter();

  // Core state
  const [mode, setMode] = useState<PageMode>('browse');
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
  const [showPlanSelection, setShowPlanSelection] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Expanded card state
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const mealsGridRef = useRef<HTMLDivElement>(null);

  // Close expanded panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (expandedMealId && mealsGridRef.current && !mealsGridRef.current.contains(e.target as Node)) {
        setExpandedMealId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedMealId]);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: BuilderState = JSON.parse(saved);
        if (state.selectedPlan && state.mode === 'builder') {
          setMode('builder');
          setSelectedPlan(state.selectedPlan);
          setSelectedMeals(state.selectedMeals || []);
        }
      }
    } catch (_) {
      // Ignore localStorage errors
    }
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    try {
      const state: BuilderState = { mode, selectedPlan, selectedMeals };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // Ignore localStorage errors
    }
  }, [mode, selectedPlan, selectedMeals]);

  // Check if meal is popular
  const isPopular = (mealId: string) => popularIds.includes(mealId);

  // Check if meal is selected
  const isMealSelected = useCallback((mealId: string) => {
    return selectedMeals.some(m => m.id === mealId);
  }, [selectedMeals]);

  // Filtered meals
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

  // Toggle expanded detail panel
  const toggleMealDetail = (mealId: string) => {
    setExpandedMealId(prev => prev === mealId ? null : mealId);
  };

  // Plan selection handlers
  const handleStartPlanClick = () => {
    router.push('/user/subscriptions/create');
  };

  const handlePlanSelect = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setSelectedMeals([]);
    setMode('builder');
    setShowPlanSelection(false);
  };

  const handleClosePlanSelection = () => {
    setShowPlanSelection(false);
  };

  // Meal selection handlers
  const handleToggleMeal = (meal: MenuItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!selectedPlan) return;

    if (isMealSelected(meal.id)) {
      // Remove meal
      setSelectedMeals(prev => prev.filter(m => m.id !== meal.id));
    } else {
      // Add meal (if under limit)
      if (selectedMeals.length < selectedPlan.mealsPerWeek) {
        const newMeal: SelectedMeal = {
          id: meal.id,
          name: meal.name,
          category: meal.category,
          imageUrl: meal.imageUrl
        };
        setSelectedMeals(prev => [...prev, newMeal]);
      }
    }
  };

  // Cancel builder mode
  const handleCancelBuilder = () => {
    setMode('browse');
    setSelectedPlan(null);
    setSelectedMeals([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Continue to checkout
  const handleContinue = () => {
    // Store state and navigate to delivery/payment
    // For now, we'll just log - another agent handles this
    router.push('/checkout');
  };

  // Progress calculation
  const mealsRequired = selectedPlan?.mealsPerWeek || 0;
  const mealsSelected = selectedMeals.length;
  const progressPercent = mealsRequired > 0 ? (mealsSelected / mealsRequired) * 100 : 0;
  const isComplete = mealsSelected >= mealsRequired;

  return (
    <>
      <Head>
        <title>
          {mode === 'builder'
            ? `Select Your Meals (${mealsSelected}/${mealsRequired}) - Osassy's Kitchen`
            : "Explore Our Meals - Osassy's Kitchen"
          }
        </title>
        <meta
          name="description"
          content="Browse authentic Nigerian dishes available for your weekly meal plan. Discover our selection of traditional recipes."
        />
      </Head>

      <Layout pageTitle={mode === 'builder' ? 'Choose Your Meals' : 'Explore Our Meals'}>
        <div className={`${styles.mealsPage} ${mode === 'builder' ? styles.builderMode : ''}`}>
          {/* Hero Section - Different for each mode */}
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              {mode === 'browse' ? (
                <>
                  <h1 className={styles.heroTitle}>Explore Our Meals</h1>
                  <p className={styles.heroSubtitle}>
                    Browse authentic Nigerian dishes available for your weekly meal plan.
                  </p>
                  <div className={styles.heroCtas}>
                    <button onClick={handleStartPlanClick} className={styles.primaryBtn}>
                      Start Your Meal Plan
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.builderHeader}>
                    <h1 className={styles.heroTitle}>Choose Your Meals</h1>
                    <p className={styles.heroSubtitle}>
                      Select {mealsRequired} meals for your {selectedPlan?.name}
                    </p>
                  </div>

                  {/* Progress Indicator */}
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

                  <button onClick={handleCancelBuilder} className={styles.cancelBtn}>
                    Cancel & Browse
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Main Content Area */}
          <div className={styles.mainContent}>
            {/* Category Filters - Sticky */}
            <section className={styles.filterSection}>
              <div className={styles.container}>
                <div className={styles.filterRow}>
                  {/* Category Pills */}
                  <div className={styles.categoryFilters}>
                  <button
                    className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <span>All Meals</span>
                    <span className={styles.count}>{menuItems.length}</span>
                  </button>
                  {categories.map(category => {
                    const count = menuItems.filter(item => item.category === category).length;
                    return (
                      <button
                        key={category}
                        className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <span>{category}</span>
                        <span className={styles.count}>{count}</span>
                      </button>
                    );
                  })}
                  </div>

                  {/* Search Bar */}
                  <div className={styles.searchBar}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search for dishes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                    {searchTerm && (
                      <button
                        className={styles.clearSearch}
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Content Layout - Grid + Summary Panel in Builder Mode */}
            <div className={styles.contentLayout}>
              {/* Meals Grid */}
              <section className={styles.mealsSection}>
                <div className={styles.container}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      {selectedCategory === 'all' ? 'All Meals' : selectedCategory}
                    </h2>
                    <p className={styles.resultsCount}>
                      {filteredItems.length} {filteredItems.length === 1 ? 'meal' : 'meals'} available
                    </p>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className={styles.noResults}>
                      <Search size={48} />
                      <h3>No meals found</h3>
                      <p>Try adjusting your search or filter criteria</p>
                      <button
                        className={styles.resetBtn}
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchTerm('');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className={styles.mealsGrid} ref={mealsGridRef}>
                      {filteredItems.map((meal) => {
                        const isSelected = isMealSelected(meal.id);
                        const canAdd = !isSelected && mealsSelected < mealsRequired;
                        const isExpanded = expandedMealId === meal.id;

                        return (
                          <div
                            key={meal.id}
                            className={`${styles.mealCardWrapper} ${isExpanded ? styles.expanded : ''}`}
                          >
                            <div
                              className={`${styles.mealCard} ${isSelected ? styles.selected : ''}`}
                              onClick={() => toggleMealDetail(meal.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && toggleMealDetail(meal.id)}
                            >
                              {/* Image */}
                              <div className={styles.cardImage}>
                                {meal.imageUrl ? (
                                  <img src={meal.imageUrl} alt={meal.name} />
                                ) : (
                                  <div className={styles.imagePlaceholder}>
                                    <span className={styles.placeholderIcon}>
                                      {getCategoryIcon(meal.category)}
                                    </span>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className={styles.selectedOverlay}>
                                    <Check size={24} />
                                  </div>
                                )}
                              </div>

                              {/* Content - Name & Description */}
                              <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                  <h3 className={styles.mealName}>{meal.name}</h3>
                                  <div className={styles.cardTags}>
                                    {isPopular(meal.id) && (
                                      <span className={`${styles.tag} ${styles.popular}`}>
                                        <Star size={10} />
                                      </span>
                                    )}
                                    {meal.isSpicy && (
                                      <span className={`${styles.tag} ${styles.spicy}`}>
                                        <Flame size={10} />
                                      </span>
                                    )}
                                    {meal.isVegetarian && (
                                      <span className={`${styles.tag} ${styles.vegetarian}`}>
                                        <Leaf size={10} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {meal.description && (
                                  <p className={styles.mealDescription}>
                                    {meal.description.slice(0, 80)}
                                    {meal.description.length > 80 ? '...' : ''}
                                  </p>
                                )}
                              </div>

                              {/* Price + Expand indicator */}
                              <div className={styles.cardActions}>
                                <span className={styles.price}>£{meal.price.toFixed(2)}</span>
                                <ChevronDown
                                  size={16}
                                  className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}
                                />

                                {mode === 'builder' && (
                                  <button
                                    className={`${styles.addBtn} ${isSelected ? styles.added : ''}`}
                                    onClick={(e) => handleToggleMeal(meal, e)}
                                    disabled={!canAdd && !isSelected}
                                  >
                                    {isSelected ? (
                                      <>
                                        <Check size={16} />
                                        Added
                                      </>
                                    ) : canAdd ? (
                                      'Add'
                                    ) : (
                                      'Full'
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Slide-out Detail Panel */}
                            <div className={`${styles.detailPanel} ${isExpanded ? styles.open : ''}`}>
                              <div className={styles.detailContent}>
                                <p className={styles.detailDescription}>{meal.description}</p>

                                {meal.region && (
                                  <div className={styles.detailRow}>
                                    <MapPin size={14} />
                                    <span className={styles.detailLabel}>Region:</span>
                                    <span>{meal.region}</span>
                                  </div>
                                )}

                                {meal.keyIngredients && meal.keyIngredients.length > 0 && (
                                  <div className={styles.detailRow}>
                                    <Leaf size={14} />
                                    <span className={styles.detailLabel}>Key ingredients:</span>
                                    <span>{meal.keyIngredients.join(', ')}</span>
                                  </div>
                                )}

                                {meal.allergens && meal.allergens.length > 0 && (
                                  <div className={`${styles.detailRow} ${styles.allergenRow}`}>
                                    <AlertTriangle size={14} />
                                    <span className={styles.detailLabel}>Allergens:</span>
                                    <span>{meal.allergens.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Summary Panel - Desktop Only (Builder Mode) */}
              {mode === 'builder' && (
                <aside className={styles.summaryPanel}>
                  <div className={styles.summaryContent}>
                    <h3 className={styles.summaryTitle}>
                      <ShoppingBag size={20} />
                      Your Selection
                    </h3>

                    <div className={styles.planInfo}>
                      <span className={styles.planName}>{selectedPlan?.name}</span>
                      <span className={styles.planPrice}>£{selectedPlan?.pricePerWeek.toFixed(2)}/week</span>
                    </div>

                    <div className={styles.progressIndicator}>
                      <div className={styles.progressCircles}>
                        {Array.from({ length: mealsRequired }).map((_, i) => (
                          <div
                            key={i}
                            className={`${styles.progressCircle} ${i < mealsSelected ? styles.filled : ''}`}
                          />
                        ))}
                      </div>
                      <span className={styles.progressLabel}>
                        {mealsSelected}/{mealsRequired} meals
                      </span>
                    </div>

                    {/* Selected Meals List */}
                    <div className={styles.selectedMealsList}>
                      {selectedMeals.map((meal, index) => (
                        <div key={meal.id} className={styles.selectedMealItem}>
                          <span className={styles.mealNumber}>{index + 1}</span>
                          <span className={styles.mealItemName}>{meal.name}</span>
                          <button
                            className={styles.removeMealBtn}
                            onClick={() => setSelectedMeals(prev => prev.filter(m => m.id !== meal.id))}
                            aria-label={`Remove ${meal.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      {/* Empty slots */}
                      {Array.from({ length: mealsRequired - mealsSelected }).map((_, i) => (
                        <div key={`empty-${i}`} className={`${styles.selectedMealItem} ${styles.empty}`}>
                          <span className={styles.mealNumber}>{mealsSelected + i + 1}</span>
                          <span className={styles.emptySlot}>Select a meal</span>
                        </div>
                      ))}
                    </div>

                    <button
                      className={styles.continueBtn}
                      onClick={handleContinue}
                      disabled={!isComplete}
                    >
                      {isComplete ? (
                        <>
                          Continue
                          <ChevronRight size={20} />
                        </>
                      ) : (
                        `Select ${mealsRequired - mealsSelected} more meal${mealsRequired - mealsSelected !== 1 ? 's' : ''}`
                      )}
                    </button>

                    <button className={styles.changePlanBtn} onClick={() => setShowPlanSelection(true)}>
                      Change Plan
                    </button>
                  </div>
                </aside>
              )}
            </div>

            {/* Bottom CTA Section - Browse Mode Only */}
            {mode === 'browse' && (
              <section className={styles.ctaSection}>
                <div className={styles.container}>
                  <div className={styles.ctaContent}>
                    <h2>Start Your Meal Plan Today</h2>
                    <p>
                      Subscribe to get authentic Nigerian meals delivered fresh to your door every week.
                    </p>
                    <div className={styles.ctaButtons}>
                      <button onClick={handleStartPlanClick} className={styles.primaryBtn}>
                        Choose a Plan
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Mobile Bottom Bar - Builder Mode */}
          {mode === 'builder' && (
            <div className={styles.mobileBottomBar}>
              <div className={styles.mobileProgress}>
                <div className={styles.mobileProgressBar}>
                  <div
                    className={styles.mobileProgressFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={styles.mobileProgressText}>
                  {mealsSelected}/{mealsRequired} meals
                </span>
              </div>

              <button
                className={styles.mobileContinueBtn}
                onClick={handleContinue}
                disabled={!isComplete}
              >
                {isComplete ? 'Continue' : `${mealsRequired - mealsSelected} more`}
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Plan Selection Modal */}
        {showPlanSelection && (
          <div className={styles.planSelectionOverlay} onClick={handleClosePlanSelection}>
            <div
              className={styles.planSelectionModal}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeModalBtn}
                onClick={handleClosePlanSelection}
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <div className={styles.planSelectionHeader}>
                <h2>Choose Your Plan</h2>
                <p>Select how many meals you would like each week</p>
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
            </div>
          </div>
        )}

      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { available: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Extract unique categories
    const categories = Array.from(new Set(menuItems.map(item => item.category))).sort();

    // Popular meal IDs - these could come from a database flag in future
    const popularIds = menuItems.slice(0, 4).map(item => item.id);

    return {
      props: {
        menuItems: JSON.parse(JSON.stringify(menuItems)),
        categories,
        popularIds
      }
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

export default MealsPage;
