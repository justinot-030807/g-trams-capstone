import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import FranchiseMasterlist from './pages/FranchiseMasterlist';
import UserManagement from './pages/UserManagement';
import SystemSettings from './pages/SystemSettings';
import FranchiseApproval from './pages/FranchiseApproval';
import ManageRevocations from './pages/ManageRevocations';
import ValidateTODA from './pages/ValidateTODA';
import AdminReports from './pages/AdminReports';
// Operator & TODA President Pages
import OperatorDashboard from './pages/OperatorDashboard';
import ApplyFranchise from './pages/ApplyFranchise';
import RenewFranchise from './pages/RenewFranchise';
import ManageProfile from './pages/ManageProfile';
import SubmitMembers from './pages/SubmitMembers';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Routes - TINANGGAL ANG <MainLayout> DITO PARA HINDI DUMOBLE */}
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
    
    </Routes>
  );
}

export default App;