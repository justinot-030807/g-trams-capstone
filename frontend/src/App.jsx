import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { lazyRetry } from './utils/lazyRetry';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';

// Operator Core Routes (lazy-loaded with auto-chunk retry to prevent 404s after new deploys)
const OperatorDashboard = lazyRetry(() => import('./pages/operator/OperatorDashboard'), 'OperatorDashboard');
const ApplyFranchise = lazyRetry(() => import('./pages/operator/ApplyFranchise'), 'ApplyFranchise');
const RenewFranchise = lazyRetry(() => import('./pages/operator/RenewFranchise'), 'RenewFranchise');
const OperatorSettings = lazyRetry(() => import('./pages/operator/OperatorSettings'), 'OperatorSettings');

import MaintenanceMode from './pages/MaintenanceMode';

// Lazy-loaded Admin and Secondary Routes for optimal bundle size
const AccountDeactivated = lazyRetry(() => import('./pages/AccountDeactivated'), 'AccountDeactivated');
const VerifyOperator = lazyRetry(() => import('./pages/shared/VerifyOperator'), 'VerifyOperator');
const About = lazyRetry(() => import('./pages/shared/About'), 'About');
const NotFound = lazyRetry(() => import('./pages/shared/NotFound'), 'NotFound');
const SubmitMembers = lazyRetry(() => import('./pages/toda/SubmitMembers'), 'SubmitMembers');
const HelpSupport = lazyRetry(() => import('./pages/operator/HelpSupport'), 'HelpSupport');

// Admin Pages (Code-split to isolate large administrative bundles from operator devices)
const AdminDashboard = lazyRetry(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const BploDashboard = lazyRetry(() => import('./pages/admin/BploDashboard'), 'BploDashboard');
const FranchiseMasterlist = lazyRetry(() => import('./pages/admin/FranchiseMasterlist'), 'FranchiseMasterlist');
const UserManagement = lazyRetry(() => import('./pages/admin/UserManagement'), 'UserManagement');
const AdminSettings = lazyRetry(() => import('./pages/admin/AdminSettings'), 'AdminSettings');
const FranchiseApproval = lazyRetry(() => import('./pages/admin/FranchiseApproval'), 'FranchiseApproval');
const FranchiseReviewPage = lazyRetry(() => import('./pages/admin/FranchiseReviewPage'), 'FranchiseReviewPage');
const ManageRevocations = lazyRetry(() => import('./pages/admin/ManageRevocations'), 'ManageRevocations');
const ValidateTODA = lazyRetry(() => import('./pages/admin/ValidateTODA'), 'ValidateTODA');
const AdminReports = lazyRetry(() => import('./pages/admin/AdminReports'), 'AdminReports');
const AdminTickets = lazyRetry(() => import('./pages/admin/AdminTickets'), 'AdminTickets');
const CashierDashboard = lazyRetry(() => import('./pages/cashier/CashierDashboard'), 'CashierDashboard');
const CashierSettings = lazyRetry(() => import('./pages/cashier/CashierSettings'), 'CashierSettings');

import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { TextSizeProvider } from './context/TextSizeContext';

import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import PwaInstallBanner from './components/common/PwaInstallBanner';
import SplashScreen from './components/common/SplashScreen';

import { initServerTimeSync, recordServerTimeFromResponse } from './utils/serverTime';
import ErrorBoundary from './components/common/ErrorBoundary';

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
    <div className="w-10 h-10 rounded-2xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] mb-2.5">
      <div className="w-5 h-5 border-2 border-[#9E2A2B] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
    <span className="text-xs font-bold text-slate-500 dark:text-slate-600 dark:text-slate-400">Loading...</span>
  </div>
);

const ProfileRedirect = () => {
  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  if (role === 'admin' || role === 'administrator' || role === 'system admin') {
    return <Navigate to="/admin/settings" replace />;
  }
  if (role === 'bplo staff') {
    return <Navigate to="/admin/settings" replace />;
  }
  if (role === 'cashier') {
    return <Navigate to="/cashier-settings" replace />;
  }
  return <Navigate to="/operator/settings" replace />;
};

