import { useSession } from 'next-auth/react';

interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: AuthUser | undefined;
  isAdmin: boolean;
  status: "authenticated" | "loading" | "unauthenticated";
}

export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated';
  const user = session?.user as AuthUser | undefined;
  const isAdmin = user?.role === 'ADMIN';

  return {
    isAuthenticated,
    user,
    isAdmin,
    status,
  };
};