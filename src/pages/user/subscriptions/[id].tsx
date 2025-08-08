import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import UserLayout from '../../../components/user/UserLayout';
import SubscriptionDetails from '../../../components/user/SubscriptionDetails';
import SubscriptionEditor from '../../../components/user/SubscriptionEditor';
import { useSubscription } from '../../../hooks/useSubscription';
import styles from '../../../styles/components/user/subscription-management.module.scss';

interface SubscriptionManagementPageProps {
  subscriptionId: string;
}

const SubscriptionManagementPage: React.FC<SubscriptionManagementPageProps> = ({
  subscriptionId
}) => {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    action: 'pause' | 'cancel' | 'resume' | null;
    show: boolean;
  }>({ action: null, show: false });

  const {
    subscription,
    loading,
    error,
    updateSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    isUpdating
  } = useSubscription(subscriptionId);

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleUpdateSubscription = async (updatedItems: Array<{ menuItemId: string; quantity: number }>) => {
    try {
      await updateSubscription({ items: updatedItems });
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const handleSubscriptionAction = async (action: 'pause' | 'cancel' | 'resume') => {
    setShowConfirmModal({ action, show: true });
  };

  const confirmAction = async () => {
    if (!showConfirmModal.action) return;

    try {
      switch (showConfirmModal.action) {
        case 'pause':
          await pauseSubscription();
          break;
        case 'resume':
          await resumeSubscription();
          break;
        case 'cancel':
          await cancelSubscription();
          break;
      }
      setShowConfirmModal({ action: null, show: false });
    } catch (error) {
      console.error(`Failed to ${showConfirmModal.action} subscription:`, error);
    }
  };

  const getActionText = (action: string | null) => {
    switch (action) {
      case 'pause': return 'Pause';
      case 'resume': return 'Resume';
      case 'cancel': return 'Cancel';
      default: return '';
    }
  };

  const getActionDescription = (action: string | null) => {
    switch (action) {
      case 'pause': return 'Your subscription will be paused and no orders will be generated until you resume it.';
      case 'resume': return 'Your subscription will be reactivated and orders will resume according to your schedule.';
      case 'cancel': return 'Your subscription will be cancelled permanently. This action cannot be undone.';
      default: return '';
    }
  };

  if (loading) {
    return (
      <UserLayout pageTitle="Managing Subscription - Osassy's Kitchen" activeTab="subscriptions">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading subscription details...</p>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout pageTitle="Subscription Error - Osassy's Kitchen" activeTab="subscriptions">
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Failed to Load Subscription</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={() => router.back()} className={styles.backButton}>
            Go Back
          </button>
        </div>
      </UserLayout>
    );
  }

  if (!subscription) {
    return (
      <UserLayout pageTitle="Subscription Not Found - Osassy's Kitchen" activeTab="subscriptions">
        <div className={styles.notFoundContainer}>
          <div className={styles.notFoundIcon}>🔍</div>
          <h2>Subscription Not Found</h2>
          <p>The subscription you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <button onClick={() => router.push('/user/subscriptions')} className={styles.backButton}>
            View All Subscriptions
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Manage {subscription.planName} - Osassy&apos;s Kitchen</title>
        <meta name="description" content={`Manage your ${subscription.planName} subscription`} />
      </Head>

      <UserLayout pageTitle={`Manage ${subscription.planName}`} activeTab="subscriptions">
        <div className={styles.subscriptionManagement}>
          {/* Header */}
          <div className={styles.header}>
            <button onClick={() => router.back()} className={styles.backButton}>
              <i className="fas fa-arrow-left"></i>
              Back to Subscriptions
            </button>
            
            <div className={styles.headerContent}>
              <h1>{subscription.planName}</h1>
              <div className={styles.status}>
                <span className={`${styles.statusBadge} ${styles[subscription.status.toLowerCase()]}`}>
                  {subscription.status}
                </span>
              </div>
            </div>

            <div className={styles.headerActions}>
              {subscription.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={handleEditToggle}
                    className={`${styles.editButton} ${editMode ? styles.active : ''}`}
                    disabled={isUpdating}
                  >
                    <i className={`fas ${editMode ? 'fa-times' : 'fa-edit'}`}></i>
                    {editMode ? 'Cancel Edit' : 'Edit Items'}
                  </button>
                  <button
                    onClick={() => handleSubscriptionAction('pause')}
                    className={styles.pauseButton}
                    disabled={isUpdating}
                  >
                    <i className="fas fa-pause"></i>
                    Pause
                  </button>
                </>
              )}
              
              {subscription.status === 'PAUSED' && (
                <button
                  onClick={() => handleSubscriptionAction('resume')}
                  className={styles.resumeButton}
                  disabled={isUpdating}
                >
                  <i className="fas fa-play"></i>
                  Resume
                </button>
              )}

              {(subscription.status === 'ACTIVE' || subscription.status === 'PAUSED') && (
                <button
                  onClick={() => handleSubscriptionAction('cancel')}
                  className={styles.cancelButton}
                  disabled={isUpdating}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.content}>
            {editMode ? (
              <SubscriptionEditor
                subscription={subscription}
                onSave={handleUpdateSubscription}
                onCancel={handleEditToggle}
                isUpdating={isUpdating}
              />
            ) : (
              <SubscriptionDetails subscription={subscription} />
            )}
          </div>

          {/* Confirmation Modal */}
          {showConfirmModal.show && (
            <div className={styles.modalOverlay} onClick={() => setShowConfirmModal({ action: null, show: false })}>
              <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h3>{getActionText(showConfirmModal.action)} Subscription</h3>
                  <button
                    onClick={() => setShowConfirmModal({ action: null, show: false })}
                    className={styles.closeButton}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className={styles.modalContent}>
                  <div className={styles.warningIcon}>
                    {showConfirmModal.action === 'cancel' ? '⚠️' : 'ℹ️'}
                  </div>
                  <p>{getActionDescription(showConfirmModal.action)}</p>
                  
                  {showConfirmModal.action === 'cancel' && (
                    <div className={styles.cancelWarning}>
                      <strong>Warning:</strong> This action cannot be undone. You will need to create a new subscription to continue receiving meals.
                    </div>
                  )}
                </div>

                <div className={styles.modalActions}>
                  <button
                    onClick={() => setShowConfirmModal({ action: null, show: false })}
                    className={styles.cancelModalButton}
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={confirmAction}
                    className={`${styles.confirmButton} ${showConfirmModal.action === 'cancel' ? styles.danger : ''}`}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Processing...
                      </>
                    ) : (
                      `${getActionText(showConfirmModal.action)} Subscription`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </UserLayout>
    </>
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

  const { id } = context.params!;

  if (!id || typeof id !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      subscriptionId: id,
    },
  };
};

export default SubscriptionManagementPage;