import React, { useState, useEffect } from "react";
import { Navbar } from "./components/common/Navbar";
import { Footer } from "./components/common/Footer";
import { HeroSection } from "./features/landing/HeroSection";
import { StatsSection } from "./features/landing/StatsSection";
import { ServicesSection } from "./features/landing/ServicesSection";
import { HowItWorksSection } from "./features/landing/HowItWorksSection";
import { CooperativeSection } from "./features/landing/CooperativeSection";
import { VerifiedWorkersSection } from "./features/landing/VerifiedWorkersSection";
import { AiAllocationSection } from "./features/landing/AiAllocationSection";
import { CtaSection } from "./features/landing/CtaSection";

// Four Role-Specific Dashboards
import { UserDashboard } from "./features/customer/UserDashboard";
import { CooperativeDashboard } from "./features/cooperative/CooperativeDashboard";
import { WorkerDashboard } from "./features/worker/WorkerDashboard";
import { AdminDashboard } from "./features/admin/AdminDashboard";

import {
  UserCheck,
  Building2,
  HardHat,
  Lock,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function App() {
  const getRoleFromHash = () => {
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "");
    if (["user", "customer"].includes(hash)) return "user";
    if (["cooperative", "coop"].includes(hash)) return "cooperative";
    if (["worker", "shramik"].includes(hash)) return "worker";
    if (["admin", "portal"].includes(hash)) return "admin";
    return null; // Landing page
  };

  const [currentRole, setCurrentRole] = useState(getRoleFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRole(getRoleFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleRoleChange = (role) => {
    if (role) {
      window.location.hash = `#/${role}`;
    } else {
      window.location.hash = "#/";
    }
    setCurrentRole(role);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Render role dashboards if selected
  if (currentRole === "user") {
    return (
      <UserDashboard
        onSwitchRole={handleRoleChange}
        onBackToHome={() => handleRoleChange(null)}
      />
    );
  }

  if (currentRole === "cooperative") {
    return (
      <CooperativeDashboard
        onSwitchRole={handleRoleChange}
        onBackToHome={() => handleRoleChange(null)}
      />
    );
  }

  if (currentRole === "worker") {
    return (
      <WorkerDashboard
        onSwitchRole={handleRoleChange}
        onBackToHome={() => handleRoleChange(null)}
      />
    );
  }

  if (currentRole === "admin") {
    return (
      <AdminDashboard
        onSwitchRole={handleRoleChange}
        onBackToHome={() => handleRoleChange(null)}
      />
    );
  }

  // Default: Public Landing Page
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 selection:bg-brand-saffron-100 selection:text-brand-saffron-900 relative">
      {/* Responsive Fixed Navigation */}
      <Navbar onSelectRole={handleRoleChange} />

      {/* Main Landing Page Flow */}
      <main className="flex-grow">
        {/* 1. Hero Section with Live Search & Telemetry */}
        <HeroSection />

        {/* 2. Key Statistics & Impact Metrics */}
        <StatsSection />

        {/* 3. Essential Service Categories & Floor Rates */}
        <ServicesSection />

        {/* 4. How It Works (Customer vs. Worker 4-step workflow) */}
        <HowItWorksSection />

        {/* 5. Cooperative Ownership & Welfare Guilds */}
        <CooperativeSection />

        {/* 6. NSDC Verified Worker Profiles & Dynamic QR Pass */}
        <VerifiedWorkersSection />

        {/* 7. AI Fair-Allocation Engine & Interactive Simulator */}
        <AiAllocationSection />

        {/* 8. Community Voices & Dual Call-to-Action */}
        <CtaSection />
      </main>

      {/* Sovereign GovTech Footer */}
      <Footer />

      {/* Floating Role Dashboard Switcher Dock */}
      <aside
        aria-label="Demo role quick navigation"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-brand-navy-950/90 text-white backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-1.5 sm:gap-2.5 max-w-[95vw] overflow-x-auto"
      >
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1 flex-shrink-0 px-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Role Dashboards:</span>
        </span>

        <button
          type="button"
          onClick={() => handleRoleChange("user")}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-semibold transition-all flex-shrink-0"
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>User</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange("cooperative")}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-200 text-xs font-semibold transition-all flex-shrink-0"
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cooperative</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange("worker")}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-amber-600 hover:text-white text-slate-200 text-xs font-semibold transition-all flex-shrink-0"
        >
          <HardHat className="w-3.5 h-3.5 text-amber-400" />
          <span>Worker</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange("admin")}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-semibold transition-all flex-shrink-0"
        >
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>Admin</span>
        </button>
      </aside>
    </div>
  );
}
