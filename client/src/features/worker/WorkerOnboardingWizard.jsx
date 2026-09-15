import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import workerService from '../../services/worker.service';
import cooperativeService from '../../services/cooperative.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  User,
  Wrench,
  Award,
  Briefcase,
  MapPin,
  Clock,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  Sparkles,
  Building2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

const TRADES_CATALOG = [
  {
    trade: 'Electrical & Power Systems',
    skills: ['Concealed Wiring', 'DB Dressing', 'Solar Inverter', 'Earthing Testing', '3-Phase Substation Tech', 'Smart Home Automation'],
    defaultFloor: 1200,
    defaultHourly: 450,
  },
  {
    trade: 'Plumbing & Water Sanitation',
    skills: ['CPVC / UPVC Piping', 'Hydro-Pneumatic Pumps', 'Drain Cleaning & Jetting', 'Sanitary Fitting', 'Solar Water Heaters', 'Leak Detection'],
    defaultFloor: 1100,
    defaultHourly: 400,
  },
  {
    trade: 'Carpentry & Woodwork',
    skills: ['Modular Kitchen Fitting', 'Door Lock Installation', 'Furniture Restoration', 'False Ceiling Framing', 'Wood Veneer & Polishing'],
    defaultFloor: 1250,
    defaultHourly: 420,
  },
  {
    trade: 'Masonry & Civil Works',
    skills: ['Tile & Granite Laying', 'Brickwork & Plastering', 'Waterproofing Membrane', 'Structural Grouting', 'Concrete Formwork'],
    defaultFloor: 1300,
    defaultHourly: 400,
  },
  {
    trade: 'Painting & Surface Coating',
    skills: ['Interior Texture Emulsion', 'Exterior Weatherproof Coat', 'Waterproof Damp Proofing', 'Wood PU Polish', 'Airless Spray Painting'],
    defaultFloor: 1050,
    defaultHourly: 350,
  },
  {
    trade: 'Appliance & HVAC Repair',
    skills: ['Inverter AC Installation', 'Compressor Overhaul', 'PCB Diagnostics', 'Washing Machine Repair', 'Refrigerator Gas Charging'],
    defaultFloor: 1400,
    defaultHourly: 500,
  },
];

const STEPS = [
  { id: 'profile', title: 'Profile', icon: User, desc: 'Personal & Trade' },
  { id: 'skills', title: 'Skills', icon: Award, desc: 'Specializations' },
  { id: 'experience', title: 'Experience', icon: Briefcase, desc: 'History & Rates' },
  { id: 'location', title: 'Location', icon: MapPin, desc: 'Service Area' },
  { id: 'availability', title: 'Availability', icon: Clock, desc: 'Working Days' },
  { id: 'documents', title: 'Documents', icon: FileText, desc: 'KYC & Trade ID' },
  { id: 'verification', title: 'Verification', icon: ShieldCheck, desc: 'Review & Status' },
];

