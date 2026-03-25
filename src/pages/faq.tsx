import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import styles from '@/styles/pages/faq.module.scss';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Subscriptions' | 'Delivery' | 'Payments' | 'Food';
}

type CategoryType = 'All' | 'Subscriptions' | 'Delivery' | 'Payments' | 'Food';

const faqData: FAQItem[] = [
  // Subscriptions
  {
    id: 'sub-1',
    question: 'How do meal plan subscriptions work?',
    answer: 'Our meal plan subscriptions deliver freshly cooked Nigerian meals to your door weekly. You choose a plan (2, 3, or 5 meals per week), select your preferred dishes from our rotating menu, and we deliver them on your chosen day. Your subscription renews automatically each week, and you can modify, skip, or cancel anytime.',
    category: 'Subscriptions',
  },
  {
    id: 'sub-2',
    question: 'Can I change my meals each week?',
    answer: 'Absolutely! You can customise your meal selections every week. Log into your account before the weekly cutoff (typically Wednesday at 11:59 PM) to choose different dishes from our menu. We update our offerings regularly to provide variety.',
    category: 'Subscriptions',
  },
  {
    id: 'sub-3',
    question: 'How do I skip or pause my subscription?',
    answer: 'You can skip any week or pause your subscription from your account dashboard. Simply go to "Manage Subscription" and select "Skip Next Delivery" or "Pause Subscription". You must do this before the weekly cutoff to avoid being charged for that week.',
    category: 'Subscriptions',
  },
  {
    id: 'sub-4',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no penalties or fees. We have no minimum commitment period. Cancel from your account dashboard, and your subscription will end after your current billing cycle completes.',
    category: 'Subscriptions',
  },
  {
    id: 'sub-5',
    question: 'What happens if I want to change my plan?',
    answer: 'You can upgrade or downgrade your meal plan anytime from your account settings. Changes take effect from the following week. If you upgrade mid-week, the price difference will be prorated on your next bill.',
    category: 'Subscriptions',
  },
  // Delivery
  {
    id: 'del-1',
    question: 'Where do you deliver?',
    answer: 'We currently deliver to major cities across Lagos, Abuja, and Port Harcourt. Enter your postcode during checkout to confirm if we deliver to your area. We\'re constantly expanding our delivery zones, so check back if we don\'t currently serve your location.',
    category: 'Delivery',
  },
  {
    id: 'del-2',
    question: 'What days do you deliver?',
    answer: 'You can choose your preferred delivery day during sign-up. We offer deliveries Monday through Saturday between 10 AM and 8 PM. You\'ll receive a notification with a 2-hour delivery window on your delivery day.',
    category: 'Delivery',
  },
  {
    id: 'del-3',
    question: 'How are the meals packaged?',
    answer: 'Each meal is packaged in BPA-free, microwave-safe containers with secure lids. Hot meals are insulated to maintain temperature, and cold items come with ice packs. All packaging is recyclable or compostable to minimise environmental impact.',
    category: 'Delivery',
  },
  {
    id: 'del-4',
    question: 'How long do the meals stay fresh?',
    answer: 'Our meals are prepared fresh daily. Refrigerated meals stay fresh for up to 5 days when stored properly at 4°C or below. Each meal is labelled with a "best before" date. For optimal taste and quality, we recommend consuming within 3 days.',
    category: 'Delivery',
  },
  {
    id: 'del-5',
    question: 'What if I\'m not home for delivery?',
    answer: 'You can leave delivery instructions for our drivers, such as leaving meals with a neighbour or in a safe location. If you won\'t be available, you can reschedule your delivery up to 24 hours in advance or arrange collection from our pickup point.',
    category: 'Delivery',
  },
  // Payments
  {
    id: 'pay-1',
    question: 'When am I charged?',
    answer: 'Your payment is processed weekly after you confirm your meal selections. For subscriptions, you\'re charged on the same day each week (typically when you first subscribed). You\'ll receive an email receipt immediately after each payment.',
    category: 'Payments',
  },
  {
    id: 'pay-2',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, Verve), bank transfers, and digital payment platforms including Paystack and Flutterwave. Your payment information is securely encrypted and never stored on our servers.',
    category: 'Payments',
  },
  {
    id: 'pay-3',
    question: 'Is there a minimum commitment?',
    answer: 'No minimum commitment required! Unlike other services, we don\'t lock you into long contracts. You can cancel, pause, or modify your subscription anytime without penalties. We believe in earning your business every week through quality and service.',
    category: 'Payments',
  },
  {
    id: 'pay-4',
    question: 'How do refunds work?',
    answer: 'If you\'re unsatisfied with a meal, contact us within 24 hours of delivery and we\'ll issue a full refund or credit to your account. For cancelled subscriptions, any unused prepaid weeks will be refunded within 5-7 business days to your original payment method.',
    category: 'Payments',
  },
  // Food
  {
    id: 'food-1',
    question: 'Are the meals freshly cooked?',
    answer: 'Yes! All our meals are cooked fresh daily by experienced Nigerian chefs in our certified kitchen. We don\'t use preservatives or freeze our meals. Each dish is prepared on the morning of delivery using fresh, quality ingredients to ensure authentic taste and nutrition.',
    category: 'Food',
  },
  {
    id: 'food-2',
    question: 'Do you cater to dietary requirements?',
    answer: 'We offer vegetarian options and can accommodate some dietary restrictions. When selecting meals, you\'ll see filters for vegetarian, spicy, and allergen information. For specific allergies or requirements, please contact us before ordering so we can advise on suitable options.',
    category: 'Food',
  },
  {
    id: 'food-3',
    question: 'How do I reheat the meals?',
    answer: 'Microwave: Remove lid, heat on high for 2-3 minutes, stirring halfway through. Stovetop: Transfer to a pot, heat on medium, stirring occasionally until hot throughout. Oven: Preheat to 180°C, cover with foil, heat for 15-20 minutes. Always ensure food is piping hot before eating.',
    category: 'Food',
  },
  {
    id: 'food-4',
    question: 'What portion sizes do you offer?',
    answer: 'All our meals are generously portioned to satisfy an adult appetite (approximately 450-550g per meal). Each dish is nutritionally balanced with proper portions of protein, carbohydrates, and vegetables. If you have specific portion requirements, we can discuss custom options.',
    category: 'Food',
  },
  {
    id: 'food-5',
    question: 'Are ingredients sourced locally?',
    answer: 'We prioritise locally sourced Nigerian ingredients whenever possible to support local farmers and ensure freshness. Staples like rice, yams, plantains, and vegetables come from trusted local suppliers. Some specialty items are imported to maintain authentic flavours in our traditional recipes.',
    category: 'Food',
  },
];

const FAQPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const categories: CategoryType[] = ['All', 'Subscriptions', 'Delivery', 'Payments', 'Food'];

  const filteredFAQs = selectedCategory === 'All'
    ? faqData
    : faqData.filter((faq) => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isOpen = (id: string) => openItems.has(id);

  return (
    <Layout pageTitle="FAQ - Osassy's Kitchen">
      <Head>
        <meta name="description" content="Find answers to frequently asked questions about Osassy's Kitchen meal subscriptions, delivery, payments, and our Nigerian cuisine." />
        <meta name="keywords" content="FAQ, Nigerian food delivery, meal subscription help, delivery information, payment options" />
      </Head>

      <div className={styles.faqPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1>Frequently Asked Questions</h1>
            <p className={styles.subtitle}>
              Find answers to common questions about our meal subscription service
            </p>
          </div>
        </section>

        {/* Category Tabs */}
        <section className={styles.categorySection}>
          <div className={styles.container}>
            <div className={styles.categoryTabs}>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`${styles.categoryTab} ${
                    selectedCategory === category ? styles.active : ''
                  }`}
                  aria-expanded={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ List */}
        <section className={styles.faqSection}>
          <div className={styles.container}>
            <div className={styles.faqList}>
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className={styles.faqItem}>
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className={styles.faqQuestion}
                    aria-expanded={isOpen(faq.id)}
                    aria-label="Question"
                  >
                    <span className={styles.questionText}>{faq.question}</span>
                    <span className={styles.icon} aria-hidden="true">
                      {isOpen(faq.id) ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </span>
                  </button>
                  <div
                    className={`${styles.faqAnswer} ${
                      isOpen(faq.id) ? styles.open : ''
                    }`}
                  >
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <div className={styles.noResults}>
                <p>No FAQs found for this category.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>Ready to Get Started?</h2>
              <p>Explore our meal plans and start enjoying authentic Nigerian cuisine delivered to your door.</p>
              <Link href="/our-process" className={styles.ctaButton}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default FAQPage;
