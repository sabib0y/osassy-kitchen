import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/components/auth/login.module.scss';

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await signIn('google', { callbackUrl: '/user/dashboard' });
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        // Make error message more specific for tests
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password');
        } else {
          setError(result.error);
        }
      } else {
        // Fetch the session to get user role
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        // Redirect based on user role
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Head>
        <title>Login - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Sign in to your Osassy's Kitchen account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          {/* Brand Header */}
          <div className={styles.brandHeader}>
            <div className={styles.logo}>
              <i className="fas fa-utensils" aria-hidden="true"></i>
            </div>
            <h1 className={styles.brandName}>Osassy&apos;s Kitchen</h1>
            <p className={styles.brandTagline}>Authentic flavours delivered fresh</p>
          </div>

          {/* Login Card */}
          <div className={styles.loginCard}>
            {isLoading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.loadingSpinner} aria-label="Loading"></div>
              </div>
            )}
            
            <div className={styles.cardHeader}>
              <h1 data-testid="login-title">Welcome Back</h1>
              <p>Sign in to your account to continue</p>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              className={styles.googleButton}
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              data-testid="google-signin"
            >
              {isGoogleLoading ? (
                <div className={styles.buttonSpinner} aria-hidden="true"></div>
              ) : (
                <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <div className={styles.divider}>
              <span>or sign in with email</span>
            </div>

            {error && (
              <div className={styles.errorAlert} role="alert" data-testid="error-message">
                <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
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

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  <i className="fas fa-lock" aria-hidden="true"></i>
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    data-testid="password-input"
                    className={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    aria-describedby={error ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className={styles.inputIcon}
                    onClick={togglePasswordVisibility}
                    data-testid="password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                data-testid="login-submit"
                disabled={isLoading}
                aria-describedby="submit-help"
              >
                <div className={styles.buttonContent}>
                  {isLoading ? (
                    <>
                      <div className={styles.buttonSpinner} aria-hidden="true"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                      <span>Sign In</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className={styles.cardFooter}>
              <p className={styles.signupLink}>
                Don&apos;t have an account?{' '}
                <Link href="/signup">Create one here</Link>
              </p>
              <div className={styles.forgotPassword}>
                <Link href="/forgot-password">Forgot your password?</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;