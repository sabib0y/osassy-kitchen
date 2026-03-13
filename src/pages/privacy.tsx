import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import styles from '../styles/pages/legal.module.scss';

const PrivacyPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - Osassy&apos;s Kitchen</title>
        <meta
          name="description"
          content="Learn how Osassy's Kitchen collects, uses, and protects your personal information in our Privacy Policy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://osassyskitchen.com/privacy" />
      </Head>

      <Layout pageTitle="Privacy Policy - Osassy's Kitchen">
        <div className={styles.legalPage} data-testid="privacy-page">
          {/* Hero Section */}
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Privacy Policy</h1>
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
                  At Osassy&apos;s Kitchen, we are committed to protecting your privacy and
                  ensuring the security of your personal information. This Privacy Policy
                  explains how we collect, use, and safeguard your data.
                </p>

                <section className={styles.section}>
                  <h2>1. Information We Collect</h2>
                  <p>
                    We collect information that you provide directly to us and information
                    that is automatically collected when you use our service:
                  </p>

                  <h3>Personal Information</h3>
                  <ul>
                    <li>
                      <strong>Account Information:</strong> Name, email address, phone number,
                      and password when you create an account.
                    </li>
                    <li>
                      <strong>Delivery Information:</strong> Address, delivery instructions,
                      and preferred delivery times.
                    </li>
                    <li>
                      <strong>Payment Information:</strong> Credit/debit card details and
                      billing address (processed securely by our payment provider).
                    </li>
                    <li>
                      <strong>Dietary Preferences:</strong> Allergies, dietary restrictions,
                      and food preferences you share with us.
                    </li>
                  </ul>

                  <h3>Automatically Collected Information</h3>
                  <ul>
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and location data</li>
                    <li>Usage data and browsing behaviour on our website</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </section>

                <section className={styles.section}>
                  <h2>2. How We Use Your Information</h2>
                  <p>
                    We use your information for the following purposes:
                  </p>
                  <ul>
                    <li>
                      <strong>Service Delivery:</strong> Processing orders, managing
                      subscriptions, and delivering meals to your address.
                    </li>
                    <li>
                      <strong>Account Management:</strong> Creating and managing your account,
                      and providing customer support.
                    </li>
                    <li>
                      <strong>Communication:</strong> Sending order confirmations, delivery
                      updates, and service-related notifications.
                    </li>
                    <li>
                      <strong>Marketing:</strong> With your consent, sending promotional
                      offers, newsletters, and new menu announcements.
                    </li>
                    <li>
                      <strong>Improvement:</strong> Analysing usage patterns to improve our
                      service, menu, and user experience.
                    </li>
                    <li>
                      <strong>Legal Compliance:</strong> Fulfilling legal obligations and
                      protecting our rights.
                    </li>
                  </ul>
                </section>

                <section className={styles.section}>
                  <h2>3. Data Storage and Security</h2>
                  <p>
                    We take the security of your data seriously and implement appropriate
                    measures to protect it:
                  </p>
                  <ul>
                    <li>
                      <strong>Encryption:</strong> All data is encrypted in transit using
                      SSL/TLS technology.
                    </li>
                    <li>
                      <strong>Secure Payment Processing:</strong> Payment information is
                      processed by PCI-compliant payment providers.
                    </li>
                    <li>
                      <strong>Access Controls:</strong> Only authorised personnel have access
                      to personal data, on a need-to-know basis.
                    </li>
                    <li>
                      <strong>Data Retention:</strong> We retain your data only as long as
                      necessary for the purposes outlined in this policy.
                    </li>
                  </ul>
                  <p>
                    While we implement robust security measures, no method of transmission
                    or storage is 100% secure. We cannot guarantee absolute security of
                    your data.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2>4. Third-Party Services</h2>
                  <p>
                    We may share your information with trusted third parties who assist
                    us in operating our service:
                  </p>
                  <ul>
                    <li>
                      <strong>Payment Processors:</strong> Stripe processes your payments
                      securely and is bound by their own privacy policies.
                    </li>
                    <li>
                      <strong>Delivery Partners:</strong> Delivery information is shared
                      with our logistics partners to fulfil orders.
                    </li>
                    <li>
                      <strong>Analytics Providers:</strong> We use analytics tools to
                      understand how our service is used.
                    </li>
                    <li>
                      <strong>Communication Services:</strong> Email and SMS providers
                      help us send notifications and updates.
                    </li>
                  </ul>
                  <p>
                    We require all third parties to respect the security of your data and
                    treat it in accordance with applicable laws.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2>5. Your Rights</h2>
                  <p>
                    Under data protection laws, you have the following rights regarding
                    your personal data:
                  </p>
                  <ul>
                    <li>
                      <strong>Access:</strong> Request a copy of the personal data we hold
                      about you.
                    </li>
                    <li>
                      <strong>Correction:</strong> Request correction of inaccurate or
                      incomplete data.
                    </li>
                    <li>
                      <strong>Deletion:</strong> Request deletion of your personal data
                      (subject to legal retention requirements).
                    </li>
                    <li>
                      <strong>Portability:</strong> Request transfer of your data to another
                      service provider.
                    </li>
                    <li>
                      <strong>Objection:</strong> Object to processing of your data for
                      marketing purposes.
                    </li>
                    <li>
                      <strong>Withdrawal of Consent:</strong> Withdraw consent for processing
                      where consent is the legal basis.
                    </li>
                  </ul>
                  <p>
                    To exercise any of these rights, please contact us using the details
                    below. We will respond to your request within 30 days.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2>6. Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy or how we handle
                    your personal data, please contact us:
                  </p>
                  <div className={styles.contactInfo}>
                    <p>
                      <strong>Data Protection Enquiries:</strong>{' '}
                      <a href="mailto:privacy@osassyskitchen.com">privacy@osassyskitchen.com</a>
                    </p>
                    <p>
                      <strong>General Enquiries:</strong>{' '}
                      <a href="mailto:hello@osassyskitchen.com">hello@osassyskitchen.com</a>
                    </p>
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a href="tel:+441234567890">+44 (0) 123 456 7890</a>
                    </p>
                    <p>
                      <strong>Help Centre:</strong>{' '}
                      <Link href="/help">Visit our Help Centre</Link>
                    </p>
                  </div>
                </section>

                <div className={styles.footer}>
                  <p>
                    This Privacy Policy may be updated from time to time. We will notify
                    you of any significant changes by email or through our website.
                  </p>
                  <div className={styles.links}>
                    <Link href="/terms">Terms of Service</Link>
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

export default PrivacyPage;
