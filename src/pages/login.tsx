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
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

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