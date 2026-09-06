import React from 'react';
import { Navigate } from 'react-router-dom';
import MaintenanceMode from '../pages/MaintenanceMode';

const normalizeRole = (role) => {
  if (!role) return '';
  return String(role).toLowerCase().trim().replace(/_/g, ' ');
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  let userRole = localStorage.getItem('role');
  const userStr = localStorage.getItem('user');

  // Fallback: get role from user object if missing from storage key
  if (!userRole && userStr) {
    try {
      const userObj = JSON.parse(userStr);
      userRole = userObj?.role;
    } catch (error) {
      console.error("Failed to parse user data.");
    }
  }

  // Redirect to login if unauthenticated
  if (!token || !userRole) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // Normalize user role
  const safeUserRole = normalizeRole(userRole);
  const isAdmin = safeUserRole === 'admin' || safeUserRole === 'administrator';

  // Block non-admins when maintenance mode is active
  const isMaintenanceActive = localStorage.getItem('maintenance_mode') === 'true';
  if (isMaintenanceActive && !isAdmin) {
    return <Navigate to="/maintenance" replace />;
  }

  const safeAllowedRoles = allowedRoles.map(normalizeRole);

  // Treat toda president and operator interchangeably for operator routes
  const isOperatorAllowed = safeAllowedRoles.includes('operator') || safeAllowedRoles.includes('toda president');
  const isUserOperatorOrToda = safeUserRole === 'operator' || safeUserRole === 'toda president';

  const isAuthorized = safeAllowedRoles.includes(safeUserRole) || (isOperatorAllowed && isUserOperatorOrToda);

  // Redirect unauthorized users to their appropriate dashboard
  if (!isAuthorized) {
    if (safeUserRole === 'admin' || safeUserRole === 'administrator') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (isUserOperatorOrToda) {
      return <Navigate to="/operator-dashboard" replace />;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  }

  // Render route children when authorized
  return children;
};

export default ProtectedRoute;