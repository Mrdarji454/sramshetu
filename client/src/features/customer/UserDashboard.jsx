import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Star,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  Zap,
  Droplets,
  Hammer,
  Wrench,
  Flame,
  Truck,
  Paintbrush,
  Tractor,
  Layers,
  FileText,
  AlertCircle,
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
  MOCK_USER_PROFILE,
  MOCK_USER_ACTIVE_BOOKINGS,
  MOCK_USER_BOOKING_HISTORY,
  MOCK_USER_PAYMENTS,
  MOCK_USER_NEARBY_WORKERS,
  MOCK_USER_NEARBY_COOPERATIVES,
  MOCK_USER_RATINGS,
} from '../../data/mockDashboardData';
import { SERVICE_CATEGORIES } from '../../data/mockData';

export function UserDashboard({ onSwitchRole, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, services, nearby, active, history, payments, ratings
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Interactive Modals
  const [bookingModalWorker, setBookingModalWorker] = useState(null);
  const [bookingModalService, setBookingModalService] = useState(null);
  const [qrModalBooking, setQrModalBooking] = useState(null);
  const [ratingModalBooking, setRatingModalBooking] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination states
  const [historyPage, setHistoryPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const pageSize = 5;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nav configuration
  const navigation = [
    { id: 'overview', label: 'Dashboard Overview', icon: Layers },
    { id: 'services', label: 'Service Search', icon: Search, badge: 'Floor Rates' },
    { id: 'nearby', label: 'Nearby Workers & Coops', icon: MapPin, badge: 'Live Rota' },
    {
      id: 'active',
      label: 'Active Bookings',
      icon: Clock,
      badge: MOCK_USER_ACTIVE_BOOKINGS.length,
    },
    { id: 'history', label: 'Booking History', icon: Calendar },
    { id: 'payments', label: 'Payments & Escrow', icon: IndianRupee },
    { id: 'ratings', label: 'Ratings & Reviews', icon: Star },
  ];

  // Category Icon Resolver
  const getCategoryIcon = (slug) => {
    switch (slug) {
      case 'electrical':
        return Zap;
      case 'plumbing':
        return Droplets;
      case 'masonry':
        return Hammer;
      case 'carpentry':
        return Wrench;
      case 'fabrication':
        return Flame;
      case 'logistics':
        return Truck;
      case 'painting':
        return Paintbrush;
      case 'agro':
        return Tractor;
      default:
        return Wrench;
    }
  };

  // Filtered Services
  const filteredServices = useMemo(() => {
    return SERVICE_CATEGORIES.filter((srv) => {
      const matchSearch =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.skills.some((sk) => sk.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat =
        selectedCategory === 'all' || srv.categoryGroup === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  // Filtered Nearby Workers
  const filteredWorkers = useMemo(() => {
    return MOCK_USER_NEARBY_WORKERS.filter((w) => {
      return (
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [searchQuery]);

  // History table columns
  const historyColumns = [
    {
      header: 'Booking ID',
      accessor: 'id',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {row.id}
        </span>
      ),
    },
    {
      header: 'Service & Category',
      accessor: 'serviceName',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.serviceName}</p>
          <p className="text-xs text-slate-500">{row.category}</p>
        </div>
      ),
    },
    {
      header: 'Worker & Guild',
      accessor: 'workerName',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.workerName}</p>
          <p className="text-xs text-slate-500 truncate max-w-[180px]">
            {row.cooperativeName}
          </p>
        </div>
      ),
    },
    {
      header: 'Completed',
      accessor: 'completedDate',
      cell: (row) => <span className="text-xs text-slate-600">{row.completedDate}</span>,
    },
    {
      header: 'Amount Paid',
      accessor: 'totalPaid',
      cell: (row) => (
        <span className="font-semibold text-slate-900">₹{row.totalPaid}</span>
      ),
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
          onClick={() => setRatingModalBooking(row)}
          className="text-xs font-semibold text-brand-saffron-600 hover:text-brand-saffron-700 hover:underline"
        >
          {row.ratingGiven ? 'View Review' : 'Rate Artisan'}
        </button>
      ),
    },
  ];

  // Payments table columns
  const paymentColumns = [
    {
      header: 'Txn ID',
      accessor: 'txnId',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {row.txnId}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.description}</p>
          <p className="text-xs text-slate-500 font-mono">Ref: {row.bookingId}</p>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      accessor: 'date',
      cell: (row) => <span className="text-xs text-slate-500">{row.date}</span>,
    },
    {
      header: 'Payment Method',
      accessor: 'method',
      cell: (row) => <span className="text-xs text-slate-600">{row.method}</span>,
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => (
        <span className="font-bold text-slate-900">₹{row.amount}</span>
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
      role="user"
      navigation={navigation}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title="Customer Portal"
      subtitle="Discover certified artisans, initiate fair escrow bookings & rate guild craftsmanship"
      userProfile={MOCK_USER_PROFILE}
      onSwitchRole={onSwitchRole}
      onBackToHome={onBackToHome}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-navy-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-brand-saffron-500/50 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Bookings"
          value={MOCK_USER_ACTIVE_BOOKINGS.length}
          change="1 ongoing right now"
          isPositive={true}
          icon={Clock}
          color="saffron"
          subtext="Dynamic QR protected"
          onClick={() => setActiveTab('active')}
        />
        <StatCard
          title="Escrow Balance"
          value={`₹${MOCK_USER_PROFILE.escrowLocked}`}
          change="Locked safely in bank"
          isPositive={true}
          icon={ShieldCheck}
          color="emerald"
          subtext="Released upon OTP signoff"
          onClick={() => setActiveTab('payments')}
        />
        <StatCard
          title="Completed Services"
          value={MOCK_USER_BOOKING_HISTORY.length}
          change="100% dispute-free"
          isPositive={true}
          icon={CheckCircle2}
          color="navy"
          subtext="Verified guild artisans"
          onClick={() => setActiveTab('history')}
        />
        <StatCard
          title="Middleman Fee Cut"
          value="0%"
          change="₹3,480 saved"
          isPositive={true}
          icon={IndianRupee}
          color="ashoka"
          subtext="vs 25-35% on private apps"
          onClick={() => setActiveTab('payments')}
        />
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Bookings Alert Banner if any */}
          {MOCK_USER_ACTIVE_BOOKINGS.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-brand-saffron-500/10 to-transparent border border-brand-saffron-200 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-saffron-500 text-white shadow-sm flex-shrink-0">
                    <Clock className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-saffron-700">
                        Live Active Job
                      </span>
                      <StatusBadge status="in_progress" size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {MOCK_USER_ACTIVE_BOOKINGS[0].serviceName}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Artisan:{' '}
                      <span className="font-semibold text-slate-800">
                        {MOCK_USER_ACTIVE_BOOKINGS[0].workerName}
                      </span>{' '}
                      • {MOCK_USER_ACTIVE_BOOKINGS[0].cooperativeName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQrModalBooking(MOCK_USER_ACTIVE_BOOKINGS[0])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy-950 text-white text-xs font-semibold hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <QrCode className="w-4 h-4 text-brand-saffron-400" />
                    <span>View QR Handshake</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span>All Bookings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Search & Categories Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Book a Certified Guild Service
                </h2>
                <p className="text-xs text-slate-500">
                  Guaranteed statutory minimum floor pricing, 0% platform surcharge & NSDC
                  skilled workforce
                </p>
              </div>

              <div className="w-full sm:w-72">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  size="sm"
                  placeholder="Search trades or skills..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICE_CATEGORIES.slice(0, 4).map((cat) => {
                const Icon = getCategoryIcon(cat.slug);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setBookingModalService(cat);
                    }}
                    className="group p-4 rounded-xl border border-slate-200/90 hover:border-brand-saffron-300 hover:shadow-card-hover transition-all duration-200 cursor-pointer bg-slate-50/50 hover:bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-brand-saffron-50 text-brand-saffron-600 group-hover:bg-brand-saffron-500 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {cat.floorRate}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-saffron-600 transition-colors line-clamp-1">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{cat.verifiedWorkers} verified</span>
                      <span className="font-semibold text-brand-saffron-600 group-hover:translate-x-0.5 transition-transform">
                        Book →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className="text-xs font-semibold text-brand-navy-900 hover:text-brand-saffron-600 transition-colors inline-flex items-center gap-1"
              >
                <span>View all 8 government recognized categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Two-Column: Nearby Workers Preview & Recent History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nearby Workers */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-saffron-500" />
                  <h3 className="text-base font-bold text-slate-900">
                    Nearby Guild Workers
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('nearby')}
                  className="text-xs font-semibold text-brand-saffron-600 hover:underline"
                >
                  View All ({MOCK_USER_NEARBY_WORKERS.length})
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_USER_NEARBY_WORKERS.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={w.avatar}
                        alt={w.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {w.name}
                          </h4>
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {w.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{w.trade}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="text-emerald-700 font-medium">
                            {w.distance}
                          </span>
                          <span>•</span>
                          <span>₹{w.hourlyRate}/hr</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingModalWorker(w)}
                      className="px-3 py-1.5 rounded-lg bg-brand-navy-950 text-white hover:bg-slate-900 text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings & Escrow Log */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Recent Bookings
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-brand-saffron-600 hover:underline"
                >
                  Full History
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_USER_BOOKING_HISTORY.slice(0, 3).map((bk) => (
                  <div
                    key={bk.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">
                          {bk.id}
                        </span>
                        <StatusBadge status={bk.status} size="sm" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                        {bk.serviceName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {bk.workerName} • ₹{bk.totalPaid}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRatingModalBooking(bk)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors flex-shrink-0"
                    >
                      {bk.ratingGiven ? 'Review' : 'Rate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SERVICE SEARCH */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Certified Guild Service Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Fixed statutory floor rates established by state registered worker cooperatives
                </p>
              </div>

              <div className="w-full md:w-80">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by trade, skill or tool..."
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 text-xs">
              {[
                { id: 'all', label: 'All Services' },
                { id: 'Technical', label: 'Technical' },
                { id: 'Home & Site', label: 'Home & Site' },
                { id: 'Civil & Infra', label: 'Civil & Infra' },
                { id: 'Industrial', label: 'Industrial' },
                { id: 'Rural & Agro', label: 'Rural & Agro' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === c.id
                      ? 'bg-brand-navy-950 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((srv) => {
                const Icon = getCategoryIcon(srv.slug);
                return (
                  <div
                    key={srv.id}
                    className="p-5 rounded-xl border border-slate-200/90 hover:border-brand-saffron-400 hover:shadow-card-hover transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="p-2.5 rounded-xl bg-brand-saffron-50 text-brand-saffron-600">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Floor: {srv.floorRate}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{srv.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {srv.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {srv.skills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">Daily Guild Rota</p>
                        <p className="text-xs font-bold text-slate-900">{srv.dailyRate}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookingModalService(srv)}
                        className="px-3.5 py-1.5 rounded-lg bg-brand-navy-950 text-white hover:bg-slate-900 text-xs font-semibold transition-colors"
                      >
                        Book Dispatch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: NEARBY WORKERS & COOPERATIVES */}
      {activeTab === 'nearby' && (
        <div className="space-y-6">
          {/* Nearby Workers Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Nearby Verified Artisans in Your Zone
                </h2>
                <p className="text-xs text-slate-500">
                  Geo-fenced availability dispatched directly via fair opportunity rotation
                </p>
              </div>
              <div className="w-full sm:w-72">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  size="sm"
                  placeholder="Filter nearby workers..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkers.map((w) => (
                <div
                  key={w.id}
                  className="p-5 rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all bg-white flex flex-col justify-between shadow-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={w.avatar}
                      alt={w.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {w.name}
                        </h4>
                        <StatusBadge status={w.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{w.trade}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {w.cooperative}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {w.rating} ({w.totalReviews})
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">
                          {w.distance} ({w.travelTime})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{w.hourlyRate}/hr
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1">
                        (₹{w.dailyRate}/day)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingModalWorker(w)}
                      className="px-4 py-1.5 rounded-lg bg-brand-navy-950 text-white hover:bg-slate-900 text-xs font-semibold transition-colors"
                    >
                      Instant Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Registered Cooperatives */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Registered Worker Cooperatives in Pune Zone
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Democratically governed societies verified by State Cooperative Registrar
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_USER_NEARBY_COOPERATIVES.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <ShieldCheck className="w-3 h-3" />
                        {c.verifiedStamp}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {c.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-500">Reg: {c.regNumber}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      {c.distance}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>
                      President: <span className="font-medium text-slate-800">{c.president}</span>
                    </p>
                    <p>
                      Active Members Today:{' '}
                      <span className="font-semibold text-slate-900">{c.activeToday} artisans</span>
                    </p>
                    <p className="text-slate-500">{c.welfareCover}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ACTIVE BOOKINGS */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Active Bookings & Live Job Tracking
                </h2>
                <p className="text-xs text-slate-500">
                  Work commencement requires dynamic QR handshake; payments protected in smart escrow
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {MOCK_USER_ACTIVE_BOOKINGS.length} Active
              </span>
            </div>

            <div className="space-y-4">
              {MOCK_USER_ACTIVE_BOOKINGS.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all bg-white shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {b.id}
                        </span>
                        <StatusBadge status={b.status} size="sm" />
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {b.eta}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {b.serviceName}
                      </h3>
                      <p className="text-xs text-slate-500">{b.category}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Escrow Locked</p>
                        <p className="text-base font-bold text-slate-900">
                          ₹{b.escrowAmount}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQrModalBooking(b)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy-950 text-white text-xs font-semibold hover:bg-slate-900 transition-colors shadow-sm"
                      >
                        <QrCode className="w-4 h-4 text-brand-saffron-400" />
                        <span>Show QR / OTP</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Assigned Worker */}
                    <div className="flex items-center gap-3">
                      <img
                        src={b.workerAvatar}
                        alt={b.workerName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{b.workerName}</p>
                        <p className="text-slate-500 truncate">{b.workerTrade}</p>
                        <a
                          href={`tel:${b.workerPhone}`}
                          className="text-brand-saffron-600 font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          {b.workerPhone}
                        </a>
                      </div>
                    </div>

                    {/* Schedule & Location */}
                    <div>
                      <p className="text-slate-400 font-medium">Scheduled Time</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{b.scheduledTime}</p>
                      <p className="text-slate-500 truncate mt-0.5">{b.address}</p>
                    </div>

                    {/* Escrow Guarantee */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">Smart Escrow Guard</p>
                        <p className="text-[11px] text-slate-500">
                          Funds released only after you approve work completion.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BOOKING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">
                  Completed Work Orders & Invoices
                </h2>
                <p className="text-xs text-slate-500">
                  Historical archive of all services rendered with digital receipts & audits
                </p>
              </div>
            </div>

            <DataTable
              columns={historyColumns}
              data={MOCK_USER_BOOKING_HISTORY}
              keyField="id"
              emptyMessage="No past bookings found."
            />

            <Pagination
              currentPage={historyPage}
              totalPages={1}
              totalItems={MOCK_USER_BOOKING_HISTORY.length}
              pageSize={pageSize}
              onPageChange={setHistoryPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: PAYMENTS & ESCROW */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Sovereign Escrow Guarantee Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
                    Smart Escrow & Direct DBT Settlement
                  </span>
                </div>
                <h3 className="text-xl font-bold font-display mt-1">
                  100% Direct Payouts. Zero Middleman Commission.
                </h3>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
                  Unlike commercial gig apps charging 25-35% in hidden cuts, ShramSetu disburses
                  100% of customer payments directly to the worker's bank account via DBT.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                <div>
                  <p className="text-xs text-emerald-100">Escrow Locked</p>
                  <p className="text-xl font-bold font-display">₹{MOCK_USER_PROFILE.escrowLocked}</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-xs text-emerald-100">Platform Surcharge</p>
                  <p className="text-xl font-bold font-display text-emerald-300">₹0 (0%)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Transactions Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Payment & Escrow Transactions
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Verified banking records & smart contract releases
            </p>

            <DataTable
              columns={paymentColumns}
              data={MOCK_USER_PAYMENTS}
              keyField="txnId"
              emptyMessage="No payment transactions logged."
            />

            <Pagination
              currentPage={paymentsPage}
              totalPages={1}
              totalItems={MOCK_USER_PAYMENTS.length}
              pageSize={pageSize}
              onPageChange={setPaymentsPage}
            />
          </div>
        </div>
      )}

      {/* VIEW: RATINGS & REVIEWS */}
      {activeTab === 'ratings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1">
              Artisan Ratings & Guild Feedback
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Your feedback directly rewards skilled craftsmanship and upholds guild trust scores
            </p>

            <div className="space-y-4">
              {MOCK_USER_RATINGS.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {rev.workerName}
                        </h4>
                        <span className="text-xs text-slate-400">• {rev.trade}</span>
                      </div>
                      <p className="text-xs text-slate-500">{rev.service}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 mt-3 italic">
                    "{rev.comment}"
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {rev.tags.map((tg) => (
                      <span
                        key={tg}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        ✓ {tg}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 ml-auto self-center">
                      Reviewed on {rev.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: QR & OTP Handshake Modal */}
      <Modal
        isOpen={Boolean(qrModalBooking)}
        onClose={() => setQrModalBooking(null)}
        title="Encrypted Dynamic QR Handshake"
        subtitle={`Booking Ref: ${qrModalBooking?.id} • Service: ${qrModalBooking?.serviceName}`}
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setQrModalBooking(null)}
            className="px-4 py-2 rounded-xl bg-brand-navy-950 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Done
          </button>
        }
      >
        {qrModalBooking && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-slate-900 text-white rounded-2xl inline-block shadow-inner mx-auto">
              {/* Dynamic QR mockup */}
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-xl flex flex-col items-center justify-center border-4 border-amber-400">
                <QrCode className="w-36 h-36 text-slate-900" />
                <span className="text-[9px] font-mono text-slate-600 mt-1 truncate">
                  {qrModalBooking.qrToken}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
              <p className="text-xs font-bold uppercase tracking-wider">
                Or Share Arrival OTP with Worker:
              </p>
              <div className="mt-1 text-2xl font-mono font-extrabold tracking-widest text-slate-900">
                {qrModalBooking.otp}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              When artisan arrives at your doorstep, scan their Guild badge or share the OTP
              to verify identity and commence work safely.
            </p>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Instant Booking Modal */}
      <Modal
        isOpen={Boolean(bookingModalWorker || bookingModalService)}
        onClose={() => {
          setBookingModalWorker(null);
          setBookingModalService(null);
        }}
        title="Confirm Fair-Rota Service Booking"
        subtitle="Transparent floor pricing backed by cooperative society guarantee"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setBookingModalWorker(null);
                setBookingModalService(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const bookedItem = bookingModalWorker?.name || bookingModalService?.name;
                setBookingModalWorker(null);
                setBookingModalService(null);
                showToast(`Booking request raised for ${bookedItem}! Worker assigned via fair rota.`);
              }}
              className="px-5 py-2 rounded-xl bg-brand-saffron-500 hover:bg-brand-saffron-600 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Confirm & Lock Escrow
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Selected Item
            </p>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              {bookingModalWorker
                ? `${bookingModalWorker.name} (${bookingModalWorker.trade})`
                : bookingModalService?.name}
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Rate:{' '}
              <span className="font-semibold text-emerald-700">
                {bookingModalWorker
                  ? `₹${bookingModalWorker.hourlyRate}/hr`
                  : bookingModalService?.floorRate}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Location
            </label>
            <input
              type="text"
              readOnly
              value={MOCK_USER_PROFILE.address}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduled Date & Time Slot
            </label>
            <select className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-saffron-500">
              <option>Today, Slot 1 (03:00 PM - 05:00 PM)</option>
              <option>Today, Slot 2 (05:30 PM - 07:30 PM)</option>
              <option>Tomorrow, Slot 1 (09:00 AM - 11:00 AM)</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>
              Your ₹900 escrow deposit remains safe in an RBI-compliant escrow account until
              you confirm successful completion. 0% middleman fees deducted.
            </span>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Rating & Review Modal */}
      <Modal
        isOpen={Boolean(ratingModalBooking)}
        onClose={() => setRatingModalBooking(null)}
        title="Rate & Review Guild Craftsmanship"
        subtitle={`Booking: ${ratingModalBooking?.id} • ${ratingModalBooking?.workerName}`}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRatingModalBooking(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                showToast(`Review submitted for ${ratingModalBooking?.workerName}!`);
                setRatingModalBooking(null);
                setRatingFeedback('');
              }}
              className="px-5 py-2 rounded-xl bg-brand-navy-950 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
            >
              Submit Review
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-center py-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">Select Star Rating</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingScore
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-700 mt-1 block">
              {ratingScore === 5
                ? 'Outstanding Master Craftsmanship'
                : ratingScore === 4
                ? 'Very Good & Punctual'
                : 'Acceptable'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback & Comments
            </label>
            <textarea
              rows={3}
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              placeholder="Describe punctuality, quality of work, cleanliness, and professionalism..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-saffron-500"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

