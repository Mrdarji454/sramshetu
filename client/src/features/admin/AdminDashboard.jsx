import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/admin.service';
import { AdminVerificationManager } from './AdminVerificationManager';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Building2, 
  Users, 
  IndianRupee, 
  Activity,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { WorkloadPredictionCard } from '../../components/dashboard';

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 128450,
    totalCooperatives: 148,
    totalWorkers: 54280,
    totalBookings: 384120,
    fairnessIndex: '98.6%',
    dbtDisbursed: '₹18.6 Cr',
  });

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

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await adminService.getSystemStats();
        if (data) {
          setStats((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }
    }
    loadStats();
    // fetch initial prediction
    loadPrediction();
  }, []);

  return (
    <DashboardLayout
      title="National Platform Administration"
      subtitle="Sovereign infrastructure oversight, cooperative state registry compliance, and open AI audit trails."
      roleBadge="Gov-Tech Platform Admin"
    >
      {/* Platform Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cooperatives</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">
            {stats.totalCooperatives} Guilds
          </div>
          <p className="text-xs text-slate-500 mt-1">Across 18 States & UTs</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">
            {typeof stats.totalWorkers === 'number' ? stats.totalWorkers.toLocaleString() : stats.totalWorkers}
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">100% e-KYC Verified</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disbursed (DBT)</span>
            <IndianRupee className="w-4 h-4 text-brand-saffron-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">
            {stats.dbtDisbursed || '₹18.6 Cr'}
          </div>
          <p className="text-xs text-slate-500 mt-1">0% platform commission cut</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Latency</span>
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-display">14.2 ms</div>
          <p className="text-xs text-slate-500 mt-1">Fairness Score: {stats.fairnessIndex || '98.6%'}</p>
        </Card>
      </div>

      {/* AI Workload Prediction Card */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <WorkloadPredictionCard
              prediction={prediction}
              loading={aiLoading}
              error={aiError}
              onRefresh={loadPrediction}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Live Admin Verification Review System */}
      <AdminVerificationManager />
    </DashboardLayout>
  );
}

export default AdminDashboard;
