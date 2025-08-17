import { useState, FormEvent, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/components/auth/signup.module.scss';

interface PasswordStrength {
  score: number;
  level: 'weak' | 'medium' | 'strong';
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const SignupPage: NextPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'weak',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Password strength checker
  const checkPasswordStrength = (pwd: string): PasswordStrength => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    let level: 'weak' | 'medium' | 'strong' = 'weak';
    
    if (score >= 4) level = 'strong';
    else if (score >= 3) level = 'medium';

    return { score, level, requirements };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    }
  }, [password]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (passwordStrength.level === 'weak') {
      errors.password = 'Password is too weak';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push('/user/dashboard');
        }
      } else {
        const { message } = await res.json();
        setError(message || 'An error occurred during signup');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - Osassy&apos;s Kitchen</title>
        <meta name="description" content="Create your Osassy's Kitchen account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className={styles.signupPage}>
        <div className={styles.signupContainer}>
          {/* Brand Header */}
          <div className={styles.brandHeader}>
            <div className={styles.logo}>
              <i className="fas fa-utensils" aria-hidden="true"></i>
            </div>
            <h1 className={styles.brandName}>Osassy&apos;s Kitchen</h1>
            <p className={styles.brandTagline}>Join our community of food lovers</p>
          </div>

          {/* Signup Card */}
          <div className={styles.signupCard}>
            {isLoading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.loadingSpinner} aria-label="Loading"></div>
              </div>
            )}
            
            <div className={styles.cardHeader}>
              <h1>Create Account</h1>
              <p>Join us for delicious meals delivered fresh to your door</p>
            </div>

            {error && (
              <div className={styles.errorAlert} role="alert">
                <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.signupForm} noValidate>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    <i className="fas fa-user" aria-hidden="true"></i>
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      id="name"
                      className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      disabled={isLoading}
                      aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                    />
                    <i className={`fas fa-id-card ${styles.inputIcon}`} aria-hidden="true"></i>
                  </div>
                  {fieldErrors.name && (
                    <div className={styles.errorMessage} id="name-error">
                      <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                      {fieldErrors.name}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    <i className="fas fa-envelope" aria-hidden="true"></i>
                    Email Address <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="email"
                      id="email"
                      className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    />
                    <i className={`fas fa-at ${styles.inputIcon}`} aria-hidden="true"></i>
                  </div>
                  {fieldErrors.email && (
                    <div className={styles.errorMessage} id="email-error">
                      <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                      {fieldErrors.email}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    <i className="fas fa-lock" aria-hidden="true"></i>
                    Password <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''} ${passwordStrength.level === 'strong' ? styles.inputSuccess : ''}`}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                      aria-describedby={fieldErrors.password ? 'password-error' : 'password-strength'}
                    />
                    <button
                      type="button"
                      className={`${styles.inputIcon} ${passwordStrength.level === 'strong' ? styles.success : ''}`}
                      onClick={() => togglePasswordVisibility('password')}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <div className={styles.errorMessage} id="password-error">
                      <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                      {fieldErrors.password}
                    </div>
                  )}
                  {password && (
                    <div className={styles.passwordStrength} id="password-strength">
                      <div className={styles.strengthLabel}>
                        <span>Password strength:</span>
                        <span className={`${styles.strengthLevel} ${styles[passwordStrength.level]}`}>
                          {passwordStrength.level.charAt(0).toUpperCase() + passwordStrength.level.slice(1)}
                        </span>
                      </div>
                      <div className={styles.strengthBar}>
                        <div className={`${styles.strengthFill} ${styles[passwordStrength.level]}`}></div>
                      </div>
                      <div className={styles.strengthRequirements}>
                        <div className={`${styles.requirement} ${passwordStrength.requirements.length ? styles.valid : ''}`}>
                          <i className={`fas ${passwordStrength.requirements.length ? 'fa-check' : 'fa-times'} ${passwordStrength.requirements.length ? styles.valid : ''}`} aria-hidden="true"></i>
                          At least 8 characters
                        </div>
                        <div className={`${styles.requirement} ${passwordStrength.requirements.uppercase ? styles.valid : ''}`}>
                          <i className={`fas ${passwordStrength.requirements.uppercase ? 'fa-check' : 'fa-times'} ${passwordStrength.requirements.uppercase ? styles.valid : ''}`} aria-hidden="true"></i>
                          One uppercase letter
                        </div>
                        <div className={`${styles.requirement} ${passwordStrength.requirements.lowercase ? styles.valid : ''}`}>
                          <i className={`fas ${passwordStrength.requirements.lowercase ? 'fa-check' : 'fa-times'} ${passwordStrength.requirements.lowercase ? styles.valid : ''}`} aria-hidden="true"></i>
                          One lowercase letter
                        </div>
                        <div className={`${styles.requirement} ${passwordStrength.requirements.number ? styles.valid : ''}`}>
                          <i className={`fas ${passwordStrength.requirements.number ? 'fa-check' : 'fa-times'} ${passwordStrength.requirements.number ? styles.valid : ''}`} aria-hidden="true"></i>
                          One number
                        </div>
                        <div className={`${styles.requirement} ${passwordStrength.requirements.special ? styles.valid : ''}`}>
                          <i className={`fas ${passwordStrength.requirements.special ? 'fa-check' : 'fa-times'} ${passwordStrength.requirements.special ? styles.valid : ''}`} aria-hidden="true"></i>
                          One special character
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    <i className="fas fa-lock" aria-hidden="true"></i>
                    Confirm Password <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''} ${confirmPassword && password === confirmPassword ? styles.inputSuccess : ''}`}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                      aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                    />
                    <button
                      type="button"
                      className={`${styles.inputIcon} ${confirmPassword && password === confirmPassword ? styles.success : ''}`}
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <div className={styles.errorMessage} id="confirm-password-error">
                      <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                      {fieldErrors.confirmPassword}
                    </div>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <div className={styles.successMessage}>
                      <i className="fas fa-check-circle" aria-hidden="true"></i>
                      Passwords match
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.termsSection}>
                <div className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    id="terms"
                    className={styles.checkbox}
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor="terms" className={styles.checkboxLabel}>
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {fieldErrors.terms && (
                  <div className={styles.termsError}>
                    <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                    {fieldErrors.terms}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading || !name || !email || !password || !confirmPassword || !acceptTerms}
                aria-describedby="submit-help"
              >
                <div className={styles.buttonContent}>
                  {isLoading ? (
                    <>
                      <div className={styles.buttonSpinner} aria-hidden="true"></div>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus" aria-hidden="true"></i>
                      <span>Create Account</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className={styles.cardFooter}>
              <p className={styles.loginLink}>
                Already have an account?{' '}
                <Link href="/login">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;