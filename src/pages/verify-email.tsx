import { useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/pages/verifyEmail.module.scss';

const VerifyEmailPage: NextPage = () => {
  const router = useRouter();
  const { email } = router.query;
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    if (!email || typeof email !== 'string') {
      setResendStatus('error');
      setResendMessage('Email address not found. Please try signing up again.');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendStatus('success');
        setResendMessage(data.message || 'Verification email sent successfully!');
      } else {
        setResendStatus('error');
        setResendMessage(data.message || 'Failed to resend email. Please try again.');
      }
    } catch (error) {
      setResendStatus('error');
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verify Your Email - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Please verify your email address to complete registration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.verifyEmailPage}>
        <div className={styles.container}>
          {/* Brand Header */}
          <div className={styles.brandHeader}>
            <div className={styles.logo}>
              <i className="fas fa-utensils" aria-hidden="true"></i>
            </div>
            <h1 className={styles.brandName}>Osassy&apos;s Kitchen</h1>
          </div>

          {/* Verification Card */}
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <i className="fas fa-envelope-open-text" aria-hidden="true"></i>
            </div>

            <h1 className={styles.title}>Check Your Email</h1>

            <p className={styles.description}>
              We&apos;ve sent a verification link to{' '}
              {email ? (
                <strong className={styles.email}>{email}</strong>
              ) : (
                'your email address'
              )}
              . Please click the link to verify your account.
            </p>

            <div className={styles.instructions}>
              <h3>What to do next:</h3>
              <ol>
                <li>Check your inbox for an email from Osassy&apos;s Kitchen</li>
                <li>Click the verification link in the email</li>
                <li>Once verified, you can sign in to your account</li>
              </ol>
            </div>

            <div className={styles.tips}>
              <p>
                <i className="fas fa-info-circle" aria-hidden="true"></i>
                <span>
                  Can&apos;t find the email? Check your spam or junk folder.
                </span>
              </p>
            </div>

            {/* Resend Email Section */}
            <div className={styles.resendSection}>
              {resendStatus === 'success' && (
                <div className={styles.successMessage}>
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                  <span>{resendMessage}</span>
                </div>
              )}

              {resendStatus === 'error' && (
                <div className={styles.errorMessage}>
                  <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                  <span>{resendMessage}</span>
                </div>
              )}

              <button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className={styles.resendButton}
              >
                {isResending ? (
                  <>
                    <div className={styles.spinner} aria-hidden="true"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo" aria-hidden="true"></i>
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer Links */}
            <div className={styles.footer}>
              <p>
                Already verified?{' '}
                <Link href="/login">Sign in here</Link>
              </p>
              <p className={styles.secondaryLink}>
                Wrong email?{' '}
                <Link href="/signup">Sign up again</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;
