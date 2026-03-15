import { useState, useEffect, FormEvent } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../../styles/pages/resetPassword.module.scss';

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const ResetPasswordPage: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);

  const [requirements, setRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  // Check if token exists when page loads
  useEffect(() => {
    if (router.isReady) {
      if (!token || typeof token !== 'string' || token.length < 32) {
        setIsTokenValid(false);
      }
      setIsPageLoading(false);
    }
  }, [router.isReady, token]);

  // Validate password requirements as user types
  useEffect(() => {
    setRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  }, [password]);

  const allRequirementsMet = Object.values(requirements).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate all requirements are met
    if (!allRequirementsMet) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    // Validate passwords match
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && data.message?.includes('expired')) {
          setIsTokenValid(false);
          return;
        }
        throw new Error(data.message || 'Failed to reset password');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const RequirementIcon = ({ met }: { met: boolean }) => (
    <i
      className={met ? 'fas fa-check-circle' : 'fas fa-circle'}
      aria-hidden="true"
    />
  );

  return (
    <>
      <Head>
        <title>Reset Password - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Set a new password for your Osassy's Kitchen account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.resetPasswordPage}>
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

            {isPageLoading ? (
              <div className={styles.pageLoading}>
                <div className={styles.loadingSpinner} aria-label="Loading"></div>
              </div>
            ) : !isTokenValid ? (
              /* Invalid or Missing Token */
              <div className={styles.invalidToken} data-testid="invalid-token">
                <div className={styles.errorIcon}>
                  <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                </div>
                <h2>Invalid or Expired Link</h2>
                <p>
                  This password reset link is invalid or has expired.
                  Please request a new password reset link.
                </p>
                <Link href="/forgot-password" className={styles.requestNewLink}>
                  <i className="fas fa-redo" aria-hidden="true"></i>
                  Request New Link
                </Link>
              </div>
            ) : isSuccess ? (
              /* Success State */
              <div className={styles.successMessage} data-testid="success-message">
                <div className={styles.successIcon}>
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                </div>
                <h2>Password Reset Successfully</h2>
                <p>
                  Your password has been updated. You can now log in with your new password.
                </p>
                <Link href="/login" className={styles.loginButton}>
                  <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                  Go to Login
                </Link>
              </div>
            ) : (
              /* Reset Password Form */
              <>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <i className="fas fa-lock" aria-hidden="true"></i>
                  </div>
                  <h2 data-testid="reset-password-title">Create New Password</h2>
                  <p>
                    Please enter your new password below. Make sure it meets all the security requirements.
                  </p>
                </div>

                {error && (
                  <div className={styles.errorAlert} role="alert" data-testid="error-message">
                    <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                  {/* New Password Field */}
                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      <i className="fas fa-lock" aria-hidden="true"></i>
                      New Password
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        data-testid="password-input"
                        className={`${styles.input} ${
                          password.length > 0
                            ? allRequirementsMet
                              ? styles.inputValid
                              : styles.inputError
                            : ''
                        }`}
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        disabled={isLoading}
                        aria-describedby="password-requirements"
                      />
                      <button
                        type="button"
                        className={styles.toggleButton}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'} aria-hidden="true"></i>
                      </button>
                    </div>

                    {/* Password Requirements */}
                    <div className={styles.passwordRequirements} id="password-requirements">
                      <div className={styles.requirementsTitle}>Password Requirements</div>
                      <div className={styles.requirementsList}>
                        <div className={`${styles.requirement} ${requirements.minLength ? styles.requirementMet : styles.requirementUnmet}`}>
                          <RequirementIcon met={requirements.minLength} />
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`${styles.requirement} ${requirements.hasUppercase ? styles.requirementMet : styles.requirementUnmet}`}>
                          <RequirementIcon met={requirements.hasUppercase} />
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`${styles.requirement} ${requirements.hasLowercase ? styles.requirementMet : styles.requirementUnmet}`}>
                          <RequirementIcon met={requirements.hasLowercase} />
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`${styles.requirement} ${requirements.hasNumber ? styles.requirementMet : styles.requirementUnmet}`}>
                          <RequirementIcon met={requirements.hasNumber} />
                          <span>One number</span>
                        </div>
                        <div className={`${styles.requirement} ${requirements.hasSpecial ? styles.requirementMet : styles.requirementUnmet}`}>
                          <RequirementIcon met={requirements.hasSpecial} />
                          <span>One special character</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      <i className="fas fa-lock" aria-hidden="true"></i>
                      Confirm Password
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        data-testid="confirm-password-input"
                        className={`${styles.input} ${
                          confirmPassword.length > 0
                            ? passwordsMatch
                              ? styles.inputValid
                              : styles.inputError
                            : ''
                        }`}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className={styles.toggleButton}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'} aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    data-testid="reset-submit"
                    disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                  >
                    <div className={styles.buttonContent}>
                      {isLoading ? (
                        <>
                          <div className={styles.buttonSpinner} aria-hidden="true"></div>
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check" aria-hidden="true"></i>
                          <span>Reset Password</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </>
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

export default ResetPasswordPage;
