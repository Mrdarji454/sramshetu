import React from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
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
  FileSpreadsheet
} from 'lucide-react';

export function CooperativeDashboard() {
  const { user } = useAuth();

  const members = [
    { name: 'Rajeshwar Shinde', trade: 'Master Electrician', status: 'busy', jobsCompleted: 462, rating: 4.94, earnings: '₹48,200' },
    { name: 'Santosh Waghmare', trade: '3-Phase Substation Tech', status: 'available', jobsCompleted: 310, rating: 4.88, earnings: '₹34,500' },
    { name: 'Dattatray Pawar', trade: 'Industrial Wireman', status: 'available', jobsCompleted: 198, rating: 4.91, earnings: '₹22,100' },
    { name: 'Kishore Jadhav', trade: 'Solar Inverter Specialist', status: 'on_leave', jobsCompleted: 245, rating: 4.85, earnings: '₹29,800' },
  ];

  return (
    <DashboardLayout
      title={`Cooperative Guild Portal: ${user?.name || 'Society Office'}`}
      subtitle="Democratically oversee member artisans, manage welfare fund pools, and audit AI opportunity allocation."
      roleBadge="State Cooperative Registered"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Artisans</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">4,280</div>
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
            <Button variant="primary" size="sm" icon={UserPlus}>
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
                <th className="p-4">Status</th>
                <th className="p-4">Completed Jobs</th>
                <th className="p-4">Rating</th>
                <th className="p-4">30-Day Earnings</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">{m.name}</td>
                  <td className="p-4 text-slate-600">{m.trade}</td>
                  <td className="p-4">
                    <Badge
                      variant={m.status === 'available' ? 'verified' : m.status === 'busy' ? 'saffron' : 'default'}
                      size="sm"
                      dot
                    >
                      {m.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{m.jobsCompleted} orders</td>
                  <td className="p-4 text-amber-600 font-bold">★ {m.rating}</td>
                  <td className="p-4 font-bold text-emerald-700">{m.earnings}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="text-brand-saffron-600">
                      Audit Rota
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CooperativeDashboard;
