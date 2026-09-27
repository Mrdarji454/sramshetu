import React, { useEffect, useId, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

export function NotificationItems({ notifications, markRead, busy }) {
  return <ul className="divide-y divide-slate-100">
    {notifications.map(item => <li key={item._id} className={`p-4 ${item.isRead ? 'bg-white' : 'bg-amber-50/60'}`}>
      <p className="text-sm font-semibold text-slate-900 break-words">{item.title}</p>
      <p className="mt-1 text-xs text-slate-600 break-words">{item.message}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <time className="text-slate-400" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
        {!item.isRead && <button disabled={busy} onClick={() => markRead(item._id)} className="font-semibold text-brand-saffron-700 hover:underline disabled:opacity-50">Mark as read</button>}
      </div>
    </li>)}
  </ul>;
}

export function NotificationBell() {
  const { notifications, unreadCount, error, loading, refresh, markRead, markAll, identity } = useNotifications();
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const root = useRef(null);
  const button = useRef(null);
  const id = useId();
  useEffect(() => { setOpen(false); setActionError(''); }, [identity]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const run = async action => {
    setBusy(true); setActionError('');
    try { await action(); } catch (err) { setActionError(err.message); } finally { setBusy(false); }
  };
  return <div ref={root} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={button} type="button" onClick={() => { setOpen(!open); if (!open) refresh(); }} aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={open} aria-controls={id} className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && <span aria-live="polite" className="absolute -top-2 -right-2 min-w-5 px-1 rounded-full bg-brand-saffron-500 text-white text-[10px] font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <section id={id} aria-label="Recent notifications" className="fixed left-3 right-3 sm:left-auto sm:right-auto sm:absolute sm:w-96 sm:translate-x-[-90%] mt-3 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-brand-navy-900">Notifications</h2>
        <button disabled={busy || !unreadCount} onClick={() => run(markAll)} className="text-xs text-brand-saffron-700 disabled:opacity-50">Mark all as read</button>
      </div>
      {(error || actionError) && <div role="alert" className="p-3 text-xs text-red-700">{actionError || error} <button onClick={refresh} className="underline">Retry</button></div>}
      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? <p className="p-4 text-sm text-slate-500">Loading notifications…</p> : !notifications.length && !error ? <p className="p-4 text-sm text-slate-500">No notifications yet.</p> : <NotificationItems notifications={notifications} markRead={id => run(() => markRead(id))} busy={busy} />}
      </div>
      <Link to="/notifications" onClick={() => setOpen(false)} className="block p-3 text-center text-sm font-semibold text-brand-navy-900 border-t border-slate-100 hover:bg-slate-50">View all notifications</Link>
    </section>}
  </div>;
}
