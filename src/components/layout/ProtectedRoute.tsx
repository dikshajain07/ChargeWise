import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChargingLoader } from '../arcade/ChargingLoader';
import { AccountsNotConfigured } from '../auth/AccountsNotConfigured';

export function ProtectedRoute({ children }: {children: React.ReactNode;}) {
  const { configured, user, loading } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <AccountsNotConfigured />
      </div>);

  }
  if (loading) return <ChargingLoader label="Loading profile" className="py-32" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}