import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export function UnauthorizedPage() {
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role || 'USER';
  const ownDashboardPath = getRoleDashboardPath(userRole);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="gov-tricolor-stripe fixed top-0 left-0 right-0 z-50" />

      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-100">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <h1 className="text-2xl font-extrabold text-brand-navy-900 font-display">
          403 - Access Denied
        </h1>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          You do not have permission to view the requested page.
          {isAuthenticated && user && (
            <>
              {' '}Your account is currently signed in as{' '}
              <strong className="font-semibold text-brand-navy-900">[{user.role}]</strong>.
            </>
          )}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {isAuthenticated ? (
            <Link to={ownDashboardPath} className="w-full">
              <Button variant="primary" size="md" className="w-full" icon={ArrowLeft}>
                Go to My Role Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login" className="w-full">
              <Button variant="primary" size="md" className="w-full">
                Sign In with Authorized Account
              </Button>
            </Link>
          )}

          <Link to="/" className="w-full">
            <Button variant="ghost" size="sm" className="w-full text-slate-600" icon={Home}>
              Return to ShramSetu Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;

