import React, { useState } from 'react';
import { PaymentMethod } from '../../types/user';
import styles from '../../styles/components/user/payments.module.scss';

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
  onRemove: (paymentMethodId: string) => Promise<void>;
  onSetDefault: (paymentMethodId: string) => Promise<void>;
  isProcessing: boolean;
}

const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  paymentMethods,
  defaultPaymentMethodId,
  onRemove,
  onSetDefault,
  isProcessing,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getCardBrandIcon = (brand: string): string => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return 'fab fa-cc-visa';
      case 'mastercard':
        return 'fab fa-cc-mastercard';
      case 'amex':
      case 'american express':
        return 'fab fa-cc-amex';
      case 'discover':
        return 'fab fa-cc-discover';
      case 'diners':
      case 'diners club':
        return 'fab fa-cc-diners-club';
      case 'jcb':
        return 'fab fa-cc-jcb';
      default:
        return 'fas fa-credit-card';
    }
  };

  const formatCardBrand = (brand: string): string => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'amex':
        return 'American Express';
      case 'diners':
        return 'Diners Club';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };

  const isCardExpired = (expMonth: number, expYear: number): boolean => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    
    if (expYear < currentYear) return true;
    if (expYear === currentYear && expMonth < currentMonth) return true;
    return false;
  };

  const formatExpiryDate = (expMonth: number, expYear: number): string => {
    const month = expMonth.toString().padStart(2, '0');
    const year = expYear.toString().slice(-2);
    return `${month}/${year}`;
  };

  const handleRemove = async (paymentMethodId: string) => {
    if (confirmDelete === paymentMethodId) {
      setProcessingId(paymentMethodId);
      try {
        await onRemove(paymentMethodId);
        setConfirmDelete(null);
      } catch (error) {
        // Error handling is done in the parent component
      } finally {
        setProcessingId(null);
      }
    } else {
      setConfirmDelete(paymentMethodId);
      // Reset confirmation after 5 seconds
      setTimeout(() => {
        setConfirmDelete(null);
      }, 5000);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (paymentMethodId === defaultPaymentMethodId) return;
    
    setProcessingId(paymentMethodId);
    try {
      await onSetDefault(paymentMethodId);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setProcessingId(null);
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="fas fa-credit-card"></i>
        <h3>No Payment Methods</h3>
        <p>Add a payment method to make purchases and manage your subscriptions</p>
      </div>
    );
  }

  return (
    <div className={styles.paymentMethodList}>
      {paymentMethods.map((method) => {
        const isExpired = isCardExpired(method.card.expMonth, method.card.expYear);
        const isDefault = method.id === defaultPaymentMethodId || method.isDefault;
        const isBeingProcessed = processingId === method.id;
        
        return (
          <div
            key={method.id}
            className={`${styles.paymentMethodCard} ${isDefault ? styles.default : ''} ${isExpired ? styles.expired : ''}`}
            data-testid={`payment-method-${method.id}`}
          >
            <div className={styles.cardInfo}>
              <div className={styles.cardIcon}>
                <i className={getCardBrandIcon(method.card.brand)}></i>
              </div>
              
              <div className={styles.cardDetails}>
                <div className={styles.cardNumber}>
                  <span className={styles.brand}>{formatCardBrand(method.card.brand)}</span>
                  <span className={styles.last4}>•••• {method.card.last4}</span>
                </div>
                
                <div className={styles.cardMeta}>
                  <span className={styles.expiry}>
                    Expires {formatExpiryDate(method.card.expMonth, method.card.expYear)}
                  </span>
                  
                  {isExpired && (
                    <span className={styles.expiredBadge}>
                      <i className="fas fa-exclamation-triangle"></i> Expired
                    </span>
                  )}
                  
                  {isDefault && (
                    <span className={styles.defaultBadge}>
                      <i className="fas fa-check-circle"></i> Default
                    </span>
                  )}
                </div>
                
                {method.billingDetails?.name && (
                  <div className={styles.cardHolder}>
                    {method.billingDetails.name}
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.cardActions}>
              {!isDefault && !isExpired && (
                <button
                  className={styles.setDefaultBtn}
                  onClick={() => handleSetDefault(method.id)}
                  disabled={isProcessing || isBeingProcessed}
                  aria-label="Set as default payment method"
                >
                  {isBeingProcessed ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fas fa-star"></i>
                      <span>Set Default</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                className={`${styles.removeBtn} ${confirmDelete === method.id ? styles.confirm : ''}`}
                onClick={() => handleRemove(method.id)}
                disabled={isProcessing || isBeingProcessed}
                aria-label={confirmDelete === method.id ? "Confirm removal" : "Remove payment method"}
              >
                {isBeingProcessed ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : confirmDelete === method.id ? (
                  <>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Confirm?</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    <span className={styles.removeBtnText}>Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentMethodList;