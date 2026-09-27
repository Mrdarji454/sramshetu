import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { NotificationItems } from '../../components/common/NotificationBell';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';

export function NotificationsPage() {
  const { user } = useAuth();
  const { revision, identity, markRead, markAll, unreadCount } = useNotifications();
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ notifications: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    apiClient.get('/notifications', { params: { filter, page, limit: 20 } }).then(response => {
      if (active) {
        setResult({ ...response.data, identity });
        if (page > 1 && !response.data.notifications.length) setPage(page - 1);
      }
    }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, page, revision, identity, retry]);
  const run = async action => {
    setBusy(true); setError('');
    try { await action(); setRetry(value => value + 1); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <DashboardLayout title="Notifications" subtitle="Your bookings, payments, and verification updates.">
    <Link to={getRoleDashboardPath(user.role)} className="text-sm text-brand-navy-900 hover:underline">Back to dashboard</Link>
    <section className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 flex flex-wrap justify-between items-center gap-3 border-b border-slate-100">
        <div className="flex flex-wrap gap-2" aria-label="Notification filters">
          {['All', 'Unread', 'Booking', 'Payment', 'Verification'].map(value => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${value === filter ? 'bg-brand-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{value}</button>)}
        </div>
        <button disabled={busy || !unreadCount} onClick={() => run(markAll)} className="text-sm font-semibold text-brand-saffron-700 disabled:opacity-50">Mark all as read</button>
      </div>
      {error && <p role="alert" className="p-4 text-sm text-red-700">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
      {loading || result.identity !== identity ? <p className="p-8 text-sm text-slate-500" role="status">{error ? 'Notifications unavailable.' : 'Loading notifications…'}</p> : !result.notifications.length ? <p className="p-8 text-sm text-slate-500">No notifications in this filter.</p> : <NotificationItems notifications={result.notifications} markRead={id => run(() => markRead(id))} busy={busy} />}
      <div className="p-4 flex justify-between items-center border-t border-slate-100 text-sm">
        <button disabled={page === 1 || loading} onClick={() => setPage(page - 1)} className="disabled:opacity-40">Previous</button>
        <span>Page {page} of {Math.max(1, Math.ceil(result.total / 20))}</span>
        <button disabled={page * 20 >= result.total || loading} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Next</button>
      </div>
    </section>
  </DashboardLayout>;
}
