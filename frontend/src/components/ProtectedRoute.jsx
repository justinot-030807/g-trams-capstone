import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  // Kung walang login data
  if (!userStr || !token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Gawing lowercase lahat para walang mintis sa case-sensitivity
    const userRole = user.role.toLowerCase();
    const safeAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    // Kung hindi kasali ang role ng user sa pinapayagang roles
    if (!safeAllowedRoles.includes(userRole)) {
      if (userRole === 'admin') {
        return <Navigate to="/admin-dashboard" replace />;
      } else {
        return <Navigate to="/operator-dashboard" replace />;
      }
    }
  } catch (error) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Kung tama ang role, papasukin sa page
  return children;
};

export default ProtectedRoute;