import React from 'react';
import { Navigate } from 'react-router-dom';
import SystemAdminDashboard from './SystemAdminDashboard';
import BploDashboard from './BploDashboard';

const AdminDashboard = () => {
  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');

  // If user is BPLO Staff, navigate directly to BPLO Operations Dashboard
  if (role === 'bplo staff') {
    return <Navigate to="/bplo-dashboard" replace />;
  }

  // System Admin and IT Administrators get the IT Control Center
  return <SystemAdminDashboard />;
};

export default AdminDashboard;
