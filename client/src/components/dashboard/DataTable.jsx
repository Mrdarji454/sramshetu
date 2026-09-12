import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

export function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No records found',
  onRowClick,
  isLoading = false,
  keyField = 'id',
  className,
}) {
  return (
    <div className={cn('w-full overflow-hidden bg-white rounded-xl border border-slate-200/90 shadow-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600">
              {columns.map((col, idx) => (
                <th
                  key={col.header || idx}
                  className={cn(
                    'py-3.5 px-4 font-semibold select-none whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-saffron-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-slate-100 text-slate-400">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row[keyField] || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick ? 'cursor-pointer hover:bg-slate-50/90' : 'hover:bg-slate-50/50',
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  )}
                >
                  {columns.map((col, cIdx) => {
                    const value =
                      typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                        ? row[col.accessor]
                        : null;

                    return (
                      <td
                        key={col.header || cIdx}
                        className={cn(
                          'py-3.5 px-4 text-slate-700 align-middle',
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left',
                          col.className
                        )}
                      >
                        {col.cell ? col.cell(row, index) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

