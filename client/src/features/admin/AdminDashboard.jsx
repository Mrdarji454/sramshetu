import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  HardHat,
  Calendar,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Server,
  Activity,
  ArrowRight,
  Eye,
  FileText,
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
  MOCK_ADMIN_STATS,
  MOCK_ADMIN_COOPERATIVES,
  MOCK_ADMIN_WORKERS,
  MOCK_ADMIN_BOOKINGS,
  MOCK_ADMIN_VERIFICATION_REQUESTS,
  MOCK_ADMIN_COMPLAINTS,
  MOCK_ADMIN_SYSTEM_ANALYTICS,
} from '../../data/mockDashboardData';

export function AdminDashboard({ onSwitchRole, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, cooperatives, workers, bookings, verifications, complaints, analytics
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Interactivity
  const [reviewVerificationModal, setReviewVerificationModal] = useState(null);
  const [resolveComplaintModal, setResolveComplaintModal] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination states
  const [coopPage, setCoopPage] = useState(1);
  const [workerPage, setWorkerPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [verificationPage, setVerificationPage] = useState(1);
  const [complaintPage, setComplaintPage] = useState(1);
  const pageSize = 5;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nav configuration
  const navigation = [
    { id: 'overview', label: 'Command Telemetry', icon: Activity },
    {
      id: 'verifications',
      label: 'Verification Requests',
      icon: FileCheck,
      badge: MOCK_ADMIN_VERIFICATION_REQUESTS.length,
    },
    {
      id: 'complaints',
      label: 'Complaints & Grievances',
      icon: AlertTriangle,
      badge: MOCK_ADMIN_COMPLAINTS.filter((c) => c.status !== 'resolved').length,
    },
    { id: 'cooperatives', label: 'Cooperatives Registry', icon: Building2 },
    { id: 'workers', label: 'Workers Registry', icon: HardHat },
    { id: 'bookings', label: 'Platform Bookings', icon: Calendar },
    { id: 'users', label: 'Total Users & Demand', icon: Users },
    { id: 'analytics', label: 'System Analytics', icon: TrendingUp },
  ];

  // Cooperatives Table Columns
  const coopColumns = [
    {
      header: 'Society Name & Reg No',
      accessor: 'name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.regNumber}</p>
        </div>
      ),
    },
    {
      header: 'State / District',
      accessor: 'state',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.state}</p>
          <p className="text-xs text-slate-500">{row.district}</p>
        </div>
      ),
    },
    {
      header: 'President',
      accessor: 'president',
      cell: (row) => <span className="text-xs font-semibold text-slate-800">{row.president}</span>,
    },
    {
      header: 'Guild Members',
      accessor: 'membersCount',
      cell: (row) => (
        <span className="font-bold text-slate-900">{row.membersCount.toLocaleString()}</span>
      ),
    },
    {
      header: 'Welfare Fund',
      accessor: 'welfareFund',
      cell: (row) => <span className="font-bold text-indigo-700">{row.welfareFund}</span>,
    },
    {
      header: 'Audit Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  // Workers Table Columns
  const workerColumns = [
    {
      header: 'Worker ID & Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.id}</p>
        </div>
      ),
    },
    {
      header: 'Trade Competency',
      accessor: 'trade',
      cell: (row) => <span className="text-xs font-medium text-slate-800">{row.trade}</span>,
    },
    {
      header: 'Cooperative Society',
      accessor: 'cooperative',
      cell: (row) => <span className="text-xs text-slate-600 truncate max-w-[180px]">{row.cooperative}</span>,
    },
    {
      header: 'Aadhaar e-KYC',
      accessor: 'aadhaarStatus',
      cell: (row) => <StatusBadge status={row.aadhaarStatus} size="sm" />,
    },
    {
      header: 'Completed Jobs',
      accessor: 'completedJobs',
      cell: (row) => (
        <span className="text-xs font-bold text-slate-900">
          {row.completedJobs} (★ {row.rating})
        </span>
      ),
    },
  ];

  // Bookings Oversight Columns
  const bookingColumns = [
    {
      header: 'Booking ID',
      accessor: 'id',
      cell: (row) => <span className="font-mono text-xs font-bold">{row.id}</span>,
    },
    {
      header: 'Service & Amount',
      accessor: 'service',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.service}</p>
          <p className="text-xs font-bold text-emerald-700">{row.amount}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => <span className="text-xs text-slate-800 font-medium">{row.customer}</span>,
    },
    {
      header: 'Artisan & Guild',
      accessor: 'worker',
      cell: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-900">{row.worker}</p>
          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{row.cooperative}</p>
        </div>
      ),
    },
    {
      header: 'Escrow Status',
      accessor: 'escrowStatus',
      cell: (row) => <StatusBadge status={row.escrowStatus} size="sm" />,
    },
    {
      header: 'Job Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  // Verification Requests Columns
  const verificationColumns = [
    {
      header: 'Request ID',
      accessor: 'id',
      cell: (row) => <span className="font-mono text-xs font-bold">{row.id}</span>,
    },
    {
      header: 'Applicant Type & Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-indigo-700 font-semibold">{row.applicantType}</p>
        </div>
      ),
    },
    {
      header: 'State',
      accessor: 'state',
      cell: (row) => <span className="text-xs text-slate-700">{row.state}</span>,
    },
    {
      header: 'Submitted',
      accessor: 'submittedDate',
      cell: (row) => <span className="text-xs text-slate-500">{row.submittedDate}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          type="button"
          onClick={() => setReviewVerificationModal(row)}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline inline-flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Review Docs</span>
        </button>
      ),
    },
  ];

  // Complaints Columns
  const complaintColumns = [
    {
      header: 'Ticket ID',
      accessor: 'ticketId',
      cell: (row) => <span className="font-mono text-xs font-bold">{row.ticketId}</span>,
    },
    {
      header: 'Filed By',
      accessor: 'filedBy',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.filedBy}</p>
          <p className="text-xs text-slate-500">{row.type}</p>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      cell: (row) => <StatusBadge status={row.severity} size="sm" />,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          type="button"
          onClick={() => {
            setResolveComplaintModal(row);
            setResolutionText(row.resolutionNotes || '');
          }}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          Inspect & Resolve
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      navigation={navigation}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title="GovTech Central Oversight Command"
      subtitle="Sovereign Public Digital Infrastructure • Ministry of Labour & Cooperation"
      userProfile={{
        name: 'Gov Administrator (R. K. Joshi)',
        district: 'National Command Center',
      }}
      onSwitchRole={onSwitchRole}
      onBackToHome={onBackToHome}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-navy-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/50 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users Registered"
          value={MOCK_ADMIN_STATS.totalUsers.toLocaleString()}
          change={MOCK_ADMIN_STATS.userGrowthRate}
          isPositive={true}
          icon={Users}
          color="ashoka"
          subtext="Citizens & businesses"
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          title="Cooperatives Registered"
          value={MOCK_ADMIN_STATS.totalCooperatives}
          change={`${MOCK_ADMIN_STATS.cooperativesVerified} Audited & Verified`}
          isPositive={true}
          icon={Building2}
          color="indigo"
          subtext="Across 18 States"
          onClick={() => setActiveTab('cooperatives')}
        />
        <StatCard
          title="Verified Workers"
          value={MOCK_ADMIN_STATS.totalWorkers.toLocaleString()}
          change={`${MOCK_ADMIN_STATS.workersAadhaarVerified} e-KYC certified`}
          isPositive={true}
          icon={HardHat}
          color="saffron"
          subtext="0% platform fee"
          onClick={() => setActiveTab('workers')}
        />
        <StatCard
          title="Total Wages Disbursed"
          value={MOCK_ADMIN_STATS.totalWagesDisbursed}
          change={`${MOCK_ADMIN_STATS.middlemanCommissionEliminated} saved`}
          isPositive={true}
          icon={TrendingUp}
          color="emerald"
          subtext="100% Direct DBT"
          onClick={() => setActiveTab('analytics')}
        />
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real-Time System Health Monitor */}
          <div className="bg-gradient-to-r from-brand-navy-950 via-slate-900 to-brand-navy-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                    Live Sovereign Engine Telemetry
                  </span>
                </div>
                <h3 className="text-lg font-bold font-display mt-1">
                  XGBoost Fair-Rank Engine: {MOCK_ADMIN_STATS.fairnessIndex} Fairness Index
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Equitable rota allocation active. Anti-monopoly cap enforced at max 2 premium
                  dispatches per artisan daily. Direct DBT settlement uptime {MOCK_ADMIN_SYSTEM_ANALYTICS.apiUptime}.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-xs">
                <div>
                  <p className="text-slate-400">API Latency</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">
                    {MOCK_ADMIN_SYSTEM_ANALYTICS.xgboostInferenceLatencyMs} ms
                  </p>
                </div>
                <div className="h-7 w-px bg-white/10" />
                <div>
                  <p className="text-slate-400">Escrow Release</p>
                  <p className="text-base font-bold text-white font-mono">
                    {MOCK_ADMIN_STATS.escrowReleaseLatencyAvg}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column: Pending Verifications & Priority Complaints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Verification Requests */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Pending Verification Queue
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('verifications')}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  View All ({MOCK_ADMIN_VERIFICATION_REQUESTS.length})
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_ADMIN_VERIFICATION_REQUESTS.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">
                          {v.id}
                        </span>
                        <StatusBadge status={v.status} size="sm" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                        {v.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {v.applicantType} • {v.state}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReviewVerificationModal(v)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      Audit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Complaints & Escalation */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">
                    Grievance Redressal Tickets
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('complaints')}
                  className="text-xs font-semibold text-amber-700 hover:underline"
                >
                  All Tickets
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_ADMIN_COMPLAINTS.map((cmp) => (
                  <div
                    key={cmp.ticketId}
                    className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">
                          {cmp.ticketId}
                        </span>
                        <StatusBadge status={cmp.severity} size="sm" />
                        <StatusBadge status={cmp.status} size="sm" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                        {cmp.type}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        By: {cmp.filedBy}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResolveComplaintModal(cmp);
                        setResolutionText(cmp.resolutionNotes || '');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors flex-shrink-0"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: VERIFICATION REQUESTS */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Cooperative & Artisan Verification Queue
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Statutory verification of state registration certificates, society by-laws, and Aadhaar e-KYC
            </p>

            <DataTable
              columns={verificationColumns}
              data={MOCK_ADMIN_VERIFICATION_REQUESTS}
              keyField="id"
              emptyMessage="No pending verification requests."
            />

            <Pagination
              currentPage={verificationPage}
              totalPages={1}
              totalItems={MOCK_ADMIN_VERIFICATION_REQUESTS.length}
              pageSize={pageSize}
              onPageChange={setVerificationPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: COMPLAINTS & GRIEVANCES */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Platform Grievance Redressal Tickets
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Escrow release disputes, safety protocol issues, and fair rota audits
            </p>

            <DataTable
              columns={complaintColumns}
              data={MOCK_ADMIN_COMPLAINTS}
              keyField="ticketId"
              emptyMessage="No open complaints registered."
            />

            <Pagination
              currentPage={complaintPage}
              totalPages={1}
              totalItems={MOCK_ADMIN_COMPLAINTS.length}
              pageSize={pageSize}
              onPageChange={setComplaintPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: COOPERATIVES REGISTRY */}
      {activeTab === 'cooperatives' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Registered Worker Cooperatives Directory
                </h2>
                <p className="text-xs text-slate-500">
                  State Registrar Validated Guild Societies governing regional worker welfare
                </p>
              </div>

              <div className="w-full sm:w-64">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  size="sm"
                  placeholder="Search by state, name, or reg ID..."
                />
              </div>
            </div>

            <DataTable
              columns={coopColumns}
              data={MOCK_ADMIN_COOPERATIVES}
              keyField="id"
              emptyMessage="No cooperatives found."
            />

            <Pagination
              currentPage={coopPage}
              totalPages={1}
              totalItems={MOCK_ADMIN_COOPERATIVES.length}
              pageSize={pageSize}
              onPageChange={setCoopPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: WORKERS REGISTRY */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  National Artisan & Shramik Registry
                </h2>
                <p className="text-xs text-slate-500">
                  All certified workers linked to recognized regional cooperatives
                </p>
              </div>

              <div className="w-full sm:w-64">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  size="sm"
                  placeholder="Search workers..."
                />
              </div>
            </div>

            <DataTable
              columns={workerColumns}
              data={MOCK_ADMIN_WORKERS}
              keyField="id"
              emptyMessage="No workers found."
            />

            <Pagination
              currentPage={workerPage}
              totalPages={1}
              totalItems={MOCK_ADMIN_WORKERS.length}
              pageSize={pageSize}
              onPageChange={setWorkerPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: BOOKINGS OVERSIGHT */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Platform-Wide Live Bookings Oversight
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Real-time transaction stream with smart escrow locks and completion certificates
            </p>

            <DataTable
              columns={bookingColumns}
              data={MOCK_ADMIN_BOOKINGS}
              keyField="id"
              emptyMessage="No bookings found."
            />

            <Pagination
              currentPage={bookingPage}
              totalPages={1}
              totalItems={MOCK_ADMIN_BOOKINGS.length}
              pageSize={pageSize}
              onPageChange={setBookingPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: TOTAL USERS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Citizen & Enterprise User Base
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Over 1,28,450 registered service consumers across 18 states
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Household Consumers
                </p>
                <p className="text-2xl font-bold font-display text-slate-900 mt-1">
                  1,14,200
                </p>
                <p className="text-xs text-slate-500 mt-0.5">88.9% of user base</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Commercial Contractors
                </p>
                <p className="text-2xl font-bold font-display text-slate-900 mt-1">
                  14,250
                </p>
                <p className="text-xs text-slate-500 mt-0.5">11.1% of user base</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Monthly Booking Retention
                </p>
                <p className="text-2xl font-bold font-display text-emerald-700 mt-1">
                  84.2%
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">Dispute-free satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SYSTEM ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Regional State Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                State Cooperative & Worker Distribution
              </h3>

              <div className="space-y-4">
                {MOCK_ADMIN_SYSTEM_ANALYTICS.stateDistribution.map((st) => (
                  <div key={st.state} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{st.state}</span>
                      <span className="text-slate-500">
                        {st.cooperatives} coops • {st.workers.toLocaleString()} workers
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (st.workers / 16400) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fairness Metrics */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Algorithmic Fairness & Anti-Monopoly
              </h3>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Gini Inequality Coefficient</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-bold font-display text-emerald-700">
                      {MOCK_ADMIN_SYSTEM_ANALYTICS.giniInequalityIndex}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      High Equality (Target &lt; 0.15)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Ensures work orders rotate equally across all guild artisans rather than concentrating on 5% "star" workers.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Direct DBT Banking Success Rate</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-bold font-display text-slate-900">
                      {MOCK_ADMIN_SYSTEM_ANALYTICS.dbtSuccessRate}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Via NPCI / PFMS Switch
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Audit Verification Docs Modal */}
      <Modal
        isOpen={Boolean(reviewVerificationModal)}
        onClose={() => setReviewVerificationModal(null)}
        title="Audit Statutory Verification Application"
        subtitle={`Applicant: ${reviewVerificationModal?.name} • ID: ${reviewVerificationModal?.id}`}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                showToast(`Application for ${reviewVerificationModal?.name} flagged for query.`);
                setReviewVerificationModal(null);
              }}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
            >
              Request Additional Documents
            </button>
            <button
              type="button"
              onClick={() => {
                showToast(`Application for ${reviewVerificationModal?.name} officially APPROVED!`);
                setReviewVerificationModal(null);
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Approve & Issue Registry Badge
            </button>
          </>
        }
      >
        {reviewVerificationModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p>
                <span className="text-slate-500">Applicant:</span>{' '}
                <span className="font-bold text-slate-900">{reviewVerificationModal.name}</span>
              </p>
              <p>
                <span className="text-slate-500">Category:</span>{' '}
                <span className="font-semibold text-indigo-700">
                  {reviewVerificationModal.applicantType}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Jurisdiction:</span>{' '}
                <span className="text-slate-800">{reviewVerificationModal.state}</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 mb-2">
                Attached Digital Identity & Legal Documents:
              </p>
              <div className="space-y-2">
                {reviewVerificationModal.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-700">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{doc}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Digitally Signed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Inspect & Resolve Complaint */}
      <Modal
        isOpen={Boolean(resolveComplaintModal)}
        onClose={() => setResolveComplaintModal(null)}
        title="Grievance Redressal Action Console"
        subtitle={`Ticket: ${resolveComplaintModal?.ticketId} • Category: ${resolveComplaintModal?.type}`}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResolveComplaintModal(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                showToast(`Ticket ${resolveComplaintModal?.ticketId} marked as RESOLVED!`);
                setResolveComplaintModal(null);
              }}
              className="px-5 py-2 rounded-xl bg-brand-navy-950 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
            >
              Record Resolution & Close Ticket
            </button>
          </>
        }
      >
        {resolveComplaintModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p>
                <span className="text-slate-500">Filed By:</span>{' '}
                <span className="font-bold text-slate-900">{resolveComplaintModal.filedBy}</span>
              </p>
              <p>
                <span className="text-slate-500">Grievance Description:</span>{' '}
                <span className="text-slate-800">{resolveComplaintModal.description}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Redressal Notes
              </label>
              <textarea
                rows={3}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Enter actions taken, officer notes, or refund/escrow override details..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

