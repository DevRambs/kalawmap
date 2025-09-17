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
      borderColor: '#236eb2',
      background: 'rgba(35, 110, 178, 0.1)',
      boxShadow: '0 0 0 3px rgba(35, 110, 178, 0.1)',
    } : {}),
  });

  return (
    <div style={authStyles.formContainer}>
      <form onSubmit={handleSubmit} style={authStyles.form}>
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
          style={{
            ...authStyles.button,
            opacity: submitting ? 0.7 : 1,
            transform: submitting ? 'scale(0.98)' : 'scale(1)',
          }}
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