// Example of how to use the new UserLayout with existing dashboard functionality
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import UserLayout from '../../components/user/UserLayout';
import { DashboardStats } from '../../types/user';

const ExampleWithUserLayout: React.FC = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    activeSubscriptions: 0,
    totalOrders: 0,
    totalSpent: 0
  });

  // Example content that would be wrapped with UserLayout
  return (
    <UserLayout pageTitle="Example Page - Osassy's Kitchen" activeTab="overview">
      <div style={{ padding: '24px' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 2px 12px rgba(193, 45, 47, 0.06)',
          border: '1px solid rgba(193, 45, 47, 0.04)'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1E1E1E', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="fas fa-chart-line" style={{ color: '#FF6F3C' }}></i>
            Dashboard Example with New Layout
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #FF6F3C 0%, #FF8F60 100%)',
              color: 'white',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
                {stats.activeSubscriptions}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Active Subscriptions</p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #F1C40F 0%, #FFD93D 100%)',
              color: '#1E1E1E',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
                {stats.totalOrders}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Total Orders</p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #C52D2F 0%, #E85D5F 100%)',
              color: 'white',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
                {stats.totalOrders}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Orders</p>
            </div>
          </div>

          <div style={{ 
            background: '#FAFAFA', 
            padding: '24px', 
            borderRadius: '12px',
            border: '1px solid rgba(193, 45, 47, 0.06)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#1E1E1E', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-info-circle" style={{ color: '#FF6F3C' }}></i>
              Integration Guide
            </h3>
            
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              color: '#666', 
              lineHeight: '1.6' 
            }}>
              <li>This page demonstrates how to wrap existing content with the new UserLayout</li>
              <li>The layout provides consistent navigation, header, and responsive behaviour</li>
              <li>All existing dashboard functionality can be moved into this structure</li>
              <li>The sidebar automatically highlights the active page based on routing</li>
              <li>Mobile responsiveness is built-in with collapsible sidebar</li>
              <li>User profile and notifications are handled in the header</li>
            </ul>

            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'white', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 111, 60, 0.2)'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#FF6F3C', fontWeight: '600' }}>
                💡 To integrate existing dashboard: Replace the Layout component with UserLayout and move tab-specific content into separate page components.
              </p>
            </div>
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
        destination: '/admin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default ExampleWithUserLayout;