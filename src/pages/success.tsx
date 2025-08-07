import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '@/components/Layout/Layout';
import OrderConfirmation from '@/components/OrderConfirmation';
import { Loader2 } from 'lucide-react';
import styles from '@/styles/pages/success.module.css';

interface CheckoutSessionData {
  id: string;
  customer_email: string;
  customer_details?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  metadata?: {
    userId?: string;
    items?: OrderItem[];
    billingInterval?: 'WEEKLY' | 'MONTHLY';
    priceId?: string;
  };
  payment_method_types?: string[];
  payment_status?: string;
  amount_subtotal?: number;
  amount_total?: number;
  currency?: string;
  subscription?: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
  } | null;
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  status?: string;
  created?: number;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

const SuccessPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { session_id } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<CheckoutSessionData | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!session_id || typeof session_id !== 'string') {
      // If no session ID or invalid format, redirect to subscriptions page
      if (router.isReady) {
        router.push('/user/subscriptions');
      }
      return;
    }

    // Fetch session details
    const fetchSessionDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Call an API endpoint to retrieve session details
        const response = await fetch(`/api/checkout/session/${session_id}`);
        
        if (!response.ok) {
          // If session not found or error, we can still show a generic success message
          console.warn('Could not fetch session details');
          setSessionData({
            id: session_id,
            customer_email: session?.user?.email || '',
            metadata: {
              billingInterval: 'WEEKLY',
              items: []
            }
          } as CheckoutSessionData);
        } else {
          const data = await response.json();
          setSessionData(data);

          // Items are already parsed in the API response
          if (data.metadata?.items && Array.isArray(data.metadata.items)) {
            setOrderItems(data.metadata.items);
          }
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionDetails();
  }, [session_id, router.isReady, session, router]);

  // Show loading state while checking authentication
  if (status === 'loading' || (isLoading && !error)) {
    return (
      <Layout pageTitle="Processing Order - Osassy Kitchen">
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <Loader2 className={styles.spinner} />
            <h2>Processing your order...</h2>
            <p>Please wait while we confirm your subscription</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate totals
  const itemsSubtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 500;
  
  // Use Stripe amounts when no items, otherwise calculate from items
  const subtotal = orderItems.length > 0 
    ? itemsSubtotal 
    : (sessionData?.amount_subtotal ? sessionData.amount_subtotal / 100 : 0);
  
  const total = orderItems.length > 0
    ? itemsSubtotal + deliveryFee
    : (sessionData?.amount_total ? sessionData.amount_total / 100 : 0);

  return (
    <Layout pageTitle="Order Successful - Osassy Kitchen">
      <Head>
        <title>Order Successful - Osassy Kitchen</title>
        <meta name="description" content="Your subscription has been successfully created" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.content}>
          <OrderConfirmation
            sessionId={session_id as string}
            orderId={sessionData?.subscription?.id}
            customerName={sessionData?.customer_details?.name || session?.user?.name || 'Customer'}
            customerEmail={sessionData?.customer_details?.email || session?.user?.email || undefined}
            items={orderItems}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            billingInterval={sessionData?.metadata?.billingInterval || 'WEEKLY'}
            paymentMethod={
              sessionData?.payment_method_types?.[0] 
                ? { brand: sessionData.payment_method_types[0] }
                : undefined
            }
            deliveryAddress={sessionData?.billing_address || sessionData?.customer_details?.address}
            isLoading={isLoading}
            error={error || undefined}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SuccessPage;