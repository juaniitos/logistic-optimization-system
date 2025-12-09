import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Spin size="large" tip="Cargando..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
