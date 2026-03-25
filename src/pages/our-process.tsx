/**
 * Our Process Page
 * Shows the behind-the-scenes journey from kitchen to table + plan selection
 */

import React from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import {
  ChefHat,
  ShoppingBasket,
  Package,
  Truck,
  Calendar,
  CheckCircle,
  Leaf,
  Clock,
  Thermometer
} from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import PlanCard from '@/components/meal-plans/PlanCard';
import { MealPlan, MEAL_PLANS } from '@/types/meal-plan';
import styles from '@/styles/pages/mealPlans.module.scss';

const OurProcessPage: React.FC = () => {
  const { data: session } = useSession();

  const handlePlanSelect = (plan: MealPlan) => {
    const targetUrl = session
      ? `/user/subscriptions/create?plan=${plan.id}`
      : `/our-process/create?plan=${plan.id}`;
    window.location.href = targetUrl;
  };

  return (
    <>
      <Head>
        <title>Our Process - From Our Kitchen to Your Table | Osassy&apos;s Kitchen</title>
        <meta
          name="description"
          content="Discover how we prepare and deliver authentic Nigerian meals with care, quality, and tradition."
        />
      </Head>

      <Layout pageTitle="Our Process">
        <div className={styles.mealPlansPage}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                From Our Kitchen
                <br />
                <span className={styles.highlight}>to Your Table</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Every meal is prepared with care, using traditional methods and the finest ingredients.
                Here&apos;s how we bring authentic Nigerian cuisine to your door.
              </p>
            </div>
          </section>

          {/* How We Prepare */}
          <section className={styles.processSection}>
            <div className={styles.container}>
              <div className={styles.processHeader}>
                <ChefHat className={styles.sectionIcon} size={40} />
                <h2 className={styles.sectionTitle}>How We Prepare</h2>
              </div>
              <div className={styles.processContent}>
                <p className={styles.leadText}>
                  Our kitchen is the heart of everything we do. Led by experienced chefs who grew up
                  cooking these dishes, we use traditional techniques passed down through generations.
                </p>
                <div className={styles.featureGrid}>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Small Batch Cooking</h3>
                      <p>We cook in small batches to ensure freshness and quality in every portion</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Traditional Methods</h3>
                      <p>Authentic cooking techniques that bring out the true flavours of Nigerian cuisine</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Made Fresh Daily</h3>
                      <p>Meals are cooked on the morning of delivery, never frozen or reheated</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>No Preservatives</h3>
                      <p>Just real food, real ingredients, and real care in every dish</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ingredient Sourcing */}
          <section className={styles.processSection + ' ' + styles.altBackground}>
            <div className={styles.container}>
              <div className={styles.processHeader}>
                <ShoppingBasket className={styles.sectionIcon} size={40} />
                <h2 className={styles.sectionTitle}>Ingredient Sourcing</h2>
              </div>
              <div className={styles.processContent}>
                <p className={styles.leadText}>
                  Quality starts with ingredients. We source fresh, authentic ingredients to ensure
                  every meal tastes just like home.
                </p>
                <div className={styles.featureGrid}>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Fresh & Quality</h3>
                      <p>Fresh vegetables, quality proteins, and the best ingredients we can find</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Authentic Spices</h3>
                      <p>Genuine Nigerian spices and seasonings imported directly from trusted suppliers</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Local Partners</h3>
                      <p>We work with local suppliers for fresh produce whenever possible</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Speciality Imports</h3>
                      <p>Hard-to-find ingredients imported to ensure authenticity in every bite</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Packaging & Freshness */}
          <section className={styles.processSection}>
            <div className={styles.container}>
              <div className={styles.processHeader}>
                <Package className={styles.sectionIcon} size={40} />
                <h2 className={styles.sectionTitle}>Packaging & Freshness</h2>
              </div>
              <div className={styles.processContent}>
                <p className={styles.leadText}>
                  After cooking, every meal is carefully packaged to lock in freshness and flavour
                  whilst being kind to the environment.
                </p>
                <div className={styles.featureGrid}>
                  <div className={styles.feature}>
                    <Leaf size={24} />
                    <div>
                      <h3>Eco-Friendly Containers</h3>
                      <p>Recyclable, microwave-safe containers that keep meals fresh</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <Thermometer size={24} />
                    <div>
                      <h3>Temperature Controlled</h3>
                      <p>Insulated delivery bags maintain optimal temperature during transit</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <Clock size={24} />
                    <div>
                      <h3>Fridge for 5 Days</h3>
                      <p>Meals stay fresh in your fridge for up to 5 days after delivery</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <Package size={24} />
                    <div>
                      <h3>Sealed & Secure</h3>
                      <p>Each meal is individually sealed to preserve quality and prevent spills</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Logistics */}
          <section className={styles.processSection + ' ' + styles.altBackground}>
            <div className={styles.container}>
              <div className={styles.processHeader}>
                <Truck className={styles.sectionIcon} size={40} />
                <h2 className={styles.sectionTitle}>Delivery Logistics</h2>
              </div>
              <div className={styles.processContent}>
                <p className={styles.leadText}>
                  We deliver twice a week to ensure you always have fresh meals ready.
                  Here&apos;s what to expect when your order arrives.
                </p>
                <div className={styles.deliveryInfo}>
                  <div className={styles.infoCard}>
                    <h3>Delivery Days</h3>
                    <p>Tuesday and Saturday</p>
                  </div>
                  <div className={styles.infoCard}>
                    <h3>Delivery Window</h3>
                    <p>Between 9am and 6pm</p>
                  </div>
                  <div className={styles.infoCard}>
                    <h3>Cooked Fresh</h3>
                    <p>On the morning of delivery</p>
                  </div>
                  <div className={styles.infoCard}>
                    <h3>Tracking</h3>
                    <p>SMS and email notifications</p>
                  </div>
                </div>
                <div className={styles.deliveryNote}>
                  <CheckCircle size={20} />
                  <p>
                    <strong>Not home?</strong> We can leave your order in a safe place or with a neighbour.
                    Just add delivery instructions when you place your order.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Flexibility & Control */}
          <section className={styles.processSection}>
            <div className={styles.container}>
              <div className={styles.processHeader}>
                <Calendar className={styles.sectionIcon} size={40} />
                <h2 className={styles.sectionTitle}>Flexibility & Control</h2>
              </div>
              <div className={styles.processContent}>
                <p className={styles.leadText}>
                  Life is unpredictable. That&apos;s why we give you complete control over your subscription
                  with no commitments or penalties.
                </p>
                <div className={styles.featureGrid}>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Change Meals Weekly</h3>
                      <p>Update your meal selection every week before the cutoff</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Skip or Pause Anytime</h3>
                      <p>Going on holiday? Skip a delivery or pause your subscription</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>No Minimum Commitment</h3>
                      <p>Subscribe week by week with no long-term contract</p>
                    </div>
                  </div>
                  <div className={styles.feature}>
                    <CheckCircle size={24} />
                    <div>
                      <h3>Cancel Whenever</h3>
                      <p>Cancel your subscription at any time, no questions asked</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Plan Selection */}
          <section className={styles.plansSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Choose Your Plan</h2>
                <p className={styles.sectionSubtitle}>
                  Select how many meals you&apos;d like delivered each week
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
                <CheckCircle size={18} />
                You&apos;ll choose your specific meals on the next step. Skip or pause your plan anytime.
              </p>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default OurProcessPage;
