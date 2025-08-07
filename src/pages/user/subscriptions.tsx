import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import styles from '../../styles/components/user/dashboard.module.scss';

const UserSubscriptions: React.FC = () => {
  return (
    <Layout pageTitle="My Subscriptions - Osassy Kitchen">
      <div className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <i className="fas fa-sync-alt"></i>
            <h3>No Subscriptions Yet</h3>
            <p>Start your meal subscription journey today!</p>
            <Link href="/subscriptions/create">
              <button className={styles.primaryBtn}>Create Subscription</button>
            </Link>
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

export default UserSubscriptions;