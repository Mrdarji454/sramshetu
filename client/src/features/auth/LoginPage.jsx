import React, { useState, useEffect } from 'react';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Lock, 
  Phone, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Users,
  HardHat,
  Building2
} from 'lucide-react';

export function LoginPage() {
  const { login, isAuthenticated, user, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('+919876543210');
  const [password, setPassword] = useState('securePassword123');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const fromPath = location.state?.from?.pathname;
      const targetPath = fromPath || getRoleDashboardPath(user.role);
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!identifier.trim() || !password.trim()) {
      setFormError('Please enter both your phone/email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(identifier.trim(), password);
      const fromPath = location.state?.from?.pathname;
      const targetPath = fromPath || getRoleDashboardPath(loggedUser.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for testing each role easily
  const handleQuickFill = (role, phone, pass) => {
    setIdentifier(phone);
    setPassword(pass);
    setFormError('');
    clearError();
  };

  const displayError = formError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-grid-pattern">
      <div className="gov-tricolor-stripe fixed top-0 left-0 right-0 z-50" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Link to="/">
            <Logo size="lg" showTagline={true} />
          </Link>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-brand-navy-900 font-display">
          Portal Sign In
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-600">
          Access your sovereign cooperative account with direct DBT settlement
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl">
          
          {/* Error Banner */}
          {displayError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number or Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. +919876543210 or name@domain.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full py-3"
                icon={isSubmitting ? Loader2 : Lock}
                iconRight={!isSubmitting ? ArrowRight : undefined}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Bar for Easy Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Fill Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('USER', '+919876543210', 'securePassword123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer (USER)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('WORKER', '+919820144019', 'workerPass123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center gap-1.5"
              >
                <HardHat className="w-3.5 h-3.5 text-brand-saffron-600" />
                <span>Worker (WORKER)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('COOPERATIVE', '+919820199999', 'coopSecret123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cooperative Society</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('ADMIN', '+919999999999', 'adminSecret123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Platform Admin</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-brand-saffron-600 hover:underline">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
