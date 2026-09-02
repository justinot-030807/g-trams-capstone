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
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // Linisin ang text: Tanggalin ang spaces/underscores at gawing small letters lahat
  const safeUserRole = normalizeRole(userRole);
  const isAdmin = safeUserRole === 'admin' || safeUserRole === 'administrator';

  // MAINTENANCE MODE CHECK: Block non-admins if active
  const isMaintenanceActive = localStorage.getItem('maintenance_mode') === 'true';
  if (isMaintenanceActive && !isAdmin) {
    return <Navigate to="/maintenance" replace />;
  }

  const safeAllowedRoles = allowedRoles.map(normalizeRole);

  // Requirement: Treat 'toda president' and 'operator' interchangeably for all operator-level routes
  const isOperatorAllowed = safeAllowedRoles.includes('operator') || safeAllowedRoles.includes('toda president');
  const isUserOperatorOrToda = safeUserRole === 'operator' || safeUserRole === 'toda president';

  const isAuthorized = safeAllowedRoles.includes(safeUserRole) || (isOperatorAllowed && isUserOperatorOrToda);

  // Kung WALA sa allowed roles ang user, i-redirect sa tamang dashboard niya nang hindi sumisipa pabalik sa login
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

  // Kung tama ang role, papasukin
  return children;
};

export default ProtectedRoute;