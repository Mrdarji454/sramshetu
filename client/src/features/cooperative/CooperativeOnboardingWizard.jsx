import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import cooperativeService from '../../services/cooperative.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SERVICE_CATEGORIES } from '../../data/mockData';
import {
  Building2,
  Wrench,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Phone,
  Mail,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import { LOCALITY_PRESETS } from '../../utils/geo.utils';

const COOP_STEPS = [
  { id: 'organization', title: 'Organization', icon: Building2, desc: 'Registration & Governance' },
  { id: 'services', title: 'Services', icon: Wrench, desc: 'Trade Categories' },
  { id: 'location', title: 'Location', icon: MapPin, desc: 'Jurisdiction & Pincodes' },
  { id: 'workers', title: 'Workers / Members', icon: Users, desc: 'Guild Artisan Roster' },
  { id: 'verification', title: 'Admin Verification', icon: ShieldCheck, desc: 'Registrar Approval' },
];

export function CooperativeOnboardingWizard({ onComplete, initialTab }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialTab || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // New Member Modal State
  const [newMemberModalOpen, setNewMemberModalOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    phone: '',
    trade: 'Electrical & Power Systems',
    dailyFloorRate: 1200,
  });

  // Form State
  const [formData, setFormData] = useState({
    name: 'Pune Shramik Vikas Sahakari',
    registrationNumber: 'MH-PUN-COOP-2022-8812',
    state: 'Maharashtra',
    registeredYear: 2022,
    authority: 'State Registrar of Cooperative Societies, Pune',
    description:
      'Democratic artisan guild supporting industrial wiremen, commercial plumbers, and masonry specialists with guaranteed statutory floor wages.',
    serviceCategories: ['Electrical & Power Systems', 'Plumbing & Water Sanitation', 'Carpentry & Woodwork'],
    address: 'Shramik Bhavan, 3rd Floor, FC Road, Shivajinagar',
    district: 'Pune',
    latitude: 18.5204,
    longitude: 73.8436,
    coverageRadiusKm: 25,
    operationalPincodes: '411001, 411004, 411038, 411052',
    presidentName: 'Sanjay Tukaram Jadhav',
    secretaryName: 'Anjali Deshmukh',
    contactEmail: user?.email || 'pune.coop@shramsetu.gov.in',
    contactPhone: user?.phone || '+91 98201 99999',
    members: [],
  });

  const [verificationData, setVerificationData] = useState(null);

  // Load cooperative profile
  useEffect(() => {
    async function loadCoopData() {
      setIsLoading(true);
      try {
        const [profile, ver, members] = await Promise.allSettled([
          cooperativeService.getProfile(),
          cooperativeService.getVerificationStatus(),
          cooperativeService.getMembers(),
        ]);

        if (profile.status === 'fulfilled' && profile.value) {
          const p = profile.value;
          setFormData((prev) => ({
            ...prev,
            name: p.name || prev.name,
            registrationNumber: p.registrationDetails?.registrationNumber || prev.registrationNumber,
            state: p.registrationDetails?.state || p.location?.state || prev.state,
            registeredYear: p.registrationDetails?.registeredYear || prev.registeredYear,
            authority: p.registrationDetails?.authority || prev.authority,
            description: p.description || prev.description,
            serviceCategories: p.serviceCategories?.length ? p.serviceCategories : prev.serviceCategories,
            address: p.location?.address || prev.address,
            district: p.location?.district || prev.district,
            operationalPincodes: Array.isArray(p.location?.operationalPincodes)
              ? p.location.operationalPincodes.join(', ')
              : prev.operationalPincodes,
            presidentName: p.governance?.presidentName || prev.presidentName,
            secretaryName: p.governance?.secretaryName || prev.secretaryName,
            contactEmail: p.governance?.contactEmail || prev.contactEmail,
            contactPhone: p.governance?.contactPhone || prev.contactPhone,
            members: members.status === 'fulfilled' && Array.isArray(members.value) ? members.value : prev.members,
          }));
        }

        if (ver.status === 'fulfilled' && ver.value) {
          setVerificationData(ver.value);
        }
      } catch (err) {
        console.error('Error loading cooperative data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCoopData();
  }, []);

  const toggleCategory = (categoryName) => {
    setFormData((prev) => {
      const exists = prev.serviceCategories.includes(categoryName);
      const updated = exists
        ? prev.serviceCategories.filter((c) => c !== categoryName)
        : [...prev.serviceCategories, categoryName];
      return { ...prev, serviceCategories: updated };
    });
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberData.name.trim()) return;

    try {
      const created = await cooperativeService.addMember(newMemberData);
      setFormData((prev) => ({
        ...prev,
        members: [created, ...prev.members],
      }));
      setNewMemberModalOpen(false);
      setNewMemberData({ name: '', phone: '', trade: 'Electrical & Power Systems', dailyFloorRate: 1200 });
      setFeedback({ type: 'success', message: `${newMemberData.name} enrolled into guild roster!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to enroll member' });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await cooperativeService.removeMember(memberId);
      setFormData((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId && m._id !== memberId),
      }));
      setFeedback({ type: 'success', message: 'Worker removed from roster' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove member' });
    }
  };

  const handleSaveAndProceed = async (targetStep) => {
    setFeedback(null);
    setIsSaving(true);
    try {
      const updated = await cooperativeService.saveOnboarding({
        ...formData,
        operationalPincodes: formData.operationalPincodes
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      });

      const ver = await cooperativeService.getVerificationStatus();
      setVerificationData(ver);

      setFeedback({ type: 'success', message: 'Cooperative details saved successfully!' });

      if (targetStep !== undefined) {
        setCurrentStep(targetStep);
      } else if (currentStep < COOP_STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        if (onComplete) onComplete(updated);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save cooperative data' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading cooperative organization details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                Cooperative Society Registration
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Step {currentStep + 1} of {COOP_STEPS.length}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-brand-navy-900 mt-1">
              {COOP_STEPS[currentStep].title}: {COOP_STEPS[currentStep].desc}
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
                    : 'coop'
                }
                size="md"
                dot
              >
                Registrar Status: {verificationData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-slate-100 pt-4">
          {COOP_STEPS.map((s, idx) => {
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
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-950' : 'text-slate-800'}`}>
                    {s.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Banner */}
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

      {/* Form Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm">
        {/* STEP 1: ORGANIZATION DETAILS */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Cooperative Society Registry & Governance Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Society Name (as in Bylaws)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pune Shramik Vikas Sahakari Sanstha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  State Registration Number
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="e.g. MH-PUN-COOP-2022-8812"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium font-mono focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Registration State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Registered Year & Authority
                </label>
                <input
                  type="text"
                  value={formData.authority}
                  onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                  placeholder="State Registrar of Cooperative Societies"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Governance Officers */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Elected Guild Office Bearers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    President / Chairman Name
                  </label>
                  <input
                    type="text"
                    value={formData.presidentName}
                    onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                    placeholder="e.g. Sanjay Tukaram Jadhav"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Secretary / Managing Director Name
                  </label>
                  <input
                    type="text"
                    value={formData.secretaryName}
                    onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                    placeholder="e.g. Anjali Deshmukh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="pune.coop@shramsetu.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Official Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 98201 99999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Bylaws & Cooperative Objectives Summary
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="State your cooperative society objectives, welfare fund policies, and trade representations..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* STEP 2: SERVICES / TRADES */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Supported Service Categories</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the trades and technical sectors represented by your cooperative guild.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = formData.serviceCategories.includes(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                          {cat.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{cat.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Floor: {cat.dailyRate}</span>
                      <span className="text-indigo-600 font-semibold">{cat.badge}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & OPERATIONAL JURISDICTION */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Registered Office & Operational Jurisdiction
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Registered Society Headquarters Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Shramik Bhavan, FC Road, Shivajinagar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  District Jurisdiction
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  State Jurisdiction
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Covered Operational Pincodes (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.operationalPincodes}
                  onChange={(e) => setFormData({ ...formData, operationalPincodes: e.target.value })}
                  placeholder="e.g. 411001, 411004, 411038, 411052"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono bg-slate-50/50"
                />
              </div>

              {/* Coordinates and Coverage Area */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Guild Headquarters Coordinates & Locality Presets
                  </span>
                  <span className="text-[10px] text-indigo-700">Used for jurisdiction and proximity routing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude || 18.5204}
                      onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude || 73.8436}
                      onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Quick Locality Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-indigo-200/60">
                  <span className="text-[10px] font-bold text-slate-500">Quick Headquarters Presets:</span>
                  {LOCALITY_PRESETS.slice(0, 6).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          latitude: p.latitude,
                          longitude: p.longitude,
                          district: p.city,
                          address: `${p.name}, ${p.city}`,
                        })
                      }
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 text-[10px] font-semibold border border-indigo-200 transition-colors"
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coverage Radius Slider */}
              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Jurisdiction Operational Radius: <span className="text-indigo-700 font-extrabold">{formData.coverageRadiusKm || 25} km</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="75"
                  step="5"
                  value={formData.coverageRadiusKm || 25}
                  onChange={(e) => setFormData({ ...formData, coverageRadiusKm: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>5 km (City Center)</span>
                  <span>25 km (Metropolitan)</span>
                  <span>75 km (District Wide)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WORKERS / MEMBERS MANAGEMENT */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enrolled Guild Member Artisans</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage worker roster, floor wage commitments, and active rota statuses
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setNewMemberModalOpen(true)}
              >
                Enroll New Artisan
              </Button>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Artisan Name</th>
                    <th className="p-3.5">Trade / Skill</th>
                    <th className="p-3.5">Phone Number</th>
                    <th className="p-3.5">Daily Floor Rate</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.members?.length > 0 ? (
                    formData.members.map((member) => (
                      <tr key={member.id || member._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-navy-900 text-white flex items-center justify-center font-bold text-[10px]">
                              {member.name?.charAt(0) || 'W'}
                            </div>
                            <span>{member.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">{member.trade}</td>
                        <td className="p-3.5 font-mono text-slate-500">{member.phone}</td>
                        <td className="p-3.5 font-bold text-slate-900">₹{member.dailyFloorRate || 1200} / day</td>
                        <td className="p-3.5">
                          <Badge variant={member.status === 'available' ? 'verified' : 'saffron'} size="sm">
                            {member.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id || member._id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Remove worker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No workers enrolled in this guild roster yet. Click "Enroll New Artisan" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Enroll New Member Modal */}
            {newMemberModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Enroll New Guild Artisan</h3>
                    <button
                      type="button"
                      onClick={() => setNewMemberModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Worker Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemberData.name}
                        onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                        placeholder="e.g. Rameshwar K. Shinde"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Mobile Phone (with WhatsApp)
                      </label>
                      <input
                        type="tel"
                        required
                        value={newMemberData.phone}
                        onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                        placeholder="+91 98201 00000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Artisan Trade
                      </label>
                      <select
                        value={newMemberData.trade}
                        onChange={(e) => setNewMemberData({ ...newMemberData, trade: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      >
                        {SERVICE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Guaranteed Daily Floor Wage (₹)
                      </label>
                      <input
                        type="number"
                        value={newMemberData.dailyFloorRate}
                        onChange={(e) => setNewMemberData({ ...newMemberData, dailyFloorRate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                      />
                    </div>

                    <div className="pt-3 flex gap-2">
                      <Button variant="outline" size="md" className="flex-1" onClick={() => setNewMemberModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="md" type="submit" className="flex-1">
                        Enroll Worker
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: ADMIN VERIFICATION */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">State Registry Verification Status</h3>
                <p className="text-xs text-slate-500">Government oversight & cooperative registry audit status</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={async () => {
                  const ver = await cooperativeService.getVerificationStatus();
                  setVerificationData(ver);
                }}
              >
                Refresh
              </Button>
            </div>

            {/* Status Banner */}
            <div className="p-5 rounded-2xl bg-indigo-950 text-white border border-indigo-900 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                    Statutory Registry Code: {formData.registrationNumber}
                  </span>
                  <h4 className="text-xl font-extrabold text-white font-display mt-1">
                    {verificationData?.status === 'verified'
                      ? '✓ Registered & Certified Cooperative Society'
                      : verificationData?.status === 'rejected'
                      ? '✗ Action Required: Society Audit Incomplete'
                      : '⏳ State Registrar Verification in Progress'}
                  </h4>
                  <p className="text-xs text-indigo-200 mt-1">
                    {verificationData?.status === 'verified'
                      ? 'Your society is certified to oversee member artisan rosters and disburse direct DBT payouts.'
                      : verificationData?.status === 'rejected'
                      ? `Reason: ${verificationData.remarks || 'Please review bylaws submission with state registrar.'}`
                      : 'Your bylaws and state registration number are undergoing verification by the Registrar of Cooperatives.'}
                  </p>
                </div>

                <Badge
                  variant={
                    verificationData?.status === 'verified'
                      ? 'verified'
                      : verificationData?.status === 'rejected'
                      ? 'outline'
                      : 'coop'
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
                Cooperative Statutory Review Checklist
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

          <Button
            variant="primary"
            size="md"
            disabled={isSaving}
            iconRight={currentStep === COOP_STEPS.length - 1 ? CheckCircle2 : ArrowRight}
            onClick={() => handleSaveAndProceed()}
          >
            {isSaving
              ? 'Saving...'
              : currentStep === COOP_STEPS.length - 1
              ? 'Submit for Registrar Verification'
              : `Save & Continue to ${COOP_STEPS[currentStep + 1]?.title}`}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default CooperativeOnboardingWizard;

