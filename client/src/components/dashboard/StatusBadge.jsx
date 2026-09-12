import React from 'react';
import { cn } from '../../utils/cn';

export function StatusBadge({ status, label, size = 'md', className }) {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  const configs = {
    // Worker availability
    available: {
      label: 'Available',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
    },
    busy: {
      label: 'On Active Job',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    on_leave: {
      label: 'On Leave',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    },
    offline: {
      label: 'Offline',
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: 'bg-slate-400',
    },

    // Job / Booking status
    pending: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
    },
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
    },
    assigned: {
      label: 'Worker Assigned',
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      dot: 'bg-teal-500 animate-pulse',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },

    // Payments & Escrow
    escrow_held: {
      label: 'Escrow Locked',
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      dot: 'bg-amber-600 animate-pulse',
    },
    held: {
      label: 'Escrow Locked',
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      dot: 'bg-amber-600 animate-pulse',
    },
    released: {
      label: 'DBT Settled (100%)',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    credited: {
      label: 'Bank Credited',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    refunded: {
      label: 'Refunded',
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      dot: 'bg-purple-500',
    },
    failed: {
      label: 'Failed',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },

    // Verification & Admin
    verified: {
      label: 'KYC Verified',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    approved: {
      label: 'Approved',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    pending_review: {
      label: 'Pending Review',
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      dot: 'bg-orange-500 animate-pulse',
    },
    under_scrutiny: {
      label: 'Under Scrutiny',
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      dot: 'bg-yellow-500',
    },
    pending_audit: {
      label: 'Audit Due',
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      dot: 'bg-yellow-500',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },

    // Complaints & Grievance severity
    high: {
      label: 'High Severity',
      bg: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
      dot: 'bg-rose-600 animate-ping',
    },
    medium: {
      label: 'Medium Severity',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    low: {
      label: 'Low Severity',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    investigating: {
      label: 'Investigating',
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-500 animate-pulse',
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    open: {
      label: 'Open Ticket',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[normalized] || {
    label: label || status || 'Active',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border select-none transition-colors whitespace-nowrap',
        config.bg,
        sizes[size] || sizes.md,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      <span>{label || config.label}</span>
    </span>
  );
}