export function WorkerOnboardingWizard({ onComplete, initialTab }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialTab || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [cooperativesList, setCooperativesList] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || '',
    primaryTrade: 'Electrical & Power Systems',
    bio: '',
    cooperativeId: '',
    skills: ['Concealed Wiring', 'DB Dressing'],
    nsdcLevel: 'NSDC Level 3 Certified',
    years: 4,
    subTrades: ['Solar Inverter'],
    dailyFloorRate: 1200,
    hourlyRate: 450,
    address: {
      street: '',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    workingRadiusKm: 15,
    availability: {
      status: 'available',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: { start: '08:00', end: '18:00' },
    },
    documents: [
      { docType: 'Aadhaar Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600', name: 'aadhaar_card_front.jpg' },
      { docType: 'NSDC Certificate', url: 'https://images.unsplash.com/photo-1589330694653-dad6ef0140be?w=600', name: 'nsdc_level3_cert.pdf' },
    ],
  });

  const [verificationData, setVerificationData] = useState(null);

  // Load existing profile & cooperatives directory
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [profile, coops, ver] = await Promise.allSettled([
          workerService.getProfile(),
          cooperativeService.getCooperativesList(),
          workerService.getVerificationStatus(),
        ]);

        if (profile.status === 'fulfilled' && profile.value) {
          const p = profile.value;
          setFormData((prev) => ({
            ...prev,
            name: p.name || prev.name,
            phone: p.phone || prev.phone,
            profileImage: p.profileImage || prev.profileImage,
            primaryTrade: p.experience?.primaryTrade || prev.primaryTrade,
            bio: p.experience?.bio || prev.bio,
            years: p.experience?.years || prev.years,
            subTrades: p.experience?.subTrades || prev.subTrades,
            skills: p.skills?.map((s) => (typeof s === 'string' ? s : s.name)) || prev.skills,
            dailyFloorRate: p.rates?.dailyFloorRate || prev.dailyFloorRate,
            hourlyRate: p.rates?.hourlyRate || prev.hourlyRate,
            address: {
              street: p.location?.address?.street || prev.address.street,
              city: p.location?.address?.city || prev.address.city,
              state: p.location?.address?.state || prev.address.state,
              pincode: p.location?.address?.pincode || prev.address.pincode,
            },
            workingRadiusKm: p.location?.workingRadiusKm || prev.workingRadiusKm,
            availability: {
              status: p.availability?.status || prev.availability.status,
              workingDays: p.availability?.workingDays || prev.availability.workingDays,
              hours: p.availability?.hours || prev.availability.hours,
            },
            documents: p.verificationStatus?.documents?.length ? p.verificationStatus.documents : prev.documents,
            cooperativeId: p.cooperativeId || p.cooperative?._id || p.cooperative || prev.cooperativeId,
          }));
        }

        if (coops.status === 'fulfilled' && Array.isArray(coops.value)) {
          setCooperativesList(coops.value);
        }

        if (ver.status === 'fulfilled' && ver.value) {
          setVerificationData(ver.value);
        }
      } catch (err) {
        console.error('Error loading worker profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleFileUpload = (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const newDoc = { docType, url: dataUrl, name: file.name };
      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents.filter((d) => d.docType !== docType), newDoc],
      }));
      setFeedback({ type: 'success', message: `${docType} attached successfully!` });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      const newSkills = exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill];
      return { ...prev, skills: newSkills };
    });
  };

  const toggleDay = (day) => {
    setFormData((prev) => {
      const days = prev.availability.workingDays;
      const exists = days.includes(day);
      const newDays = exists ? days.filter((d) => d !== day) : [...days, day];
      return {
        ...prev,
        availability: { ...prev.availability, workingDays: newDays },
      };
    });
  };

  const handleSaveAndProceed = async (targetStep) => {
    setFeedback(null);
    setIsSaving(true);
    try {
      const updated = await workerService.saveOnboarding({
        ...formData,
        skills: formData.skills.map((name) => ({
          name,
          nsdcLevel: formData.nsdcLevel,
          isPrimary: true,
        })),
      });

      const ver = await workerService.getVerificationStatus();
      setVerificationData(ver);

      setFeedback({ type: 'success', message: 'Step saved successfully!' });

      if (targetStep !== undefined) {
        setCurrentStep(targetStep);
      } else if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        if (onComplete) onComplete(updated);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save onboarding data' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentTradeObj = TRADES_CATALOG.find((t) => t.trade === formData.primaryTrade) || TRADES_CATALOG[0];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <Loader2 className="w-10 h-10 text-brand-saffron-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading worker onboarding profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Progress Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Artisan Onboarding
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-brand-navy-900 mt-1">
              {STEPS[currentStep].title}: {STEPS[currentStep].desc}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {verificationData && (
              <Badge
                variant={
                  verificationData.status === 'verified'
                    ? 'verified'
                    : verificationData.status === 'rejected'
                    ? 'outline'
                    : 'saffron'
                }
                size="md"
                dot
              >
                Verification: {verificationData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 border-t border-slate-100 pt-4">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  isCurrent
                    ? 'border-brand-saffron-500 bg-brand-saffron-50/50 ring-2 ring-brand-saffron-400/20'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isCurrent
                      ? 'bg-brand-saffron-500 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isCurrent ? 'text-brand-saffron-950' : 'text-slate-800'}`}>
                    {s.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Step Content */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm">
        {/* STEP 1: PROFILE */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Professional Profile Details
            </h3>

            {/* Profile Picture Upload & Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="relative">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Worker Profile"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-saffron-400 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-brand-navy-900 text-amber-400 font-extrabold text-2xl flex items-center justify-center border border-slate-300">
                    {formData.name?.charAt(0) || 'W'}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-900">Artisan Profile Photo</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clear front-facing photo with technical uniform/hard-hat is recommended for instant client trust.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-brand-saffron-600" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                  </label>
                  {formData.profileImage && (
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, profileImage: '' }))}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Legal Name (as in Aadhaar)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rajeshwar D. Shinde"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Trade / Specialization
                </label>
                <select
                  value={formData.primaryTrade}
                  onChange={(e) => {
                    const newTrade = e.target.value;
                    const tradeInfo = TRADES_CATALOG.find((t) => t.trade === newTrade);
                    setFormData({
                      ...formData,
                      primaryTrade: newTrade,
                      dailyFloorRate: tradeInfo?.defaultFloor || formData.dailyFloorRate,
                      hourlyRate: tradeInfo?.defaultHourly || formData.hourlyRate,
                      skills: tradeInfo?.skills.slice(0, 3) || [],
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
                >
                  {TRADES_CATALOG.map((t) => (
                    <option key={t.trade} value={t.trade}>
                      {t.trade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Affiliated Cooperative Society / Welfare Guild
              </label>
              <select
                value={formData.cooperativeId}
                onChange={(e) => setFormData({ ...formData, cooperativeId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
              >
                <option value="">Select Cooperative Guild...</option>
                {cooperativesList.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} ({c.district || c.state || 'Maharashtra'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Your guild guarantees statutory floor rates and provides 100% direct payouts with zero cuts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Professional Bio & Technical Summary
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Describe your expertise, certifications, and types of projects handled..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* STEP 2: SKILLS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Technical Skills & Certification</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your core technical skills in <strong className="text-slate-800">{formData.primaryTrade}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Available Skills in {formData.primaryTrade} (Click to toggle)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {currentTradeObj.skills.map((skill) => {
                  const isSelected = formData.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-brand-saffron-500 bg-brand-saffron-50/60 ring-2 ring-brand-saffron-400/20 text-brand-saffron-950 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs truncate">{skill}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-saffron-600 flex-shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                NSDC / Skill India Certification Tier
              </label>
              <select
                value={formData.nsdcLevel}
                onChange={(e) => setFormData({ ...formData, nsdcLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
              >
                <option value="Uncertified (Awaiting Guild Assessment)">Uncertified (Awaiting Guild Assessment)</option>
                <option value="NSDC Level 1 Assistant">NSDC Level 1 Assistant</option>
                <option value="NSDC Level 2 Junior Artisan">NSDC Level 2 Junior Artisan</option>
                <option value="NSDC Level 3 Certified">NSDC Level 3 Certified (Standard Artisan)</option>
                <option value="NSDC Level 4 Master Technician">NSDC Level 4 Master Technician (Supervisor)</option>
                <option value="ITI Certified / State Trade Diploma">ITI Certified / State Trade Diploma</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: EXPERIENCE & RATES */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Experience & Fair Floor Rates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Years of Field Experience
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={formData.years}
                    onChange={(e) => setFormData({ ...formData, years: Number(e.target.value) })}
                    className="flex-1 accent-brand-saffron-500"
                  />
                  <span className="w-14 text-center font-bold text-sm bg-slate-100 py-1.5 rounded-lg text-slate-900">
                    {formData.years} yrs
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Sub-Trades / Secondary Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.subTrades.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subTrades: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. Solar Inverter, Panel Wiring"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Rates Card */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200">
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-saffron-600" />
                Statutory Cooperative Floor Rates (No Middleman Cut)
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                Your guild sets transparent floor wages so you are never underpaid. 100% of these rates are credited directly to your bank via DBT.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Daily Floor Wage (8 Hours)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={formData.dailyFloorRate}
                      onChange={(e) => setFormData({ ...formData, dailyFloorRate: Number(e.target.value) })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-saffron-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Hourly Standard Rate (Min 2 Hours)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-saffron-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LOCATION & WORKING RADIUS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Operational Service Area & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Street / Area Address
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  placeholder="e.g. Near Shivajinagar Bus Stand"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  City / District
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  placeholder="e.g. Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Postal Pincode
                </label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value },
                    })
                  }
                  placeholder="e.g. 411038"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Operational Dispatch Radius: <span className="text-brand-saffron-600 font-extrabold">{formData.workingRadiusKm} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={formData.workingRadiusKm}
                onChange={(e) => setFormData({ ...formData, workingRadiusKm: Number(e.target.value) })}
                className="w-full accent-brand-saffron-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>1 km (Hyperlocal)</span>
                <span>15 km (Recommended City Range)</span>
                <span>50 km (Suburban)</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: AVAILABILITY */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Weekly Working Schedule & Availability
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Working Days (Click to toggle active days)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const isActive = formData.availability.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Shift Start Time
                </label>
                <input
                  type="time"
                  value={formData.availability.hours?.start || '08:00'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availability: {
                        ...formData.availability,
                        hours: { ...formData.availability.hours, start: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Shift End Time
                </label>
                <input
                  type="time"
                  value={formData.availability.hours?.end || '18:00'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availability: {
                        ...formData.availability,
                        hours: { ...formData.availability.hours, end: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/50"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Immediate Rota Status</span>
                <span className="text-[11px] text-slate-500">
                  Turn online to receive emergency nearby customer dispatches
                </span>
              </div>
              <Button
                variant={formData.availability.status === 'available' ? 'emerald' : 'outline'}
                size="sm"
                onClick={() =>
                  setFormData({
                    ...formData,
                    availability: {
                      ...formData.availability,
                      status: formData.availability.status === 'available' ? 'offline' : 'available',
                    },
                  })
                }
              >
                {formData.availability.status === 'available' ? 'Online / Ready' : 'Standby / Offline'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: DOCUMENTS */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">KYC & Technical Verification Documents</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload clear photos or PDFs for state registry and registrar verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Aadhaar Identity Card', type: 'Aadhaar Card', desc: 'Front and back side for e-KYC' },
                { title: 'NSDC / Skill Certificate', type: 'NSDC Certificate', desc: 'Skill India / ITI certification document' },
                { title: 'Trade License / Police Verification', type: 'Trade License', desc: 'Municipal registration or police clearance' },
              ].map((docItem) => {
                const uploaded = formData.documents.find((d) => d.docType === docItem.type);

                return (
                  <div key={docItem.type} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-900">{docItem.title}</h4>
                        {uploaded ? (
                          <Badge variant="verified" size="sm">Uploaded</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">Required</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">{docItem.desc}</p>

                      {uploaded && (
                        <div className="mb-3">
                          <img
                            src={uploaded.url}
                            alt={docItem.title}
                            className="w-full h-28 rounded-lg object-cover border border-slate-200 shadow-sm"
                          />
                          <p className="text-[10px] text-slate-500 truncate mt-1 font-mono">{uploaded.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-brand-saffron-600" />
                        <span>{uploaded ? 'Replace Document' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, docItem.type)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: VERIFICATION & SUMMARY */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Verification Status & Checklist</h3>
                <p className="text-xs text-slate-500">Live statutory review tracker with cooperative registrar</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={async () => {
                  const ver = await workerService.getVerificationStatus();
                  setVerificationData(ver);
                }}
              >
                Refresh
              </Button>
            </div>

            {/* Current Status Box */}
            <div className="p-5 rounded-2xl bg-brand-navy-950 text-white border border-slate-800 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                    Registration Authority: MoSDE & State Registry
                  </span>
                  <h4 className="text-xl font-extrabold text-white font-display mt-1">
                    {verificationData?.status === 'verified'
                      ? '✓ Verified Sovereign Artisan'
                      : verificationData?.status === 'rejected'
                      ? '✗ Action Required: Verification Rejected'
                      : '⏳ Application Under State Registrar Review'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    {verificationData?.status === 'verified'
                      ? 'Your profile is approved and active in high-priority proximity dispatch rotas.'
                      : verificationData?.status === 'rejected'
                      ? `Reason: ${verificationData.rejectionReason || 'Please review your uploaded documents and resubmit.'}`
                      : 'Your documents have been submitted to your cooperative society registrar for Aadhaar & NSDC verification.'}
                  </p>
                </div>

                <Badge
                  variant={
                    verificationData?.status === 'verified'
                      ? 'verified'
                      : verificationData?.status === 'rejected'
                      ? 'outline'
                      : 'saffron'
                  }
                  size="lg"
                  dot
                >
                  {(verificationData?.status || 'PENDING').toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Statutory Onboarding Verification Checklist
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verificationData?.checklist?.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          item.complete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-800">{item.title}</span>
                    </div>
                    <Badge variant={item.complete ? 'verified' : 'default'} size="sm">
                      {item.complete ? 'Done' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="border-t border-slate-100 pt-5 mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="md"
            icon={ArrowLeft}
            disabled={currentStep === 0 || isSaving}
            onClick={() => setCurrentStep((p) => p - 1)}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              disabled={isSaving}
              iconRight={currentStep === STEPS.length - 1 ? CheckCircle2 : ArrowRight}
              onClick={() => handleSaveAndProceed()}
            >
              {isSaving
                ? 'Saving...'
                : currentStep === STEPS.length - 1
                ? 'Submit & Finish Onboarding'
                : `Save & Continue to ${STEPS[currentStep + 1]?.title}`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default WorkerOnboardingWizard;

