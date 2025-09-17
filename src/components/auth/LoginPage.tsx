import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { z } from 'zod';
import { authStyles } from './authStyles';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Please enter a valid email and a password with at least 6 characters.');
      return;
    }
    try {
      setSubmitting(true);
      await signInWithEmailAndPassword(auth, email, password);
      // Navigate to main app after successful login
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      setSubmitting(true);
      await signInWithPopup(auth, googleProvider);
      // Navigate to main app after successful login
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
  });

  const getButtonStyle = (isSubmitting: boolean) => ({
    ...authStyles.button,
    opacity: isSubmitting ? 0.8 : 1,
    transform: isSubmitting ? 'scale(0.98) translateY(1px)' : 'scale(1) translateY(0)',
    boxShadow: isSubmitting 
      ? '0 4px 15px -3px rgba(59, 130, 246, 0.3)' 
      : '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
  });

  const getSecondaryButtonStyle = (isSubmitting: boolean) => ({
    ...authStyles.secondaryButton,
    opacity: isSubmitting ? 0.8 : 1,
    transform: isSubmitting ? 'scale(0.98) translateY(1px)' : 'scale(1) translateY(0)',
    boxShadow: isSubmitting 
      ? '0 4px 15px -3px rgba(239, 68, 68, 0.3)' 
      : '0 10px 25px -5px rgba(239, 68, 68, 0.4), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
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
        
        <h1 style={authStyles.title}>Welcome Back</h1>
        
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
          placeholder="Enter your password"
        />
        
        {error && <div style={authStyles.error}>{error}</div>}
        
        <button 
          type="submit" 
          disabled={submitting} 
          style={getButtonStyle(submitting)}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
        
        <button 
          type="button" 
          onClick={handleGoogle} 
          disabled={submitting} 
          style={getSecondaryButtonStyle(submitting)}
        >
          Continue with Google
        </button>
        
        <div style={authStyles.linkContainer}>
          <Link to="/register" style={authStyles.link}>Create account</Link>
          <Link to="/reset-password" style={authStyles.link}>Forgot password?</Link>
        </div>
      </form>
    </div>
  );
}