import React from "react";
import {
  Clock,
  CheckCircle2,
  Truck,
  Wrench,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

/**
 * JobProgressBar Component
 * Displays the progression of a job through various stages
 * Stages: PENDING -> ASSIGNED -> CONFIRMED -> ON_THE_WAY -> IN_PROGRESS -> COMPLETED
 */
export function JobProgressBar({ status = "PENDING", className = "" }) {
  // Define all stages in order
  const stages = [
    { key: "PENDING", label: "Requested", icon: Clock, color: "text-slate-400" },
    {
      key: "ASSIGNED",
      label: "Assigned",
      icon: UserCheck,
      color: "text-blue-600",
    },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      icon: CheckCircle2,
      color: "text-indigo-600",
    },
    {
      key: "ON_THE_WAY",
      label: "En Route",
      icon: Truck,
      color: "text-brand-saffron-600",
    },
    {
      key: "IN_PROGRESS",
      label: "Working",
      icon: Wrench,
      color: "text-teal-600",
    },
    {
      key: "COMPLETED",
      label: "Completed",
      icon: ShieldCheck,
      color: "text-emerald-600",
    },
  ];

  // Normalize status
  const normalizedStatus = (status || "PENDING").toUpperCase();

  // Find current stage index
  const currentIndex = stages.findIndex((s) => s.key === normalizedStatus);
  const progressPercent =
    currentIndex >= 0
      ? ((currentIndex + 1) / stages.length) * 100
      : (1 / stages.length) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Track */}
      <div className="mb-4">
        {/* Progress Bar Background */}
        <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          {/* Progress Bar Fill */}
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-brand-saffron-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stage Markers */}
        <div className="flex justify-between mt-3 relative">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;
            const StageIcon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center flex-1">
                {/* Stage Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 flex-shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-100 ring-2 ring-emerald-500"
                      : isCurrent
                        ? "bg-brand-saffron-100 ring-2 ring-brand-saffron-500 scale-110 shadow-lg"
                        : "bg-slate-100 ring-1 ring-slate-300"
                  }`}
                >
                  <StageIcon
                    className={`w-4 h-4 ${
                      isCompleted
                        ? "text-emerald-600"
                        : isCurrent
                          ? stage.color
                          : "text-slate-400"
                    }`}
                  />
                </div>

                {/* Stage Label */}
                <span
                  className={`text-[10px] font-semibold text-center leading-tight px-0.5 ${
                    isCompleted
                      ? "text-emerald-700"
                      : isCurrent
                        ? "text-brand-saffron-700 font-bold"
                        : "text-slate-500"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-xs font-medium text-slate-600">
          Status:{" "}
          <span className="font-bold text-slate-900">
            {stages.find((s) => s.key === normalizedStatus)?.label ||
              "Unknown"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default JobProgressBar;
