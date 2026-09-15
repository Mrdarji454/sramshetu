import React from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { ServicesSection } from './ServicesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { CooperativeSection } from './CooperativeSection';
import { VerifiedWorkersSection } from './VerifiedWorkersSection';
import { AiAllocationSection } from './AiAllocationSection';
import { CtaSection } from './CtaSection';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 selection:bg-brand-saffron-100 selection:text-brand-saffron-900">
      <Navbar />

      <main className="flex-grow">
        <HeroSection />
        <StatsSection />
        <ServicesSection />
        <HowItWorksSection />
        <CooperativeSection />
        <VerifiedWorkersSection />
        <AiAllocationSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
