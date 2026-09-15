import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  QrCode, 
  PhoneCall, 
  AlertCircle,
  Truck,
  Wrench,
  UserCheck,
  Calendar
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// Milestone definitions for the booking lifecycle
export const BOOKING_STEPS = [
  { key: 'PENDING', label: 'Request Submitted', desc: 'Awaiting cooperative assignment', icon: Clock },
  { key: 'ASSIGNED', label: 'Artisan Assigned', desc: 'Cooperative assigned artisan', icon: UserCheck },
  { key: 'ACCEPTED', label: 'Artisan Confirmed', desc: 'Artisan accepted scheduled slot', icon: CheckCircle2 },
  { key: 'ON_THE_WAY', label: 'Artisan En Route', desc: 'Artisan traveling to location', icon: Truck },
  { key: 'IN_PROGRESS', label: 'Work In Progress', desc: 'Artisan arrived & executing work', icon: Wrench },
  { key: 'COMPLETED', label: 'Completed & Settled', desc: 'Work done & escrow released', icon: ShieldCheck },
];

export function getStatusStepIndex(status) {
  const norm = (status || '').toUpperCase();
  switch (norm) {
    case 'PENDING':
      return 0;
    case 'ASSIGNED':
      return 1;
    case 'ACCEPTED':
      return 2;
    case 'ON_THE_WAY':
      return 3;
    case 'IN_PROGRESS':
      return 4;
    case 'COMPLETED':
      return 5;
    case 'REJECTED':
      return 1; // Shows alert at assignment phase
    case 'CANCELLED':
      return -1;
    default:
      return 0;
  }
}

export function BookingStatusTracker({ 
  booking, 
  onCancel, 
  onViewQr,
  showWorkerContact = true,
  className = '' 
}) {
  if (!booking) return null;

  const currentStatus = (booking.status || 'PENDING').toUpperCase();
  const stepIndex = getStatusStepIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';
  const isRejected = currentStatus === 'REJECTED';
  const isCompleted = currentStatus === 'COMPLETED';

  // Can customer cancel?
  const canCancel = ['PENDING', 'ASSIGNED', 'ACCEPTED'].includes(currentStatus);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-slate-400">
              #{booking.id || booking._id?.slice(-8) || 'BOOKING'}
            </span>
            <Badge
              variant={
                isCompleted
                  ? 'verified'
                  : isCancelled
                  ? 'outline'
                  : isRejected
                  ? 'outline'
                  : currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_THE_WAY'
                  ? 'saffron'
                  : 'default'
              }
              size="sm"
            >
              {currentStatus}
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            {booking.serviceName || booking.service?.name || 'Skilled Service'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Trade: <strong className="text-slate-700">{booking.trade || 'General Artisan'}</strong> • Backed by{' '}
            <strong className="text-brand-navy-900">{booking.cooperativeName || booking.cooperative?.name || 'Pune Shramik Vikas Sahakari'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {booking.qrVerification?.otpCode && (
            <Button
              variant="outline"
              size="sm"
              icon={QrCode}
              onClick={() => onViewQr && onViewQr(booking)}
            >
              QR Pass & OTP: <strong className="ml-1 text-brand-saffron-600 font-mono">{booking.qrVerification.otpCode}</strong>
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onCancel(booking)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Rejection / Cancellation Notice */}
      {isRejected && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Artisan Declined Assignment</p>
            <p className="text-amber-800 mt-0.5">
              Reason: {booking.rejectionReason || 'Schedule conflict'}. The cooperative society dispatch manager has been alerted to reassign another available verified artisan.
            </p>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Booking Cancelled</p>
            <p className="text-red-700 mt-0.5">
              Reason: {booking.cancellation?.reason || 'Cancelled by user'}. Any held escrow funds will be fully reversed without penalty.
            </p>
          </div>
        </div>
      )}

      {/* Visual Stepper Progression */}
      {!isCancelled && (
        <div className="mt-6 mb-8">
          <div className="hidden md:flex items-center justify-between relative">
            {/* Connecting Bar */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
              <div 
                className="h-full bg-brand-saffron-500 transition-all duration-500" 
                style={{ width: `${Math.max(0, (stepIndex / (BOOKING_STEPS.length - 1)) * 100)}%` }}
              />
            </div>

            {BOOKING_STEPS.map((step, idx) => {
              const isDone = stepIndex > idx || isCompleted;
              const isCurrent = stepIndex === idx && !isCompleted;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center text-center z-10 w-28">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-saffron-500 text-white ring-4 ring-brand-saffron-100'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-bold mt-2.5 ${isCurrent ? 'text-brand-saffron-700' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Stepper View */}
          <div className="md:hidden space-y-3">
            {BOOKING_STEPS.map((step, idx) => {
              const isDone = stepIndex > idx || isCompleted;
              const isCurrent = stepIndex === idx && !isCompleted;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-saffron-500 text-white ring-2 ring-brand-saffron-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-brand-saffron-700' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Worker & Location Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
        {/* Assigned Worker Info */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Assigned Cooperative Artisan
          </span>
          {booking.worker || booking.workerName ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  {booking.workerName || booking.worker?.name || 'Rajeshwar Shinde'}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Trade: {booking.workerTrade || booking.trade || 'Master Electrician'}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  ★ {booking.worker?.rating?.average || '4.94'} • Aadhaar & NSDC Verified
                </span>
              </div>
              {showWorkerContact && (booking.workerPhone || booking.worker?.phone) && (
                <a
                  href={`tel:${booking.workerPhone || booking.worker?.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-brand-navy-900 hover:bg-slate-100 flex items-center gap-1.5 font-bold font-mono text-[11px]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-brand-saffron-600" />
                  <span>Call Artisan</span>
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 py-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Cooperative guild is reviewing artisan availability in your jurisdiction...</span>
            </div>
          )}
        </div>

        {/* Schedule & Location */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Service Schedule & Address
          </span>
          <div className="flex items-start gap-2 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Scheduled: <strong>{new Date(booking.scheduledTime?.start || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
          </div>
          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              {booking.location?.serviceAddress?.street}, {booking.location?.serviceAddress?.city} - {booking.location?.serviceAddress?.pincode}
              {booking.location?.serviceAddress?.landmark && ` (Landmark: ${booking.location.serviceAddress.landmark})`}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60 font-semibold">
            <span>Floor Rate Escrow:</span>
            <span className="text-emerald-700 font-bold">
              ₹{booking.price?.totalAmount || booking.escrowAmount || 900} (0% Middleman Cut)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingStatusTracker;

