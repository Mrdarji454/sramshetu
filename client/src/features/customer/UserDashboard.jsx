import React from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Search, 
  PlusCircle, 
  FileText,
  IndianRupee,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function UserDashboard() {
  const { user } = useAuth();

  const mockBookings = [
    {
      id: 'BK-2026-8801',
      service: '3-Phase Concealed Wiring Inspection',
      workerName: 'Rajeshwar Shinde',
      cooperative: 'Pune Shramik Vikas Sahakari',
      scheduledDate: 'Tomorrow, 10:00 AM',
      location: 'Kothrud, Pune',
      status: 'assigned',
      amount: '₹900',
      paymentStatus: 'Escrow Locked',
    },
    {
      id: 'BK-2026-7412',
      service: 'High Pressure Water Pump Installation',
      workerName: 'Lakshmi Narayanan',
      cooperative: 'Tamil Nadu Thozhilalar Guild',
      scheduledDate: '10 Sep 2026',
      location: 'Anna Nagar, Chennai',
      status: 'completed',
      amount: '₹800',
      paymentStatus: 'Released via DBT',
    },
  ];

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name || 'Customer'}`}
      subtitle="Manage your active service bookings, track live artisans, and review smart escrow payments."
      roleBadge="Customer Account"
    >
      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Bookings</span>
            <Badge variant="verified" size="sm">1 in progress</Badge>
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">1</div>
          <p className="text-xs text-slate-500 mt-1">Artisan assigned via fair AI allocation</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Escrow Security</span>
            <Badge variant="saffron" size="sm">100% Protected</Badge>
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">₹900</div>
          <p className="text-xs text-slate-500 mt-1">Held securely; releases on QR handshake</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Middleman Cuts Saved</span>
            <Badge variant="gov" size="sm">0% Platform Cut</Badge>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-display">₹270</div>
          <p className="text-xs text-slate-500 mt-1">Compared to 30% aggregator commissions</p>
        </Card>
      </div>

      {/* Action Banner */}
      <div className="rounded-2xl bg-brand-navy-900 text-white p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div>
          <Badge variant="saffron" size="sm" className="mb-2">Need Skilled Work Done?</Badge>
          <h3 className="text-xl font-bold font-display">Book an Aadhaar & Skill India Certified Artisan</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Choose from 24+ trades with transparent floor wages, backing by registered worker cooperatives, and direct digital escrow.
          </p>
        </div>
        <Link to="/#services">
          <Button variant="primary" size="md" icon={PlusCircle} iconRight={ArrowRight}>
            Browse Services
          </Button>
        </Link>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Booking History</h3>
            <p className="text-xs text-slate-500">Live status of your work requests and QR verification passes</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {mockBookings.map((b) => (
            <div key={b.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">{b.service}</span>
                  <Badge variant={b.status === 'completed' ? 'verified' : 'saffron'} size="sm">
                    {b.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  Worker: <strong className="text-slate-800">{b.workerName}</strong> ({b.cooperative})
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {b.scheduledDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {b.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between lg:justify-end">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">{b.amount}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">{b.paymentStatus}</span>
                </div>
                <Button variant="outline" size="sm">
                  View QR Pass
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UserDashboard;