function App() {
  useEffect(() => {
    // Initial sync of system configuration and server-authoritative time
    const syncSettings = async () => {
      try {
        initServerTimeSync(import.meta.env.VITE_API_URL);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
        if (res.ok) {
          recordServerTimeFromResponse(res);
          const json = await res.json();
          if (json.data) {
            const d = json.data;
            localStorage.setItem('maintenance_mode', d.maintenanceMode ? 'true' : 'false');
            if (d.fiscalYear) localStorage.setItem('fiscal_year', d.fiscalYear);
            if (d.franchiseFee) localStorage.setItem('franchise_fee', d.franchiseFee);
            if (d.validityNew) localStorage.setItem('validity_new', d.validityNew);
            if (d.validityRenew) localStorage.setItem('validity_renew', d.validityRenew);
          }
        }
      } catch (err) {
        console.error('Failed to sync system settings:', err);
      }
    };
    syncSettings();
  }, []);

  return (
    <ThemeProvider>
      <TextSizeProvider>
        <LanguageProvider>
          <SocketProvider>
            <NotificationProvider>
              <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                  <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                  <Route path="/account-deactivated" element={<PublicRoute><AccountDeactivated /></PublicRoute>} />
                  <Route path="/maintenance" element={<MaintenanceMode />} />
                  <Route path="/verify/:id" element={<VerifyOperator />} />

                  {/* SYSTEM ADMIN SECURE ROUTES (IT Maintenance, Accounts, Telemetry, Policy) */}
                  <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['system_admin', 'admin']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/user-management" element={<ProtectedRoute allowedRoles={['system_admin', 'admin']}><UserManagement /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['system_admin', 'admin', 'bplo_staff']}><AdminSettings /></ProtectedRoute>} />
                  <Route path="/system-settings" element={<Navigate to="/admin/settings" replace />} />
                  <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={['system_admin', 'admin']}><AdminTickets /></ProtectedRoute>} />

                  {/* BPLO STAFF SECURE ROUTES (Franchise Operations, Queues, Verification, Issuance) */}
                  <Route path="/bplo-dashboard" element={<ProtectedRoute allowedRoles={['bplo_staff']}><BploDashboard /></ProtectedRoute>} />
                  <Route path="/franchise-masterlist" element={<ProtectedRoute allowedRoles={['bplo_staff']}><FranchiseMasterlist /></ProtectedRoute>} />
                  <Route path="/franchise-approval" element={<ProtectedRoute allowedRoles={['bplo_staff']}><FranchiseApproval /></ProtectedRoute>} />
                  <Route path="/franchise-approval/review/:id" element={<ProtectedRoute allowedRoles={['bplo_staff']}><FranchiseReviewPage /></ProtectedRoute>} />
                  <Route path="/manage-revocations" element={<ProtectedRoute allowedRoles={['bplo_staff']}><ManageRevocations /></ProtectedRoute>} />
                  <Route path="/admin/violations" element={<ProtectedRoute allowedRoles={['bplo_staff', 'system_admin', 'admin']}><ManageRevocations /></ProtectedRoute>} />
                  <Route path="/validate-toda" element={<ProtectedRoute allowedRoles={['bplo_staff']}><ValidateTODA /></ProtectedRoute>} />
                  <Route path="/system-reports" element={<ProtectedRoute allowedRoles={['bplo_staff']}><AdminReports /></ProtectedRoute>} />

                  {/* MUNICIPAL CASHIER & TREASURY ROUTES (Isolated Payments & Log OR) */}
                  <Route path="/cashier-dashboard" element={<ProtectedRoute allowedRoles={['cashier']}><CashierDashboard /></ProtectedRoute>} />
                  <Route path="/cashier-settings" element={<ProtectedRoute allowedRoles={['cashier']}><CashierSettings /></ProtectedRoute>} />
                  <Route path="/cashier/settings" element={<Navigate to="/cashier-settings" replace />} />

                  {/* TODA PRESIDENT SECURE ROUTES */}
                  <Route path="/submit-members" element={<ProtectedRoute allowedRoles={['toda president']}><SubmitMembers /></ProtectedRoute>} />
                  
                  {/* OPERATOR & TODA SECURE ROUTES */}
                  <Route path="/operator-dashboard" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><OperatorDashboard /></ProtectedRoute>} />
                  <Route path="/apply-franchise" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><ApplyFranchise /></ProtectedRoute>} />
                  <Route path="/renew-franchise/:id" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><RenewFranchise /></ProtectedRoute>} />
                  <Route path="/operator/settings" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><OperatorSettings /></ProtectedRoute>} />
                  <Route path="/operator-settings" element={<Navigate to="/operator/settings" replace />} />
                  
                  {/* SHARED SECURE ROUTES & REDIRECTS */}
                  <Route path="/manage-profile" element={<ProfileRedirect />} />
                  <Route path="/help-support" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'toda president']}><HelpSupport /></ProtectedRoute>} />
                  <Route path="/about" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'toda president']}><About /></ProtectedRoute>} />

                  {/* CATCH-ALL 404 ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <PwaInstallBanner />
            <SplashScreen />
          </NotificationProvider>
        </SocketProvider>
      </LanguageProvider>
      </TextSizeProvider>
    </ThemeProvider>
  );
}

export default App;
