import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import cooperativeService from '../../services/cooperative.service';
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
  Plus
} from 'lucide-react';

export function CooperativeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'onboarding'
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick enroll modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollData, setEnrollData] = useState({
    name: '',
    phone: '',
    trade: 'Electrical & Power Systems',
    dailyFloorRate: 1200,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profData, verData, membersData] = await Promise.allSettled([
        cooperativeService.getProfile(),
        cooperativeService.getVerificationStatus(),
        cooperativeService.getMembers(),
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
    } catch (err) {
      console.error('Error loading cooperative dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollData.name.trim()) return;

    try {
      const newMember = await cooperativeService.addMember(enrollData);
      setMembers((prev) => [newMember, ...prev]);
      setEnrollModalOpen(false);
      setEnrollData({ name: '', phone: '', trade: 'Electrical & Power Systems', dailyFloorRate: 1200 });
    } catch (err) {
      alert('Failed to enroll member: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await cooperativeService.removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId && m._id !== memberId));
    } catch (err) {
      alert('Failed to remove member: ' + err.message);
    }
  };

  const isVerified = verification?.status === 'verified';
  const isRejected = verification?.status === 'rejected';

  return (
    <DashboardLayout
      title={`Cooperative Guild Portal: ${profile?.name || user?.name || 'Society Office'}`}
      subtitle="Democratically oversee member artisans, manage welfare fund pools, and audit AI opportunity allocation."
      roleBadge={isVerified ? 'State Cooperative Registered' : 'Registration Pending'}
    >
      {/* Top View Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'roster'
                ? 'bg-brand-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Artisan Roster & Dispatches
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
            <span>Society Bylaws & Onboarding</span>
            {verification && (
              <span
                className={`w-2 h-2 rounded-full ${
                  isVerified ? 'bg-emerald-400' : isRejected ? 'bg-red-400' : 'bg-indigo-400'
                }`}
              />
            )}
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
            {isRejected ? 'Edit Registration' : 'View Checklist'}
          </Button>
        </div>
      )}

      {/* TAB 1: ROSTER & OVERVIEW */}
      {activeTab === 'roster' && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Artisans</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy-900 font-display">
                {members.length || 4280}
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
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Dispatches</span>
                <Clock className="w-4 h-4 text-brand-saffron-600" />
              </div>
              <div className="text-2xl font-extrabold text-brand-saffron-600 font-display">312</div>
              <p className="text-xs text-slate-500 mt-1">Real-time fair rotation</p>
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

      {/* TAB 2: ONBOARDING WIZARD */}
      {activeTab === 'onboarding' && (
        <CooperativeOnboardingWizard
          onComplete={() => {
            loadData();
            setActiveTab('roster');
          }}
        />
      )}

      {/* Enroll Worker Modal */}
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
