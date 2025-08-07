import React, { useState, useEffect, useMemo } from 'react';
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
  PlusCircle
} from 'lucide-react';
import styles from '@/styles/components/subscription-create.module.css';
import dashboardStyles from '@/styles/components/user/dashboard.module.scss';
import { Cart, CartItem, FilterState } from '@/types/user';

// Mock data for menu items - this will be replaced with API call later
const MOCK_MENU_ITEMS = [
  {
    id: 'jollof',
    name: 'Jollof Rice',
    description: 'The king of Nigerian rice dishes with tomatoes, peppers & spices',
    price: 2500,
    category: 'rice',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=200&fit=crop&crop=center',
    tags: ['Popular']
  },
  {
    id: 'egusi',
    name: 'Egusi Soup',
    description: 'Rich melon seed soup with leafy greens and your choice of protein',
    price: 3200,
    category: 'soup',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop&crop=center'
  },
  {
    id: 'pounded-yam',
    name: 'Pounded Yam',
    description: 'Smooth, stretchy yam perfect for dipping in soups',
    price: 2000,
    category: 'protein',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop&crop=center'
  },
  {
    id: 'suya',
    name: 'Suya',
    description: 'Spicy grilled beef skewers with traditional yaji spice blend',
    price: 3500,
    category: 'protein',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop&crop=center',
    tags: ['Spicy']
  },
  {
    id: 'coconut-rice',
    name: 'Coconut Rice',
    description: 'Fragrant rice cooked in rich coconut milk with vegetables',
    price: 2800,
    category: 'rice',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=200&fit=crop&crop=center'
  },
  {
    id: 'pepper-soup',
    name: 'Pepper Soup',
    description: 'Aromatic spicy soup with fish or meat and traditional herbs',
    price: 2200,
    category: 'soup',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&h=200&fit=crop&crop=center',
    tags: ['Spicy']
  },
  {
    id: 'plantain',
    name: 'Dodo (Plantain)',
    description: 'Sweet fried plantain slices, perfectly caramelised',
    price: 1500,
    category: 'protein',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&crop=center'
  },
  {
    id: 'amala',
    name: 'Amala',
    description: 'Dark, smooth yam flour swallow perfect with ewedu or gbegiri',
    price: 1800,
    category: 'protein',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop&crop=center'
  }
];

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Filter menu items based on search and category
  const filteredMenuItems = useMemo(() => {
    return MOCK_MENU_ITEMS.filter(item => {
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      const matchesSearch = item.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filters]);

  // Calculate totals
  const { subtotal, total, itemCount } = useMemo(() => {
    const subtotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal > 0 ? 500 : 0;
    const total = subtotal + deliveryFee;
    const itemCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    
    return { subtotal, total, itemCount };
  }, [cart]);

  // Handle quantity changes
  const changeQuantity = (itemId: string, change: number) => {
    const menuItem = MOCK_MENU_ITEMS.find(item => item.id === itemId);
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
            category: menuItem.category,
            quantity: newQuantity,
            imageUrl: menuItem.imageUrl
          }
        };
      }
    });
  };

  // Toggle dish in cart
  const toggleDish = (itemId: string) => {
    const currentQuantity = cart[itemId]?.quantity || 0;
    if (currentQuantity === 0) {
      changeQuantity(itemId, 1);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  // Toggle like/heart
  const toggleLike = (itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle filter changes
  const handleCategoryFilter = (category: FilterState['category']) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  };

  // Handle checkout
  const handleCheckout = () => {
    // For now, just redirect to a success page or next step
    console.log('Proceeding to checkout with:', { cart, billingInterval });
    // router.push('/subscriptions/schedule');
  };

  // Show loading state
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
          <div className={styles.contentLayout}>
            {/* Dishes Grid */}
            <div className={styles.dishesSection}>
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
                        src={item.imageUrl}
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
                      {item.tags && (
                        <div className={styles.dishTags}>
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`${styles.dishTag} ${
                                tag === 'Popular'
                                  ? styles.dishTagPopular
                                  : styles.dishTagSpicy
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.dishCardContent}>
                      <h3 className={styles.dishTitle}>{item.name}</h3>
                      <p className={styles.dishDescription}>{item.description}</p>
                      <div className={styles.dishPriceSection}>
                        <span className={styles.dishPrice}>
                          ₦{item.price.toLocaleString()}
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
              
              {/* Empty State */}
              {filteredMenuItems.length === 0 && (
                <div className={styles.emptyState}>
                  <Search className="w-16 h-16 text-gray-300 mb-4" />
                  <h3>No dishes found</h3>
                  <p>Try adjusting your search or filter criteria</p>
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
                            ₦{item.price.toLocaleString()} × {item.quantity}
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
                    <div className={styles.summaryTotals}>
                      <div className={styles.summaryTotalRow}>
                        <span>Subtotal:</span>
                        <span>₦{subtotal.toLocaleString()}</span>
                      </div>
                      <div className={styles.summaryTotalRow}>
                        <span>Delivery:</span>
                        <span>₦500</span>
                      </div>
                      <div className={styles.summaryGrandTotal}>
                        <span>Total:</span>
                        <span>₦{total.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      className={styles.checkoutBtn}
                      onClick={handleCheckout}
                    >
                      <span>Continue to Schedule</span>
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </button>
                  </>
                )}

                <div className={styles.deliveryNote}>
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Free delivery on orders over ₦5,000</span>
                </div>
              </div>
            </div>
          </div>
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