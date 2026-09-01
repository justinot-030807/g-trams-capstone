import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages (Nasa root ng pages/)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Admin Pages (Nasa pages/admin/)
import AdminDashboard from './pages/admin/AdminDashboard';
import FranchiseMasterlist from './pages/admin/FranchiseMasterlist';
import UserManagement from './pages/admin/UserManagement';
import SystemSettings from './pages/admin/SystemSettings';
import FranchiseApproval from './pages/admin/FranchiseApproval';
import ManageRevocations from './pages/admin/ManageRevocations';
import ValidateTODA from './pages/admin/ValidateTODA';
import AdminReports from './pages/admin/AdminReports';

// Operator & TODA President Pages (Nasa pages/operator/)
import OperatorDashboard from './pages/operator/OperatorDashboard';
import ApplyFranchise from './pages/operator/ApplyFranchise';
import RenewFranchise from './pages/operator/RenewFranchise';
import ManageProfile from './pages/operator/ManageProfile';
import SubmitMembers from './pages/operator/SubmitMembers';
import HelpSupport from './pages/operator/HelpSupport';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/franchise-masterlist" element={<FranchiseMasterlist />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/system-settings" element={<SystemSettings />} />
      <Route path="/franchise-approval" element={<FranchiseApproval />} />
      <Route path="/manage-revocations" element={<ManageRevocations />} />
      <Route path="/validate-toda" element={<ValidateTODA />} />
      <Route path="/system-reports" element={<AdminReports />} />

      {/* Operator & TODA Routes */}
      <Route path="/submit-members" element={<SubmitMembers />} />
      <Route path="/operator-dashboard" element={<OperatorDashboard />} />
      <Route path="/apply-franchise" element={<ApplyFranchise />} />
      <Route path="/renew-franchise/:id" element={<RenewFranchise />} />
      <Route path="/manage-profile" element={<ManageProfile />} />
      <Route path="/help-support" element={<HelpSupport />} />
    </Routes>
  );
}

export default App;