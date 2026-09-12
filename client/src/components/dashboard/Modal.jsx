import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-10 overflow-hidden flex flex-col max-h-[90vh]',
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="pr-6">
            {title && (
              <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-700 text-sm">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

