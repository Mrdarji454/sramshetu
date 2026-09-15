import React from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Lock, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Building2, 
  Users, 
  IndianRupee,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();

  const auditQueues = [
    { societyName: 'North Delhi Electrical Guild', regNo: 'DL-DEL-COOP-9901', state: 'Delhi', workers: 412, status: 'Pending Registrar Verification' },
    { societyName: 'Surat Diamond & Industrial Shramik', regNo: 'GJ-SRT-COOP-3312', state: 'Gujarat', workers: 890, status: 'Aadhaar Batch Audit Active' },
    { societyName: 'Bengaluru Masonry & Tile Council', regNo: 'KA-BLR-COOP-5521', state: 'Karnataka', workers: 640, status: 'Bylaw Compliance Verified' },
  ];

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
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">148 Guilds</div>
          <p className="text-xs text-slate-500 mt-1">Across 18 States & UTs</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">54,280</div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">100% e-KYC Verified</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disbursed (DBT)</span>
            <IndianRupee className="w-4 h-4 text-brand-saffron-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">₹18.6 Cr</div>
          <p className="text-xs text-slate-500 mt-1">0% platform commission cut</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Latency</span>
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-display">14.2 ms</div>
          <p className="text-xs text-slate-500 mt-1">Fairness Score: 98.6%</p>
        </Card>
      </div>

      {/* Audit Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cooperative Society Registration & Audit Queue</h3>
            <p className="text-xs text-slate-500">Statutory audits under State Registrar of Cooperatives</p>
          </div>
          <Badge variant="gov" size="sm">SIH 2026 Moderation</Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {auditQueues.map((item, idx) => (
            <div key={idx} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{item.societyName}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Reg No: {item.regNo} • State: {item.state} • Roster: {item.workers} workers
                </p>
                <div className="mt-2">
                  <Badge variant={item.status.includes('Verified') ? 'verified' : 'saffron'} size="sm">
                    {item.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Review Bylaws
                </Button>
                <Button variant="primary" size="sm">
                  Approve Registry
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
