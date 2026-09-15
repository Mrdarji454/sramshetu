import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/booking.service';
import { BookingWizardModal } from '../bookings/BookingWizardModal';
import { BookingStatusTracker } from '../bookings/BookingStatusTracker';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  PlusCircle, 
  IndianRupee, 
  QrCode,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBookingForQr, setSelectedBookingForQr] = useState(null);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await bookingService.getBookings();
      if (Array.isArray(data)) {
        setBookings(data);
        // Automatically expand the first active booking if present
        const activeOne = data.find((b) => !['COMPLETED', 'CANCELLED'].includes((b.status || '').toUpperCase()));
        if (activeOne) {
          setExpandedBookingId(activeOne.id || activeOne._id);
        }
      }
    } catch (err) {
      console.error('Error fetching customer bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (booking) => {
    const reason = window.prompt('Please enter a cancellation reason:');
    if (!reason) return;

    try {
      const bookingId = booking.id || booking._id;
      await bookingService.updateStatus(bookingId, 'CANCELLED', { note: reason });
      setFeedbackMsg(`Booking #${bookingId} was successfully cancelled.`);
      loadBookings();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const handleBookingCreated = (newBooking) => {
    setFeedbackMsg(`Booking #${newBooking.id || newBooking._id?.slice(-6)} created successfully!`);
    loadBookings();
    setBookingModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Stats
  const activeCount = bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes((b.status || '').toUpperCase())).length;
  const escrowHeld = bookings
    .filter((b) => !['COMPLETED', 'CANCELLED'].includes((b.status || '').toUpperCase()))
    .reduce((sum, b) => sum + (b.price?.totalAmount || b.escrowAmount || 0), 0);
  const savings = Math.round(escrowHeld * 0.3); // 30% aggregator fee cut avoided

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name || 'Customer'}`}
      subtitle="Manage your active service bookings, track live artisans, and review smart escrow payments."
      roleBadge="Customer Account"
    >
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Card className="p-5 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Bookings</span>
            <Badge variant={activeCount > 0 ? 'saffron' : 'default'} size="sm">
              {activeCount} {activeCount === 1 ? 'Job Active' : 'Jobs Active'}
            </Badge>
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">{activeCount}</div>
          <p className="text-xs text-slate-500 mt-1">Regulated through registered worker cooperatives</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Escrow Protected</span>
            <Badge variant="verified" size="sm">100% Secure</Badge>
          </div>
          <div className="text-2xl font-extrabold text-brand-navy-900 font-display">₹{escrowHeld.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">Released solely on QR handshake confirmation</p>
        </Card>

        <Card className="p-5 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Middleman Cuts Saved</span>
            <Badge variant="gov" size="sm">0% Platform Cut</Badge>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-display">₹{savings.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">Saved versus 25-35% private gig platform fees</p>
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
        <Button 
          variant="primary" 
          size="md" 
          icon={PlusCircle}
          onClick={() => setBookingModalOpen(true)}
        >
          Book a Service Now
        </Button>
      </div>

      {/* Active & Historical Bookings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Booking History & Live Tracker</h3>
            <p className="text-xs text-slate-500">Track stage-by-stage progression from cooperative dispatch to final completion</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={isLoading}
              onClick={loadBookings}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => setBookingModalOpen(true)}
            >
              New Booking
            </Button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Service Bookings Yet</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Book skilled electricians, plumbers, masons, and carpenters at transparent government-approved floor wages.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-2"
              onClick={() => setBookingModalOpen(true)}
            >
              Create Your First Booking
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((b) => {
              const bookingId = b.id || b._id;
              const isExpanded = expandedBookingId === bookingId;
              const status = (b.status || 'PENDING').toUpperCase();
              const isCompleted = status === 'COMPLETED';

              return (
                <div key={bookingId} className="transition-colors hover:bg-slate-50/50">
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {b.serviceName || 'Skilled Service'}
                        </span>
                        <Badge
                          variant={
                            isCompleted
                              ? 'verified'
                              : status === 'CANCELLED'
                              ? 'outline'
                              : status === 'IN_PROGRESS' || status === 'ON_THE_WAY'
                              ? 'saffron'
                              : 'default'
                          }
                          size="sm"
                        >
                          {status}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">
                          #{bookingId?.slice(-6) || bookingId}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        Assigned Artisan:{' '}
                        <strong className="text-slate-800">
                          {b.workerName || b.worker?.name || 'Awaiting cooperative assignment'}
                        </strong>{' '}
                        • Society: {b.cooperativeName || b.cooperative?.name || 'Pune Shramik Vikas Sahakari'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />{' '}
                          {new Date(b.scheduledTime?.start || Date.now()).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />{' '}
                          {b.location?.serviceAddress?.city || 'Pune'} ({b.location?.serviceAddress?.pincode || '411001'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between lg:justify-end">
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 block">
                          ₹{b.price?.totalAmount || b.escrowAmount || 900}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          {isCompleted ? 'DBT Settlement Paid' : 'Escrow Secured'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.qrVerification?.otpCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={QrCode}
                            onClick={() => setSelectedBookingForQr(b)}
                          >
                            QR Pass
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={isExpanded ? ChevronUp : ChevronDown}
                          onClick={() => setExpandedBookingId(isExpanded ? null : bookingId)}
                        >
                          {isExpanded ? 'Hide Tracker' : 'Track Status'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Live Progression Tracker */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-1 bg-slate-50/70 border-t border-slate-100">
                      <BookingStatusTracker
                        booking={b}
                        onCancel={handleCancelBooking}
                        onViewQr={() => setSelectedBookingForQr(b)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Wizard Modal */}
      <BookingWizardModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onBookingCreated={handleBookingCreated}
      />

      {/* Handshake QR & OTP Modal */}
      {selectedBookingForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedBookingForQr(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6 text-brand-saffron-600" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Digital Handshake Pass</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Show this QR pass or 4-digit code to the artisan when work is satisfactorily completed to authorize escrow release.
            </p>

            {/* OTP Code Display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                4-Digit Handshake OTP
              </span>
              <span className="text-3xl font-extrabold font-mono tracking-widest text-brand-navy-900 block">
                {selectedBookingForQr.qrVerification?.otpCode || '4921'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Token: {selectedBookingForQr.qrVerification?.token || 'QR-SS-8801'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-950 text-[11px] font-medium border border-emerald-200 mb-4">
              🔒 Escrow of ₹{selectedBookingForQr.price?.totalAmount || 900} will be instantly credited to the artisan's verified bank account via direct DBT upon verification.
            </div>

            <Button variant="primary" size="md" className="w-full" onClick={() => setSelectedBookingForQr(null)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default UserDashboard;
