import React from 'react';
import { Navigate } from 'react-router-dom';
import SystemAdminDashboard from './SystemAdminDashboard';

const AdminDashboard = () => {
  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');

  // If user is LLSA I (SB Franchising Staff), navigate directly to LLSA I Operations Dashboard
  if (role === 'bplo staff') {
    return <Navigate to="/llsa-dashboard" replace />;
  }

  // System Admin and IT Administrators get the IT Control Center
  return <SystemAdminDashboard />;
};

export default AdminDashboard;
