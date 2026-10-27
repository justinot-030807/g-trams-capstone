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
    localStorage.removeItem('userId');
    return <Navigate to="/login" replace />;
  }

  // Normalize user role
  const safeUserRole = normalizeRole(userRole);
  const isUserSystemAdmin = safeUserRole === 'admin' || safeUserRole === 'administrator' || safeUserRole === 'system admin';

  // Block non-admins when maintenance mode is active
  const isMaintenanceActive = localStorage.getItem('maintenance_mode') === 'true';
  if (isMaintenanceActive && !isUserSystemAdmin) {
    return <Navigate to="/maintenance" replace />;
  }

  const safeAllowedRoles = allowedRoles.map(normalizeRole);

  const isSystemAdminAllowed = safeAllowedRoles.includes('admin') || safeAllowedRoles.includes('system admin') || safeAllowedRoles.includes('administrator');

  // Treat toda president and operator interchangeably for operator routes
  const isOperatorAllowed = safeAllowedRoles.includes('operator') || safeAllowedRoles.includes('toda president');
  const isUserOperatorOrToda = safeUserRole === 'operator' || safeUserRole === 'toda president';

  const isAuthorized = safeAllowedRoles.includes(safeUserRole) || 
    (isSystemAdminAllowed && isUserSystemAdmin) || 
    (isOperatorAllowed && isUserOperatorOrToda);

  // Redirect unauthorized users to their appropriate dashboard
  if (!isAuthorized) {
    if (isUserSystemAdmin) {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (safeUserRole === 'bplo staff') {
      return <Navigate to="/bplo-dashboard" replace />;
    } else if (safeUserRole === 'cashier') {
      return <Navigate to="/cashier-dashboard" replace />;
    } else if (isUserOperatorOrToda) {
      return <Navigate to="/operator-dashboard" replace />;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      return <Navigate to="/login" replace />;
    }
  }

  // Render route children when authorized
  return children;
};

export default ProtectedRoute;
