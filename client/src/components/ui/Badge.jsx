import React from "react";
import { cn } from "../../utils/cn";

export function Badge({
  children,
  className,
  variant = "default",
  size = "md",
  dot = false,
  icon: Icon,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full transition-colors select-none";

  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200/80",
    verified: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    saffron: "bg-amber-50 text-amber-900 border border-amber-200",
    navy: "bg-slate-900 text-white border border-slate-800",
    gov: "bg-blue-50 text-blue-800 border border-blue-200",
    coop: "bg-indigo-50 text-indigo-800 border border-indigo-200",
    outline: "border border-slate-300 text-slate-600 bg-transparent",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2 font-semibold",
  };

  const dotColors = {
    default: "bg-slate-400",
    verified: "bg-emerald-500 animate-pulse",
    saffron: "bg-amber-500",
    navy: "bg-emerald-400",
    gov: "bg-blue-500",
    coop: "bg-indigo-500",
    outline: "bg-slate-400",
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            dotColors[variant],
          )}
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
