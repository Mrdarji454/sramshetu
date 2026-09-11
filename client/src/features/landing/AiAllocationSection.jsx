import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Cpu,
  Scale,
  Activity,
  ShieldCheck,
  Sparkles,
  Sliders,
  Users,
  Clock,
  Zap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { AI_ALLOCATION_METRICS } from "../../data/mockData";

export function AiAllocationSection() {
  const [fairnessBias, setFairnessBias] = useState(65); // 0 to 100 slider
  const [distanceKm, setDistanceKm] = useState(3.4);

  // Simulated live candidates based on slider
  const candidates = [
    {
      name: "Rajeshwar Shinde",
      guild: "Pune Shramik Sahakari",
      distance: `${distanceKm} km`,
      hoursWorkedThisWeek: "18 hrs",
      rotationScore: Math.round(100 - (18 / 40) * 100),
      overallRank: fairnessBias > 50 ? "#1 Dispatched" : "#2 Alternate",
      matchScore: fairnessBias > 50 ? "97.8%" : "91.2%",
      isAllocated: fairnessBias > 50,
      reason:
        fairnessBias > 50
          ? "High opportunity equity: Only 18 hours worked this week; optimal for guild fair balance"
          : "Slightly higher travel distance",
    },
    {
      name: "Santosh Waghmare",
      guild: "Pune Shramik Sahakari",
      distance: "1.2 km",
      hoursWorkedThisWeek: "38 hrs",
      rotationScore: Math.round(100 - (38 / 40) * 100),
      overallRank: fairnessBias > 50 ? "#2 Standby" : "#1 Dispatched",
      matchScore: fairnessBias > 50 ? "89.4%" : "98.5%",
      isAllocated: fairnessBias <= 50,
      reason:
        fairnessBias > 50
          ? "Anti-Monopoly Threshold: Worked 38 hrs this week; deprioritized to share earnings equitably"
          : "Closest geographic distance (1.2 km)",
    },
  ];

  return (
    <section
      id="ai-engine"
      className="py-16 sm:py-24 bg-gradient-to-b from-brand-navy-950 via-slate-900 to-brand-navy-950 text-white relative overflow-hidden"
    >
      {/* Glow Orbs */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-brand-saffron-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge
            variant="navy"
            dot
            size="md"
            className="mb-3 border-slate-700 bg-slate-800/80 text-brand-saffron-300"
          >
            Python FastAPI + XGBoost v2.4
          </Badge>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            Algorithmic Justice:{" "}
            <span className="bg-gradient-to-r from-brand-saffron-400 to-amber-400 bg-clip-text text-transparent">
              Fair-Rotation AI Allocation
            </span>
          </h2>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            Private gig platforms use secret black-box algorithms that create
            monopolies, favoring a tiny percentage of overworked individuals
            while starving the rest. ShramSetu's model guarantees fair
            opportunity distribution.
          </p>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {AI_ALLOCATION_METRICS.factors.map((factor, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-display text-brand-saffron-400">
                  {factor.weight}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Weight Vector
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-2">
                {factor.name}
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed">
                {factor.description}
              </p>
            </div>
          ))}
        </div>

        {/* Interactive Simulator: Anti-Monopoly Rotation in Action */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-saffron-400" />
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Interactive Simulator: How ShramSetu Prevents Monopolies
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Drag the fairness slider to see how the XGBoost engine balances
                pure proximity against equitable weekly hours.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Inference Latency: 14.2ms</span>
            </div>
          </div>

          {/* Controls */}
          <div className="py-6 border-b border-slate-800">
            <div className="max-w-xl">
              <div className="flex items-center justify-between text-xs mb-2 font-semibold">
                <span className="text-slate-400">
                  Pure Proximity Only (Private Gig Style)
                </span>
                <span className="text-brand-saffron-400 font-mono">
                  Fairness Weight: {fairnessBias}%
                </span>
                <span className="text-emerald-400">
                  Equitable Guild Rotation (ShramSetu)
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="90"
                value={fairnessBias}
                onChange={(e) => setFairnessBias(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-saffron-500"
              />
            </div>
          </div>

          {/* Real-time Candidate Ranking Preview */}
          <div className="pt-6">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">
              Simulated Dispatch Decision for Incoming Job (Kothrud, Pune)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border transition-all ${
                    c.isAllocated
                      ? "bg-emerald-950/30 border-emerald-500/50 shadow-lg"
                      : "bg-slate-950/40 border-slate-800 opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-base text-white">
                        {c.name}
                      </span>
                      <p className="text-xs text-slate-400">{c.guild}</p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        c.isAllocated
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {c.overallRank}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-900/80 text-xs mb-3 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        Distance
                      </span>
                      <span className="text-slate-200">{c.distance}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        Weekly Work
                      </span>
                      <span className="text-slate-200">
                        {c.hoursWorkedThisWeek}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        AI Score
                      </span>
                      <span className="text-brand-saffron-300 font-bold">
                        {c.matchScore}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic">"{c.reason}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
