import React from "react";
import { cn } from "../../utils/cn";

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      type = "button",
      icon: Icon,
      iconRight: IconRight,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg";

    const variants = {
      primary:
        "bg-gradient-to-r from-brand-saffron-600 to-brand-saffron-500 hover:from-brand-saffron-700 hover:to-brand-saffron-600 text-white shadow-sm hover:shadow-glow-saffron focus:ring-brand-saffron-500",
      secondary:
        "bg-brand-navy-900 hover:bg-brand-navy-800 text-white shadow-sm focus:ring-brand-navy-700",
      emerald:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-glow-emerald focus:ring-emerald-500",
      outline:
        "border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 focus:ring-slate-400 shadow-sm",
      ghost:
        "text-slate-700 hover:text-brand-navy-900 hover:bg-slate-100 focus:ring-slate-300",
      subtle:
        "bg-brand-navy-50 text-brand-navy-800 hover:bg-brand-navy-100 focus:ring-brand-navy-300",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5 font-medium",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3.5 gap-2.5 font-semibold",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {Icon && (
          <Icon
            className={cn(
              "flex-shrink-0",
              size === "sm"
                ? "w-3.5 h-3.5"
                : size === "lg"
                  ? "w-5 h-5"
                  : "w-4 h-4",
            )}
          />
        )}
        <span>{children}</span>
        {IconRight && (
          <IconRight
            className={cn(
              "flex-shrink-0",
              size === "sm"
                ? "w-3.5 h-3.5"
                : size === "lg"
                  ? "w-5 h-5"
                  : "w-4 h-4",
            )}
          />
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
