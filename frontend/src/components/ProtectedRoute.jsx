import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  let userRole = localStorage.getItem('role');
  const userStr = localStorage.getItem('user');

  // Fallback: Kunin ang role sa loob ng 'user' object kung wala sa 'role' key
  if (!userRole && userStr) {
    try {
      const userObj = JSON.parse(userStr);
      userRole = userObj?.role;
    } catch (error) {
      console.error("Failed to parse user data.");
    }
  }

  // Kung walang token o walang role, sipain sa login
  if (!token || !userRole) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Linisin ang text: Tanggalin ang spaces at gawing small letters lahat
  const safeUserRole = String(userRole).toLowerCase().trim();
  const safeAllowedRoles = allowedRoles.map(r => String(r).toLowerCase().trim());

  // Kung WALA sa allowed roles ang user, i-redirect sa tamang page niya
  if (!safeAllowedRoles.includes(safeUserRole)) {
    if (safeUserRole === 'admin' || safeUserRole === 'administrator') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (safeUserRole === 'operator' || safeUserRole === 'toda president') {
      return <Navigate to="/operator-dashboard" replace />;
    } else {
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
  }

  // Kung tama ang role, papasukin
  return children;
};

export default ProtectedRoute;