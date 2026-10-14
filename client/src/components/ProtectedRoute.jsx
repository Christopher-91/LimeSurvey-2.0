import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="ls-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="ls-skeleton" style={{ width: '200px', margin: '0 auto 20px auto' }} />
        <div className="ls-skeleton" style={{ width: '400px', margin: '0 auto' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination via returnTo query param
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Role mismatch: redirect appropriately
    if (role === 'voter') {
      return <Navigate to="/voter/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};
