import React from 'react';
import { Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Step 10 — Cooperative Dashboard Widget
 * Compact widget for cooperative administrators displaying:
 *   - Demand Level
 *   - Priority Score
 *   - Recommended Action (generated dynamically by Express backend)
 */
export function CooperativeWorkloadWidget({
  prediction,
  loading = false,
  className,
}) {
  const level = (prediction?.workloadLevel || 'MODERATE').toUpperCase();
  const priority = Number(prediction?.priorityScore || 0);
  const recommendation =
    prediction?.recommendation ||
    'Standard fair-rotation dispatch recommended. Monitor regional booking velocity.';

  const levelBadgeStyles = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
    MODERATE: 'bg-blue-100 text-blue-800 border-blue-200',
    LOW: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse space-y-3', className)}>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="h-8 w-20 bg-slate-200 rounded"></div>
        <div className="h-4 w-full bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-navy-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cooperative Demand Status
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          Priority: {priority}/100
        </span>
      </div>

      {/* Main Level & Score */}
      <div className="flex items-center justify-between gap-4 my-2">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Demand Level</span>
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide uppercase',
              levelBadgeStyles[level] || levelBadgeStyles.MODERATE
            )}
          >
            {level}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block mb-1">Forecast Demand</span>
          <span className="text-xl font-bold text-slate-900">
            {prediction?.predictedDemand ?? '--'} <span className="text-xs font-normal text-slate-500">units</span>
          </span>
        </div>
      </div>

      {/* Priority Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 my-3 overflow-hidden">
        <div
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            priority >= 80 ? 'bg-rose-500' : priority >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: `${Math.min(100, Math.max(0, priority))}%` }}
        />
      </div>

      {/* Dynamic Express Recommendation */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
        <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="leading-snug">
          <span className="font-semibold text-slate-800">Action: </span>
          {recommendation}
        </p>
      </div>
    </div>
  );
}

export default CooperativeWorkloadWidget;

