import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Layout from '../../components/Layout/Layout';
import styles from '../../styles/components/user/dashboard.module.scss';

const UserOrders: React.FC = () => {
  return (
    <Layout pageTitle="My Orders - Osassy Kitchen">
      <div className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <i className="fas fa-shopping-bag"></i>
            <h3>No Orders Yet</h3>
            <p>Your order history will appear here</p>
          </div>
        </div>
      </div>
    </Layout>
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

export default UserOrders;