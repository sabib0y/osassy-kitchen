/**
 * Error Boundary Component for Menu Items
 * Provides graceful error handling and recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import styles from '@/styles/components/subscription-create.module.css';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for handling menu-related errors
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
class MenuErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Menu Error Boundary caught error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // You could also log the error to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Call onRetry if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundaryContainer} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertCircle style={{
                width: '40px',
                height: '40px',
                color: '#dc2626',
              }} />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '12px',
            }}>
              Oops! Something went wrong
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '32px',
              lineHeight: '1.5',
            }}>
              We encountered an error while loading the menu. This could be a temporary issue. 
              Please try refreshing the page or come back later.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'left',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '500',
                  color: '#4b5563',
                  marginBottom: '8px',
                }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#8B4513',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b3410';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B4513';
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Try Again
              </button>

              <Link href="/user/dashboard">
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    color: '#8B4513',
                    border: '2px solid #8B4513',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3e7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Home style={{ width: '16px', height: '16px' }} />
                  Go to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MenuErrorBoundary;