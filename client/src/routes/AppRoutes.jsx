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
import { WorkerOnboardingWizard } from '../features/worker/WorkerOnboardingWizard';
import { CooperativeOnboardingWizard } from '../features/cooperative/CooperativeOnboardingWizard';
import { AdminVerificationManager } from '../features/admin/AdminVerificationManager';
import { DashboardLayout } from '../layouts/DashboardLayout';

function WorkerOnboardingPage() {
  return (
    <DashboardLayout
      title="Worker Profile & KYC Onboarding"
      subtitle="Complete your artisan profile, add your skills, set fair floor rates, and upload documents for cooperative verification."
      roleBadge="Worker Onboarding"
    >
      <WorkerOnboardingWizard />
    </DashboardLayout>
  );
}

function CooperativeOnboardingPage() {
  return (
    <DashboardLayout
      title="Cooperative Society Registry Onboarding"
      subtitle="Register your cooperative bylaws, specify operational service sectors, and enroll guild artisans."
      roleBadge="Cooperative Registration"
    >
      <CooperativeOnboardingWizard />
    </DashboardLayout>
  );
}

function AdminVerificationsPage() {
  return (
    <DashboardLayout
      title="Statutory Verification & Oversight Queue"
      subtitle="Certify cooperative societies and verify artisan credentials with state registry compliance."
      roleBadge="Gov-Tech Admin"
    >
      <AdminVerificationManager />
    </DashboardLayout>
  );
}

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

      {/* 2. COOPERATIVE -> /cooperative/dashboard & /cooperative/onboarding */}
      <Route
        path="/cooperative/dashboard"
        element={
          <ProtectedRoute allowedRoles={['COOPERATIVE']}>
            <CooperativeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cooperative/onboarding"
        element={
          <ProtectedRoute allowedRoles={['COOPERATIVE']}>
            <CooperativeOnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* 3. WORKER -> /worker/dashboard & /worker/onboarding */}
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute allowedRoles={['WORKER']}>
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/onboarding"
        element={
          <ProtectedRoute allowedRoles={['WORKER']}>
            <WorkerOnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* 4. ADMIN -> /admin/dashboard & /admin/verifications */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verifications"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminVerificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
