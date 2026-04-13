import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    const loginPath = requiredRole === 'ADMIN' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} replace />;
  }

  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
