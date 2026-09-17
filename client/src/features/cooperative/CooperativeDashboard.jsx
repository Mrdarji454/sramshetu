import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import cooperativeService from '../../services/cooperative.service';
import { bookingService } from '../../services/booking.service';
import { CooperativeOnboardingWizard } from './CooperativeOnboardingWizard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Building2, 
  Users, 
  HeartHandshake, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  FileSpreadsheet,
  AlertCircle,
  Settings,
  Trash2,
  PhoneCall,
  MapPin,
  Calendar,
  UserCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { CooperativeWorkloadWidget } from '../../components/dashboard';

export function CooperativeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'roster', or 'onboarding'
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Quick enroll modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollData, setEnrollData] = useState({
    name: '',
    phone: '',
    trade: 'Electrical & Power Systems',
    dailyFloorRate: 1200,
  });

  // Assign Worker Modal
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [assignSelectedWorkerId, setAssignSelectedWorkerId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);


     // Load AI prediction (uses client-side API proxy)
  async function loadPrediction() {
    setAiLoading(true);
    setAiError(null);
    try {
      // sample payload; adjust or wire to real inputs later
      const payload = {
        district: 'Ahmedabad',
        serviceType: 'Plumbing',
        applicationsLast7Days: 42,
        applicationsLast30Days: 163,
        pendingApplications: 18,
        availableWorkers: 26,
        averageCompletionTime: 2.5,
      };

      // `predictWorkload` is provided by the AI service client
      const { predictWorkload } = await import('../../services/ai.service');
      const res = await predictWorkload(payload);
      // normalize: API returns { success, prediction, recommendation }
      const pred = res?.prediction ?? res;
      setPrediction(pred);
    } catch (err) {
      setAiError(err?.message || String(err) || 'Failed to fetch prediction');
    } finally {
      setAiLoading(false);
    }
  }

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profData, verData, membersData, bookingsData] = await Promise.allSettled([
        cooperativeService.getProfile(),
        cooperativeService.getVerificationStatus(),
        cooperativeService.getMembers(),
        bookingService.getBookings({ role: 'cooperative' }),
      ]);

      if (profData.status === 'fulfilled' && profData.value) {
        setProfile(profData.value);
      }

      if (verData.status === 'fulfilled' && verData.value) {
        setVerification(verData.value);
      }

      if (membersData.status === 'fulfilled' && Array.isArray(membersData.value)) {
        setMembers(membersData.value);
      }

      if (bookingsData.status === 'fulfilled' && Array.isArray(bookingsData.value)) {
        setBookings(bookingsData.value);
      }
    } catch (err) {
      console.error('Error loading cooperative dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // fetch initial AI prediction
    loadPrediction();
  }, []);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollData.name.trim()) return;

    try {
      const newMember = await cooperativeService.addMember(enrollData);
      setMembers((prev) => [newMember, ...prev]);
      setEnrollModalOpen(false);
      setEnrollData({ name: '', phone: '', trade: 'Electrical & Power Systems', dailyFloorRate: 1200 });
      setActionSuccessMsg(`Artisan ${newMember.name} successfully enrolled in guild roster!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert('Failed to enroll member: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this artisan from the guild roster?')) return;
    try {
      await cooperativeService.removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId && m._id !== memberId));
    } catch (err) {
      alert('Failed to remove member: ' + err.message);
    }
  };

  const handleOpenAssignModal = (booking) => {
    setAssignModalBooking(booking);
    // Auto-select first available matching member
    const matching = members.find((m) => m.status === 'available') || members[0];
    if (matching) {
      setAssignSelectedWorkerId(matching.id || matching._id);
    }
  };

  const handleConfirmAssignment = async (e) => {
    e.preventDefault();
    if (!assignModalBooking || !assignSelectedWorkerId) return;

    setIsAssigning(true);
    try {
      const bookingId = assignModalBooking.id || assignModalBooking._id;
      await bookingService.assignWorker(bookingId, assignSelectedWorkerId);

      const assignedWorker = members.find((m) => String(m.id || m._id) === String(assignSelectedWorkerId));
      setActionSuccessMsg(`Assigned to ${assignedWorker?.name || 'Artisan'} successfully!`);
      setAssignModalBooking(null);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert('Failed to assign worker: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const reason = window.prompt('Reason for cooperative cancellation:');
    if (!reason) return;

    try {
      const bookingId = booking.id || booking._id;
      await bookingService.updateStatus(bookingId, 'CANCELLED', { note: reason });
      setActionSuccessMsg(`Booking #${bookingId} marked as cancelled.`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert('Failed to cancel: ' + err.message);
    }
  };

  const isVerified = verification?.status === 'verified';
  const isRejected = verification?.status === 'rejected';

  // Booking stats & filters
  const pendingBookings = bookings.filter((b) => (b.status || '').toUpperCase() === 'PENDING' || (b.status || '').toUpperCase() === 'REJECTED');
  const filteredBookings = bookings.filter((b) => {
    if (selectedStatusFilter === 'ALL') return true;
    return (b.status || '').toUpperCase() === selectedStatusFilter;
  });

  return (
    <DashboardLayout
      title={`Cooperative Guild Portal: ${profile?.name || user?.name || 'Society Office'}`}
      subtitle="Democratically oversee member artisans, manage welfare fund pools, and audit AI opportunity allocation."
      roleBadge={isVerified ? 'State Cooperative Registered' : 'Registration Pending'}
    >
      {/* Toast message */}
      {actionSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

 <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <CooperativeWorkloadWidget
              prediction={prediction}
              loading={aiLoading}
              error={aiError}
              onRefresh={loadPrediction}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Top View Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-6 gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-brand-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Booking Requests & Dispatch</span>
            {pendingBookings.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'requests' ? 'bg-brand-saffron-500 text-white' : 'bg-brand-saffron-100 text-brand-saffron-800'
              }`}>
                {pendingBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'roster'
                ? 'bg-brand-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Artisan Guild Roster ({members.length})
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
            <Settings className="w-3.5 h-3.5" />
            <span>Society Bylaws</span>
          </button>
        </div>

            

        {/* Status Pill */}
        {verification && (
          <Badge
            variant={isVerified ? 'verified' : isRejected ? 'outline' : 'coop'}
            size="md"
            dot
          >
            Registrar: {(verification.status || 'PENDING').toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Verification Attention Banner */}
      {!isVerified && (
        <div
          className={`p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            isRejected
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isRejected ? 'bg-red-100' : 'bg-indigo-100'}`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {isRejected
                  ? 'Cooperative Society Audit Requires Attention'
                  : 'State Registrar Verification Underway'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isRejected
                  ? `Registrar Remark: ${verification?.remarks || 'Please inspect submitted bylaws.'}`
                  : 'Your society registration certificate and roster bylaws are being audited by the State Registrar of Cooperatives.'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('onboarding')}
            className="whitespace-nowrap"
          >
            {isRejected ? 'Update Bylaws' : 'View Audit Checklist'}
          </Button>
        </div>
      )}

      {/* TAB 1: BOOKING REQUESTS & DISPATCH */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedStatusFilter === st
                      ? 'bg-brand-navy-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Bookings' : st}
                </button>
              ))}
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

          {/* Bookings Queue */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No Booking Requests Found</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Customer bookings for your operational trade sectors will appear here for artisan assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b) => {
                const bookingId = b.id || b._id;
                const status = (b.status || 'PENDING').toUpperCase();
                const isPending = status === 'PENDING';
                const isRejectedWorker = status === 'REJECTED';
                const isAssigned = status === 'ASSIGNED';
                const isCompleted = status === 'COMPLETED';

                return (
                  <div
                    key={bookingId}
                    className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-sm ${
                      isRejectedWorker
                        ? 'border-amber-300 bg-amber-50/20'
                        : isPending
                        ? 'border-brand-saffron-300 bg-white ring-1 ring-brand-saffron-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Row: Ref, Status, Price */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{bookingId?.slice(-6) || bookingId}
                          </span>
                          <Badge
                            variant={
                              isCompleted
                                ? 'verified'
                                : isRejectedWorker
                                ? 'outline'
                                : isPending
                                ? 'saffron'
                                : 'default'
                            }
                            size="sm"
                          >
                            {status}
                          </Badge>
                          <span className="text-xs text-slate-400 font-medium">
                            Created {new Date(b.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">
                          {b.serviceName || 'Skilled Trade Service'}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          Trade: <strong className="text-slate-700">{b.trade || 'General Artisan'}</strong>
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-base font-extrabold text-slate-900 block">
                          ₹{b.price?.totalAmount || b.escrowAmount || 900}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold block">
                          Floor Rate: ₹{b.price?.floorRateAmount || 450} / hr (0% Platform Fee)
                        </span>
                      </div>
                    </div>

                    {/* Rejection Alert */}
                    {isRejectedWorker && (
                      <div className="my-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            <strong>Artisan Declined:</strong> {b.rejectionReason || 'Schedule conflict'}. Please reassign to another available artisan.
                          </span>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAssignModal(b)}
                        >
                          Reassign Artisan
                        </Button>
                      </div>
                    )}

                    {/* Middle Section: Customer & Location Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Customer Information
                        </span>
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                          <span>{b.customerName || b.customer?.name || 'Customer'}</span>
                          {(b.customerPhone || b.customer?.phone) && (
                            <a
                              href={`tel:${b.customerPhone || b.customer?.phone}`}
                              className="text-brand-saffron-700 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>{b.customerPhone || b.customer?.phone}</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-start gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>
                            {b.location?.serviceAddress?.street}, {b.location?.serviceAddress?.city} - {b.location?.serviceAddress?.pincode}
                            {b.location?.serviceAddress?.landmark && ` (Landmark: ${b.location.serviceAddress.landmark})`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Scheduled Time & Notes
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            {new Date(b.scheduledTime?.start || Date.now()).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {b.specialInstructions && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 italic">
                            "{b.specialInstructions}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        {b.worker || b.workerName ? (
                          <div className="flex items-center gap-2 text-slate-700">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            <span>
                              Assigned Worker: <strong className="text-slate-900">{b.workerName || b.worker?.name}</strong> ({b.workerTrade || b.trade})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-700 font-semibold">
                            <Clock className="w-4 h-4" />
                            <span>Unassigned • Artisan dispatch required</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {(isPending || isRejectedWorker || isAssigned) && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={UserPlus}
                            onClick={() => handleOpenAssignModal(b)}
                          >
                            {isAssigned ? 'Change Worker' : 'Assign Worker'}
                          </Button>
                        )}

                        {!isCompleted && status !== 'CANCELLED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleCancelBooking(b)}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROSTER & MEMBERS */}
      {activeTab === 'roster' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Artisans</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy-900 font-display">
                {members.length || 3}
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">100% Aadhaar Verified</p>
            </Card>

            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Welfare Fund Pool</span>
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 font-display">₹2.80 Cr</div>
              <p className="text-xs text-slate-500 mt-1">₹5 Lakh health cover active</p>
            </Card>

            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Incoming Requests</span>
                <Clock className="w-4 h-4 text-brand-saffron-600" />
              </div>
              <div className="text-2xl font-extrabold text-brand-saffron-600 font-display">
                {pendingBookings.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Awaiting dispatch</p>
            </Card>

            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Direct Payouts</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy-900 font-display">₹1.42 Cr</div>
              <p className="text-xs text-slate-500 mt-1">0% commission deducted</p>
            </Card>
          </div>

          {/* Member Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Guild Member Roster</h3>
                <p className="text-xs text-slate-500">Live operational status and opportunity rotation metrics</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={FileSpreadsheet}>
                  Export DBT Ledger
                </Button>
                <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setEnrollModalOpen(true)}>
                  Enroll New Worker
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Artisan Name</th>
                    <th className="p-4">Trade</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Daily Floor Rate</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((worker) => (
                    <tr key={worker.id || worker._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-navy-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                          {worker.name?.charAt(0) || 'W'}
                        </div>
                        <span>{worker.name}</span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{worker.trade}</td>
                      <td className="p-4 text-slate-500 font-mono">{worker.phone || '+91 98000 00000'}</td>
                      <td className="p-4">
                        <Badge
                          variant={worker.status === 'available' ? 'verified' : worker.status === 'busy' ? 'saffron' : 'default'}
                          size="sm"
                          dot
                        >
                          {worker.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        ₹{worker.dailyFloorRate || 1200} / day
                      </td>
                      <td className="p-4 font-semibold text-slate-700">⭐ {worker.rating || '4.92'}</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(worker.id || worker._id)}
                          className="p-1 rounded text-red-400 hover:text-red-700 hover:bg-red-50"
                          title="Remove artisan from roster"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 3: ONBOARDING WIZARD */}
      {activeTab === 'onboarding' && (
        <CooperativeOnboardingWizard
          onComplete={() => {
            loadData();
            setActiveTab('requests');
          }}
        />
      )}

      {/* MODAL: ASSIGN ARTISAN */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Guild Artisan</h3>
                <p className="text-xs text-slate-500">
                  Select an available verified worker for #{assignModalBooking.id || assignModalBooking._id?.slice(-6)}
                </p>
              </div>
              <button onClick={() => setAssignModalBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{assignModalBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-medium text-slate-800">{assignModalBooking.location?.serviceAddress?.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guaranteed Floor Wage:</span>
                <span className="font-bold text-emerald-700">₹{assignModalBooking.price?.totalAmount || 900}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Choose Artisan from Roster
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const mId = m.id || m._id;
                    const isSelected = assignSelectedWorkerId === mId;
                    return (
                      <div
                        key={mId}
                        onClick={() => setAssignSelectedWorkerId(mId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'border-brand-saffron-500 bg-brand-saffron-50/50 ring-2 ring-brand-saffron-200'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-slate-500">{m.trade} • {m.phone || '+91 98000 00000'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">₹{m.dailyFloorRate || 1200}/day</span>
                          <Badge variant={m.status === 'available' ? 'verified' : 'saffron'} size="sm">
                            {m.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <Button variant="outline" size="md" className="flex-1" onClick={() => setAssignModalBooking(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" loading={isAssigning} className="flex-1">
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL NEW WORKER */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Enroll New Guild Artisan</h3>
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Artisan Full Name
                </label>
                <input
                  type="text"
                  required
                  value={enrollData.name}
                  onChange={(e) => setEnrollData({ ...enrollData, name: e.target.value })}
                  placeholder="e.g. Dattatray Pawar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={enrollData.phone}
                  onChange={(e) => setEnrollData({ ...enrollData, phone: e.target.value })}
                  placeholder="+91 98201 55667"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Trade / Specialization
                </label>
                <input
                  type="text"
                  required
                  value={enrollData.trade}
                  onChange={(e) => setEnrollData({ ...enrollData, trade: e.target.value })}
                  placeholder="e.g. Master Electrician"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Guaranteed Floor Rate (₹ / day)
                </label>
                <input
                  type="number"
                  value={enrollData.dailyFloorRate}
                  onChange={(e) => setEnrollData({ ...enrollData, dailyFloorRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button variant="outline" size="md" className="flex-1" onClick={() => setEnrollModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" className="flex-1">
                  Enroll Artisan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default CooperativeDashboard;
