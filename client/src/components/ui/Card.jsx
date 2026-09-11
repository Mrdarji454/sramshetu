import React from "react";
import { cn } from "../../utils/cn";

export function Card({
  children,
  className,
  hoverEffect = false,
  interactive = false,
  ...props
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200/90 shadow-card transition-all duration-200",
        hoverEffect &&
          "hover:shadow-card-hover hover:border-slate-300 hover:-translate-y-0.5",
        interactive && "cursor-pointer active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn("p-5 sm:p-6 border-b border-slate-100", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn("p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn("p-5 sm:p-6 pt-0 sm:pt-0", className)} {...props}>
      {children}
    </div>
  );
}
