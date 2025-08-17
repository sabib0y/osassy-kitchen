import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { getNavigationItems, navigationHelpers, NavItem } from '@/data/navigationConfig';
import logoImage from '@/assets/images/logo-light.png';
import styles from '@/styles/components/shared/modernHeader.module.scss';

const ModernHeader: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get navigation items based on authentication status
  const isAuthenticated = status === 'authenticated';
  const userRole = session?.user?.role;
  const navItems = getNavigationItems(isAuthenticated, userRole);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [router.pathname]);

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut({ callbackUrl: '/' });
  };

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const isActive = navigationHelpers.isActive(router.pathname, item.href);

    if (item.type === 'dropdown') {
      return (
        <li key={item.id} className={styles.navItemDropdown}>
          <button
            className={`${styles.dropdownToggle} ${isActive ? styles.active : ''}`}
            onClick={() => toggleDropdown(item.id)}
            aria-expanded={openDropdown === item.id}
          >
            {item.icon && <i className={`fas ${item.icon} ${styles.icon}`}></i>}
            <span>{item.name}</span>
            <i className={`fas fa-chevron-down ${styles.chevron} ${openDropdown === item.id ? styles.rotated : ''}`}></i>
          </button>
          
          {openDropdown === item.id && item.children && (
            <ul className={`${styles.dropdownMenu} ${isMobile ? styles.mobile : ''}`}>
              {item.children.map((child) => {
                if (child.id === 'divider') {
                  return <li key={child.id} className={styles.divider}></li>;
                }
                
                if (child.id === 'logout') {
                  return (
                    <li key={child.id}>
                      <a
                        href="#"
                        onClick={handleLogout}
                        className={styles.dropdownItem}
                      >
                        {child.icon && <i className={`fas ${child.icon} ${styles.icon}`}></i>}
                        <span>{child.name}</span>
                      </a>
                    </li>
                  );
                }
                
                return (
                  <li key={child.id}>
                    <Link href={child.href} className={styles.dropdownItem}>
                      {child.icon && <i className={`fas ${child.icon} ${styles.icon}`}></i>}
                      <span>{child.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    if (item.type === 'button') {
      return (
        <li key={item.id} className={styles.navItemButton}>
          <Link href={item.href} className={styles.authButton}>
            {item.name}
          </Link>
        </li>
      );
    }

    return (
      <li key={item.id} className={styles.navItem}>
        <Link 
          href={item.href} 
          className={`${styles.navLink} ${isActive ? styles.active : ''}`}
        >
          {item.name}
        </Link>
      </li>
    );
  };

  const userDisplay = navigationHelpers.getUserDisplay(session);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          {/* Logo */}
          <div className={styles.logoBox}>
            <Link href="/" className={styles.logo}>
              <Image
                src={logoImage}
                alt="Osassy's Kitchen"
                width={66}
                height={66}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className={styles.desktopNav} ref={dropdownRef}>
            <ul className={styles.navList}>
              {navItems.map((item) => renderNavItem(item))}
            </ul>
            
            {/* User Info Badge (if authenticated) */}
            {isAuthenticated && userDisplay && (
              <div className={styles.userBadge}>
                <div className={styles.userAvatar}>
                  <i className="fas fa-user-circle"></i>
                </div>
                <span className={styles.userName}>{userDisplay.name}</span>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={styles.mobileNav}>
            <div className={styles.mobileNavInner}>
              {/* User Info for Mobile */}
              {isAuthenticated && userDisplay && (
                <div className={styles.mobileUserInfo}>
                  <div className={styles.userAvatar}>
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div>
                    <div className={styles.userName}>{userDisplay.name}</div>
                    <div className={styles.userEmail}>{userDisplay.email}</div>
                  </div>
                </div>
              )}
              
              <ul className={styles.mobileNavList}>
                {navItems.map((item) => renderNavItem(item, true))}
              </ul>

              {/* Contact Info for Mobile */}
              <div className={styles.mobileContact}>
                <a href="tel:+447473301272" className={styles.contactLink}>
                  <i className="fas fa-phone"></i>
                  <span>+44 7473 301272</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default ModernHeader;