import React from "react";
import { Logo } from "./Logo";
import {
  ShieldCheck,
  PhoneCall,
  HeartHandshake,
  ExternalLink,
  Award,
  Sparkles,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy-950 text-slate-300 relative overflow-hidden border-t border-slate-800">
      {/* Tricolor Sovereign Strip at the top of the footer */}
      <div className="gov-tricolor-stripe" />

      {/* Emergency Distress & Helpline Ribbon */}
      <div className="bg-brand-navy-900/90 border-b border-slate-800 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="p-1 rounded bg-red-500/20 text-red-400">
              <PhoneCall className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-white">
              24x7 Shramik Welfare & Safety Helpline:
            </span>
            <span className="text-amber-400 font-mono font-bold tracking-wide">
              1800-11-7388 (1800-11-SETU)
            </span>
            <span className="hidden md:inline text-slate-500">
              | Toll-Free in 12 Regional Languages
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Digital Personal Data Protection (DPDP) Act 2023 Compliant
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand & Manifesto Column (2 cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Logo theme="dark" showTagline={true} />

            <p className="text-sm text-slate-400 leading-relaxed pr-0 lg:pr-6">
              ShramSetu (श्रमसेतु) is India’s sovereign digital marketplace
              uniting informal workers under democratically owned cooperative
              societies. By eliminating extractive middleman cuts and deploying
              open AI dispatch, we guarantee floor wages and social security to
              every skilled artisan.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Smart India Hackathon 2026</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cooperative-Owned Model</span>
              </div>
            </div>
          </div>

          {/* Column 1: Platform & Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 font-display">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="#services"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Electrical & Power
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Plumbing & Sanitation
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Civil Construction & Masonry
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Carpentry & Modular
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Heavy Freight & Logistics
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  All 24+ Skilled Trades
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: For Cooperatives & Workers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 font-display">
              Cooperatives & Guilds
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="#cooperatives"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Register a New Guild
                </a>
              </li>
              <li>
                <a
                  href="#cooperatives"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Welfare & Insurance Pool
                </a>
              </li>
              <li>
                <a
                  href="#ai-engine"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  AI Fair Rotation Engine
                </a>
              </li>
              <li>
                <a
                  href="#workers"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Aadhaar & NSDC Verification
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Zero-Commission Policy
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  QR Dynamic Handshake
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Governance & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 font-display">
              Governance & Legal
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="#"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Fair Floor Wage Charter
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Cooperative Bylaws (Model 2026)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Smart Escrow Dispute Protocol
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Privacy & Aadhaar Masking
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Open API & National Portal
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand-saffron-400 transition-colors"
                >
                  Ministry of Labour Alignment
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Credits and Disclaimer */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {currentYear} ShramSetu. Built for Smart India Hackathon (SIH
            2026). All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              0% Platform Cut • 100% Worker Dignity
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <span>Made with pride in India</span>
              <span className="inline-block w-2.5 h-2 rounded-sm bg-orange-500"></span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
