import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';

const ProfilePage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the proper user profile page
    router.replace('/user/profile');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Redirecting to your profile...</p>
    </div>
  );
};

export default ProfilePage;