import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (isAuthenticated && adminOnly && !isAdmin) {
      router.push('/unauthorized');
    }
  }, [status, isAuthenticated, isAdmin, adminOnly, router]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (isAuthenticated && (!adminOnly || isAdmin)) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;
