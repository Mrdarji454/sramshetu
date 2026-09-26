import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  QrCode,
  Edit3,
  FileText,
  Briefcase,
  Download,
  X,
  ExternalLink,
  Award,
  Phone,
  MapPin,
  IndianRupee,
  UserCheck,
  Check,
  Printer
} from 'lucide-react';
import workerService from '../../services/worker.service';

export function VerifiedDashboard({
  profile,
  verification,
  onViewJobs,
  onRefresh
}) {
  const [activeModal, setActiveModal] = useState(null); // 'edit_profile' | 'view_docs' | 'id_card'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state for editing profile
  const [editFormData, setEditFormData] = useState({
    bio: profile?.bio || profile?.experience?.bio || '',
    phone: profile?.phone || '',
    dailyFloorRate: profile?.rates?.dailyFloorRate || 1300,
    hourlyRate: profile?.rates?.hourlyRate || 450,
    workingRadiusKm: profile?.location?.workingRadiusKm || 15,
  });

  const workerId = (profile?._id || profile?.id || '65f123456789012345678902').toString();
  const formattedWorkerId = `WRK-${workerId.slice(-8).toUpperCase()}`;

  const verifiedDateRaw = verification?.verifiedAt || profile?.verificationStatus?.verifiedAt || new Date().toISOString();
  const formattedVerifiedDate = new Date(verifiedDateRaw).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const coopName =
    profile?.cooperative?.name ||
    profile?.cooperative ||
    'Pune Shramik Vikas Sahakari';

  const tradeName =
    profile?.profession ||
    profile?.experience?.primaryTrade ||
    'Master Industrial Electrician';

  const workerName = profile?.name || 'Artisan';

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await workerService.saveOnboarding({
        bio: editFormData.bio,
        phone: editFormData.phone,
        dailyFloorRate: Number(editFormData.dailyFloorRate),
        hourlyRate: Number(editFormData.hourlyRate),
        workingRadiusKm: Number(editFormData.workingRadiusKm),
      });
      setSaveSuccess(true);
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveModal(null);
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. LARGE GREEN VERIFIED BANNER ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-lg border border-emerald-500/30">
        {/* Background decorative pattern */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute right-12 top-6 opacity-10 pointer-events-none">
          <ShieldCheck className="w-56 h-56" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            {/* Verification Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>NSDC & Statutory Registry Certified Artisan</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Headline */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
                Your KYC has been approved.
              </h2>
              <p className="text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
                Congratulations, <strong className="text-white font-semibold">{workerName}</strong>! Your identity, trade skills, and government statutory e-Shram records have been officially validated. You are fully authorized for high-priority dispatch with 100% direct escrow payouts.
              </p>
            </div>

            {/* Verification Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-emerald-200/80 block text-[10px] uppercase font-bold tracking-wider">
                  Verification Date
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-white">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{formattedVerifiedDate}</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-emerald-200/80 block text-[10px] uppercase font-bold tracking-wider">
                  Worker ID
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-white">
                  <Award className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{formattedWorkerId}</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-emerald-200/80 block text-[10px] uppercase font-bold tracking-wider">
                  Cooperative Guild
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-white truncate">
                  <Building2 className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                  <span className="truncate">{coopName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── QUICK ACTIONS BAR ────────────────────────────────────────── */}
        <div className="relative z-10 mt-6 pt-6 border-t border-emerald-500/40 flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 mr-1 block w-full sm:w-auto">
            Quick Actions:
          </span>

          <button
            type="button"
            onClick={() => setActiveModal('edit_profile')}
            className="px-3.5 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('view_docs')}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-white/20 active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-200" />
            <span>View Documents</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('id_card')}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-white/20 active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-200" />
            <span>Download Verification Card</span>
          </button>

          {onViewJobs && (
            <button
              type="button"
              onClick={onViewJobs}
              className="px-3.5 py-2 rounded-xl bg-brand-saffron-500 hover:bg-brand-saffron-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ml-auto"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>View Jobs & Rota</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. CREDENTIALS & STATUTORY SUMMARY GRID ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verified Credentials Roster */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Verified Credentials & Registry Standing</h3>
                <p className="text-[11px] text-slate-500">Government compliance and statutory verification</p>
              </div>
            </div>
            <Badge variant="verified" size="sm">ACTIVE STATUS</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <span className="font-bold text-slate-800 block">Aadhaar e-KYC Identity Verification</span>
                  <span className="text-[11px] text-slate-500">UIDAI verified via biometrics & mobile OTP</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                VERIFIED
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <span className="font-bold text-slate-800 block">e-Shram National Database for Unorganised Workers</span>
                  <span className="text-[11px] text-slate-500">Universal Account Number (UAN) linked</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                VERIFIED
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <span className="font-bold text-slate-800 block">NSDC Skill Qualification & Trade Roster</span>
                  <span className="text-[11px] text-slate-500">{tradeName} • Level 4 Certified</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                VERIFIED
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <span className="font-bold text-slate-800 block">Cooperative Society Registration</span>
                  <span className="text-[11px] text-slate-500">{coopName}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                AFFILIATED
              </span>
            </div>
          </div>
        </Card>

        {/* Guaranteed Floor Wages & Artisan Protection */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-saffron-50 text-brand-saffron-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Guild Payout & Social Security Cover</h3>
                <p className="text-[11px] text-slate-500">Zero commission platform with guaranteed protections</p>
              </div>
            </div>
            <Badge variant="saffron" size="sm">0% DEDUCTION</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Minimum Daily Floor Rate</span>
              <span className="text-lg font-extrabold text-emerald-950 block mt-1">
                ₹{profile?.rates?.dailyFloorRate || 1300}
              </span>
              <span className="text-[10px] text-emerald-700">Guaranteed by Cooperative Guild</span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Hourly Rate Protection</span>
              <span className="text-lg font-extrabold text-blue-950 block mt-1">
                ₹{profile?.rates?.hourlyRate || 450} / hr
              </span>
              <span className="text-[10px] text-blue-700">Fair hourly dispatch minimum</span>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] uppercase font-bold text-purple-800 block">Operational Service Radius</span>
              <span className="text-lg font-extrabold text-purple-950 block mt-1">
                {profile?.location?.workingRadiusKm || 15} km
              </span>
              <span className="text-[10px] text-purple-700">Proximity AI dispatch cluster</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Guild Medical Welfare</span>
              <span className="text-lg font-extrabold text-amber-950 block mt-1">
                ₹5,00,000
              </span>
              <span className="text-[10px] text-amber-700">Accident & tool loss protection</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Need to adjust floor rates or dispatch radius?</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal('edit_profile')}
            >
              Update Rates
            </Button>
          </div>
        </Card>
      </div>

      {/* ─── MODAL 1: VIEW DOCUMENTS ──────────────────────────────────────── */}
      {activeModal === 'view_docs' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Verified KYC Documents</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Aadhaar Card (UIDAI)
                  </span>
                  <Badge variant="verified" size="sm">VERIFIED</Badge>
                </div>
                <p className="text-xs text-emerald-800">
                  Proof of Identity and Permanent Address verified against national registry.
                </p>
                <span className="text-[10px] font-mono text-emerald-700 block">UIDAI Ref: •••• •••• 4019</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    e-Shram Universal Account Number
                  </span>
                  <Badge variant="verified" size="sm">VERIFIED</Badge>
                </div>
                <p className="text-xs text-emerald-800">
                  Statutory unorganised worker card registered with Ministry of Labour & Employment.
                </p>
                <span className="text-[10px] font-mono text-emerald-700 block">e-Shram UAN: •••• •••• •••• 8821</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    NSDC Skill & Trade Certification
                  </span>
                  <Badge variant="verified" size="sm">LEVEL 4 CERTIFIED</Badge>
                </div>
                <p className="text-xs text-emerald-800">
                  National Skill Development Corporation certified for {tradeName}.
                </p>
                <span className="text-[10px] font-mono text-emerald-700 block">Cert ID: NSDC-IND-2024-88419</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DOWNLOAD DIGITAL ARTISAN VERIFICATION CARD ─────────── */}
      {activeModal === 'id_card' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Artisan Verification Card</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable ID Card */}
            <div className="p-6">
              <div className="rounded-2xl border-2 border-slate-800 p-5 bg-gradient-to-b from-white via-amber-50/20 to-slate-50 shadow-md relative overflow-hidden">
                {/* Tricolor top header */}
                <div className="h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600 -mx-5 -mt-5 mb-4" />

                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-extrabold text-brand-navy-900 text-sm font-display uppercase tracking-wider">
                      ShramSetu Digital Card
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      National Artisan & Guild Registry
                    </span>
                  </div>
                  <Badge variant="verified" size="sm">VERIFIED</Badge>
                </div>

                <div className="py-4 flex gap-4 items-center">
                  <div className="w-20 h-20 rounded-2xl bg-brand-navy-900 text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-inner">
                    {workerName.charAt(0)}
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-mono text-[10px] text-emerald-700 font-bold block">
                      {formattedWorkerId}
                    </span>
                    <h5 className="font-extrabold text-slate-900 text-base">{workerName}</h5>
                    <p className="text-slate-600 font-semibold text-xs">{tradeName}</p>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">{coopName}</span>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-xl p-3 flex items-center justify-between">
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    <div>Issued: <strong className="text-slate-900">{formattedVerifiedDate}</strong></div>
                    <div>Status: <strong className="text-emerald-700">UIDAI & NSDC Verified</strong></div>
                    <div>Floor Wage: <strong className="text-slate-900">₹{profile?.rates?.dailyFloorRate || 1300}/day</strong></div>
                  </div>
                  <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Scan QR on-site to verify badge</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print
                </Button>
                <Button variant="primary" size="sm" onClick={() => setActiveModal(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EDIT PROFILE ───────────────────────────────────────── */}
      {activeModal === 'edit_profile' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Verified Profile</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Profile updated successfully!
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Bio / Experience Summary
                </label>
                <textarea
                  rows={3}
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Share details of your specialty, licensed work, or past major projects..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily Floor Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    value={editFormData.dailyFloorRate}
                    onChange={(e) => setEditFormData({ ...editFormData, dailyFloorRate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hourly Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    value={editFormData.hourlyRate}
                    onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operational Working Radius (km)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editFormData.workingRadiusKm}
                  onChange={(e) => setEditFormData({ ...editFormData, workingRadiusKm: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  AI proximity engine matches you to customer bookings within this distance.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifiedDashboard;
