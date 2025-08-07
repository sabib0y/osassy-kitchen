import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { 
  XCircle, 
  ArrowLeft, 
  ShoppingCart, 
  RefreshCw, 
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  Home,
  CreditCard,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import styles from '@/styles/pages/cancel.module.css';

const CancelPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cartSaved, setCartSaved] = useState(false);

  useEffect(() => {
    // Try to save cart data to localStorage so user doesn't lose their selection
    try {
      const currentCart = localStorage.getItem('subscription_cart');
      if (currentCart) {
        localStorage.setItem('subscription_cart_backup', currentCart);
        setCartSaved(true);
      }
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  const handleRetryPayment = () => {
    // Restore cart from backup if available
    try {
      const backupCart = localStorage.getItem('subscription_cart_backup');
      if (backupCart) {
        localStorage.setItem('subscription_cart', backupCart);
      }
    } catch (error) {
      console.error('Failed to restore cart:', error);
    }
    
    // Go back to subscription creation page
    router.push('/subscriptions/create');
  };

  const handleContactSupport = () => {
    // Open email client with pre-filled support request
    window.location.href = 'mailto:support@osassykitchen.com?subject=Payment%20Issue&body=I%20encountered%20an%20issue%20during%20checkout.%20Please%20help.';
  };

  if (status === 'loading') {
    return (
      <Layout pageTitle="Loading - Osassy Kitchen">
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout pageTitle="Payment Cancelled - Osassy Kitchen">
      <Head>
        <title>Payment Cancelled - Osassy Kitchen</title>
        <meta name="description" content="Your payment was cancelled. You can try again anytime." />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Cancel Header */}
          <div className={styles.cancelHeader}>
            <div className={styles.iconWrapper}>
              <XCircle className={styles.cancelIcon} />
            </div>
            <h1 className={styles.title}>Payment Cancelled</h1>
            <p className={styles.subtitle}>
              Your payment was not processed and no charges were made
            </p>
          </div>

          {/* Info Box */}
          <div className={styles.infoBox}>
            <AlertTriangle className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <h3>Don&apos;t worry!</h3>
              <p>
                Your selected dishes have been saved. You can complete your subscription 
                anytime by clicking the button below.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button 
              onClick={handleRetryPayment}
              className={styles.primaryButton}
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>
            
            <Link href="/user/dashboard" className={styles.secondaryButton}>
              <Home className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </Link>
            
            <Link href="/subscriptions/create" className={styles.secondaryButton}>
              <ShoppingCart className="w-5 h-5" />
              <span>Start Fresh</span>
            </Link>
          </div>

          {/* Common Reasons Section */}
          <div className={styles.reasonsSection}>
            <h2 className={styles.sectionTitle}>Common Reasons for Cancellation</h2>
            <div className={styles.reasonsGrid}>
              <div className={styles.reasonCard}>
                <CreditCard className={styles.reasonIcon} />
                <h3>Payment Method</h3>
                <p>Incorrect card details or insufficient funds</p>
              </div>
              <div className={styles.reasonCard}>
                <ShieldAlert className={styles.reasonIcon} />
                <h3>Security Check</h3>
                <p>Bank declined for security reasons</p>
              </div>
              <div className={styles.reasonCard}>
                <AlertTriangle className={styles.reasonIcon} />
                <h3>Changed Mind</h3>
                <p>Decided to review order before completing</p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className={styles.tipsSection}>
            <h2 className={styles.sectionTitle}>Having Trouble?</h2>
            <div className={styles.tipsList}>
              <div className={styles.tip}>
                <span className={styles.tipNumber}>1</span>
                <div className={styles.tipContent}>
                  <h4>Check Your Card Details</h4>
                  <p>Ensure your card number, expiry date, and CVV are correct</p>
                </div>
              </div>
              <div className={styles.tip}>
                <span className={styles.tipNumber}>2</span>
                <div className={styles.tipContent}>
                  <h4>Contact Your Bank</h4>
                  <p>Your bank may have blocked the transaction for security</p>
                </div>
              </div>
              <div className={styles.tip}>
                <span className={styles.tipNumber}>3</span>
                <div className={styles.tipContent}>
                  <h4>Try a Different Card</h4>
                  <p>If available, try using an alternative payment method</p>
                </div>
              </div>
              <div className={styles.tip}>
                <span className={styles.tipNumber}>4</span>
                <div className={styles.tipContent}>
                  <h4>Clear Browser Data</h4>
                  <p>Sometimes clearing cookies and cache can help</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className={styles.supportSection}>
            <h2 className={styles.sectionTitle}>Need Help?</h2>
            <p className={styles.supportText}>
              Our support team is here to assist you with any payment issues
            </p>
            <div className={styles.contactOptions}>
              <button 
                onClick={handleContactSupport}
                className={styles.contactButton}
              >
                <Mail className="w-5 h-5" />
                <span>Email Support</span>
              </button>
              <a href="tel:+2348012345678" className={styles.contactButton}>
                <Phone className="w-5 h-5" />
                <span>Call Us</span>
              </a>
              <Link href="/support/chat" className={styles.contactButton}>
                <MessageCircle className="w-5 h-5" />
                <span>Live Chat</span>
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className={styles.faqSection}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqList}>
              <details className={styles.faqItem}>
                <summary className={styles.faqQuestion}>
                  <HelpCircle className="w-5 h-5" />
                  Will I be charged for the cancelled transaction?
                </summary>
                <p className={styles.faqAnswer}>
                  No, you will not be charged. The payment was cancelled before processing, 
                  so no money has been taken from your account.
                </p>
              </details>
              <details className={styles.faqItem}>
                <summary className={styles.faqQuestion}>
                  <HelpCircle className="w-5 h-5" />
                  Are my selected dishes saved?
                </summary>
                <p className={styles.faqAnswer}>
                  Yes! We&apos;ve saved your selection. When you click &quot;Try Again&quot;, 
                  your previously selected dishes will still be in your cart.
                </p>
              </details>
              <details className={styles.faqItem}>
                <summary className={styles.faqQuestion}>
                  <HelpCircle className="w-5 h-5" />
                  Is my payment information secure?
                </summary>
                <p className={styles.faqAnswer}>
                  Absolutely. We use Stripe for payment processing, which is PCI-compliant 
                  and uses industry-standard encryption to protect your information.
                </p>
              </details>
              <details className={styles.faqItem}>
                <summary className={styles.faqQuestion}>
                  <HelpCircle className="w-5 h-5" />
                  Can I pay with a different method?
                </summary>
                <p className={styles.faqAnswer}>
                  Currently, we accept all major credit and debit cards through Stripe. 
                  We&apos;re working on adding more payment options soon.
                </p>
              </details>
            </div>
          </div>

          {/* Footer Message */}
          <div className={styles.footerMessage}>
            <p>
              Ready to enjoy delicious Nigerian meals delivered to your door?
            </p>
            <button 
              onClick={handleRetryPayment}
              className={styles.footerCTA}
            >
              Complete Your Subscription
              <ArrowLeft className="w-5 h-5 rotate-180 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CancelPage;