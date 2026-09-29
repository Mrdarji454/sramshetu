import React, { useEffect, useState } from 'react';
import { bookingService } from '../../services/booking.service';

export function WorkVerificationPanel({ booking }) {
  const [otp, setOtp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const stage = ['ON_THE_WAY', 'ARRIVED'].includes(booking.status?.toUpperCase()) ? 'start' : 'end';
  useEffect(() => { setOtp(null); setError(''); }, [booking._id || booking.id, stage]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const seconds = otp ? Math.max(0, Math.ceil((new Date(otp.expiresAt).getTime() - now) / 1000)) : 0;
  const issue = async () => {
    setBusy(true); setError('');
    try { setOtp(await bookingService.issueOtp(booking._id || booking.id, stage)); setNow(Date.now()); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <section className="my-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-3">
    <h4 className="font-bold">{stage === 'start' ? 'Confirm artisan arrival' : 'Confirm completed work'}</h4>
    <p className="text-sm text-slate-600">{stage === 'start' ? 'Generate a code when your artisan arrives. Share it with them to start work.' : 'After checking the work, generate a new code and share it with your artisan. Successful verification completes the booking and unlocks payment.'}</p>
    {otp && seconds > 0 && <div role="status"><strong className="text-3xl tracking-widest font-mono text-orange-800">{otp.code}</strong><p className="mt-1 text-xs">Expires in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}. One-time use.</p></div>}
    {otp && !seconds && <p role="status" className="text-sm">Code expired. Generate a new code.</p>}
    <button type="button" disabled={busy} onClick={issue} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Generating…' : otp ? 'Generate new code' : 'Generate customer code'}</button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
