import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

/**
 * Returns the designated dashboard path based on user role
 * Allowed roles: USER, COOPERATIVE, WORKER, ADMIN
 */
export function getRoleDashboardPath(role) {
  const normalizedRole = (role || '').toUpperCase();
  switch (normalizedRole) {
    case 'COOPERATIVE':
      return '/cooperative/dashboard';
    case 'WORKER':
      return '/worker/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'USER':
    case 'CUSTOMER':
    default:
      return '/user/dashboard';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('shramsetu_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('shramsetu_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load and verify current user on initial app mount
   */
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const savedToken = localStorage.getItem('shramsetu_token');
      if (savedToken) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (isMounted) {
            setUser(currentUser);
            localStorage.setItem('shramsetu_user', JSON.stringify(currentUser));
          }
        } catch (err) {
          // Token is expired or invalid
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('shramsetu_token');
            localStorage.removeItem('shramsetu_user');
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }

    initializeAuth();

    // Listen for global session expiration dispatched by apiClient interceptor
    const handleSessionExpired = (e) => {
      setUser(null);
      setToken(null);
      setError(e.detail?.message || 'Session expired. Please log in again.');
    };

    window.addEventListener('shramsetu:session-expired', handleSessionExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('shramsetu:session-expired', handleSessionExpired);
    };
  }, []);

  /**
   * Login action
   */
  const login = useCallback(async (identifier, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login({ identifier, password });
      const { user: authUser, token: authToken } = result;

      setUser(authUser);
      setToken(authToken);
      localStorage.setItem('shramsetu_token', authToken);
      localStorage.setItem('shramsetu_user', JSON.stringify(authUser));

      return authUser;
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register action
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.register(userData);
      const { user: authUser, token: authToken } = result;

      setUser(authUser);
      setToken(authToken);
      localStorage.setItem('shramsetu_token', authToken);
      localStorage.setItem('shramsetu_user', JSON.stringify(authUser));

      return authUser;
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout action
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      localStorage.removeItem('shramsetu_token');
      localStorage.removeItem('shramsetu_user');
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    getRoleDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
