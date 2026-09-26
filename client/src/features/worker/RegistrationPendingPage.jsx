import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import workerService from '../../services/worker.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/common/Logo';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HardHat,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  LogOut,
  HelpCircle,
} from 'lucide-react';

export function RegistrationPendingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [statusInfo, setStatusInfo] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workerService.getRegistrationStatus();
      setStatusInfo(res);

      // If approved, redirect to worker dashboard
      if (res.registrationStatus === 'APPROVED') {
        navigate('/worker/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Failed to load registration status:', err);
      setError(err.message || 'Failed to retrieve application status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isApproved = statusInfo?.registrationStatus === 'APPROVED';
  const isRejected = statusInfo?.registrationStatus === 'REJECTED';
  const isPending = !isApproved && !isRejected;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative">
      <div className="gov-tricolor-stripe fixed top-0 left-0 right-0 z-50" />

      {/* Top Navigation */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200">
        <Link to="/">
          <Logo size="md" showTagline={false} />
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            disabled={loading}
            onClick={fetchStatus}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl w-full mx-auto my-8">
        <Card className="p-6 sm:p-10 bg-white border-slate-200 shadow-xl text-center">
          {isRejected ? (
            /* Rejected State */
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <AlertCircle className="w-9 h-9" />
              </div>
              <Badge variant="outline" size="md" className="border-red-300 text-red-700 bg-red-50 font-bold">
                Application Review Required
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Action Required on Your Application
              </h1>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                The state cooperative registrar reviewed your submission and requested adjustments.
              </p>

              {statusInfo?.rejectionReason && (
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 text-left text-xs text-red-900">
                  <span className="font-bold block mb-1">Registrar Remarks:</span>
                  <p className="font-medium">{statusInfo.rejectionReason}</p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/worker/onboarding')}
                >
                  Update & Resubmit Application
                </Button>
              </div>
            </div>
          ) : isApproved ? (
            /* Approved State */
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <Badge variant="verified" size="md">
                Application Approved
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Welcome to ShramSetu!
              </h1>
              <p className="text-sm text-slate-600">
                Your artisan verification has been approved. You are now active on the marketplace.
              </p>
              <div className="pt-4">
                <Button variant="primary" size="md" onClick={() => navigate('/worker/dashboard')}>
                  Enter Worker Dashboard
                </Button>
              </div>
            </div>
          ) : (
            /* Pending Approval State (Requirement 10) */
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Clock className="w-9 h-9" />
              </div>

              <div className="flex justify-center">
                <Badge variant="saffron" size="md" dot>
                  APPLICATION STATUS: PENDING
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy-900 font-display">
                Registration Submitted
              </h1>

              <p className="text-base font-semibold text-slate-700">
                Your profile is waiting for admin approval.
              </p>

              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                Please wait for admin verification. The cooperative society and district oversight board are reviewing your Aadhaar, Address Proof, and e-Shram credentials.
              </p>

              {/* Submitted Details Snapshot */}
              {statusInfo?.worker && (
                <div className="mt-6 pt-6 border-t border-slate-100 text-left bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Submitted Application Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-brand-saffron-600 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Worker Name</span>
                        <span className="font-bold">{statusInfo.worker.name || user?.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-brand-saffron-600 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Profession</span>
                        <span className="font-bold">
                          {statusInfo.worker.customProfession || statusInfo.worker.profession || 'Tradesperson'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-saffron-600 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Operational District</span>
                        <span className="font-bold">
                          {statusInfo.worker.address?.district || 'Pune'}, {statusInfo.worker.address?.state || 'Maharashtra'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">e-Shram Status</span>
                        <span className="font-bold text-emerald-700">Verified & Uploaded</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notice */}
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-left text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p>
                  To maintain marketplace trust and prevent unauthorized jobs, work dispatch is enabled only after government registry compliance review. Typical turnaround is within 24-48 business hours.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Support / Help Footer */}
      <div className="max-w-2xl w-full mx-auto text-center text-xs text-slate-500 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Need assistance? Contact support at <strong className="text-slate-700">support@shramsetu.in</strong></span>
        </div>
        <span>Toll-Free Helpline: <strong className="text-slate-700">1800-111-255</strong></span>
      </div>
    </div>
  );
}

export default RegistrationPendingPage;

