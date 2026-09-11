import React from "react";
import { cn } from "../../utils/cn";

export function Logo({
  className,
  showTagline = true,
  theme = "light", // 'light' or 'dark'
  size = "md",
}) {
  const isDark = theme === "dark";

  return (
    <a
      href="#"
      className={cn(
        "inline-flex items-center gap-3 group select-none text-left",
        className,
      )}
    >
      {/* Emblem SVG: Bridge archway + Gear + Ashoka Chakra node */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-slate-900 p-2 shadow-sm border border-slate-700/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
          <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Bridge Arch (Setu) */}
            <path
              d="M4 26C8 16 14 11 18 11C22 11 28 16 32 26"
              stroke="#EA580C"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Base Bridge Deck */}
            <path
              d="M4 27H32"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Labour Pillar Struts */}
            <path
              d="M12 19V27"
              stroke="#93C5FD"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M18 13V27"
              stroke="#F8FAFC"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M24 19V27"
              stroke="#93C5FD"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Sovereign Core Node */}
            <circle cx="18" cy="8" r="3" fill="#F97316" />
            <circle cx="18" cy="8" r="1.5" fill="#FFFFFF" />
          </svg>
        </div>
        {/* Subtle dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-display font-extrabold tracking-tight",
              size === "sm" ? "text-lg" : "text-xl sm:text-2xl",
              isDark ? "text-white" : "text-brand-navy-900",
            )}
          >
            Shram<span className="text-brand-saffron-600">Setu</span>
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 font-sans tracking-wide",
              isDark && "bg-amber-950/70 text-amber-300 border-amber-800/60",
            )}
          >
            श्रमसेतु
          </span>
        </div>

        {showTagline && (
          <span
            className={cn(
              "text-[10px] tracking-wider uppercase font-semibold mt-0.5",
              isDark ? "text-slate-400" : "text-slate-500",
            )}
          >
            Cooperative Digital Stack
          </span>
        )}
      </div>
    </a>
  );
}
