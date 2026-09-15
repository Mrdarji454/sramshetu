import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

/**
 * ProtectedRoute: Enforces authentication and role-based access control.
 *
 * @param {Array<string>} allowedRoles - Allowed roles (e.g. ['USER', 'WORKER', 'COOPERATIVE', 'ADMIN'])
 * @param {React.ReactNode} children - Optional children (falls back to <Outlet />)
 */
export function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-brand-saffron-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Verifying session security...</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to login, saving intended URL
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role Authorization Check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toUpperCase();
    const normalizedUserRole = userRole === 'CUSTOMER' ? 'USER' : userRole;

    const isAuthorized = allowedRoles.some((role) => {
      const r = role.toUpperCase();
      const normalizedRole = r === 'CUSTOMER' ? 'USER' : r;
      return normalizedRole === normalizedUserRole;
    });

    if (!isAuthorized) {
      // Render Unauthorized screen with clear instructions and safe redirect
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 font-display">
              Access Restricted
            </h2>

            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your account with role <strong className="font-semibold text-brand-navy-900">[{user.role}]</strong> does not have permission to access this portal.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
              Required Role: <span className="font-semibold text-slate-800">{allowedRoles.join(' or ')}</span>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <NavigateToOwnDashboard userRole={user.role} />
              <a href="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium py-2">
                Return to ShramSetu Home
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  return children ? children : <Outlet />;
}

function NavigateToOwnDashboard({ userRole }) {
  const ownPath = getRoleDashboardPath(userRole);
  return (
    <a href={ownPath} className="w-full">
      <Button variant="primary" size="md" className="w-full" icon={ArrowLeft}>
        Go to My Role Dashboard
      </Button>
    </a>
  );
}

export default ProtectedRoute;
