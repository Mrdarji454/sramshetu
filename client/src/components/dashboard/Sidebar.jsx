import React from 'react';
import {
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
  Users,
  Building2,
  HardHat,
  Lock,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function Sidebar({
  role = 'user', // 'user' | 'cooperative' | 'worker' | 'admin'
  navigation = [],
  activeTab,
  onTabChange,
  isOpen = false,
  onClose,
  userProfile,
  onSwitchRole,
  onBackToHome,
}) {
  const roleThemes = {
    user: {
      name: 'Customer Portal',
      subtitle: 'Citizen & Enterprise',
      icon: Users,
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      activeItem: 'bg-brand-saffron-500 text-white shadow-sm font-semibold',
    },
    cooperative: {
      name: 'Cooperative HQ',
      subtitle: 'Guild Administration',
      icon: Building2,
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      activeItem: 'bg-indigo-600 text-white shadow-sm font-semibold',
    },
    worker: {
      name: 'Shramik Desk',
      subtitle: 'Certified Guild Artisan',
      icon: HardHat,
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      activeItem: 'bg-amber-600 text-white shadow-sm font-semibold',
    },
    admin: {
      name: 'GovTech Command',
      subtitle: 'State Registry Oversight',
      icon: Lock,
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      activeItem: 'bg-brand-navy-700 text-white shadow-sm font-semibold border-l-4 border-amber-400',
    },
  };

  const currentTheme = roleThemes[role] || roleThemes.user;
  const RoleIcon = currentTheme.icon;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-brand-navy-950 text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sovereign Tricolor Ribbon */}
        <div className="gov-tricolor-stripe" />

        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-saffron-500 via-amber-600 to-brand-emerald-600 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-brand-navy-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5 text-brand-saffron-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold font-display text-white tracking-tight">
                  ShramSetu
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-semibold">
                  SIH 2026
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RoleIcon className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] text-slate-400 font-medium">
                  {currentTheme.name}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Identity Tag */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              {currentTheme.subtitle}
            </span>
          </div>
          <span
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
              currentTheme.badge
            )}
          >
            {role.toUpperCase()}
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  onClose?.();
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group',
                  isActive
                    ? currentTheme.activeItem
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                        isActive
                          ? 'bg-black/25 text-white'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Back to Landing */}
        {onBackToHome && (
          <div className="px-3 py-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-brand-saffron-400" />
              <span>Back to Public Portal</span>
            </button>
          </div>
        )}

        {/* User Profile Snippet */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-navy-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                {userProfile?.name?.charAt(0) || 'U'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {userProfile?.name || 'Authorized User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {userProfile?.city || userProfile?.district || 'India'}
              </p>
            </div>
          </div>

          {/* Persona Switcher Buttons */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span>Switch Persona:</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { r: 'user', label: 'User' },
                { r: 'cooperative', label: 'Coop' },
                { r: 'worker', label: 'Worker' },
                { r: 'admin', label: 'Admin' },
              ].map(({ r, label }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSwitchRole && onSwitchRole(r)}
                  className={cn(
                    'py-1 rounded text-[10px] font-semibold transition-colors',
                    role === r
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

