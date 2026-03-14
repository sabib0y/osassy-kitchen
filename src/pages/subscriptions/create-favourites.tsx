/**
 * Create Subscription Page
 * Allows users to build subscriptions from their favourited menu items
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import UserLayout from '@/components/user/UserLayout';
import SubscriptionTabs from '@/components/subscription/SubscriptionTabs';
import { useFavourites } from '@/hooks/useFavourites';
import { useMenuItems } from '@/hooks/useMenuItems';
import FavouritedItemCard from '@/components/subscription/FavouritedItemCard';
import SubscriptionSummary from '@/components/subscription/SubscriptionSummary';
import EmptyFavourites from '@/components/subscription/EmptyFavourites';
import { SubscriptionCartItem, SubscriptionFrequency } from '@/types/user';
import { MenuItem } from '@/types/admin';
import { Loader2 } from 'lucide-react';
import styles from '@/styles/pages/subscriptionCreate.module.scss';

const CART_STORAGE_KEY = 'osassy_subscription_cart';

/**
 * Load cart from localStorage
 */
const loadCartFromStorage = (): Record<string, SubscriptionCartItem> => {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return {};
  }
};

/**
 * Save cart to localStorage
 */
const saveCartToStorage = (cart: Record<string, SubscriptionCartItem>): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const CreateSubscriptionPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch favourites
  const { favourites, isLoading: isLoadingFavourites } = useFavourites();

  // Convert favourites Set to array
  const favouriteIds = useMemo(() => Array.from(favourites), [favourites]);

  // Fetch menu items
  const { data: allMenuItems = [], isLoading: isLoadingMenu } = useMenuItems({
    enabled: !!session,
  });

  // Filter menu items to only favourited ones
  const favouritedMenuItems = useMemo(() => {
    return allMenuItems.filter((item) => favouriteIds.includes(item.id));
  }, [allMenuItems, favouriteIds]);

  // Cart state
  const [cart, setCart] = useState<Record<string, SubscriptionCartItem>>(() => loadCartFromStorage());
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Persist cart to localStorage
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  /**
   * Handle quantity change
   */
  const handleQuantityChange = useCallback((menuItemId: string, newQuantity: number) => {
    const menuItem = favouritedMenuItems.find((item) => item.id === menuItemId);
    if (!menuItem) return;

    setCart((prev) => {
      const existingItem = prev[menuItemId];
      return {
        ...prev,
        [menuItemId]: {
          id: menuItemId,
          menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: newQuantity,
          frequency: existingItem?.frequency || 'weekly',
          imageUrl: menuItem.imageUrl || undefined,
          category: menuItem.category,
        },
      };
    });
  }, [favouritedMenuItems]);

  /**
   * Handle frequency change
   */
  const handleFrequencyChange = useCallback((menuItemId: string, frequency: SubscriptionFrequency) => {
    setCart((prev) => {
      const existingItem = prev[menuItemId];
      if (!existingItem) return prev;

      return {
        ...prev,
        [menuItemId]: {
          ...existingItem,
          frequency,
        },
      };
    });
  }, []);

  /**
   * Handle remove from cart
   */
  const handleRemove = useCallback((menuItemId: string) => {
    setCart((prev) => {
      const { [menuItemId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Initialise cart with favourited items (default quantity: 1, frequency: weekly)
   */
  useEffect(() => {
    if (favouritedMenuItems.length === 0) return;

    setCart((prev) => {
      const newCart = { ...prev };

      favouritedMenuItems.forEach((item) => {
        // Only add if not already in cart
        if (!newCart[item.id]) {
          newCart[item.id] = {
            id: item.id,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            frequency: 'weekly',
            imageUrl: item.imageUrl || undefined,
            category: item.category,
          };
        }
      });

      return newCart;
    });
  }, [favouritedMenuItems]);

  /**
   * Handle checkout
   */
  const handleCheckout = async () => {
    setIsProcessingCheckout(true);

    try {
      const items = Object.values(cart).map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        frequency: item.frequency,
      }));

      // Call subscribe API
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      if (data.checkoutUrl) {
        // Clear cart and redirect to Stripe checkout
        localStorage.removeItem(CART_STORAGE_KEY);
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to proceed to checkout');
      setIsProcessingCheckout(false);
    }
  };

  // Convert cart to array for summary component
  const cartItems = useMemo(() => Object.values(cart), [cart]);

  // Loading state
  const isLoading = status === 'loading' || isLoadingFavourites || isLoadingMenu;

  return (
    <>
      <Head>
        <title>Create Subscription - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Build your custom meal subscription from your favourite dishes" />
      </Head>

      <UserLayout pageTitle="Create Your Subscription" activeTab="subscriptions">
        <div className={styles.pageContainer}>
          {/* Subscription Navigation Tabs */}
          <SubscriptionTabs activeTab="create" />

          {/* Loading State */}
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className={styles.loadingIcon} />
              <p>Loading your favourites...</p>
            </div>
          ) : favouritedMenuItems.length === 0 ? (
            // Empty state - no favourites
            <EmptyFavourites />
          ) : (
            // Main content - favourited items + summary
            <div className={styles.contentLayout}>
              <div className={styles.itemsSection}>
                <h2 className={styles.sectionTitle}>Your Favourited Dishes</h2>
                <p className={styles.sectionSubtitle}>
                  Customise quantities and delivery frequencies for each dish
                </p>

                <div className={styles.itemsGrid}>
                  {favouritedMenuItems.map((item) => (
                    <FavouritedItemCard
                      key={item.id}
                      item={item}
                      cartItem={cart[item.id] || null}
                      onQuantityChange={handleQuantityChange}
                      onFrequencyChange={handleFrequencyChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.summarySection}>
                <SubscriptionSummary
                  items={cartItems}
                  onCheckout={handleCheckout}
                  onRemoveItem={handleRemove}
                  isLoading={isProcessingCheckout}
                />
              </div>
            </div>
          )}
        </div>
      </UserLayout>
    </>
  );
};

export default CreateSubscriptionPage;
