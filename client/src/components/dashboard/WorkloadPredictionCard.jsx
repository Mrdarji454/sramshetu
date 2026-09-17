import React from 'react';
import {
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Step 9 — Admin Dashboard Widget
 * Displays comprehensive AI workload prediction metrics:
 *   - Predicted Demand
 *   - Predicted Inspections
 *   - Workload Level (with color-coded badge)
 *   - Priority Score (with progress meter)
 * Includes loading skeletons, error states, and responsive layout.
 */
export function WorkloadPredictionCard({
  prediction,
  loading = false,
  error = null,
  onRefresh,
  className,
  district = 'Ahmedabad',
  serviceType = 'Plumbing',
}) {
  // Color configuration for Workload Levels
  const levelStyles = {
    CRITICAL: {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      accent: 'border-l-rose-600',
      icon: 'text-rose-600 bg-rose-50',
    },
    HIGH: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      accent: 'border-l-amber-500',
      icon: 'text-amber-600 bg-amber-50',
    },
    MODERATE: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      accent: 'border-l-blue-500',
      icon: 'text-blue-600 bg-blue-50',
    },
    LOW: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      accent: 'border-l-emerald-500',
      icon: 'text-emerald-600 bg-emerald-50',
    },
  };

  const currentLevel = (prediction?.workloadLevel || 'MODERATE').toUpperCase();
  const activeStyle = levelStyles[currentLevel] || levelStyles.MODERATE;
  const priority = Number(prediction?.priorityScore || 0);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse', className)}>
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State with Retry Button
  if (error) {
    return (
      <div className={cn('bg-white rounded-xl p-6 border border-rose-200 shadow-sm', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">AI Workload Prediction Unavailable</h4>
              <p className="text-xs text-rose-600 mt-1">{error}</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm border-l-4 transition-all duration-200',
        activeStyle.accent,
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              AI Workload Forecast
            </h3>
            <p className="text-xs text-slate-500">
              Region: <span className="font-medium text-slate-700">{district}</span> • Trade:{' '}
              <span className="font-medium text-slate-700">{serviceType}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            XGBoost v1.2.0
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh prediction"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Predicted Demand */}
        <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Predicted Demand</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {prediction?.predictedDemand ?? '--'}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <span className="text-[11px] text-slate-400">Projected dispatch volume</span>
        </div>

        {/* Metric 2: Predicted Inspections */}
        <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Predicted Inspections</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {prediction?.predictedInspections ?? '--'}
            </span>
            <span className="text-xs text-slate-400">audits</span>
          </div>
          <span className="text-[11px] text-slate-400">Statutory verification</span>
        </div>

        {/* Metric 3: Workload Level */}
        <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Workload Level</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide uppercase',
                activeStyle.badge
              )}
            >
              {currentLevel}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Capacity stress status</span>
        </div>

        {/* Metric 4: Priority Score */}
        <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Priority Score</span>
            <span className="text-xs font-bold text-slate-700">{priority} / 100</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-500',
                  priority >= 80
                    ? 'bg-rose-500'
                    : priority >= 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, Math.max(0, priority))}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">Resource allocation urgency</span>
        </div>
      </div>

      {/* Express Recommendation Banner (Step 10) */}
      {prediction?.recommendation && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-0.5">
            Action:
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            {prediction.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

export default WorkloadPredictionCard;

