import { useAtomValue } from 'jotai';
import { Navigate } from 'react-router-dom';
import { isAdminAuthenticatedAtom } from '@/store/atoms';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAtomValue(isAdminAuthenticatedAtom);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
