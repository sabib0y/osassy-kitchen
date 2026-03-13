import { useState, FormEvent } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/components/auth/forgotPassword.module.scss';

const ForgotPasswordPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, just show success message (no actual email sending)
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Reset your Osassy's Kitchen account password" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.forgotPasswordPage}>
        <div className={styles.container}>
          {/* Brand Header */}
          <div className={styles.brandHeader}>
            <div className={styles.logo}>
              <i className="fas fa-utensils" aria-hidden="true"></i>
            </div>
            <h1 className={styles.brandName}>Osassy&apos;s Kitchen</h1>
            <p className={styles.brandTagline}>Authentic flavours delivered fresh</p>
          </div>

          {/* Card */}
          <div className={styles.card}>
            {isLoading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.loadingSpinner} aria-label="Loading"></div>
              </div>
            )}

            {!isSubmitted ? (
              <>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <i className="fas fa-key" aria-hidden="true"></i>
                  </div>
                  <h2 data-testid="forgot-password-title">Forgot Your Password?</h2>
                  <p>
                    No worries! Enter your email address below and we&apos;ll send you
                    instructions to reset your password.
                  </p>
                </div>

                {error && (
                  <div className={styles.errorAlert} role="alert" data-testid="error-message">
                    <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      <i className="fas fa-envelope" aria-hidden="true"></i>
                      Email Address
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        data-testid="email-input"
                        className={styles.input}
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={isLoading}
                        aria-describedby={error ? 'email-error' : undefined}
                      />
                      <i className={`fas fa-at ${styles.inputIcon}`} aria-hidden="true"></i>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    data-testid="reset-submit"
                    disabled={isLoading}
                  >
                    <div className={styles.buttonContent}>
                      {isLoading ? (
                        <>
                          <div className={styles.buttonSpinner} aria-hidden="true"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane" aria-hidden="true"></i>
                          <span>Reset Password</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </>
            ) : (
              <div className={styles.successMessage} data-testid="success-message">
                <div className={styles.successIcon}>
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                </div>
                <h2>Check Your Email</h2>
                <p>
                  If an account exists with <strong>{email}</strong>, you&apos;ll receive
                  a password reset link shortly.
                </p>
                <p className={styles.subText}>
                  Don&apos;t see it? Check your spam folder or try again.
                </p>
                <button
                  type="button"
                  className={styles.tryAgainButton}
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                >
                  <i className="fas fa-redo" aria-hidden="true"></i>
                  Try a different email
                </button>
              </div>
            )}

            <div className={styles.cardFooter}>
              <Link href="/login" className={styles.backLink}>
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
