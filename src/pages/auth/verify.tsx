import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../../styles/pages/verifyEmail.module.scss';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired' | 'already-verified';

interface VerificationResult {
  status: VerificationStatus;
  message: string;
}

const VerifyPage: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [result, setResult] = useState<VerificationResult>({
    status: 'verifying',
    message: 'Verifying your email...',
  });
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token || typeof token !== 'string') return;

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          if (data.alreadyVerified) {
            setResult({
              status: 'already-verified',
              message: data.message || 'Your email is already verified.',
            });
          } else {
            setResult({
              status: 'success',
              message: data.message || 'Your email has been verified successfully!',
            });
          }
        } else {
          if (data.expired) {
            setResult({
              status: 'expired',
              message: data.message || 'Your verification link has expired.',
            });
          } else {
            setResult({
              status: 'error',
              message: data.message || 'Verification failed. Please try again.',
            });
          }
        }
      } catch (error) {
        setResult({
          status: 'error',
          message: 'An error occurred during verification. Please try again.',
        });
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) {
      setResendStatus('error');
      setResendMessage('Please enter your email address.');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendStatus('success');
        setResendMessage(data.message || 'Verification email sent!');
      } else {
        setResendStatus('error');
        setResendMessage(data.message || 'Failed to resend. Please try again.');
      }
    } catch (error) {
      setResendStatus('error');
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getIcon = () => {
    switch (result.status) {
      case 'verifying':
        return <div className={styles.spinner} aria-hidden="true"></div>;
      case 'success':
      case 'already-verified':
        return <i className="fas fa-check-circle" aria-hidden="true"></i>;
      case 'expired':
        return <i className="fas fa-clock" aria-hidden="true"></i>;
      case 'error':
        return <i className="fas fa-times-circle" aria-hidden="true"></i>;
      default:
        return null;
    }
  };

  const getIconClass = () => {
    switch (result.status) {
      case 'success':
      case 'already-verified':
        return styles.iconSuccess;
      case 'expired':
        return styles.iconWarning;
      case 'error':
        return styles.iconError;
      default:
        return '';
    }
  };

  return (
    <>
      <Head>
        <title>Email Verification - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Email verification status" />
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
            <div className={`${styles.iconWrapper} ${getIconClass()}`}>
              {getIcon()}
            </div>

            <h1 className={styles.title}>
              {result.status === 'verifying' && 'Verifying Email'}
              {result.status === 'success' && 'Email Verified!'}
              {result.status === 'already-verified' && 'Already Verified'}
              {result.status === 'expired' && 'Link Expired'}
              {result.status === 'error' && 'Verification Failed'}
            </h1>

            <p className={styles.description}>{result.message}</p>

            {/* Success Actions */}
            {(result.status === 'success' || result.status === 'already-verified') && (
              <div className={styles.actionSection}>
                <Link href="/login" className={styles.primaryButton}>
                  <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                  <span>Sign In to Your Account</span>
                </Link>
              </div>
            )}

            {/* Expired/Error - Resend Option */}
            {(result.status === 'expired' || result.status === 'error') && (
              <div className={styles.resendSection}>
                <p className={styles.resendPrompt}>
                  Enter your email address to receive a new verification link:
                </p>

                <div className={styles.resendForm}>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={styles.emailInput}
                    disabled={isResending}
                  />

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
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className={styles.resendButton}
                  >
                    {isResending ? (
                      <>
                        <div className={styles.spinner} aria-hidden="true"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane" aria-hidden="true"></i>
                        <span>Send New Verification Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Links */}
            <div className={styles.footer}>
              <p>
                Need help?{' '}
                <Link href="/contact">Contact Support</Link>
              </p>
              <p className={styles.secondaryLink}>
                <Link href="/">Return to Home</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyPage;
