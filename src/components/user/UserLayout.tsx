import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import Layout from '../Layout/Layout';
import styles from '../../styles/user-layout.module.scss';

interface UserLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  activeTab?: string;
  showSidebar?: boolean;
}

const UserLayout: React.FC<UserLayoutProps> = ({
  children,
  pageTitle = 'User Dashboard - Osassy\'s Kitchen',
  activeTab,
  showSidebar = true,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    // Close sidebar on route change (mobile)
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  // Handle overlay click to close sidebar
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [sidebarOpen]);

  if (status === 'loading' || loading) {
    return (
      <Layout pageTitle={pageTitle}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout pageTitle={pageTitle}>
      <div className={styles.userLayout}>
        {/* Background Pattern */}
        <div className={styles.backgroundPattern}></div>
        
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className={styles.mobileOverlay}
            onClick={handleOverlayClick}
            aria-label="Close sidebar"
          />
        )}

        <div className={styles.container}>
          {/* Sidebar */}
          {showSidebar && (
            <UserSidebar
              activeTab={activeTab}
              sidebarOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content Area */}
          <main className={styles.mainContent}>
            {/* Header */}
            <UserHeader
              onMenuClick={() => setSidebarOpen(true)}
              showMenuButton={showSidebar}
            />

            {/* Content */}
            <div className={styles.contentWrapper}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default UserLayout;