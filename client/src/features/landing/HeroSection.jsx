import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  ShieldCheck,
  Search,
  MapPin,
  Sparkles,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Activity,
  QrCode,
  Users,
  IndianRupee,
} from "lucide-react";
import { SERVICE_CATEGORIES } from "../../data/mockData";

export function HeroSection() {
  const [selectedTrade, setSelectedTrade] = useState("electrical");
  const [pincode, setPincode] = useState("411038");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedMatch, setSimulatedMatch] = useState(null);

  const handleSimulateSearch = (e) => {
    e.preventDefault();
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const selected =
        SERVICE_CATEGORIES.find((c) => c.id === selectedTrade) ||
        SERVICE_CATEGORIES[0];
      setSimulatedMatch({
        serviceName: selected.name,
        pincode: pincode || "411038",
        allocatedWorker: "Rajeshwar Shinde",
        cooperative: "Pune Shramik Vikas Sahakari",
        eta: "11 mins",
        fairFloorWage: selected.floorRate,
        score: "98.4%",
      });
    }, 600);
  };

  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden bg-gradient-to-b from-brand-navy-50/40 via-white to-slate-50/60 bg-grid-pattern">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-saffron-200/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-200/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Sovereign Initiative Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 shadow-sm text-xs text-brand-navy-900 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-saffron-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-saffron-500"></span>
            </span>
            <span className="font-semibold text-brand-saffron-700">
              SIH 2026 Project
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 hidden sm:inline">
              India's Sovereign Cooperative Digital Labour Marketplace
            </span>
            <span className="text-slate-600 sm:hidden">
              Cooperative Labour Marketplace
            </span>
          </div>
        </div>

        {/* Hero Main Headline & Value Prop */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-brand-navy-900 tracking-tight font-display leading-[1.15]">
            Dignified Work.{" "}
            <span className="bg-gradient-to-r from-brand-saffron-600 via-amber-600 to-brand-saffron-600 bg-clip-text text-transparent">
              Zero Middleman Cut.
            </span>
            <br />
            Powered by Cooperatives & AI.
          </h1>

          <p className="mt-5 sm:mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Connecting citizens and enterprises with{" "}
            <strong className="font-semibold text-slate-800">
              Aadhaar & NSDC verified artisans
            </strong>
            . Governed by registered worker cooperatives with guaranteed floor
            wages, 100% direct DBT payouts, and open-source fair algorithmic
            allocation.
          </p>

          {/* Core Trust Pillars */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-slate-700">
            <Badge variant="verified" icon={CheckCircle2} size="md">
              0% Platform Commission
            </Badge>
            <Badge variant="gov" icon={ShieldCheck} size="md">
              Aadhaar e-KYC Verified
            </Badge>
            <Badge variant="coop" icon={Users} size="md">
              Cooperative Guild Backed
            </Badge>
            <Badge variant="saffron" icon={IndianRupee} size="md">
              Direct Escrow Payouts
            </Badge>
          </div>
        </div>

        {/* Interactive Booking & AI Dispatch Widget */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200/90 ring-1 ring-slate-900/5">
            <form
              onSubmit={handleSimulateSearch}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center"
            >
              {/* Trade Selector */}
              <div className="sm:col-span-5 text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Skilled Trade
                </label>
                <div className="relative">
                  <select
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none focus:bg-white transition-all"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.hindiName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location / Pincode */}
              <div className="sm:col-span-4 text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pincode / Location
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 411038 (Pune) or 110020"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="sm:col-span-3 sm:self-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSimulating}
                  className="w-full py-3 h-[46px]"
                  icon={isSimulating ? Sparkles : Search}
                >
                  {isSimulating ? "AI Matching..." : "Find Worker"}
                </Button>
              </div>
            </form>

            {/* Instant AI Allocation Result Simulation Box */}
            {simulatedMatch && (
              <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950 text-sm">
                        {simulatedMatch.allocatedWorker}
                      </span>
                      <Badge variant="verified" size="sm">
                        Available Now
                      </Badge>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Guild:{" "}
                      <span className="font-semibold text-slate-800">
                        {simulatedMatch.cooperative}
                      </span>{" "}
                      • ETA:{" "}
                      <span className="text-emerald-700 font-bold">
                        {simulatedMatch.eta}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                      Guaranteed Floor Wage
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {simulatedMatch.fairFloorWage}
                    </span>
                  </div>
                  <a href="#workers">
                    <Button size="sm" variant="emerald">
                      View Profile & QR
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live GovTech Telemetry & Fair Allocation Card */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel-dark rounded-2xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-saffron-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-brand-saffron-400 border border-slate-700">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base font-display">
                      ShramSetu AI Dispatch Engine (XGBoost v2.4)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE INFERENCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    FastAPI ML Service • Latency: 14.2ms • Anti-Monopoly
                    Rotation Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Fairness Score: 98.6%</span>
              </div>
            </div>

            {/* Real-time Simulated Telemetry Feed */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Last Job Allocated
                </span>
                <span className="font-semibold text-slate-100">
                  3-Phase Substation Repair
                </span>
                <p className="text-[11px] text-emerald-400 mt-1">
                  Matched in 4.2s • Pune Guild
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Opportunity Distribution
                </span>
                <span className="font-semibold text-slate-100">
                  Equal Rota Weighted
                </span>
                <p className="text-[11px] text-brand-saffron-300 mt-1">
                  0% algorithmic favouritism
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Handshake Protocol
                </span>
                <span className="font-semibold text-slate-100">
                  Dynamic Geo-Fenced QR
                </span>
                <p className="text-[11px] text-emerald-400 mt-1">
                  100% Escrow Protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
