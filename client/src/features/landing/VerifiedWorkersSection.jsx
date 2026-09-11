import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Star,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Award,
  QrCode,
  Calendar,
  Briefcase,
  IndianRupee,
  X,
  Phone,
} from "lucide-react";
import { VERIFIED_WORKERS } from "../../data/mockData";

export function VerifiedWorkersSection() {
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [activeTradeFilter, setActiveTradeFilter] = useState("All");

  const trades = ["All", "Electrician", "Sanitation", "Mason", "Welder"];

  const filteredWorkers =
    activeTradeFilter === "All"
      ? VERIFIED_WORKERS
      : VERIFIED_WORKERS.filter((w) =>
          w.trade.toLowerCase().includes(activeTradeFilter.toLowerCase()),
        );

  return (
    <section id="workers" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badgeText="Sovereign Identity & Trust"
          badgeVariant="verified"
          title="NSDC Certified Artisans,"
          titleAccent="Cooperative Backed"
          description="Every artisan on ShramSetu undergoes stringent biometric Aadhaar e-KYC verification, National Skill Development Corporation (NSDC) skill grading, and local police verification before field dispatch."
        />

        {/* Quick Filter tabs */}
        <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {trades.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTradeFilter(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTradeFilter === t
                  ? "bg-brand-navy-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Worker Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((worker) => (
            <Card
              key={worker.id}
              hoverEffect
              className="flex flex-col h-full bg-white border-slate-200 group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full ring-2 ring-white">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-brand-navy-900 truncate">
                        {worker.name}
                      </h4>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{worker.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-400 font-sans mt-0.5">
                      {worker.hindiName}
                    </p>

                    <p className="text-xs font-medium text-brand-saffron-700 mt-1 truncate">
                      {worker.trade}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{worker.city}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="py-0 flex-1 space-y-3.5">
                {/* Cooperative Guild Affiliation */}
                <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-700" />
                    <span className="font-semibold text-indigo-950 truncate max-w-[190px] sm:max-w-[210px]">
                      {worker.cooperative}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 font-bold">
                    GUILD
                  </span>
                </div>

                {/* Badges & Verifications */}
                <div className="flex flex-wrap gap-1.5">
                  {worker.certifications.slice(0, 3).map((cert, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{cert}</span>
                    </span>
                  ))}
                </div>

                {/* Track Record Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      Experience
                    </span>
                    <span className="font-bold text-slate-800">
                      {worker.experienceYears} Years
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      Completed Jobs
                    </span>
                    <span className="font-bold text-emerald-700">
                      {worker.jobsCompleted}+ orders
                    </span>
                  </div>
                </div>

                {/* Floor Wage Rate */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-500">Statutory Rate:</span>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900">
                      ₹{worker.hourlyRate}/hr
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      (₹{worker.dailyRate}/day)
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center group-hover:border-brand-navy-900 group-hover:text-brand-navy-900"
                  icon={QrCode}
                  onClick={() => setSelectedWorker(worker)}
                >
                  <span>Verify Digital Pass & ID</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Dynamic Digital Work Pass Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
            {/* Top Close Button */}
            <button
              onClick={() => setSelectedWorker(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Gov-Tech Sovereign Pass Header */}
            <div className="gov-tricolor-stripe rounded-full mb-4" />

            <div className="text-center mb-5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Ministry of Skill Development & Cooperatives
              </span>
              <h3 className="text-lg font-extrabold text-brand-navy-900 font-display">
                Digital Shramik Identity Card
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {selectedWorker.id}
              </p>
            </div>

            {/* Worker Visual Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
              <img
                src={selectedWorker.avatar}
                alt={selectedWorker.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {selectedWorker.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedWorker.hindiName}
                </p>
                <Badge
                  variant="verified"
                  size="sm"
                  className="mt-1"
                  icon={ShieldCheck}
                >
                  Aadhaar e-KYC Verified
                </Badge>
              </div>
            </div>

            {/* Mock QR Code Visual */}
            <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center mb-5">
              <div className="w-36 h-36 bg-slate-900 p-2 rounded-xl flex items-center justify-center relative">
                {/* Simulated QR Pattern */}
                <QrCode className="w-28 h-28 text-white" />
                <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none rounded-xl" />
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-bold mt-2.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Dynamic Handshake QR
                Active
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Client scans upon arrival to confirm physical geofenced presence
              </p>
            </div>

            {/* Credentials details */}
            <div className="space-y-2 text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Affiliated Cooperative</span>
                <span className="font-semibold text-slate-900">
                  {selectedWorker.cooperative}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cooperative Reg. No</span>
                <span className="font-mono text-slate-700">
                  {selectedWorker.cooperativeRegNo}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Statutory Daily Wage</span>
                <span className="font-bold text-emerald-700">
                  ₹{selectedWorker.dailyRate} / day
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setSelectedWorker(null)}
            >
              Close Identity Card
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
