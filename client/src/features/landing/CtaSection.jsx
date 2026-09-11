import React from "react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  ArrowRight,
  ShieldCheck,
  HardHat,
  Building2,
  Sparkles,
  Quote,
  Star,
} from "lucide-react";
import { TESTIMONIALS } from "../../data/mockData";

export function CtaSection() {
  return (
    <section className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonials from Real Artisans & Contractors */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="gov" size="md" className="mb-2">
              Voices of ShramSetu
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-brand-navy-900">
              Dignity for Workers. Reliability for Citizens.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between relative shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 italic leading-relaxed mb-6">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-slate-200/80">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {t.name}
                    </h4>
                    <p className="text-xs text-brand-saffron-700 font-semibold">
                      {t.role}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t.guild} • {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual High-Impact CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-slate-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
          {/* Subtle Graphic Accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-saffron-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <Badge variant="saffron" size="sm" className="mb-4">
              Join the National Movement • SIH 2026
            </Badge>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
              Ready to Experience India’s Fair Labour Marketplace?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Whether you need skilled artisans for home or industrial work, or
              you are an artisan seeking 100% direct payouts with cooperative
              healthcare, ShramSetu is your platform.
            </p>

            {/* Dual Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#services" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-base px-8"
                  iconRight={ArrowRight}
                >
                  Book a Verified Artisan
                </Button>
              </a>

              <a href="#cooperatives" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Join / Register Guild
                </Button>
              </a>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              No platform cuts • 100% Aadhaar & Skill India verified • Instant
              DBT settlement
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
