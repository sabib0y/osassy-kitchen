import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../../styles/user-layout.module.scss';

interface UserHeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

const UserHeader: React.FC<UserHeaderProps> = ({
  onMenuClick,
  showMenuButton = true,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Mock notification data - replace with real data
  const notifications = [
    {
      id: 1,
      title: 'Order Delivered',
      message: 'Your recent order has been delivered successfully',
      time: '2 hours ago',
      type: 'success',
      read: false,
    },
    {
      id: 2,
      title: 'Subscription Renewal',
      message: 'Your weekly subscription will renew tomorrow',
      time: '1 day ago',
      type: 'info',
      read: false,
    },
    {
      id: 3,
      title: 'Payment Processed',
      message: 'Your payment of ₦15,000 was processed successfully',
      time: '3 days ago',
      type: 'success',
      read: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get page title based on current route
  const getPageTitle = (): string => {
    const currentPath = router.pathname;
    
    if (currentPath === '/user/dashboard') return 'Dashboard Overview';
    if (currentPath.startsWith('/user/subscriptions')) return 'My Subscriptions';
    if (currentPath.startsWith('/user/orders')) return 'Order History';
    if (currentPath.startsWith('/user/profile')) return 'My Profile';
    if (currentPath.startsWith('/user/payments')) return 'Payment Methods';
    
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleNotificationClick = (notificationId: number) => {
    // Mark notification as read and handle click
    console.log('Notification clicked:', notificationId);
    // You can add navigation logic here
  };

  const formatTime = (timeStr: string): string => {
    return timeStr;
  };

  return (
    <header className={styles.userHeader}>
      <div className={styles.headerContent}>
        {/* Left Section */}
        <div className={styles.headerLeft}>
          {showMenuButton && (
            <button 
              className={styles.menuToggle}
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </button>
          )}
          
          <div className={styles.pageTitle}>
            <h1>{getPageTitle()}</h1>
            <div className={styles.breadcrumb}>
              <Link href="/user/dashboard">
                <a>Dashboard</a>
              </Link>
              {router.pathname !== '/user/dashboard' && (
                <>
                  <i className="fas fa-chevron-right" aria-hidden="true"></i>
                  <span>{getPageTitle()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.headerRight}>
          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <Link href="/subscriptions">
              <a 
                className={styles.quickActionBtn}
                title="Create new subscription"
              >
                <i className="fas fa-plus" aria-hidden="true"></i>
                <span className={styles.quickActionLabel}>New Subscription</span>
              </a>
            </Link>
          </div>

          {/* Notifications */}
          <div className={styles.notificationContainer} ref={notificationRef}>
            <button 
              className={`${styles.notificationBtn} ${unreadCount > 0 ? styles.hasNotifications : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <i className="fas fa-bell" aria-hidden="true"></i>
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.notificationDropdown}>
                <div className={styles.notificationHeader}>
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className={styles.unreadCount}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                
                <div className={styles.notificationList}>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className={`${styles.notificationIcon} ${styles[notification.type]}`}>
                          <i className={
                            notification.type === 'success' ? 'fas fa-check-circle' :
                            notification.type === 'info' ? 'fas fa-info-circle' :
                            'fas fa-exclamation-circle'
                          } aria-hidden="true"></i>
                        </div>
                        <div className={styles.notificationContent}>
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className={styles.notificationTime}>
                            {formatTime(notification.time)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noNotifications}>
                      <i className="fas fa-bell-slash" aria-hidden="true"></i>
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
                
                <div className={styles.notificationFooter}>
                  <Link href="/user/notifications">
                    <a>View all notifications</a>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className={styles.userProfileContainer} ref={dropdownRef}>
            <button 
              className={styles.userProfileBtn}
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="User menu"
              aria-expanded={showDropdown}
            >
              <div className={styles.userAvatarSmall}>
                <i className="fas fa-user-circle" aria-hidden="true"></i>
              </div>
              <div className={styles.userNameDisplay}>
                <span>{session?.user?.name || 'User'}</span>
                <i className={`fas fa-chevron-down ${showDropdown ? styles.rotated : ''}`} aria-hidden="true"></i>
              </div>
            </button>

            {showDropdown && (
              <div className={styles.userDropdown}>
                <div className={styles.userDropdownHeader}>
                  <div className={styles.userAvatarLarge}>
                    <i className="fas fa-user-circle" aria-hidden="true"></i>
                  </div>
                  <div className={styles.userInfo}>
                    <h4>{session?.user?.name}</h4>
                    <p>{session?.user?.email}</p>
                  </div>
                </div>
                
                <div className={styles.userDropdownMenu}>
                  <Link href="/user/profile">
                    <a className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      <i className="fas fa-user" aria-hidden="true"></i>
                      <span>My Profile</span>
                    </a>
                  </Link>
                  
                  <Link href="/user/payments">
                    <a className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      <i className="fas fa-credit-card" aria-hidden="true"></i>
                      <span>Payment Methods</span>
                    </a>
                  </Link>
                  
                  <Link href="/user/settings">
                    <a className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      <i className="fas fa-cog" aria-hidden="true"></i>
                      <span>Settings</span>
                    </a>
                  </Link>
                  
                  <div className={styles.dropdownDivider}></div>
                  
                  <Link href="/support">
                    <a className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>
                      <i className="fas fa-question-circle" aria-hidden="true"></i>
                      <span>Help & Support</span>
                    </a>
                  </Link>
                  
                  <button 
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;