import Link from 'next/link';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import styles from '../styles/components/auth/unauthorized.module.scss';

const UnauthorizedPage: NextPage = () => {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Access Restricted - Osassy&apos;s Kitchen</title>
        <meta 
          name="description" 
          content="You do not have permission to access this page. Please log in or contact us for assistance." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Layout pageTitle="Access Restricted - Osassy's Kitchen">
        <div className={styles.unauthorizedPage}>
          <div className={styles.unauthorizedContainer}>
            {/* Illustration Section */}
            <div className={styles.illustrationSection}>
              <div className={styles.iconContainer}>
                <i className={`fas fa-utensils ${styles.mainIcon}`} aria-hidden="true"></i>
                <i className={`fas fa-lock ${styles.floatingElement}`} aria-hidden="true"></i>
                <i className={`fas fa-exclamation-triangle ${styles.floatingElement}`} aria-hidden="true"></i>
                <i className={`fas fa-shield-alt ${styles.floatingElement}`} aria-hidden="true"></i>
              </div>
            </div>

            {/* Content Section */}
            <div className={styles.contentSection}>
              <h1 className={styles.statusCode} aria-label="Error 4 0 1">401</h1>
              <h2 className={styles.title}>Kitchen Access Restricted</h2>
              <p className={styles.subtitle}>Sorry, you don&apos;t have permission to enter this area</p>
              <p className={styles.description}>
                This section of Osassy&apos;s Kitchen requires special access. 
                Please sign in with the appropriate credentials or contact our team for assistance.
              </p>
            </div>

            {/* Actions Section */}
            <div className={styles.actionsSection}>
              <div className={styles.buttonGroup}>
                <Link href="/login" className={styles.primaryButton}>
                  <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                  Sign In
                </Link>
                <button 
                  onClick={handleGoBack}
                  className={styles.secondaryButton}
                  type="button"
                >
                  <i className="fas fa-arrow-left" aria-hidden="true"></i>
                  Go Back
                </button>
              </div>
              
              <p className={styles.helpText}>
                Need help? <Link href="/contact">Contact our support team</Link> or 
                return to our <Link href="/">homepage</Link>.
              </p>
            </div>

            {/* Suggestions Section */}
            <div className={styles.suggestionsSection}>
              <h3 className={styles.suggestionsTitle}>
                <i className="fas fa-compass" aria-hidden="true"></i>
                Explore Our Kitchen
              </h3>
              <ul className={styles.suggestionsList}>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-home" aria-hidden="true"></i>
                  <Link href="/">Homepage</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-utensils" aria-hidden="true"></i>
                  <Link href="/menu">Our Menu</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-sync-alt" aria-hidden="true"></i>
                  <Link href="/subscriptions">Meal Plans</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-info-circle" aria-hidden="true"></i>
                  <Link href="/about">About Us</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-phone" aria-hidden="true"></i>
                  <Link href="/contact">Contact</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-question-circle" aria-hidden="true"></i>
                  <Link href="/faq">Support</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default UnauthorizedPage;
