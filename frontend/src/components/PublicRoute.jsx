import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');

  if (token) {
    if (role === 'admin' || role === 'administrator') {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/operator-dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
