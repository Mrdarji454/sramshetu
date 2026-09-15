import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/common/Logo';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  LogOut, 
  Home, 
  User as UserIcon, 
  ShieldCheck, 
  Bell,
  HardHat,
  Building2,
  Lock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function DashboardLayout({ title, subtitle, roleBadge, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch ((user?.role || '').toUpperCase()) {
      case 'COOPERATIVE':
        return Building2;
      case 'WORKER':
        return HardHat;
      case 'ADMIN':
        return Lock;
      case 'USER':
      case 'CUSTOMER':
      default:
        return UserIcon;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Sovereign Line */}
      <div className="gov-tricolor-stripe" />

      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" title="Go to ShramSetu Home">
              <Logo size="sm" showTagline={false} />
            </Link>
            <span className="hidden md:inline-block h-5 w-px bg-slate-200" />
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="gov" size="sm">
                Portal: {(user?.role || 'USER').toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" icon={Home} className="hidden sm:inline-flex">
                Marketplace
              </Button>
            </Link>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-lg bg-brand-navy-900 text-white flex items-center justify-center font-bold">
                <RoleIcon className="w-4 h-4 text-brand-saffron-400" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-bold text-slate-900 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-mono">{user?.phone || user?.email}</p>
              </div>
            </div>

            {/* Logout CTA */}
            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy-900 font-display">
                  {title}
                </h1>
                {roleBadge && (
                  <Badge variant="verified" size="sm" icon={ShieldCheck}>
                    {roleBadge}
                  </Badge>
                )}
              </div>
              {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
