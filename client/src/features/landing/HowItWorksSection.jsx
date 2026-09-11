import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  FileText,
  Cpu,
  QrCode,
  ShieldCheck,
  Users,
  Smartphone,
  CheckCircle2,
  IndianRupee,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  HOW_IT_WORKS_CUSTOMER,
  HOW_IT_WORKS_WORKER,
} from "../../data/mockData";

const iconMap = {
  FileText,
  Cpu,
  QrCode,
  ShieldCheck,
  Users,
  Smartphone,
  CheckCircle2,
  IndianRupee,
};

export function HowItWorksSection() {
  const [activePersona, setActivePersona] = useState("customer"); // 'customer' or 'worker'

  const currentSteps =
    activePersona === "customer" ? HOW_IT_WORKS_CUSTOMER : HOW_IT_WORKS_WORKER;

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badgeText="End-to-End Workflow"
          badgeVariant="saffron"
          title="How ShramSetu Operates with"
          titleAccent="Total Integrity"
          description="A seamless protocol eliminating exploitation. Demands are matched using fair AI rotation and validated via dynamic QR codes before instant escrow payout."
        />

        {/* Persona Switcher Buttons */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActivePersona("customer")}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activePersona === "customer"
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>For Customers & Enterprises</span>
            </button>
            <button
              onClick={() => setActivePersona("worker")}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activePersona === "worker"
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>For Workers & Cooperatives</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                0% Fee
              </span>
            </button>
          </div>
        </div>

        {/* 4-Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {currentSteps.map((item, index) => {
            const Icon = iconMap[item.icon] || FileText;
            return (
              <div key={item.step} className="relative group">
                <Card
                  hoverEffect
                  className="h-full p-6 flex flex-col justify-between bg-slate-50/40 border-slate-200 relative z-10"
                >
                  <div>
                    {/* Step badge & Icon */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-2xl font-black font-display text-slate-300 group-hover:text-brand-saffron-500 transition-colors">
                        {item.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-brand-navy-900 text-brand-saffron-400 flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-brand-navy-900 mb-2 font-display">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Micro-indicator */}
                  <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Phase {index + 1} of 4</span>
                    <span className="text-brand-saffron-600 font-semibold flex items-center gap-0.5">
                      Verified{" "}
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </span>
                  </div>
                </Card>

                {/* Connector Arrow for Desktop */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3.5 -translate-y-1/2 z-20 pointer-events-none text-slate-300">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Deep Dive Callout Box on Dynamic QR Protocol */}
        <div className="mt-12 rounded-2xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-bold">
                  Dynamic Geofenced QR Handshake
                </h4>
                <Badge variant="verified" size="sm">
                  SIH 2026 Core Tech
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                When a worker arrives on site, a time-expiring cryptographic QR
                code verifies attendance against GPS bounds. This unlocks the
                work session and freezes the agreed floor rate in escrow,
                eliminating payment friction and safety concerns for both
                parties.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <a href="#ai-engine">
              <Button variant="emerald" size="sm" iconRight={ArrowRight}>
                View AI Allocation Specs
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
