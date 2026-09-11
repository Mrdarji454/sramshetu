import React, { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  Globe,
  ChevronDown,
  UserCheck,
  Building2,
  HardHat,
  Lock,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../utils/cn";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState("EN"); // 'EN' or 'HI'
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: language === "EN" ? "Services" : "सेवाएं", href: "#services" },
    {
      label: language === "EN" ? "How It Works" : "कार्य प्रणाली",
      href: "#how-it-works",
    },
    {
      label: language === "EN" ? "Cooperatives" : "सहकारी समितियां",
      href: "#cooperatives",
    },
    {
      label: language === "EN" ? "Verified Workers" : "प्रमाणित श्रमिक",
      href: "#workers",
    },
    {
      label: language === "EN" ? "AI Dispatch" : "एआई आवंटन",
      href: "#ai-engine",
    },
    { label: language === "EN" ? "Platform Impact" : "प्रभाव", href: "#stats" },
  ];

  const roles = [
    {
      name: "Customer / Business",
      icon: UserCheck,
      desc: "Book verified artisans with escrow",
      badge: "Active",
    },
    {
      name: "Worker / Shramik",
      icon: HardHat,
      desc: "100% direct payouts & welfare access",
      badge: "Join Guild",
    },
    {
      name: "Cooperative Society",
      icon: Building2,
      desc: "Manage member roster & payouts",
      badge: "Registered",
    },
    {
      name: "Admin Portal",
      icon: Lock,
      desc: "Audit trails & state registry oversight",
      badge: "Gov Access",
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200">
      {/* Tricolor Sovereign Accent Line */}
      <div className="gov-tricolor-stripe" />

      {/* Gov-Tech Institutional Top Alert Ribbon */}
      <div className="bg-brand-navy-950 text-slate-300 text-[11px] py-1.5 px-4 hidden sm:block border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium text-amber-400">
              <Sparkles className="w-3 h-3" /> SIH 2026 Initiative:
            </span>
            <span>
              Sovereign Cooperative Digital Infrastructure for India’s
              Blue-Collar Workforce
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>MoSDE & State Registry Compliant</span>
            </div>
            <span className="text-slate-600">|</span>
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage((l) => (l === "EN" ? "HI" : "EN"))}
              className="flex items-center gap-1 text-slate-300 hover:text-white font-medium transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-brand-saffron-400" />
              <span>{language === "EN" ? "English (EN)" : "हिन्दी (HI)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={cn(
          "transition-all duration-200",
          isScrolled
            ? "glass-panel shadow-sm border-b border-slate-200/80 py-2.5"
            : "bg-white/95 backdrop-blur-md border-b border-slate-200/60 py-3.5",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-600 hover:text-brand-navy-900 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Right Side CTA & Portals */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Role Portal Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  onBlur={() =>
                    setTimeout(() => setRoleDropdownOpen(false), 200)
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <span>Portal Login</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-500 transition-transform",
                      roleDropdownOpen && "rotate-180",
                    )}
                  />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Select Access Portal
                      </p>
                    </div>
                    <div className="py-1 space-y-1">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                          <a
                            key={role.name}
                            href="#portal"
                            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                          >
                            <div className="p-2 rounded-md bg-slate-100 text-slate-700 group-hover:bg-brand-saffron-50 group-hover:text-brand-saffron-600 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-900">
                                  {role.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {role.desc}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Call to Action */}
              <a href="#services">
                <Button size="sm" variant="primary" iconRight={ArrowRight}>
                  {language === "EN" ? "Book Worker" : "श्रमिक बुक करें"}
                </Button>
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setLanguage((l) => (l === "EN" ? "HI" : "EN"))}
                className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 sm:hidden"
              >
                {language}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 pb-3 border-b border-slate-100">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-saffron-600 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Mobile Portals Preview */}
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-3">
                Role Portals
              </p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <a
                      key={r.name}
                      href="#portal"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 flex items-center gap-2 text-xs font-medium text-slate-800"
                    >
                      <Icon className="w-4 h-4 text-brand-saffron-600" />
                      <span className="truncate">{r.name.split("/")[0]}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-2">
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button size="md" variant="primary" className="w-full">
                  Book a Verified Worker Now
                </Button>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
