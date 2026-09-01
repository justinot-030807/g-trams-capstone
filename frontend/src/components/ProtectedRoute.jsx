import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  let userRole = localStorage.getItem('role');

  // Fallback: Kung wala sa 'role', baka nasa loob ng 'user' object na-save ng Login page mo
  if (!userRole) {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userRole = userObj?.role || '';
      }
    } catch (error) {
      console.error("Hindi mabasa ang user data sa storage.");
    }
  }

  // Kapag walang token o walang role, ibalik sa login
  if (!token || !userRole) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Gawing lowercase para walang case-sensitive issues (Admin vs admin)
  const safeUserRole = userRole.toLowerCase();
  const safeAllowedRoles = allowedRoles.map(r => r.toLowerCase());

  // Kung ang role mo ay WALA sa pinapayagan sa pahinang ito, ire-redirect ka sa tamang dashboard
  if (!safeAllowedRoles.includes(safeUserRole)) {
    if (safeUserRole === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/operator-dashboard" replace />;
    }
  }

  // Kapag tama ang lahat, papasukin sa pahina
  return children;
};

export default ProtectedRoute;