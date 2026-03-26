import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Repeat, 
  Utensils, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import styles from '@/styles/components/admin/layout.module.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: Repeat },
  { name: 'Menu Items', href: '/admin/menu', icon: Utensils },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className={styles.adminLayout}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoIcon}>OA</div>
          <span className={styles.title}>Osassy Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className={styles.closeButton}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={styles.sidebarFooter}>
          <button
            onClick={handleSignOut}
            className={styles.signOutButton}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <button
                onClick={() => setSidebarOpen(true)}
                className={styles.menuButton}
              >
                <Menu size={20} />
              </button>
              <h1 className={styles.pageTitle}>{title || 'Admin Dashboard'}</h1>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  {session?.user?.name?.charAt(0) || 'A'}
                </div>
                <span className={styles.userName}>
                  {session?.user?.name || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
