import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { RegistrationPendingPage } from '../features/worker/RegistrationPendingPage';
import { DashboardLayout } from '../layouts/DashboardLayout';
import workerService from '../services/worker.service';
import { NotificationsPage } from '../features/notifications/NotificationsPage';

function WorkerOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [workerStatus, setWorkerStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await workerService.getRegistrationStatus();
        if (!isMounted) return;
        setWorkerStatus(res);

        const isVer = Boolean(
          res?.isVerified ||
          res?.registrationStatus === 'APPROVED' ||
          String(res?.verificationStatus?.status || res?.verificationStatus || '').toLowerCase() === 'verified'
        );

        if (isVer) {
          navigate('/worker/dashboard', { replace: true });
          return;
        }

        if (res?.registrationStatus === 'PENDING_APPROVAL' || res?.registrationStatus === 'PENDING_ADMIN_APPROVAL') {
          navigate('/registration-pending', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout title="Worker Profile & KYC" roleBadge="Worker">
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 rounded-full border-2 border-brand-saffron-500 border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const isVerified = Boolean(
    workerStatus?.isVerified ||
    workerStatus?.registrationStatus === 'APPROVED' ||
    String(workerStatus?.verificationStatus?.status || workerStatus?.verificationStatus || '').toLowerCase() === 'verified'
  );

  if (isVerified) {
    return <Navigate to="/worker/dashboard" replace />;
  }

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
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Requirement 10: Dedicated Worker Registration Pending Page */}
      <Route
        path="/registration-pending"
        element={
          <ProtectedRoute allowedRoles={['WORKER']}>
            <RegistrationPendingPage />
          </ProtectedRoute>
        }
      />

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

      {/* 3. WORKER -> /worker/dashboard, /worker/onboarding & registration aliases */}
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
      {/* Requirement 10: Automatic aliases for worker registration URLs */}
      <Route path="/worker/register" element={<Navigate to="/worker/onboarding" replace />} />
      <Route path="/worker/registration" element={<Navigate to="/worker/onboarding" replace />} />
      <Route path="/worker/profile-setup" element={<Navigate to="/worker/onboarding" replace />} />

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
