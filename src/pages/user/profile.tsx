import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Layout from '../../components/Layout/Layout';
import styles from '../../styles/components/user/dashboard.module.scss';

const UserProfile: React.FC = () => {
  return (
    <Layout pageTitle="My Profile - Osassy Kitchen">
      <div className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <i className="fas fa-user"></i>
            <h3>Profile Settings</h3>
            <p>Manage your account information and preferences</p>
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

export default UserProfile;