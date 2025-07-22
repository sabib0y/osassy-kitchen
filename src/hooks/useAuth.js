import { useSession } from 'next-auth/react';

export const useAuth = () => {
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated';
  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN';

  return {
    isAuthenticated,
    user,
    isAdmin,
    status,
  };
};
