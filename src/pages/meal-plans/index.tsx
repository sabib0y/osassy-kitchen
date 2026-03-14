/**
 * Meal Plans Landing Page
 * Displays subscription tiers with CTAs to the wizard
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, Check, Clock, Truck, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import PlanCard from '@/components/meal-plans/PlanCard';
import { MealPlan, MEAL_PLANS } from '@/types/meal-plan';
import styles from '@/styles/pages/mealPlans.module.scss';

const MealPlansPage: React.FC = () => {
  const { data: session } = useSession();

  const handlePlanSelect = (plan: MealPlan) => {
    // Redirect logged-in users to dashboard flow, others to standalone wizard
    const targetUrl = session
      ? `/user/subscriptions/create?plan=${plan.id}`
      : `/meal-plans/create?plan=${plan.id}`;
    window.location.href = targetUrl;
  };

  return (
    <>
      <Head>
        <title>Meal Plans - Osassy&apos;s Kitchen</title>
        <meta
          name="description"
          content="Choose your weekly Nigerian meal subscription plan. Fresh, authentic dishes delivered to your door."
        />
      </Head>

      <Layout pageTitle="Meal Plans">
        <div className={styles.mealPlansPage}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Authentic Nigerian Meals,
                <br />
                <span className={styles.highlight}>Delivered Weekly</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Choose your plan and enjoy freshly cooked traditional dishes
                without the hassle of cooking.
              </p>
            </div>
          </section>

          {/* Benefits Bar */}
          <section className={styles.benefitsBar}>
            <div className={styles.benefitItem}>
              <Clock size={24} />
              <span>Fresh Every Week</span>
            </div>
            <div className={styles.benefitItem}>
              <Truck size={24} />
              <span>Free Delivery</span>
            </div>
            <div className={styles.benefitItem}>
              <RefreshCw size={24} />
              <span>Skip or Pause Anytime</span>
            </div>
          </section>

          {/* Plan Cards Section */}
          <section className={styles.plansSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Choose Your Plan</h2>
                <p className={styles.sectionSubtitle}>
                  Select how many meals you would like delivered each week
                </p>
              </div>

              <div className={styles.planCardsGrid}>
                {MEAL_PLANS.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={handlePlanSelect}
                  />
                ))}
              </div>

              <p className={styles.reassurance}>
                <Check size={18} />
                You&apos;ll choose your meals on the next step. Skip or pause your plan anytime.
              </p>
            </div>
          </section>

          {/* How It Works Section */}
          <section className={styles.howItWorks}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>How It Works</h2>

              <div className={styles.stepsGrid}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <h3>Choose Your Plan</h3>
                  <p>Select how many meals you want each week</p>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <h3>Pick Your Meals</h3>
                  <p>Browse our menu and select your favourites</p>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <h3>We Cook & Deliver</h3>
                  <p>Fresh meals arrive at your door each week</p>
                </div>

                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <h3>Heat & Enjoy</h3>
                  <p>Ready in minutes, taste like home</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className={styles.ctaSection}>
            <div className={styles.container}>
              <div className={styles.ctaContent}>
                <h2>Ready to Start?</h2>
                <p>Join hundreds of happy subscribers enjoying authentic Nigerian cuisine.</p>
                <Link href="/meal-plans/create" className={styles.ctaButton}>
                  Start Your Meal Plan
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ Preview */}
          <section className={styles.faqPreview}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>Common Questions</h2>

              <div className={styles.faqGrid}>
                <div className={styles.faqItem}>
                  <h3>Can I change my meals each week?</h3>
                  <p>
                    Yes! You can update your meal selection each week before the
                    cutoff time.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3>What if I need to skip a week?</h3>
                  <p>
                    No problem. You can pause or skip any delivery from your
                    dashboard.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3>Where do you deliver?</h3>
                  <p>
                    We currently deliver across London and surrounding areas.
                    Check your postcode at checkout.
                  </p>
                </div>

                <div className={styles.faqItem}>
                  <h3>How are the meals packaged?</h3>
                  <p>
                    All meals are freshly cooked and packaged in eco-friendly
                    containers to stay fresh.
                  </p>
                </div>
              </div>

              <Link href="/faq" className={styles.viewAllFaq}>
                View All FAQs
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default MealPlansPage;
