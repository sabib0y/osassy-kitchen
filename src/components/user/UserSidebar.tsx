import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../../styles/user-layout.module.scss';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  isActive?: boolean;
}

interface UserSidebarProps {
  activeTab?: string;
  sidebarOpen: boolean;
  onClose: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({
  activeTab,
  sidebarOpen,
  onClose,
}) => {
  const { data: session } = useSession();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/user/dashboard',
      icon: 'fas fa-home',
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      href: '/user/subscriptions',
      icon: 'fas fa-sync-alt',
    },
    {
      id: 'orders',
      label: 'Orders',
      href: '/user/orders',
      icon: 'fas fa-shopping-bag',
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/user/profile',
      icon: 'fas fa-user',
    },
    {
      id: 'payments',
      label: 'Payments',
      href: '/user/payments',
      icon: 'fas fa-credit-card',
    },
  ];

  // Determine active item based on current route or activeTab prop
  const getActiveItem = (): string => {
    if (activeTab) return activeTab;
    
    const currentPath = router.pathname;
    if (currentPath === '/user/dashboard') return 'overview';
    if (currentPath.startsWith('/user/subscriptions')) return 'subscriptions';
    if (currentPath.startsWith('/user/orders')) return 'orders';
    if (currentPath.startsWith('/user/profile')) return 'profile';
    if (currentPath.startsWith('/user/payments')) return 'payments';
    
    return 'overview';
  };

  const activeItem = getActiveItem();

  const handleNavClick = (item: NavItem) => {
    // Close mobile sidebar when navigating
    onClose();
  };

  return (
    <>
      <aside 
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
        role="navigation"
        aria-label="User dashboard navigation"
      >
        <div className={styles.sidebarContent}>
          {/* User Info Section */}
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <i className="fas fa-user-circle" aria-hidden="true"></i>
            </div>
            <div className={styles.userDetails}>
              <h3>{session?.user?.name || 'Welcome'}</h3>
              <p>{session?.user?.email}</p>
            </div>
            
            {/* Close Button for Mobile */}
            <button 
              className={styles.sidebarCloseBtn}
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className={styles.sidebarNav} role="navigation">
            {navItems.map((item) => {
              const isActive = activeItem === item.id;
              
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => handleNavClick(item)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <i className={item.icon} aria-hidden="true"></i>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className={styles.activeIndicator} aria-hidden="true"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className={styles.sidebarActions}>
            <Link 
              href="/subscriptions" 
              className={styles.createSubscriptionBtn} 
              onClick={onClose}
            >
              <i className="fas fa-plus" aria-hidden="true"></i>
              <span>New Subscription</span>
            </Link>
            
            <Link 
              href="/menu" 
              className={styles.browseMenuBtn} 
              onClick={onClose}
            >
              <i className="fas fa-utensils" aria-hidden="true"></i>
              <span>Browse Menu</span>
            </Link>
          </div>

          {/* Support Link */}
          <div className={styles.sidebarFooter}>
            <Link
              href="/help"
              className={styles.supportLink}
              onClick={onClose}
            >
              <i className="fas fa-question-circle" aria-hidden="true"></i>
              <span>Help & Support</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default UserSidebar;