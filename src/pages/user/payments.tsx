import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import UserLayout from '../../components/user/UserLayout';
import PaymentMethodList from '../../components/user/PaymentMethodList';
import AddPaymentMethod from '../../components/user/AddPaymentMethod';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import styles from '../../styles/components/user/payments.module.scss';

const UserPayments: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const {
    paymentMethods,
    defaultPaymentMethodId,
    loading,
    error,
    fetchPaymentMethods,
    removePaymentMethod,
    setDefaultPaymentMethod,
    isProcessing,
  } = usePaymentMethods();

  const handleAddSuccess = async () => {
    setShowAddForm(false);
    await fetchPaymentMethods();
  };

  const handleRemove = async (paymentMethodId: string) => {
    try {
      await removePaymentMethod(paymentMethodId);
    } catch (err) {
      // Error is handled in the hook
      console.error('Failed to remove payment method:', err);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await setDefaultPaymentMethod(paymentMethodId);
    } catch (err) {
      // Error is handled in the hook
      console.error('Failed to set default payment method:', err);
    }
  };

  return (
    <UserLayout pageTitle="Payment Methods - Osassy's Kitchen" activeTab="payments">
      <div className={styles.paymentsPage}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>Payment Methods</h1>
            <p>Manage your payment methods for subscriptions and orders</p>
          </div>
          
          {!showAddForm && paymentMethods.length > 0 && (
            <button
              className={styles.addButton}
              onClick={() => setShowAddForm(true)}
              disabled={isProcessing}
            >
              <i className="fas fa-plus"></i>
              <span>Add Payment Method</span>
            </button>
          )}
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
            <button
              className={styles.dismissBtn}
              onClick={() => window.location.reload()}
              aria-label="Retry"
            >
              <i className="fas fa-redo"></i>
            </button>
          </div>
        )}

        <div className={styles.pageContent}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading payment methods...</p>
            </div>
          ) : showAddForm ? (
            <div className={styles.addFormContainer}>
              <AddPaymentMethod
                onSuccess={handleAddSuccess}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyState}>
                <i className="fas fa-credit-card"></i>
                <h3>No Payment Methods</h3>
                <p>Add a payment method to make purchases and manage your subscriptions</p>
                <button
                  className={styles.addButtonLarge}
                  onClick={() => setShowAddForm(true)}
                >
                  <i className="fas fa-plus"></i>
                  <span>Add Your First Payment Method</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <PaymentMethodList
                paymentMethods={paymentMethods}
                defaultPaymentMethodId={defaultPaymentMethodId}
                onRemove={handleRemove}
                onSetDefault={handleSetDefault}
                isProcessing={isProcessing}
              />
              
              <div className={styles.securityNote}>
                <i className="fas fa-lock"></i>
                <div>
                  <h4>Your payment information is secure</h4>
                  <p>
                    We use industry-standard encryption to protect your payment details. 
                    Card information is stored securely with our payment processor, Stripe.
                  </p>
                </div>
              </div>
            </>
          )}
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

  return {
    props: {},
  };
};

export default UserPayments;