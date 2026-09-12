import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search by name, skill, ID, or location...',
  className,
  size = 'md',
  shortcut = false,
  autoFocus = false,
}) {
  const sizes = {
    sm: 'py-1.5 pl-8 pr-7 text-xs',
    md: 'py-2 pl-9 pr-8 text-sm',
    lg: 'py-2.5 pl-10 pr-9 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
    lg: 'w-5 h-5 left-3.5',
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search
        className={cn(
          'absolute text-slate-400 pointer-events-none transition-colors',
          iconSizes[size] || iconSizes.md
        )}
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-saffron-500/20 focus:border-brand-saffron-500',
          'transition-all duration-150',
          sizes[size] || sizes.md
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else if (onChange) onChange('');
          }}
          className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <div className="absolute right-2.5 pointer-events-none hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200">
          ⌘K
        </div>
      ) : null}
    </div>
  );
}

