import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import workerService from '../../services/worker.service';
import { WorkerOnboardingWizard } from './WorkerOnboardingWizard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  HardHat, 
  QrCode, 
  IndianRupee, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Power, 
  Sparkles, 
  PhoneCall,
  Edit3,
  AlertCircle,
  Briefcase
} from 'lucide-react';

export function WorkerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'onboarding'
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const activeJob = {
    id: 'BK-2026-8801',
    customer: 'Aakash Sharma',
    service: '3-Phase Concealed Wiring Inspection',
    address: 'Flat 402, Green Meadows, Kothrud, Pune',
    pincode: '411038',
    scheduledTime: 'Today, 02:30 PM',
    rateGuaranteed: '₹480 / hr (Min ₹960 for 2 hrs)',
    status: 'assigned',
    clientPhone: '+91 98201 44520',
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profData, verData] = await Promise.allSettled([
        workerService.getProfile(),
        workerService.getVerificationStatus(),
      ]);

      if (profData.status === 'fulfilled' && profData.value) {
        setProfile(profData.value);
        setIsAvailable(profData.value.availability?.status === 'available');
      }

      if (verData.status === 'fulfilled' && verData.value) {
        setVerification(verData.value);
      }
    } catch (err) {
      console.error('Error loading worker dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async () => {
    const nextStatus = isAvailable ? 'offline' : 'available';
    setIsAvailable(!isAvailable);
    try {
      await workerService.updateAvailability({ status: nextStatus });
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  const isVerified = verification?.status === 'verified';
  const isRejected = verification?.status === 'rejected';

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || profile?.name || 'Shramik'}`}
      subtitle="Your work is backed by your cooperative guild. 100% direct payouts with zero platform deductions."
      roleBadge={isVerified ? 'NSDC Verified Artisan' : 'Verification Underway'}
    >
      {/* Top View Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-brand-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Daily Work Rota & Job
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('onboarding')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'onboarding'
                ? 'bg-brand-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Onboarding Profile & KYC</span>
            {verification && (
              <span
                className={`w-2 h-2 rounded-full ${
                  isVerified ? 'bg-emerald-400' : isRejected ? 'bg-red-400' : 'bg-amber-400'
                }`}
              />
            )}
          </button>
        </div>

        {/* Verification Status Pill */}
        {verification && (
          <Badge
            variant={isVerified ? 'verified' : isRejected ? 'outline' : 'saffron'}
            size="md"
            dot
          >
            Status: {(verification.status || 'PENDING').toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Verification Attention Banner */}
      {!isVerified && (
        <div
          className={`p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            isRejected
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isRejected ? 'bg-red-100' : 'bg-amber-100'}`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {isRejected
                  ? 'Application Review Needs Attention'
                  : 'Artisan Verification In Progress'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isRejected
                  ? `Registrar Note: ${verification?.rejectionReason || 'Please update your documents.'}`
                  : 'Your Aadhaar e-KYC and technical certificates are being verified by your cooperative society registrar.'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('onboarding')}
            className="whitespace-nowrap"
          >
            {isRejected ? 'Update Documents' : 'View Checklist'}
          </Button>
        </div>
      )}

      {/* Tab 1: Overview Dashboard */}
      {activeTab === 'overview' && (
        <>
          {/* Availability Status Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    Dispatch Status: {isAvailable ? 'Available for New Jobs' : 'Offline / On Break'}
                  </span>
                  <Badge variant={isAvailable ? 'verified' : 'default'} size="sm">
                    {isAvailable ? 'In Active Rota' : 'Standby'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI Fair Allocation Engine includes you in proximity dispatches across a {profile?.location?.workingRadiusKm || 15} km radius.
                </p>
              </div>
            </div>

            <Button
              variant={isAvailable ? 'outline' : 'primary'}
              size="sm"
              icon={Power}
              onClick={handleToggleAvailability}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weekly Earnings</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-display">₹11,400</div>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">100% Credited to Bank (0% Fee)</p>
            </Card>

            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guaranteed Floor Wage</span>
                <ShieldCheck className="w-4 h-4 text-brand-saffron-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-display">
                ₹{profile?.rates?.dailyFloorRate || 1200} / day
              </div>
              <p className="text-xs text-slate-500 mt-1">{profile?.cooperative || 'Guild Statutory Rate'}</p>
            </Card>

            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guild Welfare Cover</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-700 font-display">₹5,00,000</div>
              <p className="text-xs text-slate-500 mt-1">Family Medical & Tool Protection</p>
            </Card>
          </div>

          {/* Active Job Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  Current Assigned Order
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{activeJob.service}</h3>
              </div>
              <Badge variant="verified" size="sm" icon={ShieldCheck}>
                Escrow Funded
              </Badge>
            </div>

            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-saffron-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{activeJob.address}</span>
                    <span className="text-xs text-slate-500 font-mono">Pincode: {activeJob.pincode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Scheduled Time: <strong className="font-semibold">{activeJob.scheduledTime}</strong></span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <IndianRupee className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Guaranteed Floor: <strong className="font-semibold text-emerald-700">{activeJob.rateGuaranteed}</strong></span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Customer Contact</span>
                  <span className="text-xs text-slate-600 block mt-0.5">{activeJob.customer}</span>
                  <div className="flex items-center gap-1.5 text-xs text-brand-navy-900 font-mono mt-1">
                    <PhoneCall className="w-3.5 h-3.5 text-brand-saffron-600" />
                    <span>{activeJob.clientPhone}</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" icon={PhoneCall}>
                    Call Customer
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" icon={QrCode}>
                    Scan Handshake QR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Onboarding Wizard */}
      {activeTab === 'onboarding' && (
        <WorkerOnboardingWizard
          onComplete={() => {
            loadData();
            setActiveTab('overview');
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default WorkerDashboard;
