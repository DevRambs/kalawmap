import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { authStyles } from './authStyles';

export function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      setSubmitting(true);
      await sendPasswordResetEmail(auth, email);
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getInputStyle = (fieldName: string) => ({
    ...authStyles.input,
    ...(focusedField === fieldName ? {
      borderColor: '#3b82f6',
      background: 'rgba(59, 130, 246, 0.1)',
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1), 0 10px 25px -5px rgba(59, 130, 246, 0.2)',
      transform: 'translateY(-2px)',
    } : {}),
  });

  const getButtonStyle = (isSubmitting: boolean) => ({
    ...authStyles.button,
    opacity: isSubmitting ? 0.8 : 1,
    transform: isSubmitting ? 'scale(0.98) translateY(1px)' : 'scale(1) translateY(0)',
    boxShadow: isSubmitting 
      ? '0 4px 15px -3px rgba(59, 130, 246, 0.3)' 
      : '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
  });

  return (
    <div style={authStyles.formContainer}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      
      <form onSubmit={handleSubmit} style={authStyles.form}>
        {/* Form glow effect */}
        <div style={{
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
          borderRadius: 26,
          zIndex: -1,
          opacity: 0.5,
        }} />
        
        <h1 style={authStyles.title}>Reset Password</h1>
        
        <label style={authStyles.label}>Email Address</label>
        <input 
          type="email" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          style={getInputStyle('email')}
          placeholder="Enter your email"
        />
        
        {error && <div style={authStyles.error}>{error}</div>}
        {info && <div style={authStyles.success}>{info}</div>}
        
        <button 
          type="submit" 
          disabled={submitting} 
          style={getButtonStyle(submitting)}
        >
          {submitting ? 'Sending...' : 'Send Reset Email'}
        </button>
        
        <div style={authStyles.linkContainer}>
          <Link to="/login" style={authStyles.link}>Back to Login</Link>
        </div>
      </form>
    </div>
  );
}