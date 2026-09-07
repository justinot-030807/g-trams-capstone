import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MaintenanceMode from './pages/MaintenanceMode';

import AdminDashboard from './pages/admin/AdminDashboard';
import FranchiseMasterlist from './pages/admin/FranchiseMasterlist';
import UserManagement from './pages/admin/UserManagement';
import AdminSettings from './pages/admin/AdminSettings';
import FranchiseApproval from './pages/admin/FranchiseApproval';
import ManageRevocations from './pages/admin/ManageRevocations';
import ValidateTODA from './pages/admin/ValidateTODA';
import AdminReports from './pages/admin/AdminReports';

import OperatorDashboard from './pages/operator/OperatorDashboard';
import ApplyFranchise from './pages/operator/ApplyFranchise';
import RenewFranchise from './pages/operator/RenewFranchise';
import OperatorSettings from './pages/operator/OperatorSettings';
import SubmitMembers from './pages/operator/SubmitMembers';
import HelpSupport from './pages/operator/HelpSupport';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

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
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/maintenance" element={<MaintenanceMode />} />

          {/* ADMIN SECURE ROUTES */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/franchise-masterlist" element={<ProtectedRoute allowedRoles={['admin']}><FranchiseMasterlist /></ProtectedRoute>} />
          <Route path="/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
          <Route path="/system-settings" element={<Navigate to="/admin/settings" replace />} />
          <Route path="/franchise-approval" element={<ProtectedRoute allowedRoles={['admin']}><FranchiseApproval /></ProtectedRoute>} />
          <Route path="/manage-revocations" element={<ProtectedRoute allowedRoles={['admin']}><ManageRevocations /></ProtectedRoute>} />
          <Route path="/validate-toda" element={<ProtectedRoute allowedRoles={['admin']}><ValidateTODA /></ProtectedRoute>} />
          <Route path="/system-reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />

          {/* TODA PRESIDENT SECURE ROUTES */}
          <Route path="/submit-members" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><SubmitMembers /></ProtectedRoute>} />
          
          {/* OPERATOR & TODA SECURE ROUTES */}
          <Route path="/operator-dashboard" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><OperatorDashboard /></ProtectedRoute>} />
          <Route path="/apply-franchise" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><ApplyFranchise /></ProtectedRoute>} />
          <Route path="/renew-franchise/:id" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><RenewFranchise /></ProtectedRoute>} />
          <Route path="/operator/settings" element={<ProtectedRoute allowedRoles={['operator', 'toda president']}><OperatorSettings /></ProtectedRoute>} />
          
          {/* SHARED SECURE ROUTES & REDIRECTS */}
          <Route path="/manage-profile" element={<ProfileRedirect />} />
          <Route path="/help-support" element={<ProtectedRoute allowedRoles={['admin', 'operator', 'toda president']}><HelpSupport /></ProtectedRoute>} />
        </Routes>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;