import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/components/subscription/subscriptionTabs.module.scss';

interface SubscriptionTabsProps {
  activeTab: 'list' | 'create';
}

const SubscriptionTabs: React.FC<SubscriptionTabsProps> = ({ activeTab }) => {
  const router = useRouter();

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsList}>
        <Link
          href="/user/subscriptions"
          className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
        >
          <i className="fas fa-list"></i>
          <span>My Subscriptions</span>
        </Link>

        <Link
          href="/user/subscriptions/create"
          className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
        >
          <i className="fas fa-plus-circle"></i>
          <span>Create New</span>
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionTabs;
