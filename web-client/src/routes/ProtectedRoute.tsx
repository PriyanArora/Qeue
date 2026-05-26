import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import type { UserRole } from '../services/types';

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/events" replace state={{ rejected: role }} />;
  }

  return <Outlet />;
}
