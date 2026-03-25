import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Calendar, Utensils, Truck, ChefHat, Heart, Clock, Phone } from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import styles from '@/styles/pages/catering.module.scss';

interface ServiceItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  servingSize: string;
}

interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

const services: ServiceItem[] = [
  {
    id: 'corporate',
    icon: <Users size={32} />,
    title: 'Corporate Events',
    description: 'From board meetings to conferences, we provide professional catering that impresses. Perfect for office lunches, seminars, and corporate celebrations.',
  },
  {
    id: 'weddings',
    icon: <Heart size={32} />,
    title: 'Weddings & Celebrations',
    description: 'Make your special day unforgettable with our authentic Nigerian wedding catering. Traditional ceremonies, engagement parties, and anniversary celebrations.',
  },
  {
    id: 'parties',
    icon: <Calendar size={32} />,
    title: 'Private Parties',
    description: 'Birthday parties, family reunions, and house gatherings. We bring the restaurant experience to your home with fresh, delicious Nigerian cuisine.',
  },
  {
    id: 'bulk',
    icon: <Truck size={32} />,
    title: 'Bulk Orders',
    description: 'Need food for a large group? We offer bulk meal orders with flexible delivery options. Ideal for community events, religious gatherings, and charity functions.',
  },
];

const menuHighlights: MenuItem[] = [
  {
    id: 'jollof',
    name: 'Jollof Rice',
    description: 'Our signature party jollof, smoky and flavourful',
    servingSize: 'Serves 20-50 guests',
  },
  {
    id: 'egusi',
    name: 'Egusi Soup',
    description: 'Rich melon seed soup with assorted meats',
    servingSize: 'Serves 15-40 guests',
  },
  {
    id: 'suya',
    name: 'Suya',
    description: 'Spiced grilled beef skewers, a crowd favourite',
    servingSize: 'Serves 25-60 guests',
  },
  {
    id: 'puffpuff',
    name: 'Puff Puff',
    description: 'Sweet fried dough balls, perfect for dessert',
    servingSize: 'Serves 30-70 guests',
  },
];

const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: 'Enquiry',
    description: 'Tell us about your event — date, location, number of guests, and any dietary requirements.',
  },
  {
    step: 2,
    title: 'Consultation',
    description: "We'll work with you to create a custom menu that suits your taste and budget.",
  },
  {
    step: 3,
    title: 'Confirmation',
    description: 'Confirm your menu, finalise the details, and secure your booking with a deposit.',
  },
  {
    step: 4,
    title: 'Delivery',
    description: "We deliver everything fresh on the day of your event, ready to serve and enjoy.",
  },
];

const CateringPage: React.FC = () => {
  return (
    <Layout pageTitle="Catering - Osassy's Kitchen">
      <Head>
        <meta
          name="description"
          content="Professional Nigerian catering services for weddings, corporate events, parties, and bulk orders. Authentic cuisine prepared fresh by experienced chefs."
        />
        <meta
          name="keywords"
          content="Nigerian catering, event catering, wedding catering, corporate catering, bulk food orders, party catering, Lagos catering"
        />
      </Head>

      <div className={styles.cateringPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1>Catering Services</h1>
            <p className={styles.subtitle}>
              Bring authentic Nigerian cuisine to your next event. From intimate gatherings to grand celebrations, we deliver unforgettable flavours.
            </p>
            <Link href="/contact" className={styles.heroButton}>
              Get a Quote
            </Link>
          </div>
        </section>

        {/* Services Section */}
        <section className={styles.servicesSection}>
          <div className={styles.container}>
            <h2>Our Catering Services</h2>
            <p className={styles.sectionSubtitle}>
              Whatever the occasion, we have the perfect catering solution for you
            </p>
            <div className={styles.servicesGrid}>
              {services.map((service) => (
                <div key={service.id} className={styles.serviceCard}>
                  <div className={styles.serviceIcon}>{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className={styles.whyUsSection}>
          <div className={styles.container}>
            <h2>Why Choose Osassy&apos;s Catering?</h2>
            <div className={styles.whyUsGrid}>
              <div className={styles.whyUsItem}>
                <ChefHat size={28} />
                <div>
                  <h4>Authentic Recipes</h4>
                  <p>Traditional Nigerian dishes made with time-honoured recipes and premium ingredients.</p>
                </div>
              </div>
              <div className={styles.whyUsItem}>
                <Users size={28} />
                <div>
                  <h4>Experienced Chefs</h4>
                  <p>Our skilled chefs have decades of combined experience in Nigerian cuisine.</p>
                </div>
              </div>
              <div className={styles.whyUsItem}>
                <Utensils size={28} />
                <div>
                  <h4>Flexible Menus</h4>
                  <p>Customise your menu to match your event theme, dietary needs, and preferences.</p>
                </div>
              </div>
              <div className={styles.whyUsItem}>
                <Clock size={28} />
                <div>
                  <h4>Professional Service</h4>
                  <p>Punctual delivery, proper presentation, and attention to every detail.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Highlights Section */}
        <section className={styles.menuSection}>
          <div className={styles.container}>
            <h2>Popular Catering Dishes</h2>
            <p className={styles.sectionSubtitle}>
              A taste of what we offer — full menus available on request
            </p>
            <div className={styles.menuGrid}>
              {menuHighlights.map((item) => (
                <div key={item.id} className={styles.menuCard}>
                  <h3>{item.name}</h3>
                  <p className={styles.menuDescription}>{item.description}</p>
                  <span className={styles.servingSize}>{item.servingSize}</span>
                </div>
              ))}
            </div>
            <div className={styles.menuCta}>
              <p>Want to see our full catering menu?</p>
              <Link href="/contact" className={styles.menuButton}>
                Request Full Menu
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className={styles.processSection}>
          <div className={styles.container}>
            <h2>How It Works</h2>
            <div className={styles.processSteps}>
              {processSteps.map((step) => (
                <div key={step.step} className={styles.processStep}>
                  <div className={styles.stepNumber}>{step.step}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={styles.pricingSection}>
          <div className={styles.container}>
            <h2>Pricing</h2>
            <div className={styles.pricingContent}>
              <div className={styles.pricingInfo}>
                <p>
                  Our catering prices depend on the menu selection, number of guests, and event requirements.
                  We work with you to create a package that fits your budget.
                </p>
                <ul className={styles.pricingList}>
                  <li>
                    <strong>Minimum order:</strong> 20 guests
                  </li>
                  <li>
                    <strong>Starting from:</strong> ₦5,000 per person
                  </li>
                  <li>
                    <strong>Custom quote:</strong> Available for all events
                  </li>
                </ul>
              </div>
              <div className={styles.pricingNote}>
                <p>
                  Prices include food preparation, packaging, and delivery within Lagos.
                  Additional services such as serving staff and equipment hire are available upon request.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <h2>Ready to Plan Your Event?</h2>
              <p>
                Let us help make your event memorable with delicious Nigerian cuisine.
                Get in touch today for a free consultation and custom quote.
              </p>
              <div className={styles.ctaActions}>
                <Link href="/contact" className={styles.ctaButton}>
                  Request a Quote
                </Link>
                <div className={styles.ctaPhone}>
                  <Phone size={20} />
                  <span>Call us: +234 800 123 4567</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CateringPage;
