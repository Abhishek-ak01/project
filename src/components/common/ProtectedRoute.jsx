import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, isAuthenticated } = useAuth();
  const location = useLocation();
  const { addToast } = useToast();

  if (!isAuthenticated) {
    addToast('Please sign in to access this area.', 'warning');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    addToast(`Access restricted: ${allowedRoles.join(' or ')} permission required. Use the role switcher in the navbar to test this role.`, 'error');
    return <Navigate to="/" replace />;
  }

  return children;
}
