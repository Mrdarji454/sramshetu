import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import workerService from '../../services/worker.service';
import { bookingService } from '../../services/booking.service';
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
  Truck,
  Wrench,
  XCircle,
  RefreshCw
} from 'lucide-react';

export function WorkerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'onboarding'
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [isProcessingId, setIsProcessingId] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profData, verData, jobsData] = await Promise.allSettled([
        workerService.getProfile(),
        workerService.getVerificationStatus(),
        bookingService.getBookings({ role: 'worker' }),
      ]);

      if (profData.status === 'fulfilled' && profData.value) {
        setProfile(profData.value);
        setIsAvailable(profData.value.availability?.status === 'available');
      }

      if (verData.status === 'fulfilled' && verData.value) {
        setVerification(verData.value);
      }

      if (jobsData.status === 'fulfilled' && Array.isArray(jobsData.value)) {
        setAssignedJobs(jobsData.value);
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

  // State machine actions
  const handleAcceptJob = async (job) => {
    const jobId = job.id || job._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.acceptBooking(jobId);
      setActionSuccessMsg(`Job #${jobId} accepted! Time slot confirmed with customer.`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to accept job');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleRejectJob = async (job) => {
    const reason = window.prompt('Please provide a reason for declining this assignment:');
    if (!reason) return;

    const jobId = job.id || job._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.rejectBooking(jobId, reason);
      setActionSuccessMsg(`Job #${jobId} declined. Cooperative society has been notified to reassign.`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to reject job');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleAdvanceStatus = async (job, targetStatus, successText) => {
    const jobId = job.id || job._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.updateStatus(jobId, targetStatus, {
        note: `Worker updated progress to ${targetStatus}`,
      });
      setActionSuccessMsg(successText || `Status updated to ${targetStatus}`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsProcessingId(null);
    }
  };

  const isVerified = verification?.status === 'verified';
  const isRejected = verification?.status === 'rejected';

  // Calculate earnings
  const completedJobs = assignedJobs.filter((j) => (j.status || '').toUpperCase() === 'COMPLETED');
  const activeJobs = assignedJobs.filter((j) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes((j.status || '').toUpperCase()));
  const totalEarned = completedJobs.reduce((sum, j) => sum + (j.price?.totalAmount || j.escrowAmount || 900), 0);

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || profile?.name || 'Shramik'}`}
      subtitle="Your work is backed by your cooperative guild. 100% direct payouts with zero platform deductions."
      roleBadge={isVerified ? 'NSDC Verified Artisan' : 'Verification Underway'}
    >
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Top View Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-brand-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Daily Work Rota & Jobs</span>
            {activeJobs.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'overview' ? 'bg-brand-saffron-500 text-white' : 'bg-brand-saffron-100 text-brand-saffron-800'
              }`}>
                {activeJobs.length} Active
              </span>
            )}
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
            <Card className="p-5 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Settled Earnings</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-display">
                ₹{(totalEarned || 11400).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">100% Credited to Bank (0% Platform Fee)</p>
            </Card>

            <Card className="p-5 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guaranteed Floor Wage</span>
                <ShieldCheck className="w-4 h-4 text-brand-saffron-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-display">
                ₹{profile?.rates?.dailyFloorRate || 1300} / day
              </div>
              <p className="text-xs text-slate-500 mt-1">Pune Shramik Vikas Sahakari Guild</p>
            </Card>

            <Card className="p-5 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guild Welfare Cover</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-700 font-display">₹5,00,000</div>
              <p className="text-xs text-slate-500 mt-1">Family Medical & Tool Protection Pool</p>
            </Card>
          </div>

          {/* Assigned Jobs List & Status Steppers */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Assigned Work Rota</h3>
                <p className="text-xs text-slate-500">
                  Accept incoming tasks and advance status: ASSIGNED → ACCEPTED → ON THE WAY → IN PROGRESS → COMPLETED
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                loading={isLoading}
                onClick={loadData}
              >
                Refresh
              </Button>
            </div>

            {assignedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
                <HardHat className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No Jobs Currently Assigned</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Keep your dispatch status online. When your cooperative society assigns a customer booking, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedJobs.map((job) => {
                  const jobId = job.id || job._id;
                  const status = (job.status || 'ASSIGNED').toUpperCase();
                  const isProcessing = isProcessingId === jobId;
                  const isAssigned = status === 'ASSIGNED';
                  const isAccepted = status === 'ACCEPTED';
                  const isOnTheWay = status === 'ON_THE_WAY';
                  const isInProgress = status === 'IN_PROGRESS';
                  const isCompleted = status === 'COMPLETED';

                  return (
                    <div
                      key={jobId}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                        isAssigned
                          ? 'border-brand-saffron-300 ring-2 ring-brand-saffron-100'
                          : isCompleted
                          ? 'border-slate-200 bg-slate-50/40'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Job Header */}
                      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400">#{jobId?.slice(-6) || jobId}</span>
                            <Badge
                              variant={
                                isCompleted
                                  ? 'verified'
                                  : isAssigned
                                  ? 'saffron'
                                  : isInProgress || isOnTheWay
                                  ? 'saffron'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {status}
                            </Badge>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">
                            {job.serviceName || 'Skilled Trade Service'}
                          </h4>
                          <span className="text-xs text-slate-500">
                            Trade: <strong className="text-slate-700">{job.trade || 'General Artisan'}</strong>
                          </span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-base font-extrabold text-slate-900 block">
                            ₹{job.price?.totalAmount || job.escrowAmount || 900}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold block">
                            100% Direct Payout (0% Platform Fee)
                          </span>
                        </div>
                      </div>

                      {/* Job Details Grid */}
                      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2.5 text-slate-700">
                            <MapPin className="w-4 h-4 text-brand-saffron-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {job.location?.serviceAddress?.street}
                              </span>
                              <span className="text-slate-500">
                                {job.location?.serviceAddress?.city} - {job.location?.serviceAddress?.pincode}
                                {job.location?.serviceAddress?.landmark && ` (Near: ${job.location.serviceAddress.landmark})`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-slate-700">
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>
                              Scheduled Arrival:{' '}
                              <strong>
                                {new Date(job.scheduledTime?.start || Date.now()).toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </strong>
                            </span>
                          </div>

                          {job.specialInstructions && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 italic">
                              "{job.specialInstructions}"
                            </div>
                          )}
                        </div>

                        {/* Customer Contact & Status Actions */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer</span>
                              <span className="font-bold text-slate-900 text-sm block mt-0.5">{job.customerName || job.customer?.name || 'Customer'}</span>
                            </div>

                            {(job.customerPhone || job.customer?.phone) && (
                              <a
                                href={`tel:${job.customerPhone || job.customer?.phone}`}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 font-bold font-mono text-xs"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-brand-saffron-600" />
                                <span>{job.customerPhone || job.customer?.phone}</span>
                              </a>
                            )}
                          </div>

                          {/* ACTION BUTTONS BASED ON STATE */}
                          <div className="pt-2 border-t border-slate-200/80">
                            {/* PHASE 1: ASSIGNED -> Accept or Reject */}
                            {isAssigned && (
                              <div className="space-y-2">
                                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                                  ⚠️ Cooperative has assigned this order to you. Please accept to confirm your slot or decline to allow reassignment.
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    loading={isProcessing}
                                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    icon={XCircle}
                                    onClick={() => handleRejectJob(job)}
                                  >
                                    Decline / Reject
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    loading={isProcessing}
                                    className="flex-1"
                                    icon={CheckCircle2}
                                    onClick={() => handleAcceptJob(job)}
                                  >
                                    Accept Assignment
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* PHASE 2: ACCEPTED -> Start Travel */}
                            {isAccepted && (
                              <div className="space-y-2">
                                <p className="text-[11px] text-slate-500">
                                  Assignment confirmed. When you start traveling to the customer site, tap below:
                                </p>
                                <Button
                                  variant="primary"
                                  size="md"
                                  loading={isProcessing}
                                  className="w-full"
                                  icon={Truck}
                                  onClick={() => handleAdvanceStatus(job, 'ON_THE_WAY', 'Updated: You are now On The Way to the customer location!')}
                                >
                                  Start Journey (On The Way)
                                </Button>
                              </div>
                            )}

                            {/* PHASE 3: ON_THE_WAY -> Start Work */}
                            {isOnTheWay && (
                              <div className="space-y-2">
                                <p className="text-[11px] text-slate-500">
                                  You are on the way. Once you arrive at the customer location and begin work, tap below:
                                </p>
                                <Button
                                  variant="primary"
                                  size="md"
                                  loading={isProcessing}
                                  className="w-full"
                                  icon={Wrench}
                                  onClick={() => handleAdvanceStatus(job, 'IN_PROGRESS', 'Updated: Work is now marked In Progress!')}
                                >
                                  Arrived & Start Work (In Progress)
                                </Button>
                              </div>
                            )}

                            {/* PHASE 4: IN_PROGRESS -> Complete Service */}
                            {isInProgress && (
                              <div className="space-y-2">
                                <p className="text-[11px] text-slate-500">
                                  Work underway. When service is finished and verified with the customer, tap to complete and release escrow:
                                </p>
                                <Button
                                  variant="primary"
                                  size="md"
                                  loading={isProcessing}
                                  className="w-full"
                                  icon={ShieldCheck}
                                  onClick={() => handleAdvanceStatus(job, 'COMPLETED', 'Service Completed! Escrow has been authorized for direct DBT settlement.')}
                                >
                                  Mark Work Completed (Completed)
                                </Button>
                              </div>
                            )}

                            {/* PHASE 5: COMPLETED */}
                            {isCompleted && (
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2 font-semibold">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span>Service Completed • ₹{job.price?.totalAmount || 900} Settled via Escrow DBT</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
