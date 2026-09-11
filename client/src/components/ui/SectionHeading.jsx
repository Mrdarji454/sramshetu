import React from "react";
import { cn } from "../../utils/cn";
import { Badge } from "./Badge";

export function SectionHeading({
  badgeText,
  badgeVariant = "gov",
  title,
  titleAccent,
  description,
  alignment = "center",
  children,
  className,
}) {
  const isCenter = alignment === "center";

  return (
    <div
      className={cn(
        "mb-10 sm:mb-14",
        isCenter ? "text-center max-w-3xl mx-auto" : "max-w-4xl",
        className,
      )}
    >
      {badgeText && (
        <div className={cn("mb-3 flex", isCenter && "justify-center")}>
          <Badge variant={badgeVariant} dot size="md">
            {badgeText}
          </Badge>
        </div>
      )}

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-navy-900 tracking-tight font-display leading-tight">
        {title}{" "}
        {titleAccent && (
          <span className="bg-gradient-to-r from-brand-saffron-600 to-amber-600 bg-clip-text text-transparent">
            {titleAccent}
          </span>
        )}
      </h2>

      {description && (
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          {description}
        </p>
      )}

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
