import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Layout from '../../components/Layout/Layout';
import styles from '../../styles/components/user/dashboard.module.scss';

const UserPayments: React.FC = () => {
  return (
    <Layout pageTitle="Payment Methods - Osassy Kitchen">
      <div className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <i className="fas fa-credit-card"></i>
            <h3>Payment Methods</h3>
            <p>Manage your billing and payment information</p>
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

export default UserPayments;