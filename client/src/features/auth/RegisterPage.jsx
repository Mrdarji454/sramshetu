import React, { useState, useEffect, useRef } from 'react';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button';
import {
  User,
  Phone,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Loader2,
  Users,
  HardHat,
  Building2,
  CheckCircle2,
  Timer,
  Send,
  ShieldCheck,
  Copy,
  X,
} from 'lucide-react';
import { otpService } from '../../services/otp.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip all non-digit chars and return just digits */
const digitsOnly = (v) => v.replace(/\D/g, '');

/** Return true for a 10-digit Indian mobile (starts 6-9) */
const isValidPhone = (v) => /^[6-9]\d{9}$/.test(digitsOnly(v));

/** Normalise to E.164 style accepted by backend */
const normalisePhone = (v) => {
  const d = digitsOnly(v);
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith('91')) return `+${d}`;
  return d;
};

const RESEND_COOLDOWN = 30; // seconds

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RegisterPage() {
  const { register, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  // ── form fields ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'USER',
  });

  // ── OTP state ──────────────────────────────────────────────────────────────
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [debugOtp, setDebugOtp] = useState(''); // dev-mode hint

  // ── demo OTP toast (dev/demo only) ────────────────────────────────────────
  const [showDemoOtp, setShowDemoOtp] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);
  const demoOtpTimerRef = useRef(null);

  const countdownRef = useRef(null);

  // ── general form state ─────────────────────────────────────────────────────
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── cleanup timers on unmount ─────────────────────────────────────────────
  useEffect(() => () => {
    clearInterval(countdownRef.current);
    clearTimeout(demoOtpTimerRef.current);
  }, []);

  /** Hide the demo OTP toast and cancel its auto-hide timer */
  const dismissDemoToast = () => {
    clearTimeout(demoOtpTimerRef.current);
    setShowDemoOtp(false);
    setOtpCopied(false);
  };

  // ── role definitions ───────────────────────────────────────────────────────
  const roles = [
    { id: 'USER', label: 'Customer / Business', icon: Users, desc: 'Book verified artisans with escrow protection' },
    { id: 'WORKER', label: 'Worker / Shramik', icon: HardHat, desc: '100% direct payouts, zero middleman cut' },
    { id: 'COOPERATIVE', label: 'Cooperative Society', icon: Building2, desc: 'Manage member roster & welfare fund' },
  ];

  // ── derived validation ─────────────────────────────────────────────────────
  const phoneDigits = digitsOnly(formData.phone);
  const phoneOk = isValidPhone(formData.phone);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const nameOk = formData.name.trim().length >= 3;
  const passwordOk = formData.password.length >= 8;
  const canRegister = nameOk && emailOk && phoneOk && phoneVerified && passwordOk;

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
    clearError();

    // If phone is edited after OTP was sent/verified, reset OTP state
    if (name === 'phone') {
      setOtpSent(false);
      setOtpValue('');
      setPhoneVerified(false);
      setOtpError('');
      setDebugOtp('');
      setResendCountdown(0);
      clearInterval(countdownRef.current);
    }
  };

  const startCountdown = () => {
    setResendCountdown(RESEND_COOLDOWN);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setOtpError('');
    if (!phoneOk) {
      setOtpError('Enter a valid 10-digit Indian mobile number first.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await otpService.sendOtp(normalisePhone(formData.phone));
      setOtpSent(true);
      startCountdown();
      // Dev/demo mode: backend returns debugOtp — show it in a popup toast
      if (res?.debugOtp) {
        setDebugOtp(res.debugOtp);
        setShowDemoOtp(true);
        setOtpCopied(false);
        clearTimeout(demoOtpTimerRef.current);
        demoOtpTimerRef.current = setTimeout(dismissDemoToast, 10_000);
      }
    } catch (err) {
      setOtpError(err?.response?.data?.message || err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    if (otpValue.length !== 6) {
      setOtpError('Enter the 6-digit OTP sent to your number.');
      return;
    }
    setVerifyingOtp(true);
    try {
      await otpService.verifyOtp(normalisePhone(formData.phone), otpValue);
      setPhoneVerified(true);
      setOtpError('');
    } catch (err) {
      setOtpError(err?.response?.data?.message || err?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!nameOk) { setFormError('Full name must be at least 3 characters.'); return; }
    if (!emailOk) { setFormError('Please enter a valid email address.'); return; }
    if (!phoneOk) { setFormError('Please enter a valid 10-digit mobile number.'); return; }
    if (!phoneVerified) { setFormError('Please verify your mobile number via OTP before registering.'); return; }
    if (!passwordOk) { setFormError('Password must be at least 8 characters.'); return; }

    setIsSubmitting(true);
    try {
      const newUser = await register({
        name: formData.name.trim(),
        phone: normalisePhone(formData.phone),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });
      const targetPath = getRoleDashboardPath(newUser.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || authError;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-grid-pattern">
      <div className="gov-tricolor-stripe fixed top-0 left-0 right-0 z-50" />

      {/* ── Demo OTP Toast (dev/demo only) ─────────────────────────────── */}
      {import.meta.env.DEV && showDemoOtp && debugOtp && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-400 rounded-2xl px-4 py-3 shadow-2xl">
            {/* Badge */}
            <span className="flex-shrink-0 text-lg select-none">🛠</span>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">
                Demo Mode — OTP
              </p>
              <p className="font-mono text-2xl font-extrabold tracking-[0.3em] text-amber-900 leading-none">
                {debugOtp}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                Auto-hides in 10 s · never shown in production
              </p>
            </div>

            {/* Copy button */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(debugOtp).catch(() => {});
                setOtpCopied(true);
                setTimeout(() => setOtpCopied(false), 2000);
              }}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
              title="Copy OTP"
            >
              {otpCopied ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="text-[9px] font-bold">{otpCopied ? 'Copied!' : 'Copy'}</span>
            </button>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={dismissDemoToast}
              className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:text-amber-800 hover:bg-amber-200 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar (10-second countdown visual) */}
          <div className="mt-1 h-0.5 bg-amber-200 rounded-full overflow-hidden mx-1">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ animation: 'shrink-x 10s linear forwards' }}
            />
          </div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center mb-4">
          <Link to="/"><Logo size="lg" showTagline={true} /></Link>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-brand-navy-900 font-display">
          Create Your ShramSetu Account
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-600">
          Join India's cooperative-owned digital labour marketplace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl">

          {/* Error Banner */}
          {displayError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Role Picker ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = formData.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, role: r.id }))}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-brand-saffron-500 bg-brand-saffron-50/50 ring-2 ring-brand-saffron-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-brand-saffron-600' : 'text-slate-500'}`} />
                      <div>
                        <span className={`block text-xs font-bold ${isSelected ? 'text-brand-saffron-950' : 'text-slate-800'}`}>
                          {r.label.split('/')[0]}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{r.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Full Name ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name / Society Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rajeshwar Shinde"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* ── Phone Number ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={phoneVerified}
                    placeholder="+91 98201 44019"
                    maxLength={15}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white transition-colors ${
                      phoneVerified
                        ? 'border-green-400 bg-green-50/50 text-green-800'
                        : 'border-slate-200'
                    }`}
                  />
                  {phoneVerified && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Send / Resend OTP button */}
                {!phoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!phoneOk || sendingOtp || resendCountdown > 0}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border border-brand-saffron-500 bg-brand-saffron-50 text-brand-saffron-700 hover:bg-brand-saffron-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    {sendingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : resendCountdown > 0 ? (
                      <>
                        <Timer className="w-3.5 h-3.5" />
                        {resendCountdown}s
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {otpSent ? 'Resend' : 'Send OTP'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* ── OTP input row (visible after send) ── */}
              {otpSent && !phoneVerified && (
                <div className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => {
                      const v = digitsOnly(e.target.value).slice(0, 6);
                      setOtpValue(v);
                      setOtpError('');
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-medium tracking-widest focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpValue.length !== 6 || verifyingOtp}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border border-green-500 bg-green-50 text-green-700 hover:bg-green-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    {verifyingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verify
                      </>
                    )}
                  </button>
                </div>
              )}


              {/* OTP success badge */}
              {phoneVerified && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-green-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mobile number verified
                </p>
              )}

              {/* OTP error */}
              {otpError && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {otpError}
                </p>
              )}

              {/* Resend prompt */}
              {otpSent && !phoneVerified && resendCountdown === 0 && (
                <p className="mt-1 text-[10px] text-slate-500">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="text-brand-saffron-600 font-bold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </p>
              )}
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* ── Password ── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* ── Register Button ── */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!canRegister || isSubmitting}
                className="w-full py-3"
                icon={isSubmitting ? Loader2 : ArrowRight}
              >
                {isSubmitting ? 'Registering…' : `Join as ${formData.role}`}
              </Button>

              {/* Hint strip: shows which fields still need attention */}
              {!canRegister && (
                <p className="mt-2 text-[10px] text-center text-slate-400">
                  {!nameOk && 'Name · '}
                  {!emailOk && 'Email · '}
                  {!phoneVerified && 'Mobile OTP · '}
                  {!passwordOk && 'Password (8+ chars) · '}
                  required to continue
                </p>
              )}
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-saffron-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
