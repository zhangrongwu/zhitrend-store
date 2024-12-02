import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function RouteGuard({ 
  children, 
  requireAuth = false,
  requireAdmin = false 
}: RouteGuardProps) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (requireAuth && !token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 