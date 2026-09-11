import React from "react";
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
  Building2,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  Landmark,
  FileCheck2,
  Award,
} from "lucide-react";
import { COOPERATIVE_GUILDS } from "../../data/mockData";

export function CooperativeSection() {
  return (
    <section
      id="cooperatives"
      className="py-16 sm:py-24 bg-brand-navy-50/50 border-b border-slate-200/80 relative overflow-hidden"
    >
      {/* Background Subtle Circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-saffron-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badgeText="Democratic Ownership Model"
          badgeVariant="coop"
          title="Democratically Governed by"
          titleAccent="Registered Worker Cooperatives"
          description="ShramSetu does not own the workers; the workers own the network. Registered labour cooperatives pool welfare funds, negotiate floor wages, and oversee fair AI dispatch."
        />

        {/* 3 Value Highlights for the Cooperative Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200/60">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                State Registry Aligned
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All affiliated unions operate under the Cooperative Societies
                Act, ensuring auditable elections, democratic bylaws, and state
                registrar oversight.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200/60">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Pooled Welfare & Health
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Unlike gig apps where medical risks fall entirely on the
                individual, guild safety nets fund family hospitalizations,
                maternity, and power-tool repairs.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 border border-blue-200/60">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Guaranteed Floor Wages
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Cooperatives mandate trade-specific statutory base rates.
                Customers receive verified craft quality while artisans earn
                living wages with dignity.
              </p>
            </div>
          </div>
        </div>

        {/* Spotlight on Real-World Guild Profiles */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-brand-navy-900 font-display">
                Featured Registered Cooperatives
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Active cooperative societies managing worker rosters and welfare
                pools on ShramSetu
              </p>
            </div>
            <Badge
              variant="verified"
              dot
              size="md"
              className="hidden sm:inline-flex"
            >
              All 148 Guilds Verified
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {COOPERATIVE_GUILDS.map((coop) => (
              <Card
                key={coop.id}
                hoverEffect
                className="flex flex-col h-full bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="gov" size="sm" icon={ShieldCheck}>
                      {coop.state}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      Est. {coop.establishedYear}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-brand-navy-900 mb-1">
                    {coop.name}
                  </h4>

                  <p className="text-xs text-slate-500 font-mono">
                    Reg: {coop.regNumber}
                  </p>
                </CardHeader>

                <CardContent className="py-0 flex-1 space-y-4">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Total Artisans
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {coop.membersCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Welfare Corpus
                      </span>
                      <span className="font-extrabold text-emerald-700 text-sm">
                        {coop.welfareFund}
                      </span>
                    </div>
                  </div>

                  {/* Key Benefits Included */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Guild Welfare Coverage:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {coop.keyBenefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Coverage */}
                  <div className="pt-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Jurisdiction:{" "}
                    </span>
                    {coop.districts}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 mt-4 border-t border-slate-100">
                  <div className="w-full flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Guild President:{" "}
                      <strong className="text-slate-800">
                        {coop.president}
                      </strong>
                    </span>
                    <span className="font-semibold text-brand-saffron-600 hover:text-brand-saffron-700 cursor-pointer">
                      View Roster →
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Cooperative Onboarding Banner */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-navy-900 text-brand-saffron-400 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-brand-navy-900">
                Are You an Office-Bearer of a Labour Cooperative Society?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Onboard your entire artisan roster onto ShramSetu. Enjoy
                automated DBT accounting, dynamic QR job passes, and zero
                software licensing costs under SIH 2026.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              iconRight={ArrowRight}
            >
              Register Your Cooperative
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
