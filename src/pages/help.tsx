import React, { useState, useMemo } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout/Layout';
import SearchBar from '@/components/help/SearchBar';
import FaqAccordion, { FaqItem } from '@/components/help/FaqAccordion';
import ContactForm from '@/components/help/ContactForm';
import ContactInfoCard from '@/components/help/ContactInfoCard';
import styles from '../styles/pages/help.module.scss';

// FAQ Data
const FAQ_DATA: FaqItem[] = [
  {
    id: '1',
    category: 'Subscription',
    question: 'How do I pause or cancel my subscription?',
    answer: 'You can pause or cancel your subscription anytime from your account dashboard. Go to the Subscriptions section, select your active subscription, and choose "Pause" or "Cancel". You\'ll receive a confirmation email with the details.'
  },
  {
    id: '2',
    category: 'Subscription',
    question: 'Can I change the dishes in my upcoming delivery?',
    answer: 'Yes, you can modify your upcoming delivery up to 48 hours before the scheduled delivery date. Visit your account dashboard, go to Subscriptions, and click "Modify" on your upcoming order to change dishes or quantities.'
  },
  {
    id: '3',
    category: 'Subscription',
    question: 'How do I skip a delivery?',
    answer: 'You can skip any delivery by logging into your account and going to the Subscriptions section. Select the delivery you want to skip and click "Skip This Delivery". This must be done at least 48 hours before the scheduled delivery.'
  },
  {
    id: '4',
    category: 'Billing',
    question: 'How do I update my payment method?',
    answer: 'Navigate to your account settings and select Payment Methods to add or update your card details. You can also set a default payment method for future subscriptions. All payment information is securely processed and encrypted.'
  },
  {
    id: '5',
    category: 'Billing',
    question: 'Where can I find my invoices?',
    answer: 'All invoices are available in your account dashboard under the Billing History section. You can view, download, and print invoices for all your past orders and subscription payments.'
  },
  {
    id: '6',
    category: 'Billing',
    question: 'Do you offer refunds?',
    answer: 'We offer full refunds for cancelled orders up to 24 hours before preparation begins. For quality issues or delivery problems, we provide refunds or credits based on our satisfaction guarantee policy.'
  },
  {
    id: '7',
    category: 'Delivery',
    question: 'What are your delivery days and times?',
    answer: 'We deliver Monday through Saturday between 10 AM and 6 PM. You can select your preferred delivery window during checkout. Sunday deliveries are available in select areas for an additional fee.'
  },
  {
    id: '8',
    category: 'Delivery',
    question: 'How do I track my order?',
    answer: 'Once your order is prepared and dispatched, you\'ll receive a tracking link via SMS and email. You can also track your order in real-time from your account dashboard under "Current Orders".'
  },
  {
    id: '9',
    category: 'Delivery',
    question: 'What if I\'m not home for delivery?',
    answer: 'Our delivery team will call you 15 minutes before arrival. If you\'re not available, we can leave the order with a trusted neighbor, building security, or reschedule for the same day at no extra cost.'
  },
  {
    id: '10',
    category: 'Food',
    question: 'Do you cater to dietary restrictions?',
    answer: 'Yes, we offer options for various dietary needs including vegetarian, vegan, and gluten-free meals. You can filter our menu by dietary preferences and add special notes to your orders for allergies or specific requirements.'
  },
  {
    id: '11',
    category: 'Food',
    question: 'How fresh are the ingredients?',
    answer: 'We source fresh ingredients daily from local markets and farms. All meals are prepared on the day of delivery using ingredients that meet our strict freshness and quality standards. Meat and seafood are never frozen before cooking.'
  },
  {
    id: '12',
    category: 'Food',
    question: 'Can I customize portion sizes?',
    answer: 'Yes, most of our dishes offer different portion sizes (regular, large, family). You can also add extra portions of rice, protein, or vegetables to customize your meal according to your appetite and preferences.'
  }
];

const CATEGORY_OPTIONS = ['All', 'Subscription', 'Billing', 'Delivery', 'Food'];

const HelpPage: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter and process FAQs
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset category when searching
    if (query && selectedCategory !== 'All') {
      setSelectedCategory('All');
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <>
      <Head>
        <title>Help Center - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Get help with your Osassy&apos;s Kitchen orders, subscriptions, and account. Find answers to frequently asked questions or contact our support team." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://osassyskitchen.com/help" />
      </Head>
      
      <Layout pageTitle="Help Center - Osassy's Kitchen">
        <div className={`${styles.helpPage} help-page`} data-testid="help-page">
          {/* Hero Section */}
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>Help Center</h1>
                <p className={styles.heroSubtitle}>
                  How can we help you today? Search for answers or browse our FAQs below.
                </p>
              </div>
              
              {/* Search Bar */}
              <div className={styles.searchSection}>
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Search for answers..."
                  className={styles.heroSearch}
                />
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className={styles.mainContent}>
            <div className={styles.contentContainer}>
              
              {/* FAQ Section */}
              <div className={styles.faqSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                  <p className={styles.sectionSubtitle}>
                    Find quick answers to the most common questions about our service
                  </p>
                </div>

                {/* Category Tabs */}
                <div className={styles.categoryTabs} role="tablist">
                  {CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category}
                      role="tab"
                      aria-selected={selectedCategory === category}
                      aria-controls="faq-content"
                      className={`${styles.categoryTab} ${selectedCategory === category ? styles.active : ''}`}
                      onClick={() => handleCategoryChange(category)}
                      type="button"
                      data-testid={`category-tab-${category.toLowerCase()}`}
                    >
                      {category}
                      {category !== 'All' && (
                        <span className={styles.categoryCount}>
                          {FAQ_DATA.filter(faq => faq.category === category).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* FAQ Accordion */}
                <div id="faq-content" className={styles.faqContent}>
                  {searchQuery && (
                    <div className={styles.searchResults}>
                      <p className={styles.resultsText}>
                        {filteredFaqs.length === 0 ? (
                          <>No results found for <strong>&ldquo;{searchQuery}&rdquo;</strong></>
                        ) : (
                          <>
                            Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}
                            {searchQuery && <> for <strong>&ldquo;{searchQuery}&rdquo;</strong></>}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  
                  <FaqAccordion
                    faqs={filteredFaqs}
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                  />
                </div>
              </div>

              {/* Contact Section */}
              <div id="contact" className={styles.contactSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Still need help?</h2>
                  <p className={styles.sectionSubtitle}>
                    Our team is here to assist you. Get in touch and we&rsquo;ll respond as soon as possible.
                  </p>
                </div>

                <div className={styles.contactContent}>
                  <div className={styles.contactInfo}>
                    <ContactInfoCard />
                  </div>
                  
                  <div className={styles.contactFormWrapper}>
                    <ContactForm />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default HelpPage;