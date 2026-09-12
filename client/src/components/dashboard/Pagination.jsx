import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize = 10,
  className,
}) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  const getVisiblePages = () => {
    const pages = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 bg-white border-t border-slate-200/80 text-xs text-slate-600',
        className
      )}
    >
      {totalItems !== undefined ? (
        <div className="text-slate-500">
          Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalItems}</span> results
        </div>
      ) : (
        <div className="text-slate-500">
          Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          className={cn(
            'p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Number Buttons */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 text-slate-400 select-none">
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-brand-navy-900 text-white font-semibold shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          className={cn(
            'p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

