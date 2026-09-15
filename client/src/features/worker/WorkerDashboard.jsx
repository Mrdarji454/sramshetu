import React, { useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  HardHat, 
  QrCode, 
  IndianRupee, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Power,
  Sparkles,
  PhoneCall
} from 'lucide-react';

export function WorkerDashboard() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);

  const activeJob = {
    id: 'BK-2026-8801',
    customer: 'Aakash Sharma',
    service: '3-Phase Concealed Wiring Inspection',
    address: 'Flat 402, Green Meadows, Kothrud, Pune',
    pincode: '411038',
    scheduledTime: 'Today, 02:30 PM',
    rateGuaranteed: '₹480 / hr (Min ₹960 for 2 hrs)',
    status: 'assigned',
    clientPhone: '+91 98201 44520',
  };

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || 'Shramik'}`}
      subtitle="Your work is backed by your cooperative guild. 100% direct payouts with zero platform deductions."
      roleBadge="NSDC Level 4 Artisan"
    >
      {/* Availability Status Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Dispatch Status: {isAvailable ? 'Available for New Jobs' : 'Offline / On Break'}
              </span>
              <Badge variant={isAvailable ? 'verified' : 'default'} size="sm">
                {isAvailable ? 'In Active Rota' : 'Standby'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              XGBoost AI Allocation will include you in proximity dispatches across a 15 km radius.
            </p>
          </div>
        </div>

        <Button
          variant={isAvailable ? 'outline' : 'primary'}
          size="sm"
          icon={Power}
          onClick={() => setIsAvailable(!isAvailable)}
        >
          {isAvailable ? 'Go Offline' : 'Go Online'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weekly Earnings</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">₹11,400</div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">100% Credited to Bank (0% Fee)</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guaranteed Floor Wage</span>
            <ShieldCheck className="w-4 h-4 text-brand-saffron-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">₹1,300 / day</div>
          <p className="text-xs text-slate-500 mt-1">Pune Shramik Guild Statutory Rate</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guild Welfare Cover</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 font-display">₹5,00,000</div>
          <p className="text-xs text-slate-500 mt-1">Family Medical & Tool Protection</p>
        </Card>
      </div>

      {/* Active Assigned Job Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Current Assigned Work Order</h3>
              <Badge variant="saffron" size="sm">Urgent Dispatch</Badge>
            </div>
            <p className="text-xs text-slate-500">Order ID: {activeJob.id} • Escrow Guaranteed</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-lg font-extrabold text-brand-navy-900">{activeJob.service}</h4>
              <p className="text-xs text-slate-600">
                Customer: <strong className="text-slate-800">{activeJob.customer}</strong>
              </p>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{activeJob.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{activeJob.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">{activeJob.rateGuaranteed}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button variant="outline" size="sm" icon={PhoneCall}>
                  Call Client: {activeJob.clientPhone}
                </Button>
              </div>
            </div>

            {/* Dynamic QR Handshake Visual */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center text-center">
              <div className="p-2 bg-white rounded-xl mb-3">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>
              <span className="text-xs font-bold text-emerald-400">Dynamic Handshake QR</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Have the client scan this upon arrival to start your guaranteed escrow timer
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default WorkerDashboard;
