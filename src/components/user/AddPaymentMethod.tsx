import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeCardElementOptions } from '@stripe/stripe-js';
import styles from '../../styles/components/user/payments.module.scss';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodFormProps {
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  const cardElementOptions: StripeCardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1E1E1E',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#666EE8',
      },
      invalid: {
        color: '#C52D2F',
        iconColor: '#C52D2F',
      },
    },
    hidePostalCode: false,
  };

  const createSetupIntent = async (): Promise<string> => {
    const response = await fetch('/api/user/payment-methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create setup intent');
    }

    const data = await response.json();
    return data.clientSecret;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !cardComplete) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create SetupIntent on the server
      const clientSecret = await createSetupIntent();

      // Get the CardElement
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm the SetupIntent with the card details
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName || undefined,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Failed to add payment method');
      }

      if (setupIntent?.status === 'succeeded') {
        // Payment method added successfully
        await onSuccess();
        
        // Clear the form
        cardElement.clear();
        setCardholderName('');
        setCardComplete(false);
      } else {
        throw new Error('Failed to confirm payment method');
      }
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form className={styles.addPaymentForm} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h3>Add Payment Method</h3>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onCancel}
          disabled={isProcessing}
          aria-label="Cancel"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label htmlFor="cardholderName">Cardholder Name</label>
          <input
            id="cardholderName"
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
            className={styles.textInput}
            disabled={isProcessing}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="card-element">Card Details</label>
          <div className={styles.cardElementWrapper}>
            <CardElement
              id="card-element"
              options={cardElementOptions}
              onChange={handleCardChange}
            />
          </div>
          <p className={styles.helpText}>
            Your card information is encrypted and secure
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className={styles.formFooter}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!stripe || !cardComplete || isProcessing}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <i className="fas fa-plus"></i>
              <span>Add Card</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

interface AddPaymentMethodProps {
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

const AddPaymentMethod: React.FC<AddPaymentMethodProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <AddPaymentMethodForm {...props} />
    </Elements>
  );
};

export default AddPaymentMethod;