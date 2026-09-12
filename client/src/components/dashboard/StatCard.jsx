import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export function StatCard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  subtext,
  color = 'navy',
  badge,
  onClick,
  className,
}) {
  const colorStyles = {
    navy: {
      iconBg: 'bg-brand-navy-50 text-brand-navy-700 border-brand-navy-100',
      accent: 'border-l-brand-navy-600',
    },
    saffron: {
      iconBg: 'bg-brand-saffron-50 text-brand-saffron-600 border-brand-saffron-100',
      accent: 'border-l-brand-saffron-500',
    },
    emerald: {
      iconBg: 'bg-brand-emerald-50 text-brand-emerald-700 border-brand-emerald-100',
      accent: 'border-l-brand-emerald-500',
    },
    ashoka: {
      iconBg: 'bg-blue-50 text-blue-700 border-blue-100',
      accent: 'border-l-blue-600',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-700 border-purple-100',
      accent: 'border-l-purple-600',
    },
  };

  const activeStyle = colorStyles[color] || colorStyles.navy;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-5 border border-slate-200/90 shadow-card transition-all duration-200 relative overflow-hidden',
        'border-l-4',
        activeStyle.accent,
        onClick && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
              {title}
            </span>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                {badge}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              'p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center',
              activeStyle.iconBg
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(change || subtext) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {change && (
            <div
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                isPositive ? 'text-emerald-700' : 'text-rose-600'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{change}</span>
            </div>
          )}
          {subtext && (
            <span className="text-slate-400 text-[11px] truncate ml-auto">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

