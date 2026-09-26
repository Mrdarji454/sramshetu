import React, { useId, useState } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { POPULAR_PROFESSIONS } from '../../utils/tradeUtils';

const storageKey = 'shramsetu:recent-services';
function recentSearches() {
  try { const values = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(values) ? values.filter(v => typeof v === 'string').slice(0, 5) : []; } catch { return []; }
}
export function ServiceSearch({ value, onChange, onSearch }) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(recentSearches);
  const id = useId();
  const popular = POPULAR_PROFESSIONS.map(p => p.shortName);
  const suggestions = value.trim() ? popular.filter(name => name.toLowerCase().includes(value.toLowerCase())).slice(0, 6) : popular.slice(0, 5);
  const search = text => {
    const clean = text.trim();
    if (!clean) return;
    const next = [clean, ...recent.filter(item => item !== clean)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Private mode */ }
    onChange(clean);
    setOpen(false);
    onSearch(clean);
  };
  return <div className="relative w-full" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm focus-within:ring-2 focus-within:ring-orange-400">
      <Search className="h-5 w-5 text-orange-600 shrink-0" />
      <input aria-label="Search services or custom professions" aria-expanded={open} aria-controls={id} value={value} onFocus={() => setOpen(true)} onChange={e => { onChange(e.target.value); setOpen(true); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(value); } if (e.key === 'Escape') setOpen(false); }} placeholder="Plumber, Electrician, AC Repair…" className="w-full min-w-0 bg-transparent py-2 outline-none text-sm sm:text-base" />
      <button type="button" onClick={() => search(value)} className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white">Search</button>
    </div>
    {open && <div id={id} className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xl text-sm">
      <p className="mb-2 flex items-center gap-2 font-semibold text-slate-500"><TrendingUp size={14} />{value ? 'Suggestions' : 'Popular searches'}</p>
      <div className="flex flex-wrap gap-2">{suggestions.map(name => <button type="button" key={name} onClick={() => search(name)} className="rounded-xl bg-orange-50 px-3 py-2 text-orange-800">{name}</button>)}
        {value.trim() && <button type="button" onClick={() => search(value)} className="rounded-xl bg-slate-100 px-3 py-2">Search “{value}”</button>}</div>
      {!!recent.length && <><p className="mt-4 mb-2 flex items-center gap-2 font-semibold text-slate-500"><Clock size={14} />Recent searches</p><div className="flex flex-wrap gap-2">{recent.map(name => <button type="button" key={name} onClick={() => search(name)} className="rounded-xl border px-3 py-2">{name}</button>)}</div></>}
    </div>}
  </div>;
}
