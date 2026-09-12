import React, { useState } from 'react';
import {
  HardHat,
  Award,
  Calendar,
  Briefcase,
  Clock,
  IndianRupee,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Phone,
  MapPin,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import {
  StatCard,
  DataTable,
  StatusBadge,
  SearchBar,
  Modal,
  Pagination,
} from '../../components/dashboard';
import {
  MOCK_WORKER_PROFILE,
  MOCK_WORKER_SKILLS,
  MOCK_WORKER_AVAILABILITY,
  MOCK_WORKER_ASSIGNED_JOBS,
  MOCK_WORKER_TODAY_SCHEDULE,
  MOCK_WORKER_EARNINGS,
  MOCK_WORKER_JOB_HISTORY,
} from '../../data/mockDashboardData';

export function WorkerDashboard({ onSwitchRole, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, profile, skills, availability, assigned, schedule, earnings, history
  const [isOnline, setIsOnline] = useState(MOCK_WORKER_AVAILABILITY.isOnline);
  const [workingRadius, setWorkingRadius] = useState(MOCK_WORKER_AVAILABILITY.workingRadiusKm);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Interactivity
  const [qrPassModalOpen, setQrPassModalOpen] = useState(false);
  const [startJobModal, setStartJobModal] = useState(null);
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination states
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 5;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nav configuration
  const navigation = [
    { id: 'overview', label: 'Artisan Desk', icon: HardHat },
    {
      id: 'assigned',
      label: 'Assigned Jobs',
      icon: Briefcase,
      badge: MOCK_WORKER_ASSIGNED_JOBS.length,
    },
    { id: 'schedule', label: "Today's Schedule", icon: Clock },
    { id: 'profile', label: 'Artisan Profile', icon: HardHat },
    { id: 'skills', label: 'NSDC Skills', icon: Award, badge: MOCK_WORKER_SKILLS.length },
    { id: 'availability', label: 'Availability & Rota', icon: Calendar },
    { id: 'earnings', label: 'Earnings Passbook', icon: IndianRupee },
    { id: 'history', label: 'Job History', icon: CheckCircle2 },
  ];

  // Job History Table Columns
  const historyColumns = [
    {
      header: 'Job ID',
      accessor: 'id',
      cell: (row) => <span className="font-mono text-xs font-bold">{row.id}</span>,
    },
    {
      header: 'Service Rendered',
      accessor: 'service',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.service}</p>
          <p className="text-xs text-slate-500">Client: {row.customer}</p>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      cell: (row) => <span className="text-xs text-slate-500">{row.date}</span>,
    },
    {
      header: 'Net Direct Payout',
      accessor: 'payout',
      cell: (row) => (
        <span className="font-bold text-emerald-700">₹{row.payout}</span>
      ),
    },
    {
      header: 'Client Rating',
      accessor: 'rating',
      cell: (row) => (
        <div className="text-xs font-bold text-amber-600">★ {row.rating}.0</div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  // DBT Payouts Columns
  const dbtColumns = [
    {
      header: 'DBT Txn ID',
      accessor: 'txnId',
      cell: (row) => <span className="font-mono text-xs font-bold">{row.txnId}</span>,
    },
    {
      header: 'Job Reference',
      accessor: 'jobId',
      cell: (row) => (
        <div>
          <p className="font-mono text-xs text-slate-800">{row.jobId}</p>
          <p className="text-xs text-slate-500">{row.customer}</p>
        </div>
      ),
    },
    {
      header: 'Gross Payout',
      accessor: 'grossAmount',
      cell: (row) => <span className="font-semibold text-slate-900">₹{row.grossAmount}</span>,
    },
    {
      header: 'Platform Cut (0%)',
      accessor: 'platformCut',
      cell: () => (
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          ₹0 (0% Cut)
        </span>
      ),
    },
    {
      header: 'Net Bank Credit',
      accessor: 'netCredited',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">₹{row.netCredited}</p>
          <p className="font-mono text-[10px] text-slate-400">{row.bankRef}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <DashboardLayout
      role="worker"
      navigation={navigation}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={`${MOCK_WORKER_PROFILE.name} (${MOCK_WORKER_PROFILE.hindiName})`}
      subtitle={`Guild Member ID: ${MOCK_WORKER_PROFILE.id} • ${MOCK_WORKER_PROFILE.cooperative}`}
      userProfile={MOCK_WORKER_PROFILE}
      onSwitchRole={onSwitchRole}
      onBackToHome={onBackToHome}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-navy-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/50 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Earnings"
          value={`₹${MOCK_WORKER_EARNINGS.today}`}
          change="100% DBT credited"
          isPositive={true}
          icon={IndianRupee}
          color="saffron"
          subtext="Zero middleman fee"
          onClick={() => setActiveTab('earnings')}
        />
        <StatCard
          title="This Week"
          value={`₹${MOCK_WORKER_EARNINGS.thisWeek}`}
          change="On track for monthly target"
          isPositive={true}
          icon={TrendingUp}
          color="emerald"
          subtext="Direct bank settlement"
          onClick={() => setActiveTab('earnings')}
        />
        <StatCard
          title="Jobs Completed"
          value={MOCK_WORKER_PROFILE.jobsCompleted}
          change={`Rating: ★ ${MOCK_WORKER_PROFILE.rating}`}
          isPositive={true}
          icon={CheckCircle2}
          color="navy"
          subtext="388 five-star reviews"
          onClick={() => setActiveTab('history')}
        />
        <StatCard
          title="Middleman Fees Saved"
          value="₹1,44,600"
          change="0% platform commission"
          isPositive={true}
          icon={ShieldCheck}
          color="ashoka"
          subtext="vs 30% aggregator apps"
          onClick={() => setActiveTab('earnings')}
        />
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Worker Digital ID Pass Banner */}
          <div className="bg-gradient-to-r from-brand-navy-950 via-slate-900 to-brand-navy-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="gov-tricolor-stripe absolute top-0 left-0 right-0" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
              <div className="flex items-start gap-4">
                <img
                  src={MOCK_WORKER_PROFILE.avatar}
                  alt={MOCK_WORKER_PROFILE.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-display text-white">
                      {MOCK_WORKER_PROFILE.name}
                    </h2>
                    <span className="text-xs text-amber-300 font-medium">
                      ({MOCK_WORKER_PROFILE.hindiName})
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/40 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Aadhaar e-KYC Verified
                    </span>
                  </div>

                  <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                    {MOCK_WORKER_PROFILE.trade} • {MOCK_WORKER_PROFILE.experienceYears} Years Exp
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Guild: {MOCK_WORKER_PROFILE.cooperative} (Reg: {MOCK_WORKER_PROFILE.cooperativeRegNo})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Instant Online/Offline Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isOnline;
                    setIsOnline(next);
                    showToast(next ? 'You are now ONLINE for Rota Dispatch!' : 'You are now OFFLINE.');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span>{isOnline ? 'Available for Rota' : 'Go Offline'}</span>
                </button>

                {/* Show QR Pass Button */}
                <button
                  type="button"
                  onClick={() => setQrPassModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show Digital Work Pass</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Active Work Order */}
          {MOCK_WORKER_ASSIGNED_JOBS.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">
                    Current Assigned Work Order
                  </h3>
                  <StatusBadge status="in_progress" size="sm" />
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {MOCK_WORKER_ASSIGNED_JOBS[0].rateGuaranteed}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Job & Customer Details */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <span className="text-slate-400 font-medium">Service Requested:</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {MOCK_WORKER_ASSIGNED_JOBS[0].service}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-medium">Customer:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {MOCK_WORKER_ASSIGNED_JOBS[0].customerName}
                      </p>
                      <a
                        href={`tel:${MOCK_WORKER_ASSIGNED_JOBS[0].customerPhone}`}
                        className="text-amber-600 font-semibold inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {MOCK_WORKER_ASSIGNED_JOBS[0].customerPhone}
                      </a>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium">Site Address:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {MOCK_WORKER_ASSIGNED_JOBS[0].address}
                      </p>
                      <p className="text-slate-500">{MOCK_WORKER_ASSIGNED_JOBS[0].landmark}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-800">Special Notes:</span>{' '}
                    <span className="text-slate-600">
                      {MOCK_WORKER_ASSIGNED_JOBS[0].specialNotes}
                    </span>
                  </div>
                </div>

                {/* Verification Handshake Card */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Dynamic QR Handshake</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Present your pass to customer or enter customer OTP to unlock escrow release.
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => setStartJobModal(MOCK_WORKER_ASSIGNED_JOBS[0])}
                      className="w-full py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Enter Customer OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrPassModalOpen(true)}
                      className="w-full py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-white transition-colors"
                    >
                      Show QR Handshake
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Two-Column: Schedule Preview & Certified Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Today's Rota Timeline
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  Full Day
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_WORKER_TODAY_SCHEDULE.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                      item.current
                        ? 'border-amber-400 bg-amber-50/50'
                        : item.completed
                        ? 'border-slate-200 bg-slate-50/50 opacity-80'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600">
                          {item.time}
                        </span>
                        {item.completed && (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            ✓ Done
                          </span>
                        )}
                        {item.current && (
                          <span className="text-[10px] text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded font-bold animate-pulse">
                            Active Slot
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.location}</p>
                    </div>

                    {item.earned && (
                      <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                        {item.earned}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Certified Skills Snapshot */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    NSDC Certified Skills
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAddSkillModalOpen(true)}
                  className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_WORKER_SKILLS.slice(0, 3).map((sk) => (
                  <div
                    key={sk.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-white"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{sk.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {sk.nsdcLevel} • {sk.verifiedBy}
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                      {sk.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ASSIGNED JOBS */}
      {activeTab === 'assigned' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Assigned Work Orders
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Jobs dispatched by your cooperative society with guaranteed statutory floor rates
            </p>

            <div className="space-y-4">
              {MOCK_WORKER_ASSIGNED_JOBS.map((j) => (
                <div
                  key={j.id}
                  className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{j.id}</span>
                        <StatusBadge status={j.status} size="sm" />
                        <span className="text-xs text-emerald-700 font-semibold">
                          {j.distance}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{j.service}</h3>
                      <p className="text-xs text-slate-500">Slot: {j.scheduledTime}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Guaranteed Floor</p>
                        <p className="text-base font-bold text-slate-900">
                          ₹{j.escrowLocked}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStartJobModal(j)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                      >
                        Enter Client OTP
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Customer:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{j.customerName}</p>
                      <a
                        href={`tel:${j.customerPhone}`}
                        className="text-amber-600 font-semibold inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {j.customerPhone}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Location:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{j.address}</p>
                      <p className="text-slate-500">{j.landmark}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TODAY'S SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Today's Service Schedule & Rota
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Hourly breakdown of dispatched appointments and rest periods
            </p>

            <div className="relative border-l-2 border-amber-200 ml-4 pl-6 space-y-6">
              {MOCK_WORKER_TODAY_SCHEDULE.map((s, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${
                      s.current
                        ? 'bg-amber-500 ring-4 ring-amber-200 animate-pulse'
                        : s.completed
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">{s.time}</span>
                      {s.earned && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {s.earned}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{s.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{s.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ARTISAN PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Shramik Identity & Cooperative Membership Record
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Official statutory credentials certified by State Registrar & Skill India
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Aadhaar e-KYC:</span>
                  <span className="font-bold text-slate-900">
                    {MOCK_WORKER_PROFILE.aadhaarMasked} (Verified)
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">NSDC Certificate No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {MOCK_WORKER_PROFILE.nsdcCertificateNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Primary Trade:</span>
                  <span className="font-bold text-slate-900">{MOCK_WORKER_PROFILE.trade}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Cooperative Guild:</span>
                  <span className="font-bold text-slate-900">
                    {MOCK_WORKER_PROFILE.cooperative}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Police Clearance:</span>
                  <span className="text-emerald-700 font-semibold">
                    {MOCK_WORKER_PROFILE.policeVerification}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Bank Account (DBT Linked):</span>
                  <span className="font-bold text-slate-900">
                    {MOCK_WORKER_PROFILE.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Health Insurance:</span>
                  <span className="text-slate-800 font-medium">
                    {MOCK_WORKER_PROFILE.healthInsurancePolicy}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Statutory Daily Floor Wage:</span>
                  <span className="text-emerald-700 font-bold">
                    ₹{MOCK_WORKER_PROFILE.dailyFloorRate} / day
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Emergency Guild SOS:</span>
                  <span className="font-bold text-slate-900">
                    {MOCK_WORKER_PROFILE.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SKILLS */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Certified Competencies & Tools
                </h2>
                <p className="text-xs text-slate-500">
                  Recognized by NSDC, Skill India, and Guild Technical Standards Board
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAddSkillModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Certificate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_WORKER_SKILLS.map((sk) => (
                <div
                  key={sk.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {sk.nsdcLevel}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">{sk.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Certified by: {sk.verifiedBy}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-slate-700">
                      ★ {sk.endorsements} endorsements
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: AVAILABILITY & ROTA */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Availability & Fair-Rota Preferences
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Control your dispatch radius and schedule without penalty
            </p>

            <div className="space-y-6 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Live Dispatch Status
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle your availability for immediate rota allocation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOnline(!isOnline)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isOnline ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isOnline ? 'Online (Available)' : 'Offline'}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                  <span>Maximum Travel Radius</span>
                  <span className="text-amber-600">{workingRadius} km</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="25"
                  value={workingRadius}
                  onChange={(e) => setWorkingRadius(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>3 km (Local Colony)</span>
                  <span>15 km (City Zone)</span>
                  <span>25 km (Metro Area)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: EARNINGS PASSBOOK */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* Zero Middleman Proof Card */}
          <div className="bg-gradient-to-r from-amber-600 to-brand-saffron-600 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-100">
                  Sovereign Dignity Guarantee
                </span>
                <h3 className="text-xl font-bold font-display mt-1">
                  100% Direct Payouts. 0% Middleman Cut.
                </h3>
                <p className="text-xs text-amber-100 mt-1 max-w-2xl">
                  You have saved ₹{MOCK_WORKER_EARNINGS.commissionSavedVsPrivateApps.toLocaleString()} in
                  exploitative 30% private app cuts by operating under Pune Shramik Vikas Sahakari.
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur rounded-xl p-4 border border-white/20 text-right">
                <p className="text-xs text-amber-100">All-Time DBT Earnings</p>
                <p className="text-2xl font-bold font-display">
                  ₹{MOCK_WORKER_EARNINGS.allTimeDisbursed.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* DBT Settlements Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Direct Bank Transfer (DBT) Statement
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Verified banking UTR records credited instantly on job sign-off
            </p>

            <DataTable
              columns={dbtColumns}
              data={MOCK_WORKER_EARNINGS.dbtHistory}
              keyField="txnId"
              emptyMessage="No DBT payouts recorded."
            />
          </div>
        </div>
      )}

      {/* VIEW: JOB HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Completed Job History
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Historical ledger of completed service orders with verified customer reviews
            </p>

            <DataTable
              columns={historyColumns}
              data={MOCK_WORKER_JOB_HISTORY}
              keyField="id"
              emptyMessage="No completed jobs found."
            />

            <Pagination
              currentPage={historyPage}
              totalPages={1}
              totalItems={MOCK_WORKER_JOB_HISTORY.length}
              pageSize={pageSize}
              onPageChange={setHistoryPage}
            />
          </div>
        </div>
      )}

      {/* MODAL 1: Digital Worker QR Pass */}
      <Modal
        isOpen={qrPassModalOpen}
        onClose={() => setQrPassModalOpen(false)}
        title="Official Guild Digital Identity Pass"
        subtitle="SIH 2026 Sovereign Cooperative ID & Geofenced Rota Pass"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setQrPassModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Pass
          </button>
        }
      >
        <div className="text-center space-y-4">
          <div className="p-4 bg-brand-navy-950 text-white rounded-2xl max-w-sm mx-auto shadow-xl border border-amber-400/40 relative overflow-hidden">
            <div className="gov-tricolor-stripe absolute top-0 left-0 right-0" />

            <div className="pt-2 flex items-center justify-between text-[11px] text-amber-300 font-bold border-b border-slate-800 pb-2">
              <span>SHRAMIK WORK PASS</span>
              <span>MH-2026</span>
            </div>

            <div className="mt-3 flex items-center gap-3 text-left">
              <img
                src={MOCK_WORKER_PROFILE.avatar}
                alt={MOCK_WORKER_PROFILE.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-bold text-white">{MOCK_WORKER_PROFILE.name}</p>
                <p className="text-[11px] text-amber-300">{MOCK_WORKER_PROFILE.trade}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  ID: {MOCK_WORKER_PROFILE.id}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white rounded-xl text-slate-900">
              <QrCode className="w-36 h-36 mx-auto text-slate-950" />
              <p className="text-[9px] font-mono text-slate-500 mt-1">
                {MOCK_WORKER_PROFILE.qrTokenId}
              </p>
            </div>

            <div className="mt-3 text-[10px] text-emerald-400 font-medium">
              ✓ State Cooperative Registrar Validated • Aadhaar e-KYC
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Enter OTP / Start Job */}
      <Modal
        isOpen={Boolean(startJobModal)}
        onClose={() => setStartJobModal(null)}
        title="Commence Work Order Handshake"
        subtitle={`Job Ref: ${startJobModal?.id} • Client: ${startJobModal?.customerName}`}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setStartJobModal(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={otpInput.length < 4}
              onClick={() => {
                showToast(`OTP Verified! Job commenced. Escrow locked at ₹${startJobModal?.escrowLocked}`);
                setStartJobModal(null);
                setOtpInput('');
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-sm transition-colors"
            >
              Verify & Start Work
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Ask the client for the 4-digit arrival OTP shown on their screen to commence the job
            and lock escrow protection.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Enter 4-Digit Client Handshake OTP
            </label>
            <input
              type="text"
              maxLength={4}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="e.g. 5829"
              className="w-full text-center text-2xl font-mono font-extrabold tracking-widest p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Add Skill Certification */}
      <Modal
        isOpen={addSkillModalOpen}
        onClose={() => setAddSkillModalOpen(false)}
        title="Register New Skill Certification"
        subtitle="Link NSDC or Skill India trade certificates to your profile"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddSkillModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                showToast('Skill certificate submitted to cooperative technical board for verification!');
                setAddSkillModalOpen(false);
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Submit for Verification
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skill / Trade Competency Name
            </label>
            <input
              type="text"
              placeholder="e.g. Electric Vehicle Charger Installation"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certification Authority
            </label>
            <select className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800">
              <option>National Skill Development Corporation (NSDC)</option>
              <option>Skill India Directorate</option>
              <option>State Labour Department Guild Board</option>
            </select>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

