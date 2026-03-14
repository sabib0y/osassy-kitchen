import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import prisma from '@/lib/prisma';
import { useFavourites } from '@/hooks/useFavourites';
import styles from '@/styles/pages/menu.module.scss';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  image?: string | null;
}

interface MenuPageProps {
  menuItems: MenuItem[];
  categories: string[];
}

const MenuPage: React.FC<MenuPageProps> = ({ menuItems, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>(menuItems);
  const { isFavourite, toggleFavourite } = useFavourites();

  useEffect(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [selectedCategory, searchTerm, menuItems]);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Rice': '🍚',
      'Stew': '🍲',
      'Soup': '🥘',
      'Specials': '⭐',
      'Drinks': '🥤',
      'Sides': '🥗',
      'Desserts': '🍰'
    };
    return icons[category] || '🍽️';
  };

  return (
    <Layout pageTitle="Our Menu - Osassy's Kitchen">
      <div className={styles.menuPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Our Menu</h1>
              <p className={styles.heroSubtitle}>
                Authentic African cuisine, freshly prepared and delivered to your door
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className={styles.filterSection}>
          <div className={styles.container}>
            {/* Search Bar */}
            <div className={styles.searchBar}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setSearchTerm('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className={styles.categoryFilters}>
              <button
                className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span className={styles.categoryIcon}>🍽️</span>
                <span>All Items</span>
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
                    <span className={styles.categoryIcon}>{getCategoryIcon(category)}</span>
                    <span>{category}</span>
                    <span className={styles.count}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Menu Items Grid */}
        <section className={styles.menuSection}>
          <div className={styles.container}>
            {filteredItems.length === 0 ? (
              <div className={styles.noResults}>
                <i className="fas fa-search"></i>
                <h3>No items found</h3>
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
              <div className={styles.menuGrid}>
                {filteredItems.map(item => (
                  <div key={item.id} className={styles.menuCard}>
                    {/* Image Placeholder */}
                    <div className={styles.cardImage}>
                      <div className={styles.imagePlaceholder}>
                        <span>{getCategoryIcon(item.category)}</span>
                      </div>
                      {!item.available && (
                        <div className={styles.unavailableOverlay}>
                          <span>Currently Unavailable</span>
                        </div>
                      )}
                      {/* Favourite Heart Button */}
                      <button
                        className={`${styles.heartBtn} ${isFavourite(item.id) ? styles.favourited : ''}`}
                        onClick={() => toggleFavourite(item.id)}
                        aria-label={
                          isFavourite(item.id)
                            ? `Remove from favourites - ${item.name}`
                            : `Add to favourites - ${item.name}`
                        }
                      >
                        <Heart
                          size={20}
                          fill={isFavourite(item.id) ? 'currentColor' : 'none'}
                          strokeWidth={2}
                        />
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className={styles.cardContent}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <div className={styles.badges}>
                          {item.isVegetarian && (
                            <span className={`${styles.badge} ${styles.vegetarian}`}>
                              <i className="fas fa-leaf"></i>
                              Vegetarian
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className={`${styles.badge} ${styles.spicy}`}>
                              <i className="fas fa-pepper-hot"></i>
                              Spicy
                            </span>
                          )}
                        </div>
                      </div>

                      {item.description && (
                        <p className={styles.itemDescription}>{item.description}</p>
                      )}

                      <div className={styles.cardFooter}>
                        <span className={styles.price}>£{item.price.toFixed(2)}</span>
                        <span className={styles.category}>{item.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>Ready to Order?</h2>
              <p>Create a subscription and enjoy our delicious meals delivered regularly</p>
              <div className={styles.ctaButtons}>
                <Link href="/subscriptions/create" className={styles.primaryBtn}>
                  <i className="fas fa-plus"></i>
                  Create Subscription
                </Link>
                <Link href="/how-it-works" className={styles.secondaryBtn}>
                  <i className="fas fa-info-circle"></i>
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Extract unique categories
    const categories = Array.from(new Set(menuItems.map(item => item.category))).sort();

    return {
      props: {
        menuItems: JSON.parse(JSON.stringify(menuItems)),
        categories
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return {
      props: {
        menuItems: [],
        categories: []
      }
    };
  }
};

export default MenuPage;