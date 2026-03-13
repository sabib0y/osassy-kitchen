import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import UserLayout from '../../components/user/UserLayout';
import UserHeader from '../../components/user/UserHeader';
import ProfileForm from '../../components/user/ProfileForm';
import AddressManager from '../../components/user/AddressManager';
import NotificationPreferences from '../../components/user/NotificationPreferences';
import { useProfile } from '../../hooks/useProfile';
import styles from '../../styles/components/user/profile.module.scss';

type TabType = 'personal' | 'addresses' | 'notifications';

const UserProfile: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const { profile, loading, error, updateProfile, refetchProfile } = useProfile();

  if (status === 'loading' || loading) {
    return (
      <UserLayout pageTitle="Profile Settings - Osassy's Kitchen" activeTab="profile">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your profile...</p>
        </div>
      </UserLayout>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <UserLayout pageTitle="Profile Settings - Osassy's Kitchen" activeTab="profile">
        <div className={styles.errorContainer}>
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <button onClick={refetchProfile} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </UserLayout>
    );
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <UserLayout pageTitle="Profile Settings - Osassy's Kitchen" activeTab="profile">
      <div className={styles.profilePage}>
          
          <div className={styles.profileContainer}>
            {/* Tab Navigation */}
            <div className={styles.tabNavigation}>
              <button
                className={`${styles.tabButton} ${activeTab === 'personal' ? styles.active : ''}`}
                onClick={() => handleTabChange('personal')}
              >
                <i className="fas fa-user"></i>
                <span>Personal Information</span>
              </button>
              
              <button
                className={`${styles.tabButton} ${activeTab === 'addresses' ? styles.active : ''}`}
                onClick={() => handleTabChange('addresses')}
              >
                <i className="fas fa-map-marker-alt"></i>
                <span>Delivery Addresses</span>
              </button>
              
              <button
                className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.active : ''}`}
                onClick={() => handleTabChange('notifications')}
              >
                <i className="fas fa-bell"></i>
                <span>Notifications</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === 'personal' && (
                <div className={styles.tabPanel}>
                  <div className={styles.panelHeader}>
                    <h2>Personal Information</h2>
                    <p>Manage your personal details and account information.</p>
                  </div>
                  <ProfileForm 
                    profile={profile} 
                    onUpdate={updateProfile}
                    loading={loading}
                  />
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className={styles.tabPanel}>
                  <div className={styles.panelHeader}>
                    <h2>Delivery Addresses</h2>
                    <p>Manage your delivery addresses for orders and subscriptions.</p>
                  </div>
                  <AddressManager 
                    addresses={profile?.addresses || []} 
                    onAddressChange={refetchProfile}
                  />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className={styles.tabPanel}>
                  <div className={styles.panelHeader}>
                    <h2>Notification Preferences</h2>
                    <p>Choose how you&apos;d like to receive updates about your orders and account.</p>
                  </div>
                  <NotificationPreferences 
                    preferences={profile?.notificationPreferences} 
                    onUpdate={refetchProfile}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if (session.user?.role === 'ADMIN') {
    return {
      redirect: {
        destination: '/admin/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default UserProfile;