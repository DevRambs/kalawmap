import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { z } from 'zod';
import { authStyles } from './authStyles';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      const errorMessage = parsed.error.errors[0]?.message || 'Please check your input';
      setError(errorMessage);
      return;
    }
    try {
      setSubmitting(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // Navigate to main app after successful registration
      window.location.href = '/';
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
    ...(fieldName === 'confirmPassword' && password && confirmPassword && password !== confirmPassword ? {
      borderColor: '#ef4444',
      background: 'rgba(239, 68, 68, 0.1)',
      boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.1)',
    } : {}),
  });

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = password && confirmPassword && password !== confirmPassword;

  const getButtonStyle = (isSubmitting: boolean, isDisabled: boolean) => ({
    ...authStyles.button,
    opacity: (isSubmitting || isDisabled) ? 0.6 : 1,
    transform: isSubmitting ? 'scale(0.98) translateY(1px)' : 'scale(1) translateY(0)',
    boxShadow: (isSubmitting || isDisabled)
      ? '0 4px 15px -3px rgba(59, 130, 246, 0.2)' 
      : '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
    cursor: (isSubmitting || isDisabled) ? 'not-allowed' : 'pointer',
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
        
        <h1 style={authStyles.title}>Create Account</h1>
        
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
        
        <label style={authStyles.label}>Password</label>
        <input 
          type="password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          style={getInputStyle('password')}
          placeholder="Enter your password (min. 6 characters)"
        />
        
        <label style={authStyles.label}>Confirm Password</label>
        <input 
          type="password" 
          required 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFocus={() => setFocusedField('confirmPassword')}
          onBlur={() => setFocusedField(null)}
          style={getInputStyle('confirmPassword')}
          placeholder="Confirm your password"
        />
        
        {passwordsMatch && (
          <div style={authStyles.success}>✓ Passwords match</div>
        )}
        
        {passwordsDontMatch && (
          <div style={authStyles.error}>✗ Passwords don't match</div>
        )}
        
        {error && <div style={authStyles.error}>{error}</div>}
        
        <button 
          type="submit" 
          disabled={submitting || passwordsDontMatch} 
          style={getButtonStyle(submitting, passwordsDontMatch)}
        >
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
        
        <div style={authStyles.linkContainer}>
          <Link to="/login" style={authStyles.link}>Already have an account?</Link>
        </div>
      </form>
    </div>
  );
}