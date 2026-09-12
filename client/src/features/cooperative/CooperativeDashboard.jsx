import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  Inbox,
  UserCheck,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Phone,
  Clock,
  ArrowRight,
  Filter,
  Award,
  AlertCircle,
  FileText,
  DollarSign,
  UserPlus,
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
  MOCK_COOPERATIVE_PROFILE,
  MOCK_COOPERATIVE_MEMBERS,
  MOCK_COOPERATIVE_INCOMING_REQUESTS,
  MOCK_COOPERATIVE_ACTIVE_JOBS,
  MOCK_COOPERATIVE_COMPLETED_JOBS,
  MOCK_COOPERATIVE_ANALYTICS,
} from '../../data/mockDashboardData';

export function CooperativeDashboard({ onSwitchRole, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, members, requests, assign, active_jobs, completed_jobs, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');

  // Modals & Interactivity
  const [assignModalRequest, setAssignModalRequest] = useState(null);
  const [selectedWorkerForAssign, setSelectedWorkerForAssign] = useState(null);
  const [viewWorkerModal, setViewWorkerModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination states
  const [membersPage, setMembersPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const pageSize = 5;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nav configuration
  const navigation = [
    { id: 'overview', label: 'Guild Overview', icon: Building2 },
    {
      id: 'requests',
      label: 'Incoming Requests',
      icon: Inbox,
      badge: MOCK_COOPERATIVE_INCOMING_REQUESTS.length,
    },
    {
      id: 'members',
      label: 'Member Workers',
      icon: Users,
      badge: MOCK_COOPERATIVE_PROFILE.membersCount,
    },
    { id: 'assign', label: 'Assign Worker', icon: UserCheck },
    {
      id: 'active_jobs',
      label: 'Active Jobs',
      icon: Briefcase,
      badge: MOCK_COOPERATIVE_ACTIVE_JOBS.length,
    },
    { id: 'completed_jobs', label: 'Completed Jobs', icon: CheckCircle2 },
    { id: 'analytics', label: 'Cooperative Analytics', icon: TrendingUp },
  ];

  // Filtered members
  const filteredMembers = useMemo(() => {
    return MOCK_COOPERATIVE_MEMBERS.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTrade = tradeFilter === 'all' || m.trade.includes(tradeFilter);
      return matchSearch && matchTrade;
    });
  }, [searchQuery, tradeFilter]);

  // Member Workers Table Columns
  const memberColumns = [
    {
      header: 'Artisan ID & Name',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar}
            alt={row.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <p className="font-mono text-[11px] text-slate-500">{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Trade & Skill Level',
      accessor: 'subTrade',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.subTrade}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
              NSDC Certified
            </span>
            <span className="text-xs text-slate-400">• {row.experienceYears} yrs exp</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Floor Wage',
      accessor: 'dailyFloorRate',
      cell: (row) => (
        <span className="font-bold text-slate-900">₹{row.dailyFloorRate}/day</span>
      ),
    },
    {
      header: 'Rating & Jobs',
      accessor: 'rating',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">★ {row.rating}</span>
          <span className="text-slate-500 ml-1">({row.jobsCompleted} completed)</span>
        </div>
      ),
    },
    {
      header: 'Daily Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Action',
      cell: (row) => (
        <button
          type="button"
          onClick={() => setViewWorkerModal(row)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          View Profile
        </button>
      ),
    },
  ];

  // Active Jobs Columns
  const activeJobColumns = [
    {
      header: 'Job ID',
      accessor: 'id',
      cell: (row) => <span className="font-mono text-xs font-bold">{row.id}</span>,
    },
    {
      header: 'Service & Trade',
      accessor: 'service',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.service}</p>
          <p className="text-xs text-slate-500">{row.trade}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Worker',
      accessor: 'workerName',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.workerName}</p>
          <p className="font-mono text-[11px] text-slate-500">{row.workerId}</p>
        </div>
      ),
    },
    {
      header: 'Customer & Site',
      accessor: 'customerName',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.customerName}</p>
          <p className="text-xs text-slate-500">{row.location}</p>
        </div>
      ),
    },
    {
      header: 'Escrow Locked',
      accessor: 'escrowLocked',
      cell: (row) => (
        <span className="font-bold text-emerald-700">{row.escrowLocked}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  // Completed Jobs Columns
  const completedJobColumns = [
    {
      header: 'Job ID',
      accessor: 'id',
      cell: (row) => <span className="font-mono text-xs font-bold">{row.id}</span>,
    },
    {
      header: 'Service Details',
      accessor: 'service',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.service}</p>
          <p className="text-xs text-slate-500">{row.trade}</p>
        </div>
      ),
    },
    {
      header: 'Worker',
      accessor: 'workerName',
      cell: (row) => <span className="font-semibold text-slate-800">{row.workerName}</span>,
    },
    {
      header: 'Payout (100% DBT)',
      accessor: 'payout',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.payout}</p>
          <p className="font-mono text-[10px] text-slate-400">{row.dbtRef}</p>
        </div>
      ),
    },
    {
      header: 'Rating',
      accessor: 'rating',
      cell: (row) => (
        <span className="text-xs font-bold text-amber-600">★ {row.rating}</span>
      ),
    },
    {
      header: 'Signoff',
      accessor: 'completedAt',
      cell: (row) => <span className="text-xs text-slate-500">{row.completedAt}</span>,
    },
  ];

  return (
    <DashboardLayout
      role="cooperative"
      navigation={navigation}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={MOCK_COOPERATIVE_PROFILE.name}
      subtitle={`Reg: ${MOCK_COOPERATIVE_PROFILE.regNumber} • State Registrar Validated Society`}
      userProfile={{
        name: MOCK_COOPERATIVE_PROFILE.president,
        district: MOCK_COOPERATIVE_PROFILE.district,
      }}
      onSwitchRole={onSwitchRole}
      onBackToHome={onBackToHome}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-navy-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/50 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Member Workers"
          value={MOCK_COOPERATIVE_PROFILE.membersCount.toLocaleString()}
          change="+14 enrolled this month"
          isPositive={true}
          icon={Users}
          color="indigo"
          subtext="100% Aadhaar verified"
          onClick={() => setActiveTab('members')}
        />
        <StatCard
          title="Active Today"
          value={MOCK_COOPERATIVE_PROFILE.activeToday}
          change="94% attendance rate"
          isPositive={true}
          icon={Briefcase}
          color="emerald"
          subtext="On rota or dispatched"
          onClick={() => setActiveTab('active_jobs')}
        />
        <StatCard
          title="Incoming Demands"
          value={MOCK_COOPERATIVE_INCOMING_REQUESTS.length}
          change="3 awaiting dispatch"
          isPositive={true}
          icon={Inbox}
          color="saffron"
          subtext="Avg response: 9.4m"
          onClick={() => setActiveTab('requests')}
        />
        <StatCard
          title="Welfare Fund Pool"
          value={MOCK_COOPERATIVE_PROFILE.welfareFund}
          change="Audited & Secured"
          isPositive={true}
          icon={ShieldCheck}
          color="navy"
          subtext="Family health cover active"
          onClick={() => setActiveTab('analytics')}
        />
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Incoming Dispatch Alert */}
          {MOCK_COOPERATIVE_INCOMING_REQUESTS.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-900 to-brand-navy-900 text-white rounded-2xl p-6 shadow-md border border-indigo-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-amber-400 animate-bounce" />
                    <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
                      Cooperative Dispatch Queue
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display mt-1">
                    {MOCK_COOPERATIVE_INCOMING_REQUESTS.length} New Service Demands Require
                    Worker Assignment
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Assign certified artisans using our XGBoost fair-opportunity rota engine.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Open Assignment Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Incoming Requests Quick Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Priority Customer Requests
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_COOPERATIVE_INCOMING_REQUESTS.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-indigo-300 transition-all bg-slate-50/50 hover:bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {req.id}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {req.urgency}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {req.service}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {req.trade} • {req.location}
                    </p>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {req.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400">Budget Floor</p>
                      <p className="text-xs font-bold text-emerald-700">{req.budgetFloor}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalRequest(req);
                        setSelectedWorkerForAssign(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                    >
                      Assign Worker
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column: Active Jobs Monitor & Member Workers Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Jobs Live Feed */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Live Active Assignments
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('active_jobs')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Details
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_COOPERATIVE_ACTIVE_JOBS.map((j) => (
                  <div
                    key={j.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">
                          {j.id}
                        </span>
                        <StatusBadge status={j.status} size="sm" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                        {j.service}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Worker: <span className="font-semibold text-slate-800">{j.workerName}</span> • Site: {j.location}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-700">{j.escrowLocked}</p>
                      <span className="text-[10px] text-slate-400">Escrow Locked</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guild Health & Welfare Snapshot */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Guild Welfare & Compliance
                  </h3>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Trust: {MOCK_COOPERATIVE_PROFILE.trustScore}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Dispute Rate (Platform Target &lt; 1%)</span>
                  <span className="font-bold text-emerald-700">
                    {MOCK_COOPERATIVE_ANALYTICS.disputeRate}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Welfare Fund Payouts (Year-to-date)</span>
                  <span className="font-bold text-slate-900">
                    {MOCK_COOPERATIVE_ANALYTICS.welfareDisbursements}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Active Member Family Insurances</span>
                  <span className="font-bold text-slate-900">
                    {MOCK_COOPERATIVE_ANALYTICS.activeInsurances} covered
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Average Guild Dispatch Latency</span>
                  <span className="font-bold text-indigo-700">
                    {MOCK_COOPERATIVE_ANALYTICS.avgResponseMins} mins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: INCOMING REQUESTS & ASSIGN WORKER */}
      {(activeTab === 'requests' || activeTab === 'assign') && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Incoming Work Requests Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Demands raised by citizens awaiting allocation to available cooperative artisans
                </p>
              </div>

              <div className="w-full sm:w-72">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  size="sm"
                  placeholder="Search demand or location..."
                />
              </div>
            </div>

            <div className="space-y-4">
              {MOCK_COOPERATIVE_INCOMING_REQUESTS.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-xl border border-slate-200/90 hover:border-indigo-300 transition-all bg-white shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {req.id}
                        </span>
                        <StatusBadge status={req.status} size="sm" />
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {req.urgency}
                        </span>
                        <span className="text-xs text-slate-500">
                          • {req.distance} away
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {req.service}
                      </h3>
                      <p className="text-xs text-slate-500">{req.trade}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Guaranteed Budget</p>
                        <p className="text-base font-bold text-emerald-700">
                          {req.budgetFloor}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAssignModalRequest(req);
                          setSelectedWorkerForAssign(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Assign Worker</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 font-medium">Customer:</span>{' '}
                      <span className="font-semibold text-slate-800">{req.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Schedule:</span>{' '}
                      <span className="font-semibold text-slate-800">{req.scheduledFor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Location:</span>{' '}
                      <span className="font-semibold text-slate-800">{req.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-800">Job Scope:</span>{' '}
                    {req.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MEMBER WORKERS */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Cooperative Member Roster
                </h2>
                <p className="text-xs text-slate-500">
                  Registered guild artisans with verified Aadhaar e-KYC & NSDC skill certificates
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={tradeFilter}
                  onChange={(e) => setTradeFilter(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-700"
                >
                  <option value="all">All Trades</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Masonry">Masonry</option>
                  <option value="Painting">Painting</option>
                  <option value="Carpentry">Carpentry</option>
                </select>

                <div className="w-full sm:w-64">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    size="sm"
                    placeholder="Search workers..."
                  />
                </div>
              </div>
            </div>

            <DataTable
              columns={memberColumns}
              data={filteredMembers}
              keyField="id"
              emptyMessage="No member workers match query."
            />

            <Pagination
              currentPage={membersPage}
              totalPages={1}
              totalItems={filteredMembers.length}
              pageSize={pageSize}
              onPageChange={setMembersPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: ACTIVE JOBS */}
      {activeTab === 'active_jobs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Live On-Site Assignments
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Real-time monitoring of dispatched workers and smart escrow lock status
            </p>

            <DataTable
              columns={activeJobColumns}
              data={MOCK_COOPERATIVE_ACTIVE_JOBS}
              keyField="id"
              emptyMessage="No active jobs right now."
            />
          </div>
        </div>
      )}

      {/* VIEW: COMPLETED JOBS */}
      {activeTab === 'completed_jobs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Completed Jobs & Payout Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Archival log of completed work orders with 100% direct DBT settlement reference
            </p>

            <DataTable
              columns={completedJobColumns}
              data={MOCK_COOPERATIVE_COMPLETED_JOBS}
              keyField="id"
              emptyMessage="No completed jobs found."
            />

            <Pagination
              currentPage={completedPage}
              totalPages={1}
              totalItems={MOCK_COOPERATIVE_COMPLETED_JOBS.length}
              pageSize={pageSize}
              onPageChange={setCompletedPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: COOPERATIVE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Monthly DBT Volume
              </span>
              <p className="text-2xl font-bold font-display text-slate-900 mt-1">
                {MOCK_COOPERATIVE_PROFILE.monthlyWagesDisbursed}
              </p>
              <p className="text-xs text-emerald-700 mt-1">100% direct to worker accounts</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Welfare Reserve Balance
              </span>
              <p className="text-2xl font-bold font-display text-indigo-700 mt-1">
                {MOCK_COOPERATIVE_PROFILE.welfareFund}
              </p>
              <p className="text-xs text-slate-500 mt-1">For pensions, tool loans & health</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Dispute Ratio
              </span>
              <p className="text-2xl font-bold font-display text-slate-900 mt-1">
                {MOCK_COOPERATIVE_ANALYTICS.disputeRate}
              </p>
              <p className="text-xs text-emerald-700 mt-1">Industry benchmark: 3.4%</p>
            </div>
          </div>

          {/* Trade Membership Distribution */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Trade Membership Distribution
            </h3>

            <div className="space-y-3">
              {MOCK_COOPERATIVE_ANALYTICS.tradeDistribution.map((td) => (
                <div key={td.trade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{td.trade}</span>
                    <span className="text-slate-500">
                      {td.count} workers ({td.percentage})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: td.percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Assign Worker Modal */}
      <Modal
        isOpen={Boolean(assignModalRequest)}
        onClose={() => setAssignModalRequest(null)}
        title="Assign Certified Guild Worker"
        subtitle={`Request: ${assignModalRequest?.id} • Service: ${assignModalRequest?.service}`}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAssignModalRequest(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedWorkerForAssign}
              onClick={() => {
                showToast(
                  `Successfully assigned ${selectedWorkerForAssign.name} to ${assignModalRequest?.service}!`
                );
                setAssignModalRequest(null);
                setSelectedWorkerForAssign(null);
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Confirm Dispatch
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <p className="font-bold text-slate-900">{assignModalRequest?.service}</p>
            <p className="text-slate-500">
              Location: {assignModalRequest?.location} • Time: {assignModalRequest?.scheduledFor}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Available Guild Member (Ranked by Equitable Rotation & Proximity):
            </label>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {MOCK_COOPERATIVE_MEMBERS.filter((m) => m.status === 'available').map(
                (worker) => {
                  const isSelected = selectedWorkerForAssign?.id === worker.id;
                  return (
                    <div
                      key={worker.id}
                      onClick={() => setSelectedWorkerForAssign(worker)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={worker.avatar}
                          alt={worker.name}
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">
                              {worker.name}
                            </h4>
                            <span className="text-[10px] text-amber-600 font-bold">
                              ★ {worker.rating}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{worker.subTrade}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">
                          ₹{worker.dailyFloorRate}/day
                        </span>
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          Available Today
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: View Worker Profile */}
      <Modal
        isOpen={Boolean(viewWorkerModal)}
        onClose={() => setViewWorkerModal(null)}
        title="Artisan Guild Record"
        subtitle={`Member ID: ${viewWorkerModal?.id}`}
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setViewWorkerModal(null)}
            className="px-4 py-2 rounded-xl bg-brand-navy-950 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Close
          </button>
        }
      >
        {viewWorkerModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={viewWorkerModal.avatar}
                alt={viewWorkerModal.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {viewWorkerModal.name}
                </h4>
                <p className="text-xs text-slate-600">{viewWorkerModal.subTrade}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    Aadhaar e-KYC Verified
                  </span>
                  <StatusBadge status={viewWorkerModal.status} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400">Total Jobs Completed</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {viewWorkerModal.jobsCompleted}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400">Customer Rating</span>
                <p className="text-sm font-bold text-amber-600 mt-0.5">
                  ★ {viewWorkerModal.rating} / 5.0
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400">Daily Minimum Floor</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  ₹{viewWorkerModal.dailyFloorRate}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400">Monthly Wages</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  ₹{viewWorkerModal.monthlyEarnings?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>
                Protected under Guild Collective Bargaining Agreement & PM-JAY health insurance.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

