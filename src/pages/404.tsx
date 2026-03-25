import Link from 'next/link';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import styles from '../styles/components/auth/404.module.scss';

const Custom404Page: NextPage = () => {
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
        <title>Page Not Found - Osassy&apos;s Kitchen</title>
        <meta 
          name="description" 
          content="The page you're looking for doesn't exist. Let's get you back to our delicious offerings." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Layout pageTitle="Page Not Found - Osassy's Kitchen">
        <div className={styles.notFoundPage}>
          <div className={styles.notFoundContainer}>
            {/* Illustration Section */}
            <div className={styles.illustrationSection}>
              <div className={styles.iconContainer}>
                <i className={`fas fa-pizza-slice ${styles.mainIcon}`} aria-hidden="true"></i>
                <i className={`fas fa-question ${styles.floatingElement}`} aria-hidden="true"></i>
                <i className={`fas fa-map-marked-alt ${styles.floatingElement}`} aria-hidden="true"></i>
                <i className={`fas fa-compass ${styles.floatingElement}`} aria-hidden="true"></i>
              </div>
            </div>

            {/* Content Section */}
            <div className={styles.contentSection}>
              <h1 className={styles.statusCode} aria-label="Error 4 0 4">404</h1>
              <h2 className={styles.title}>Oops! Lost in the Kitchen</h2>
              <p className={styles.subtitle}>We can&apos;t find the page you&apos;re looking for</p>
              <p className={styles.description}>
                It seems you&apos;ve wandered into an empty pantry! The page you&apos;re looking for 
                might have been moved, deleted, or perhaps it never existed. Let&apos;s get you back 
                to our delicious menu.
              </p>
            </div>

            {/* Actions Section */}
            <div className={styles.actionsSection}>
              <div className={styles.buttonGroup}>
                <Link href="/" className={styles.primaryButton}>
                  <i className="fas fa-home" aria-hidden="true"></i>
                  Back to Home
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
                Still hungry? Check out our <Link href="/meals">meals</Link> or
                {' '}<Link href="/help">contact us</Link> for assistance.
              </p>
            </div>

            {/* Popular Pages Section */}
            <div className={styles.suggestionsSection}>
              <h3 className={styles.suggestionsTitle}>
                <i className="fas fa-star" aria-hidden="true"></i>
                Popular Pages
              </h3>
              <ul className={styles.suggestionsList}>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-utensils" aria-hidden="true"></i>
                  <Link href="/meals">Our Meals</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-sync-alt" aria-hidden="true"></i>
                  <Link href="/our-process">Our Process</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-user" aria-hidden="true"></i>
                  <Link href="/login">Sign In</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-user-plus" aria-hidden="true"></i>
                  <Link href="/signup">Create Account</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-question-circle" aria-hidden="true"></i>
                  <Link href="/faq">FAQs</Link>
                </li>
                <li className={styles.suggestionItem}>
                  <i className="fas fa-phone" aria-hidden="true"></i>
                  <Link href="/help">Help & Support</Link>
                </li>
              </ul>
            </div>

            {/* Fun Message */}
            <div className={styles.funMessage}>
              <p>
                <i className="fas fa-lightbulb" aria-hidden="true"></i>
                {' '}Pro tip: You can always use the navigation menu above to find what you&apos;re looking for!
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Custom404Page;