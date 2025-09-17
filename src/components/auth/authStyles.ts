import React from 'react';

export const authStyles = {
  // Loading styles for protected route
  loadingContainer: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #071624 0%, #0c1a2e 50%, #1e293b 100%)',
    color: '#fff',
    fontSize: '18px',
    zIndex: 9999,
  },

  input: {
    width: '100%',
    padding: '14px 16px',
    marginTop: 8,
    background: 'rgba(15, 27, 45, 0.8)',
    color: '#fff',
    border: '2px solid rgba(35, 110, 178, 0.3)',
    borderRadius: 12,
    fontSize: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },

  button: {
    width: '100%',
    marginTop: 16,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #236eb2 0%, #1e5a96 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(35, 110, 178, 0.3)',
  },

  secondaryButton: {
    width: '100%',
    marginTop: 16,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
  },

  formContainer: {
    display: 'grid',
    placeItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #071624 0%, #0c1a2e 50%, #1e293b 100%)',
    color: '#fff',
    padding: '20px',
  },

  form: {
    width: '100%',
    maxWidth: 420,
    background: 'rgba(15, 27, 45, 0.95)',
    padding: '40px 32px',
    borderRadius: 20,
    border: '1px solid rgba(35, 110, 178, 0.2)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(35, 110, 178, 0.1)',
    backdropFilter: 'blur(10px)',
  },

  title: {
    marginBottom: 32,
    fontSize: '28px',
    fontWeight: '700',
    textAlign: 'center' as const,
    background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  label: {
    display: 'block',
    marginBottom: 6,
    marginTop: 16,
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  error: {
    color: '#ef4444',
    marginTop: 8,
    fontSize: '14px',
    padding: '8px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
  },

  success: {
    color: '#10b981',
    marginTop: 8,
    fontSize: '14px',
    padding: '8px 12px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
  },

  linkContainer: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },

  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.3s ease',
  },
};