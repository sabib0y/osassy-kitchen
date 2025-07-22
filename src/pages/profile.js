import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <div>
        <h1>Profile</h1>
        <p>
          <strong>Name:</strong> {session.user.name}
        </p>
        <p>
          <strong>Email:</strong> {session.user.email}
        </p>
        <p>
          <strong>Role:</strong> {session.user.role}
        </p>
        <button onClick={() => signOut()}>Logout</button>
      </div>
    );
  }

  return null;
};

export default ProfilePage;
