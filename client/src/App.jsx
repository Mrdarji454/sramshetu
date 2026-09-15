import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

/**
 * HashCompatibilityRedirect:
 * Redirects legacy hash routes (e.g. #/user -> /user/dashboard)
 * to maintain backwards-compatibility with existing demo bookmarks.
 */
function HashCompatibilityRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rawHash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
    if (['user', 'customer'].includes(rawHash)) {
      window.location.hash = '';
      navigate('/user/dashboard', { replace: true });
    } else if (['cooperative', 'coop'].includes(rawHash)) {
      window.location.hash = '';
      navigate('/cooperative/dashboard', { replace: true });
    } else if (['worker', 'shramik'].includes(rawHash)) {
      window.location.hash = '';
      navigate('/worker/dashboard', { replace: true });
    } else if (['admin', 'portal'].includes(rawHash)) {
      window.location.hash = '';
      navigate('/admin/dashboard', { replace: true });
    } else if (['login', 'signin'].includes(rawHash)) {
      window.location.hash = '';
      navigate('/login', { replace: true });
    } else if (['register', 'signup'].includes(rawHash)) {
      window.location.hash = '';
      navigate('/register', { replace: true });
    }
  }, [navigate, location]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HashCompatibilityRedirect />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
