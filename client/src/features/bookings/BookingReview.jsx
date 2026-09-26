import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { bookingService } from '../../services/booking.service';
const tags = ['On Time', 'Skilled', 'Professional', 'Affordable', 'Friendly'];
function Stars({ label, value, onChange }) {
  return <fieldset><legend className="mb-2 text-sm font-semibold">{label}</legend><div className="flex gap-2">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={`${label}: ${n} stars`} aria-pressed={value === n} onClick={() => onChange(n)} className="rounded-lg p-2 focus:ring-2 focus:ring-orange-500"><Star className={n <= value ? 'fill-amber-400 text-amber-500' : 'text-slate-300'} /></button>)}</div></fieldset>;
}
export function BookingReview({ booking }) {
  const [rating, setRating] = useState(0), [cooperativeRating, setCooperativeRating] = useState(0);
  const [feedback, setFeedback] = useState(''), [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(false), [busy, setBusy] = useState(true), [error, setError] = useState('');
  const id = booking._id || booking.id;
  useEffect(() => { let active = true; bookingService.getReview(id).then(review => { if (active) setSaved(Boolean(review)); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); }); return () => { active = false; }; }, [id]);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await bookingService.submitReview({ bookingId: id, rating, cooperativeRating: cooperativeRating || undefined, feedback, tags: selected }); setSaved(true); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  if (saved) return <p role="status" className="my-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">Thank you. Your review has been saved.</p>;
  return <form onSubmit={submit} className="my-5 rounded-2xl border border-slate-200 p-5 space-y-4"><h4 className="font-bold text-lg">How was your service?</h4>
    <Stars label="Rate your artisan" value={rating} onChange={setRating} />
    {booking.cooperative && <Stars label="Rate the cooperative (optional)" value={cooperativeRating} onChange={setCooperativeRating} />}
    <label className="block text-sm font-semibold">Feedback<textarea value={feedback} onChange={e => setFeedback(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder="Tell us about your experience" /></label>
    <div className="flex flex-wrap gap-2">{tags.map(tag => <button type="button" key={tag} aria-pressed={selected.includes(tag)} onClick={() => setSelected(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} className={`rounded-full border px-3 py-2 text-xs ${selected.includes(tag) ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-200'}`}>{tag}</button>)}</div>
    <button disabled={busy || !rating} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Please wait…' : 'Submit review'}</button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </form>;
}
