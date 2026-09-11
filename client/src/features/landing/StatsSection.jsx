import React from "react";
import { Card } from "../../components/ui/Card";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Badge } from "../../components/ui/Badge";
import {
  TrendingUp,
  IndianRupee,
  Users,
  ShieldCheck,
  Building2,
  Check,
  X as CloseIcon,
  ArrowUpRight,
} from "lucide-react";
import { PLATFORM_STATS } from "../../data/mockData";

export function StatsSection() {
  const iconMap = {
    wages: IndianRupee,
    workers: Users,
    commission: ShieldCheck,
    cooperatives: Building2,
  };

  return (
    <section
      id="stats"
      className="py-16 sm:py-24 bg-white border-y border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badgeText="Sovereign Impact & Transparency"
          badgeVariant="verified"
          title="Transforming Labour Economics"
          titleAccent="by the Numbers"
          description="Real-time public ledger data proving how cooperative-owned digital infrastructure returns power and economic dignity back to blue-collar workers."
        />

        {/* 4 Big Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-16">
          {PLATFORM_STATS.map((stat) => {
            const Icon = iconMap[stat.id] || TrendingUp;
            return (
              <Card
                key={stat.id}
                hoverEffect
                className="p-6 relative overflow-hidden bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-brand-navy-900 text-white flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-brand-saffron-400" />
                  </div>
                  <Badge
                    variant={stat.id === "commission" ? "verified" : "gov"}
                    size="sm"
                  >
                    {stat.change}
                  </Badge>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold text-brand-navy-900 font-display tracking-tight">
                  {stat.value}
                </div>

                <div className="text-sm font-bold text-slate-800 mt-1">
                  {stat.label}
                </div>

                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {stat.subtext}
                </p>

                {/* Sovereign Accent bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-saffron-500 to-emerald-500 opacity-80" />
              </Card>
            );
          })}
        </div>

        {/* Comparison Callout: Private Gig App vs ShramSetu Cooperative Stack */}
        <div className="bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-xl">
          <div className="max-w-3xl mb-8">
            <Badge variant="saffron" size="sm" className="mb-3">
              The Cooperative Advantage
            </Badge>
            <h3 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white">
              Why ShramSetu is Replacing Private Gig Exploitation
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mt-2">
              On private contractor apps, workers are treated as independent
              disposable units with opaque ratings and punitive algorithmic
              shadow-banning. ShramSetu restores sovereign worker rights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Private Gig Aggregators Column */}
            <div className="rounded-xl bg-slate-950/50 p-5 sm:p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-red-400">
                  Private Tech Aggregators
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/60">
                  Extractive Model
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CloseIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>20% – 35% commission</strong> deducted from every
                    completed service
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CloseIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Opaque algorithmic dispatch that favors workers who work 16+
                    hour days
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CloseIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Zero health insurance, accidental death pool, or retirement
                    security
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CloseIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Customer disputes lead to instant automated account
                    deactivations
                  </span>
                </li>
              </ul>
            </div>

            {/* ShramSetu Cooperative Column */}
            <div className="rounded-xl bg-emerald-950/40 p-5 sm:p-6 border border-emerald-600/40">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-800/60">
                <span className="font-bold text-sm text-emerald-300">
                  ShramSetu Cooperative Stack
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-600/60">
                  Democratic & Fair
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-emerald-100">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>0% platform commission</strong> — 100% wages paid
                    via direct DBT
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    AI Equal-Opportunity Rotation balances work evenly across
                    registered guild members
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    ₹5 Lakh cooperative family medical cover & subsidized
                    power-tool leasing
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Peer cooperative council mediates any dispute with human
                    dignity
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
