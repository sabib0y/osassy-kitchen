import { NextPage, GetServerSidePropsContext } from 'next';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Settings,
  CreditCard,
  Building2,
  Truck,
  Bell,
  Server,
  CheckCircle
} from 'lucide-react';
import styles from '@/styles/components/admin/settings.module.scss';

// --- Components ---
const Sidebar = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
    { icon: CreditCard, label: 'Subscriptions', href: '/admin/subscriptions' },
    { icon: Package, label: 'Menu Items', href: '/admin/menu' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: FileText, label: 'Reports', href: '/admin/reports' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoContent}>
          <div className={styles.logoIcon}>OA</div>
          <span className={styles.logoText}>Osassy Admin</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, description }) => {
  return (
    <div className={styles.toggleItem}>
      <div className={styles.toggleInfo}>
        <span className={styles.toggleLabel}>{label}</span>
        {description && <span className={styles.toggleDescription}>{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`${styles.toggleSwitch} ${checked ? styles.checked : ''}`}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
};

const AdminSettings: NextPage = () => {
  const { data: session, status } = useSession();

  // Notification preferences state (placeholder - not persisted)
  const notificationPreferences = {
    newOrders: true,
    newSubscriptions: true,
    cancellations: false,
  };

  if (status === 'loading') {
    return (
      <div className={styles.settingsContainer}>
        <Sidebar />
        <div className={styles.loadingContent}>
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={styles.loadingCard}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return <div style={{ padding: '2rem' }}>Access Denied</div>;
  }

  const environment = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';

  return (
    <div className={styles.settingsContainer}>
      <Sidebar />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>Manage your business settings and preferences</p>
          </div>

          <div className={styles.settingsGrid}>
            {/* Business Information */}
            <section className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <Building2 className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Business Information</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Business Name</span>
                  <span className={styles.infoValue}>Osassy&apos;s Kitchen</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Contact Email</span>
                  <span className={styles.infoValue}>
                    {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@osassyskitchen.com'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>+44 20 1234 5678</span>
                </div>
              </div>
            </section>

            {/* Delivery Settings */}
            <section className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <Truck className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Delivery Settings</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Delivery Days</span>
                  <span className={styles.infoValue}>Tuesday, Thursday, Saturday</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Delivery Areas</span>
                  <span className={styles.infoValue}>London and surrounding areas</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Minimum Order Value</span>
                  <span className={styles.infoValue}>&pound;25.00</span>
                </div>
              </div>
            </section>

            {/* Notification Preferences */}
            <section className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <Bell className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Notification Preferences</h2>
              </div>
              <div className={styles.cardContent}>
                <p className={styles.cardNote}>
                  Email notifications are sent to the contact email address above.
                </p>
                <div className={styles.toggleList}>
                  <ToggleSwitch
                    checked={notificationPreferences.newOrders}
                    onChange={() => {/* Placeholder - not functional */}}
                    label="New Orders"
                    description="Receive email when a new order is placed"
                  />
                  <ToggleSwitch
                    checked={notificationPreferences.newSubscriptions}
                    onChange={() => {/* Placeholder - not functional */}}
                    label="New Subscriptions"
                    description="Receive email when a customer subscribes"
                  />
                  <ToggleSwitch
                    checked={notificationPreferences.cancellations}
                    onChange={() => {/* Placeholder - not functional */}}
                    label="Cancellations"
                    description="Receive email when a subscription is cancelled"
                  />
                </div>
              </div>
            </section>

            {/* System Information */}
            <section className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <Server className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>System Information</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>App Version</span>
                  <span className={styles.infoValue}>1.0.0</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Environment</span>
                  <span className={`${styles.infoValue} ${styles.badge} ${environment === 'Production' ? styles.badgeSuccess : styles.badgeInfo}`}>
                    {environment}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Database Status</span>
                  <span className={`${styles.infoValue} ${styles.statusIndicator}`}>
                    <CheckCircle className={styles.statusIcon} />
                    Connected
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default AdminSettings;
