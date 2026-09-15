import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';
import { UserDashboard } from '../features/customer/UserDashboard';
import { CooperativeDashboard } from '../features/cooperative/CooperativeDashboard';
import { WorkerDashboard } from '../features/worker/WorkerDashboard';
import { AdminDashboard } from '../features/admin/AdminDashboard';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Role Protected Routes */}
      {/* 1. USER -> /user/dashboard */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={['USER', 'CUSTOMER']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* 2. COOPERATIVE -> /cooperative/dashboard */}
      <Route
        path="/cooperative/dashboard"
        element={
          <ProtectedRoute allowedRoles={['COOPERATIVE']}>
            <CooperativeDashboard />
          </ProtectedRoute>
        }
      />

      {/* 3. WORKER -> /worker/dashboard */}
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute allowedRoles={['WORKER']}>
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />

      {/* 4. ADMIN -> /admin/dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
