import React from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSection } from './features/landing/HeroSection';
import { StatsSection } from './features/landing/StatsSection';
import { ServicesSection } from './features/landing/ServicesSection';
import { HowItWorksSection } from './features/landing/HowItWorksSection';
import { CooperativeSection } from './features/landing/CooperativeSection';
import { VerifiedWorkersSection } from './features/landing/VerifiedWorkersSection';
import { AiAllocationSection } from './features/landing/AiAllocationSection';
import { CtaSection } from './features/landing/CtaSection';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 selection:bg-brand-saffron-100 selection:text-brand-saffron-900">
      {/* Responsive Fixed Navigation */}
      <Navbar />

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
    </div>
  );
}

