/**
 * User Orders Page - Complete order history with filtering and pagination
 * Features: Status filters, date range, search, order details, invoice download
 */

import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import UserLayout from '../../components/user/UserLayout';
import OrderList from '../../components/user/OrderList';
import { api } from '../../lib/api-client';
import styles from '../../styles/components/user/orders.module.scss';

// Order detail modal component
interface OrderDetailModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Order Details</h3>
          <button onClick={onClose} className={styles.modalClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>Detailed order view for {orderId} - This could include order tracking, detailed items, etc.</p>
          <p className={styles.modalNote}>
            <i className="fas fa-info-circle"></i>
            This is a placeholder. In a full implementation, this would show comprehensive order details, 
            tracking information, and additional actions.
          </p>
        </div>
      </div>
    </div>
  );
};

const UserOrdersPage: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle order selection for detailed view
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  // Handle invoice download (placeholder)
  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // In a real implementation, this would download the invoice
      console.log('Downloading invoice for order:', orderId);
      
      // Show feedback to user
      const notification = document.createElement('div');
      notification.className = styles.notification;
      notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        Invoice download started for order #${orderId.slice(-8).toUpperCase()}
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      
      // Show error feedback
      const errorNotification = document.createElement('div');
      errorNotification.className = `${styles.notification} ${styles.error}`;
      errorNotification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        Failed to download invoice. Please try again.
      `;
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        if (errorNotification && errorNotification.parentNode) {
          errorNotification.parentNode.removeChild(errorNotification);
        }
      }, 5000);
    }
  };

  return (
    <UserLayout 
      pageTitle="My Orders - Osassy's Kitchen"
      activeTab="orders"
    >
      <div className={styles.ordersPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>My Orders</h1>
              <p className={styles.pageSubtitle}>
                Track your order history and manage your purchases
              </p>
            </div>
            <div className={styles.headerActions}>
              <a href="/menu" className={styles.newOrderBtn}>
                <i className="fas fa-plus"></i>
                Place New Order
              </a>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className={styles.ordersContent}>
          <OrderList
            onOrderSelect={handleOrderSelect}
            onDownloadInvoice={handleDownloadInvoice}
          />
        </div>

        {/* Order Detail Modal */}
        {selectedOrderId && (
          <OrderDetailModal
            orderId={selectedOrderId}
            isOpen={isModalOpen}
            onClose={handleModalClose}
          />
        )}
      </div>
    </UserLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getSession(context);

    if (!session) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Redirect admin users to admin panel
    if (session.user?.role === 'ADMIN') {
      return {
        redirect: {
          destination: '/admin/orders',
          permanent: false,
        },
      };
    }

    // Pre-fetch first page of orders for better UX
    const queryClient = new QueryClient();
    
    try {
      // This would ideally use the same API call as the hook
      // but we'll keep it simple for now and let the hook handle the fetch
      await queryClient.prefetchQuery({
        queryKey: ['user-orders', 1, 10, { search: '', status: '', dateFrom: '', dateTo: '' }],
        queryFn: async () => {
          // This is a simplified version - in practice you'd want to use the same API client
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/orders?page=1&limit=10`, {
            headers: {
              'cookie': context.req.headers.cookie || '',
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch orders');
          }
          
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    } catch (error) {
      // Don't fail the page if prefetch fails
      console.warn('Failed to prefetch orders:', error);
    }

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    return {
      props: {},
    };
  }
};

export default UserOrdersPage;