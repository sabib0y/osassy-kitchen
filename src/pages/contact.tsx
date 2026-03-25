import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout/Layout';
import ContactForm from '@/components/help/ContactForm';
import ContactInfoCard from '@/components/help/ContactInfoCard';
import styles from '@/styles/pages/contact.module.scss';

const ContactPage: NextPage = () => {
  return (
    <Layout pageTitle="Contact Us - Osassy's Kitchen">
      <Head>
        <meta
          name="description"
          content="Get in touch with Osassy's Kitchen. We're here to help with your meal subscription questions, catering enquiries, or feedback."
        />
        <meta
          name="keywords"
          content="contact, support, Nigerian food delivery, meal subscription help, catering enquiries"
        />
      </Head>

      <div className={styles.contactPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1>Contact Us</h1>
            <p className={styles.subtitle}>
              We'd love to hear from you. Get in touch and we'll respond as soon as we can.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className={styles.mainSection}>
          <div className={styles.container}>
            <div className={styles.grid}>
              {/* Contact Information */}
              <div className={styles.infoColumn}>
                <div className={styles.infoCard}>
                  <h2>Get in Touch</h2>
                  <p className={styles.infoIntro}>
                    Whether you have a question about our meal plans, need help with your subscription,
                    or want to discuss catering for your event, we're here to help.
                  </p>

                  <div className={styles.contactDetails}>
                    <div className={styles.contactItem}>
                      <div className={styles.iconWrapper}>
                        <i className="fas fa-envelope" aria-hidden="true"></i>
                      </div>
                      <div className={styles.contactText}>
                        <h3>Email</h3>
                        <a href="mailto:hello@osassyskitchen.com">hello@osassyskitchen.com</a>
                        <span>We respond within 24 hours</span>
                      </div>
                    </div>

                    <div className={styles.contactItem}>
                      <div className={styles.iconWrapper}>
                        <i className="fab fa-whatsapp" aria-hidden="true"></i>
                      </div>
                      <div className={styles.contactText}>
                        <h3>Phone / WhatsApp</h3>
                        <a href="tel:+447123456789">+44 7123 456 789</a>
                        <span>Mon-Fri, 9am-6pm GMT</span>
                      </div>
                    </div>

                    <div className={styles.contactItem}>
                      <div className={styles.iconWrapper}>
                        <i className="fas fa-clock" aria-hidden="true"></i>
                      </div>
                      <div className={styles.contactText}>
                        <h3>Hours</h3>
                        <p>Monday - Friday: 9am - 6pm</p>
                        <p>Saturday: 10am - 4pm</p>
                        <span>Sunday: Closed</span>
                      </div>
                    </div>

                    <div className={styles.contactItem}>
                      <div className={styles.iconWrapper}>
                        <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                      </div>
                      <div className={styles.contactText}>
                        <h3>Location</h3>
                        <p>London, United Kingdom</p>
                        <span>Delivering across London</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className={styles.socialSection}>
                    <h3>Follow Us</h3>
                    <div className={styles.socialLinks}>
                      <a
                        href="https://instagram.com/osassyskitchen"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Follow us on Instagram"
                      >
                        <i className="fab fa-instagram" aria-hidden="true"></i>
                      </a>
                      <a
                        href="https://facebook.com/osassyskitchen"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Follow us on Facebook"
                      >
                        <i className="fab fa-facebook" aria-hidden="true"></i>
                      </a>
                      <a
                        href="https://twitter.com/osassyskitchen"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Follow us on Twitter"
                      >
                        <i className="fab fa-twitter" aria-hidden="true"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className={styles.formColumn}>
                <div className={styles.formCard}>
                  <h2>Send Us a Message</h2>
                  <p className={styles.formIntro}>
                    Fill out the form below and we'll get back to you shortly.
                  </p>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ContactPage;
