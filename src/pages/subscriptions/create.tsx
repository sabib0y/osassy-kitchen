import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  Minus, 
  Plus, 
  CheckCircle, 
  ArrowLeft, 
  PieChart, 
  Package, 
  ShoppingCart, 
  User, 
  CreditCard,
  Zap,
  PlusCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import styles from '@/styles/components/subscription-create.module.css';
import dashboardStyles from '@/styles/components/user/dashboard.module.scss';
import { Cart, CartItem, FilterState } from '@/types/user';
import { MenuItem } from '@/types/admin';
import { useMenuItems } from '@/hooks/useMenuItems';
import MenuItemSkeleton, { SkeletonStyles } from '@/components/MenuItemSkeleton';
import MenuErrorBoundary from '@/components/MenuErrorBoundary';
import { createCheckoutSession, redirectToCheckout } from '@/lib/stripe-client';

// Map categories from database to UI display format
const categoryMapping: { [key: string]: string } = {
  'rice-dishes': 'rice',
  'soups': 'soup',
  'grilled': 'protein',
  'main-dishes': 'protein',
  'sides': 'protein',
  'appetizers': 'protein'
};

// Helper function to map database category to UI category
const mapCategory = (dbCategory: string): string => {
  return categoryMapping[dbCategory] || 'protein';
};

const CreateSubscriptionPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [cart, setCart] = useState<Cart>({});
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    searchTerm: ''
  });
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Use React Query hook to fetch menu items
  const {
    data: menuItems = [],
    isLoading: isLoadingMenu,
    error: menuQueryError,
    refetch: refetchMenuItems,
    isRefetching
  } = useMenuItems({
    enabled: !!session, // Only fetch when user is authenticated
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes
    onError: (error) => {
      console.error('Failed to fetch menu items:', error);
    }
  });

  // Convert query error to string for display
  const menuError = menuQueryError ? menuQueryError.message : null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Filter menu items based on search and category
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const uiCategory = mapCategory(item.category);
      const matchesCategory = filters.category === 'all' || uiCategory === filters.category;
      const matchesSearch = item.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, filters]);

  // Calculate totals
  const { subtotal, total, itemCount } = useMemo(() => {
    const subtotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal > 0 ? 500 : 0;
    const total = subtotal + deliveryFee;
    const itemCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    
    return { subtotal, total, itemCount };
  }, [cart]);

  // Handle quantity changes
  const changeQuantity = useCallback((itemId: string, change: number) => {
    const menuItem = menuItems.find(item => item.id === itemId);
    if (!menuItem) return;

    setCart(prev => {
      const currentQuantity = prev[itemId]?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + change);

      if (newQuantity === 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      } else {
        return {
          ...prev,
          [itemId]: {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            category: mapCategory(menuItem.category),
            quantity: newQuantity,
            imageUrl: menuItem.imageUrl || undefined
          }
        };
      }
    });
  }, [menuItems]);

  // Toggle dish in cart
  const toggleDish = useCallback((itemId: string) => {
    const currentQuantity = cart[itemId]?.quantity || 0;
    if (currentQuantity === 0) {
      changeQuantity(itemId, 1);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  }, [cart, changeQuantity]);

  // Toggle like/heart
  const toggleLike = useCallback((itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Handle filter changes
  const handleCategoryFilter = useCallback((category: FilterState['category']) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  // Handle checkout
  const handleCheckout = async () => {
    // Validate cart
    if (Object.keys(cart).length === 0) {
      setCheckoutError('Please add at least one item to your subscription');
      return;
    }

    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      // Prepare items for the API
      const items = Object.values(cart).map(item => ({
        menuItemId: item.id,
        quantity: item.quantity
      }));

      // Determine the Stripe price ID based on billing interval
      // These price IDs are created via scripts/setup-stripe-prices.js
      const priceId = billingInterval === 'WEEKLY' 
        ? 'price_1RtHViQcnp5UiDwRGeiN3oy0' // Weekly subscription price
        : 'price_1RtHViQcnp5UiDwRQ8S4gxgG'; // Monthly subscription price

      // Create Stripe checkout session using the utility function
      const { sessionId } = await createCheckoutSession({
        priceId,
        items,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/cancel`
      });

      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error instanceof Error ? error.message : 'An error occurred during checkout');
      setIsProcessingCheckout(false);
    }
  };

  // Show loading state only for authentication
  if (status === 'loading') {
    return (
      <Layout pageTitle="Create Your Nigerian Meal Subscription - Osassy Kitchen">
        <div className={dashboardStyles.dashboard}>
          <div className={dashboardStyles.loadingContainer}>
            <div className={dashboardStyles.spinner}></div>
            <p>Loading your subscription builder...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return (
    <Layout pageTitle="Create Your Nigerian Meal Subscription - Osassy Kitchen">
      <SkeletonStyles />
      <div className={dashboardStyles.dashboard}>
        <div className={dashboardStyles.container}>
          {/* Sidebar */}
          <aside className={dashboardStyles.sidebar}>
            <div className={dashboardStyles.sidebarContent}>
              <div className={dashboardStyles.userInfo}>
                <div className={dashboardStyles.userAvatar}>
                  <i className="fas fa-user-circle"></i>
                </div>
                <h3>{session?.user?.name || 'Welcome'}</h3>
                <p>{session?.user?.email}</p>
              </div>
              <nav className={dashboardStyles.sidebarNav}>
                <Link href="/user/dashboard" className={dashboardStyles.navItem}>
                  <i className="fas fa-home"></i>
                  <span>Overview</span>
                </Link>
                <Link href="/user/subscriptions" className={`${dashboardStyles.navItem} ${dashboardStyles.active}`}>
                  <i className="fas fa-sync-alt"></i>
                  <span>Subscriptions</span>
                </Link>
                <Link href="/user/orders" className={dashboardStyles.navItem}>
                  <i className="fas fa-shopping-bag"></i>
                  <span>Orders</span>
                </Link>
                <Link href="/user/profile" className={dashboardStyles.navItem}>
                  <i className="fas fa-user"></i>
                  <span>Profile</span>
                </Link>
                <Link href="/user/payments" className={dashboardStyles.navItem}>
                  <i className="fas fa-credit-card"></i>
                  <span>Payments</span>
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className={dashboardStyles.mainContent}>
            <div className={dashboardStyles.header}>
              <h1 className={dashboardStyles.pageTitle}>Create Your Nigerian Meal Subscription</h1>
            </div>

            <div className={styles.pageContainer}>
              {/* Breadcrumb Navigation */}
              <nav className={styles.breadcrumb}>
                <Link href="/user/dashboard" className={styles.breadcrumbLink}>
                  <PieChart className="w-4 h-4" />
                  Dashboard
                </Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <Link href="/user/subscriptions" className={styles.breadcrumbLink}>
                  <Package className="w-4 h-4" />
                  Subscriptions
                </Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbActive}>Create Subscription</span>
              </nav>
              
              {/* Page Subtitle */}
              <p className={styles.pageSubtitle}>
                Build your personalised meal plan with authentic Nigerian dishes delivered to your door
              </p>
          {/* Progress Steps */}
          <div className={styles.progressContainer}>
            <div className={styles.progressSteps}>
              <div className={`${styles.progressStep} ${styles.progressStepActive}`}>
                <div className={styles.progressStepNumber}>1</div>
                <span className={styles.progressStepLabel}>Select Dishes</span>
              </div>
              <div className={`${styles.progressLine} ${styles.progressLineActive}`}></div>
              <div className={`${styles.progressStep} ${styles.progressStepInactive}`}>
                <div className={styles.progressStepNumber}>2</div>
                <span className={styles.progressStepLabel}>Schedule</span>
              </div>
              <div className={styles.progressLine}></div>
              <div className={`${styles.progressStep} ${styles.progressStepInactive}`}>
                <div className={styles.progressStepNumber}>3</div>
                <span className={styles.progressStepLabel}>Payment</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={styles.filtersContainer}>
            <div className={styles.filtersContent}>
              <div className={styles.searchSection}>
                <div className={styles.searchInputContainer}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search authentic Nigerian dishes..."
                    className={styles.searchInput}
                    value={filters.searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.categoryFilters}>
                {[
                  { key: 'all', label: 'All Dishes', icon: '🍽️' },
                  { key: 'rice', label: 'Rice', icon: '🍚' },
                  { key: 'soup', label: 'Soups', icon: '🍲' },
                  { key: 'protein', label: 'Protein', icon: '🥩' }
                ].map((category) => (
                  <button
                    key={category.key}
                    className={`${styles.filterTab} ${
                      filters.category === category.key ? styles.filterTabActive : ''
                    }`}
                    onClick={() => handleCategoryFilter(category.key as FilterState['category'])}
                  >
                    <span className={styles.filterIcon}>{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dishes and Summary Layout */}
          <MenuErrorBoundary onRetry={() => refetchMenuItems()}>
          <div className={styles.contentLayout}>
            {/* Dishes Grid */}
            <div className={styles.dishesSection}>
              {/* Error Message */}
              {menuError && (
                <div className={styles.errorMessage}>
                  <AlertCircle className="w-5 h-5" />
                  <span>{menuError}</span>
                  <button 
                    onClick={() => refetchMenuItems()} 
                    className={styles.retryButton}
                    disabled={isRefetching}
                  >
                    {isRefetching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Retry
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Loading Skeleton */}
              {isLoadingMenu && !menuError && (
                <MenuItemSkeleton count={6} />
              )}

              {/* Dishes Grid */}
              {!isLoadingMenu && !menuError && (
              <div className={styles.dishesGrid}>
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.dishCard} ${
                      cart[item.id] ? styles.dishCardSelected : ''
                    }`}
                  >
                    <div className={styles.dishCardImageContainer}>
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1633237308525-a7fa7d67e41f?w=300&h=200&fit=crop&crop=center'}
                        alt={item.name}
                        className={styles.dishImage}
                        loading="lazy"
                      />
                      <button
                        className={`${styles.heartLike} ${
                          likedItems.has(item.id) ? styles.heartLiked : ''
                        }`}
                        onClick={() => toggleLike(item.id)}
                        aria-label={`${likedItems.has(item.id) ? 'Remove from' : 'Add to'} favourites`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      {/* Add tags based on category */}
                      {(item.category === 'grilled' || item.category === 'soups') && (
                        <div className={styles.dishTags}>
                          <span
                            className={`${styles.dishTag} ${
                              item.category === 'grilled'
                                ? styles.dishTagSpicy
                                : styles.dishTagPopular
                            }`}
                          >
                            {item.category === 'grilled' ? 'Grilled' : 'Popular'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.dishCardContent}>
                      <h3 className={styles.dishTitle}>{item.name}</h3>
                      <p className={styles.dishDescription}>{item.description}</p>
                      <div className={styles.dishPriceSection}>
                        <span className={styles.dishPrice}>
                          £{item.price.toLocaleString()}
                        </span>
                        <div className={styles.quantityControls}>
                          <button
                            className={styles.quantityBtn}
                            onClick={() => changeQuantity(item.id, -1)}
                            disabled={!cart[item.id]}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className={styles.quantityDisplay}>
                            {cart[item.id]?.quantity || 0}
                          </span>
                          <button
                            className={styles.quantityBtn}
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        className={`${styles.addButton} ${
                          cart[item.id] ? styles.addButtonInactive : ''
                        }`}
                        onClick={() => toggleDish(item.id)}
                      >
                        <span>{cart[item.id] ? 'In Box' : 'Add to Box'}</span>
                        {!cart[item.id] && <PlusCircle className="w-4 h-4 ml-2" />}
                        {cart[item.id] && <CheckCircle className="w-4 h-4 ml-2" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
              
              {/* Empty State */}
              {!isLoadingMenu && !menuError && filteredMenuItems.length === 0 && (
                <div className={styles.emptyState}>
                  <Search className="w-16 h-16 text-gray-300 mb-4" />
                  <h3>No dishes found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                  {filters.searchTerm || filters.category !== 'all' ? (
                    <button
                      onClick={() => setFilters({ category: 'all', searchTerm: '' })}
                      className={styles.resetFiltersBtn}
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        backgroundColor: '#8B4513',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Clear Filters
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Summary Panel */}
            <div className={styles.summarySection}>
              <div className={styles.summaryPanel}>
                <div className={styles.summaryHeader}>
                  <h3 className={styles.summaryTitle}>
                    <ShoppingBag className="w-5 h-5" />
                    Your Box
                    <span className={styles.itemCount}>({itemCount})</span>
                  </h3>
                </div>

                <div className={styles.summaryItems}>
                  {Object.keys(cart).length === 0 ? (
                    <div className={styles.emptySummary}>
                      <PlusCircle className="w-12 h-12 text-gray-300 mb-3" />
                      <p className={styles.emptySummaryText}>Add dishes to see your selection</p>
                      <p className={styles.emptySummarySubtext}>Start building your Nigerian feast!</p>
                    </div>
                  ) : (
                    Object.entries(cart).map(([itemId, item]) => (
                      <div key={itemId} className={styles.summaryItem}>
                        <div className={styles.summaryItemImage}>
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                        <div className={styles.summaryItemDetails}>
                          <h4 className={styles.summaryItemName}>{item.name}</h4>
                          <p className={styles.summaryItemPrice}>
                            £{item.price.toLocaleString()} × {item.quantity}
                          </p>
                          <div className={styles.summaryItemControls}>
                            <button
                              onClick={() => changeQuantity(itemId, -1)}
                              className={styles.summaryQuantityBtn}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={styles.summaryQuantityDisplay}>{item.quantity}</span>
                            <button
                              onClick={() => changeQuantity(itemId, 1)}
                              className={styles.summaryQuantityBtn}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {Object.keys(cart).length > 0 && (
                  <>
                    {/* Billing Interval Selector */}
                    <div className={styles.billingIntervalSection}>
                      <h4 className={styles.billingTitle}>Delivery Frequency</h4>
                      <div className={styles.billingOptions}>
                        <button
                          className={`${styles.billingOption} ${billingInterval === 'WEEKLY' ? styles.billingOptionActive : ''}`}
                          onClick={() => setBillingInterval('WEEKLY')}
                        >
                          <div className={styles.billingOptionContent}>
                            <span className={styles.billingOptionLabel}>Weekly</span>
                            <span className={styles.billingOptionPrice}>£150 base fee</span>
                          </div>
                        </button>
                        <button
                          className={`${styles.billingOption} ${billingInterval === 'MONTHLY' ? styles.billingOptionActive : ''}`}
                          onClick={() => setBillingInterval('MONTHLY')}
                        >
                          <div className={styles.billingOptionContent}>
                            <span className={styles.billingOptionLabel}>Monthly</span>
                            <span className={styles.billingOptionPrice}>£500 base fee</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className={styles.summaryTotals}>
                      <div className={styles.summaryTotalRow}>
                        <span>Subtotal:</span>
                        <span>£{subtotal.toLocaleString()}</span>
                      </div>
                      <div className={styles.summaryTotalRow}>
                        <span>Delivery:</span>
                        <span>£500</span>
                      </div>
                      <div className={styles.summaryGrandTotal}>
                        <span>Total:</span>
                        <span>£{total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Checkout Error */}
                    {checkoutError && (
                      <div className={styles.errorAlert}>
                        <AlertCircle className="w-4 h-4" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    <button
                      className={styles.checkoutBtn}
                      onClick={handleCheckout}
                      disabled={isProcessingCheckout}
                    >
                      {isProcessingCheckout ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Proceed to Checkout</span>
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </>
                      )}
                    </button>
                  </>
                )}

                <div className={styles.deliveryNote}>
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Free delivery on orders over £50</span>
                </div>
              </div>
            </div>
          </div>
          </MenuErrorBoundary>
            {/* Success Toast */}
            {showSuccessToast && (
              <div className={styles.successToast}>
                <div className={styles.toastContent}>
                  <CheckCircle className="w-5 h-5" />
                  <span>Added to your box!</span>
                </div>
              </div>
            )}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default CreateSubscriptionPage;