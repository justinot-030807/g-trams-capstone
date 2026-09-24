import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';

// Operator Core Routes (lazy-loaded to reduce initial bundle size)
const OperatorDashboard = lazy(() => import('./pages/operator/OperatorDashboard'));
const ApplyFranchise = lazy(() => import('./pages/operator/ApplyFranchise'));
const RenewFranchise = lazy(() => import('./pages/operator/RenewFranchise'));
const OperatorSettings = lazy(() => import('./pages/operator/OperatorSettings'));

import MaintenanceMode from './pages/MaintenanceMode';

// Lazy-loaded Admin and Secondary Routes for optimal bundle size
const AccountDeactivated = lazy(() => import('./pages/AccountDeactivated'));
const VerifyOperator = lazy(() => import('./pages/shared/VerifyOperator'));
const About = lazy(() => import('./pages/shared/About'));
const NotFound = lazy(() => import('./pages/shared/NotFound'));
const SubmitMembers = lazy(() => import('./pages/operator/SubmitMembers'));
const HelpSupport = lazy(() => import('./pages/operator/HelpSupport'));

// Admin Pages (Code-split to isolate large administrative bundles from operator devices)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const FranchiseMasterlist = lazy(() => import('./pages/admin/FranchiseMasterlist'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const FranchiseApproval = lazy(() => import('./pages/admin/FranchiseApproval'));
const FranchiseReviewPage = lazy(() => import('./pages/admin/FranchiseReviewPage'));
const ManageRevocations = lazy(() => import('./pages/admin/ManageRevocations'));
const ValidateTODA = lazy(() => import('./pages/admin/ValidateTODA'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));

import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import PwaInstallBanner from './components/common/PwaInstallBanner';
import SplashScreen from './components/common/SplashScreen';

import ErrorBoundary from './components/common/ErrorBoundary';

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
    <div className="w-10 h-10 rounded-2xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] mb-2.5">
      <div className="w-5 h-5 border-2 border-[#7A1B22] dark:border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
    <span className="text-xs font-bold text-slate-500 dark:text-slate-600 dark:text-slate-400">Loading...</span>
  </div>
);

const ProfileRedirect = () => {
  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  if (role === 'admin' || role === 'administrator') {
    return <Navigate to="/admin/settings" replace />;
  }
  return <Navigate to="/operator/settings" replace />;
};

function App() {
  useEffect(() => {
    // Initial sync of system configuration (maintenance mode, fiscal year, fees)
    const syncSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
        if (res.ok) {
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

                  {/* ADMIN SECURE ROUTES */}
                  <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/franchise-masterlist" element={<ProtectedRoute allowedRoles={['admin']}><FranchiseMasterlist /></ProtectedRoute>} />
                  <Route path="/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
                  <Route path="/system-settings" element={<Navigate to="/admin/settings" replace />} />
                  <Route path="/franchise-approval" element={<ProtectedRoute allowedRoles={['admin']}><FranchiseApproval /></ProtectedRoute>} />
                  <Route path="/franchise-approval/review/:id" element={<ProtectedRoute allowedRoles={['admin']}><FranchiseReviewPage /></ProtectedRoute>} />
                  <Route path="/manage-revocations" element={<ProtectedRoute allowedRoles={['admin']}><ManageRevocations /></ProtectedRoute>} />
                  <Route path="/validate-toda" element={<ProtectedRoute allowedRoles={['admin']}><ValidateTODA /></ProtectedRoute>} />
                  <Route path="/system-reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
                  <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={['admin']}><AdminTickets /></ProtectedRoute>} />

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
    </ThemeProvider>
  );
}

export default App;
