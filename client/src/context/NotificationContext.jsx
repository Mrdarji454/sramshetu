import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import apiClient from '../lib/apiClient';
import { useAuth } from './AuthContext';

const Context = createContext(null);
export function NotificationProvider({ children }) {
  const { user, token, isLoading } = useAuth();
  const [state, setState] = useState({ notifications: [], unreadCount: 0, error: '', loading: true });
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const identity = `${user?._id || user?.id || ''}:${token || ''}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const refresh = useCallback(async () => {
    if (!user || !token || isLoading) return;
    const request = ++sequence.current;
    try {
      const response = await apiClient.get('/notifications', { params: { limit: 8 } });
      if (request === sequence.current && currentIdentity.current === identity) {
        setState({ ...response.data, error: '', loading: false, identity });
        setRevision(value => value + 1);
      }
    } catch (error) {
      if (request === sequence.current && currentIdentity.current === identity) setState(old => ({ ...old, error: error.message, loading: false, identity }));
    }
  }, [identity, isLoading]);
  useEffect(() => {
    setState({ notifications: [], unreadCount: 0, error: '', loading: Boolean(token), identity });
    if (!user || !token || isLoading) return;
    refresh();
    const origin = import.meta.env.VITE_SOCKET_URL || new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin).origin;
    const socket = io(origin, { auth: { token } });
    socket.on('connect', refresh);
    socket.on('notifications:changed', refresh);
    const interval = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { sequence.current++; socket.disconnect(); clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [identity, isLoading, refresh]);
  const markRead = async id => {
    await apiClient.patch(`/notifications/${id}/read`);
    await refresh();
  };
  const markAll = async () => { await apiClient.patch('/notifications/read-all'); await refresh(); };
  const visible = state.identity === identity ? state : { notifications: [], unreadCount: 0, error: '', loading: Boolean(token) };
  return <Context.Provider value={{ ...visible, refresh, markRead, markAll, revision, identity }}>{children}</Context.Provider>;
}
export const useNotifications = () => useContext(Context);
