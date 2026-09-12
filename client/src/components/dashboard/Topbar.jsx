import React, { useState } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  HardHat,
  Lock,
  Home,
} from 'lucide-react';
import { SearchBar } from './SearchBar';
import { cn } from '../../utils/cn';

export function Topbar({
  title,
  subtitle,
  role = 'user',
  onSwitchRole,
  onToggleSidebar,
  searchValue = '',
  onSearchChange,
  onBackToHome,
  userProfile,
  notificationCount = 3,
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const roles = [
    {
      id: 'user',
      name: 'User / Citizen',
      desc: 'Book services & track bookings',
      icon: UserCheck,
      color: 'text-emerald-600',
    },
    {
      id: 'cooperative',
      name: 'Cooperative HQ',
      desc: 'Manage guild members & assign jobs',
      icon: Building2,
      color: 'text-indigo-600',
    },
    {
      id: 'worker',
      name: 'Worker / Shramik',
      desc: 'View schedule, jobs & 0% fee earnings',
      icon: HardHat,
      color: 'text-amber-600',
    },
    {
      id: 'admin',
      name: 'GovTech Admin',
      desc: 'Registry oversight & verifications',
      icon: Lock,
      color: 'text-blue-600',
    },
  ];

  const currentRoleObj = roles.find((r) => r.id === role) || roles[0];

  const notifications = [
    {
      id: 1,
      title: 'Smart Escrow Safe Handshake',
      desc: 'Worker checked in via dynamic QR. Payment locked safely.',
      time: '10m ago',
      type: 'success',
    },
    {
      id: 2,
      title: 'Direct DBT Settled',
      desc: '₹950 transferred directly to bank account with 0% middleman cut.',
      time: '1h ago',
      type: 'info',
    },
    {
      id: 3,
      title: 'NSDC Skill Verification Update',
      desc: 'New certification verified on Skill India portal.',
      time: '3h ago',
      type: 'alert',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center / SearchBar */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            size="sm"
            placeholder="Quick search across records, IDs, trades..."
          />
        </div>

        {/* Right Side: Role Switcher & Notifications & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Back to Home Button */}
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              title="Return to Public Portal"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium"
            >
              <Home className="w-4 h-4 text-brand-saffron-500" />
              <span>Public Portal</span>
            </button>
          )}

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/75 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Role:</span>
              <span className="truncate max-w-[120px]">{currentRoleObj.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Active Dashboard
                  </p>
                </div>
                <div className="py-1">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = r.id === role;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          onSwitchRole && onSwitchRole(r.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left flex items-start gap-2.5 px-3 py-2 text-xs transition-colors',
                          isSelected
                            ? 'bg-amber-50/80 text-amber-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <div className={cn('p-1.5 rounded-md bg-slate-100 mt-0.5', r.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 flex items-center justify-between">
                            <span>{r.name}</span>
                            {isSelected && (
                              <span className="text-[10px] text-amber-700 font-bold">Active</span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{r.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setRoleDropdownOpen(false);
              }}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-saffron-500 ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200/90 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {notificationCount}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Clear all</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            {n.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          {userProfile?.avatar ? (
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 hidden sm:block"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-navy-900 text-amber-400 font-bold text-xs flex items-center justify-center border border-slate-200 hidden sm:flex">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

