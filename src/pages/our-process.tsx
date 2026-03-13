import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';
import styles from '@/styles/pages/howItWorks.module.scss';

// Hero background images for randomisation
const heroBackgrounds = [
  '/images/hero-bg/jollof-chicken.jpg',
  '/images/hero-bg/moi-moi.jpg',
  '/images/hero-bg/poundo-soup.jpg',
];

const HowItWorksPage: React.FC = () => {
  const [bgImage, setBgImage] = useState(heroBackgrounds[0]);

  useEffect(() => {
    // Randomise background image on mount
    const randomIndex = Math.floor(Math.random() * heroBackgrounds.length);
    setBgImage(heroBackgrounds[randomIndex]);
  }, []);

  const steps = [
    {
      number: '1',
      icon: 'fa-utensils',
      title: 'Choose Your Meals',
      description: 'Browse our authentic African menu and select your favourite dishes. From jollof rice to egusi soup, we have something for everyone.',
    },
    {
      number: '2',
      icon: 'fa-calendar-alt',
      title: 'Set Your Schedule',
      description: 'Choose between weekly or monthly deliveries. You can pause, skip, or modify your subscription anytime.',
    },
    {
      number: '3',
      icon: 'fa-credit-card',
      title: 'Secure Payment',
      description: 'Pay securely through our platform. We accept all major cards and process payments safely through Stripe.',
    },
    {
      number: '4',
      icon: 'fa-truck',
      title: 'Fresh Delivery',
      description: 'Receive freshly prepared meals delivered to your door. All meals are made to order ensuring maximum freshness.',
    }
  ];

  const benefits = [
    {
      icon: 'fa-clock',
      title: 'Save Time',
      description: 'No more cooking or grocery shopping. Spend more time doing what you love.'
    },
    {
      icon: 'fa-heart',
      title: 'Healthy & Fresh',
      description: 'All meals are freshly prepared with quality ingredients and no preservatives.'
    },
    {
      icon: 'fa-sync-alt',
      title: 'Flexible Plans',
      description: 'Pause, skip, or cancel anytime. No long-term commitments required.'
    },
    {
      icon: 'fa-shield-alt',
      title: 'Quality Guaranteed',
      description: "We stand behind our food. If you're not satisfied, we'll make it right."
    },
    {
      icon: 'fa-leaf',
      title: 'Dietary Options',
      description: 'Vegetarian, spicy, or mild - customise your meals to your preferences.'
    },
    {
      icon: 'fa-tags',
      title: 'Great Value',
      description: 'Subscription discounts and bulk pricing make eating well affordable.'
    }
  ];

  const faqs = [
    {
      question: 'How do subscriptions work?',
      answer: 'You choose your meals and delivery frequency (weekly or monthly). We prepare and deliver your meals on schedule. You can modify, pause, or cancel anytime.'
    },
    {
      question: 'When are meals delivered?',
      answer: 'We deliver throughout the week. You can choose your preferred delivery day when setting up your subscription. We\'ll notify you the day before delivery.'
    },
    {
      question: 'How fresh are the meals?',
      answer: 'All meals are prepared fresh on the day of delivery. We don\'t use preservatives or freeze our food. Meals typically stay fresh for 3-5 days when refrigerated.'
    },
    {
      question: 'Can I skip a delivery?',
      answer: 'Yes! You can skip any delivery up to 48 hours before your scheduled delivery date. Just log into your account and manage your subscription.'
    },
    {
      question: 'What areas do you deliver to?',
      answer: 'We currently deliver throughout London and surrounding areas. Enter your postcode during signup to check if we deliver to your area.'
    },
    {
      question: 'What if I have allergies?',
      answer: 'Please note any allergies or dietary restrictions in your profile. Our team will ensure your meals are prepared safely according to your needs.'
    }
  ];

  return (
    <Layout pageTitle="How It Works - Osassy's Kitchen">
      <div className={styles.howItWorksPage}>
        {/* Hero Section */}
        <section
          className={styles.hero}
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>How It Works</h1>
            <p className={styles.heroSubtitle}>
              Getting delicious African meals delivered to your door has never been easier
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className={styles.stepsSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Four Simple Steps to Delicious Meals</h2>
              <p>From selection to delivery, we make it easy</p>
            </div>

            <div className={styles.stepsGrid}>
              {steps.map((step, index) => (
                <div key={index} className={styles.stepCard}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIconWrapper}>
                      <i className={`fas ${step.icon}`}></i>
                      <span className={styles.stepNumber}>{step.number}</span>
                    </div>
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className={styles.benefitsSection}>
          <div className={styles.container}>
            <div className={styles.benefitsSectionHeader}>
              <h2>Why Choose Osassy&apos;s Kitchen?</h2>
              <p>Experience the benefits of our meal subscription service</p>
            </div>

            <div className={styles.benefitsGrid}>
              {benefits.map((benefit, index) => (
                <div key={index} className={styles.benefitCard}>
                  <div className={styles.benefitIcon}>
                    <i className={`fas ${benefit.icon}`}></i>
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video/Demo Section */}
        <section className={styles.demoSection}>
          <div className={styles.container}>
            <div className={styles.demoContent}>
              <div className={styles.demoText}>
                <h2>See It In Action</h2>
                <p>Watch how easy it is to set up your meal subscription and start enjoying authentic African cuisine at home.</p>
                <ul className={styles.demoFeatures}>
                  <li>
                    <i className="fas fa-check"></i>
                    <span>No minimum commitment</span>
                  </li>
                  <li>
                    <i className="fas fa-check"></i>
                    <span>Cancel anytime</span>
                  </li>
                  <li>
                    <i className="fas fa-check"></i>
                    <span>Modify meals each week</span>
                  </li>
                  <li>
                    <i className="fas fa-check"></i>
                    <span>Skip deliveries when away</span>
                  </li>
                </ul>
              </div>
              <div className={styles.demoVisual}>
                <div className={styles.demoPlaceholder}>
                  <i className="fas fa-play-circle"></i>
                  <p>Demo Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Frequently Asked Questions</h2>
              <p>Got questions? We&apos;ve got answers</p>
            </div>

            <div className={styles.faqGrid}>
              {faqs.map((faq, index) => (
                <div key={index} className={styles.faqCard}>
                  <h3 className={styles.faqQuestion}>
                    <i className="fas fa-question-circle"></i>
                    {faq.question}
                  </h3>
                  <p className={styles.faqAnswer}>{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className={styles.moreQuestions}>
              <p>Still have questions?</p>
              <Link href="/help" className={styles.contactLink}>
                <i className="fas fa-envelope"></i>
                Contact Support
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of happy customers enjoying authentic African meals</p>
              <div className={styles.ctaButtons}>
                <Link href="/signup" className={styles.primaryBtn}>
                  <i className="fas fa-user-plus"></i>
                  Sign Up Now
                </Link>
                <Link href="/menu" className={styles.secondaryBtn}>
                  <i className="fas fa-book-open"></i>
                  View Menu
                </Link>
              </div>
              <p className={styles.ctaNote}>
                <i className="fas fa-gift"></i>
                Get 10% off your first order when you sign up today!
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HowItWorksPage;
