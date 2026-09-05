import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../ui/Spinner';

// Placeholder for auth context hook
const useAuth = () => {
  // Mock implementation for UI building
  return {
    user: { id: '1', role: 'donor' },
    loading: false,
    isAuthenticated: true
  };
};

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
