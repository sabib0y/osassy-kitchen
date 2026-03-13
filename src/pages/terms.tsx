import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import styles from '../styles/pages/legal.module.scss';

const TermsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Terms of Service - Osassy&apos;s Kitchen</title>
        <meta
          name="description"
          content="Read our Terms of Service to understand the terms and conditions of using Osassy's Kitchen meal subscription service."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://osassyskitchen.com/terms" />
      </Head>

      <Layout pageTitle="Terms of Service - Osassy's Kitchen">
        <div className={styles.legalPage} data-testid="terms-page">
          {/* Hero Section */}
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Terms of Service</h1>
              <p className={styles.heroSubtitle}>
                Last updated: January 2025
              </p>
            </div>
          </section>

          {/* Content Section */}
          <section className={styles.contentSection}>
            <div className={styles.container}>
              <article className={styles.legalContent}>
                <p className={styles.intro}>
                  Welcome to Osassy&apos;s Kitchen. By accessing or using our service, you agree
                  to be bound by these Terms of Service. Please read them carefully.
                </p>

                <section className={styles.section}>
                  <h2>1. Acceptance of Terms</h2>
                  <p>
                    By creating an account, placing an order, or using any part of our service,
                    you acknowledge that you have read, understood, and agree to be bound by
                    these Terms of Service and our Privacy Policy.
                  </p>
                  <p>
                    If you do not agree to these terms, please do not use our service. We
                    reserve the right to update these terms at any time, and your continued
                    use of the service constitutes acceptance of any changes.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2>2. Service Description</h2>
                  <p>
                    Osassy&apos;s Kitchen provides a meal subscription service delivering
                    authentic Nigerian cuisine directly to your door. Our service includes:
                  </p>
                  <ul>
                    <li>Weekly meal subscription plans with flexible options</li>
                    <li>Freshly prepared Nigerian dishes made with quality ingredients</li>
                    <li>Convenient delivery to your specified address</li>
                    <li>Online account management for subscriptions and orders</li>
                  </ul>
                  <p>
                    Service availability may vary by location. We reserve the right to modify,
                    suspend, or discontinue any aspect of the service at any time.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2>3. Subscription Terms</h2>
                  <p>
                    When you subscribe to our meal service, you agree to the following terms:
                  </p>
                  <ul>
                    <li>
                      <strong>Subscription Plans:</strong> You may choose from various
                      subscription plans with different meal frequencies and quantities.
                    </li>
                    <li>
                      <strong>Billing Cycle:</strong> Subscriptions are billed on a weekly
                      or monthly basis, depending on your chosen plan.
                    </li>
                    <li>
                      <strong>Auto-Renewal:</strong> Subscriptions automatically renew unless
                      cancelled before the billing date.
                    </li>
                    <li>
                      <strong>Modifications:</strong> You may modify your meal selections,
                      delivery schedule, or subscription plan through your account dashboard.
                    </li>
                  </ul>
                </section>

                <section className={styles.section}>
                  <h2>4. Payment Terms</h2>
                  <p>
                    All payments are processed securely through our payment provider. By
                    providing payment information, you represent that you are authorised
                    to use the payment method.
                  </p>
                  <ul>
                    <li>Prices are displayed in Nigerian Naira (NGN) or British Pounds (GBP)</li>
                    <li>Payment is due at the time of order or subscription renewal</li>
                    <li>We accept major credit/debit cards and bank transfers</li>
                    <li>Prices may be subject to change with prior notice</li>
                  </ul>
                  <p>
                    You are responsible for ensuring your payment information is accurate
                    and up to date.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2>5. Delivery Policy</h2>
                  <p>
                    We strive to deliver your meals fresh and on time. Our delivery terms
                    include:
                  </p>
                  <ul>
                    <li>
                      <strong>Delivery Windows:</strong> We deliver Monday through Saturday,
                      between 10 AM and 6 PM.
                    </li>
                    <li>
                      <strong>Delivery Areas:</strong> Service is available in select areas.
                      Check your postcode for availability.
                    </li>
                    <li>
                      <strong>Address Accuracy:</strong> You are responsible for providing
                      accurate delivery information.
                    </li>
                    <li>
                      <strong>Failed Deliveries:</strong> If delivery fails due to incorrect
                      information or absence, additional delivery fees may apply.
                    </li>
                  </ul>
                </section>

                <section className={styles.section}>
                  <h2>6. Cancellation Policy</h2>
                  <p>
                    You may cancel your subscription or order under the following conditions:
                  </p>
                  <ul>
                    <li>
                      <strong>Subscription Cancellation:</strong> Cancel anytime through your
                      account dashboard. Cancellation takes effect at the end of your current
                      billing period.
                    </li>
                    <li>
                      <strong>Order Cancellation:</strong> Individual orders may be cancelled
                      up to 48 hours before the scheduled delivery.
                    </li>
                    <li>
                      <strong>Refunds:</strong> Refunds for cancelled orders are processed
                      within 5-10 business days, subject to our refund policy.
                    </li>
                    <li>
                      <strong>Pausing:</strong> You may pause your subscription for up to 4
                      weeks without cancellation.
                    </li>
                  </ul>
                </section>

                <section className={styles.section}>
                  <h2>7. Contact Information</h2>
                  <p>
                    If you have any questions about these Terms of Service, please contact
                    us:
                  </p>
                  <div className={styles.contactInfo}>
                    <p>
                      <strong>Email:</strong>{' '}
                      <a href="mailto:hello@osassyskitchen.com">hello@osassyskitchen.com</a>
                    </p>
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a href="tel:+441onal234567890">+44 (0) 123 456 7890</a>
                    </p>
                    <p>
                      <strong>Help Centre:</strong>{' '}
                      <Link href="/help">Visit our Help Centre</Link>
                    </p>
                  </div>
                </section>

                <div className={styles.footer}>
                  <p>
                    These Terms of Service constitute the entire agreement between you and
                    Osassy&apos;s Kitchen regarding the use of our service.
                  </p>
                  <div className={styles.links}>
                    <Link href="/privacy">Privacy Policy</Link>
                    <span className={styles.divider}>|</span>
                    <Link href="/help">Help Centre</Link>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default TermsPage;
