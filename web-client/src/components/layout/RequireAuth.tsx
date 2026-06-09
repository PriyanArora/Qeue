import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import type { Role } from '../../lib/types';
import { LoadingBlock } from '../ui/States';

/** Guards routes by authentication and (optionally) a required role. */
export function RequireAuth({ role }: { role?: Role }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingBlock label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
