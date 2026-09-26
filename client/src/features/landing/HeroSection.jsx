import { ServiceSearch } from '../matching/ServiceSearch';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Users,
  IndianRupee,
  Clock,
  Zap,
  Droplets,
  Hammer,
  Boxes,
  Paintbrush,
  Wind,
  Flame,
  Wrench,
} from "lucide-react";
import { matchingService } from "../../services/matching.service";
import {
  POPULAR_PROFESSIONS,
  detectTradeFromJobDescription,
} from "../../utils/tradeUtils";
import { LOCALITY_PRESETS } from "../../utils/geo.utils";

const PROFESSION_ICONS = {
  electrical: Zap,
  plumbing: Droplets,
  carpentry: Hammer,
  masonry: Boxes,
  painting: Paintbrush,
  hvac: Wind,
  welding: Flame,
};

export function HeroSection() {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("all");
  const [pincode, setPincode] = useState("411038");
  const [isSearching, setIsSearching] = useState(false);
  const [matchedResult, setMatchedResult] = useState(null);
  const [detectedTrade, setDetectedTrade] = useState(null);

  // Handle free-text job description changes and detect NLP trade intent
  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    setJobDescription(text);
    const detected = detectTradeFromJobDescription(text);
    setDetectedTrade(detected);
    if (detected && selectedTrade === "all") {
      setSelectedTrade(detected.id);
    }
  };

  // Perform real search against server matching API
  const handleFindWorker = async (e) => {
    if (e) e.preventDefault();
    handleNavigateToMatcher();
  };

  // Click on a profession category chip
  const handleSelectCategory = (prof) => {
    setSelectedTrade(prof.id);
    navigate(
      `/user/dashboard?tab=match&trade=${encodeURIComponent(prof.tradeName)}&pincode=${pincode}`,
    );
  };

  // Navigate to live matching view carrying search parameters
  const handleNavigateToMatcher = () => {
    const tradeObj = POPULAR_PROFESSIONS.find((p) => p.id === selectedTrade);
    const tradeParam = tradeObj?.tradeName || "";
    const params = new URLSearchParams();
    params.set("tab", "match");
    if (tradeParam) params.set("trade", tradeParam);
    if (pincode) params.set("pincode", pincode);
    if (jobDescription) params.set("desc", jobDescription);
    navigate(`/user/dashboard?${params.toString()}`);
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

        {/* Interactive Search & Discovery Widget */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/90 ring-1 ring-slate-900/5 space-y-4">
            <form onSubmit={handleFindWorker} className="space-y-3">
              {/* Natural Language Job Description / Prompt Input */}
              <div className="relative">
                <ServiceSearch value={jobDescription} onChange={text => { setJobDescription(text); setDetectedTrade(detectTradeFromJobDescription(text)); setSelectedTrade('all'); }} onSearch={text => navigate(`/user/dashboard?tab=match&desc=${encodeURIComponent(text)}&pincode=${pincode}`)} />

              </div>

              {/* Detected Trade Suggestion Pill */}
              {detectedTrade && (
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold animate-in fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>
                    Detected Relevant Trade:{" "}
                    <strong className="text-amber-950 underline">
                      {detectedTrade.tradeName}
                    </strong>{" "}
                    ({detectedTrade.hindiName})
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                {/* Trade Selector Dropdown */}
                <div className="sm:col-span-5 text-left">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Skilled Profession
                  </label>
                  <select
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none focus:bg-white"
                  >
                    <option value="all">All Registered Trades</option>
                    {POPULAR_PROFESSIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.tradeName} ({p.hindiName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location / Pincode */}
                <div className="sm:col-span-4 text-left">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Service Locality / Pincode
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 411038 (Pune)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Submit Find Worker CTA */}
                <div className="sm:col-span-3 sm:self-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={isSearching}
                    className="w-full py-2.5 h-[42px]"
                    icon={Search}
                  >
                    Find Artisans
                  </Button>
                </div>
              </div>
            </form>

            {/* Clickable Profession Categories Pills */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-left">
                Popular Verified Trades (Click to filter):
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_PROFESSIONS.map((prof) => {
                  const Icon = PROFESSION_ICONS[prof.id] || Wrench;
                  const isSelected = selectedTrade === prof.id;

                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => handleSelectCategory(prof)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        isSelected
                          ? "bg-brand-navy-900 text-white shadow-sm ring-2 ring-brand-navy-400"
                          : "bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-950 border border-slate-200"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-brand-saffron-600"}`}
                      />
                      <span>{prof.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real Server Match Live Result Card */}
            {matchedResult && (
              <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {matchedResult.worker?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-950 text-sm">
                        {matchedResult.worker?.name}
                      </span>
                      <Badge variant="verified" size="sm">
                        Verified
                      </Badge>
                      <span className="text-amber-600 font-bold text-[11px]">
                        ★ {matchedResult.rating}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Guild:{" "}
                      <strong className="text-slate-900">
                        {matchedResult.cooperative?.name}
                      </strong>{" "}
                      • Distance:{" "}
                      <strong className="text-emerald-700">
                        {matchedResult.distanceFormatted}
                      </strong>{" "}
                      (~{matchedResult.estimatedArrivalMin} min)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-200">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                      Floor Wage (0% Commission)
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{matchedResult.floorRate} / day
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={ArrowRight}
                    onClick={handleNavigateToMatcher}
                  >
                    View on Live Map
                  </Button>
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
                      ShramSetu Multi-Factor Ranking & Fair Rotation Engine
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      DETERMINISTIC RANKING
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Skills • Proximity • Verification • Fair Rotation (1:4
                    Verified New Talent)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Fairness Rotation Active</span>
              </div>
            </div>

            {/* Real-time Telemetry Feed */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Ranking Engine
                </span>
                <span className="font-semibold text-slate-100">
                  Multi-Factor Deterministic
                </span>
                <p className="text-[11px] text-emerald-400 mt-1">
                  Zero commission bidding
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Opportunity Distribution
                </span>
                <span className="font-semibold text-slate-100">
                  Equal Rota (1:4 New Artisans)
                </span>
                <p className="text-[11px] text-brand-saffron-300 mt-1">
                  0% algorithmic bias
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
