import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16
      }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verificando sessão...</span>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
