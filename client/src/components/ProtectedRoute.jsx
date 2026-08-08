import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

/**
 * Guards a route by auth state and (optionally) role.
 * Redirects unauthenticated users to /login and wrong-role users to their home.
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Loading…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'mentor' ? '/mentor' : '/dashboard'} replace />;
  }
  return children;
}
