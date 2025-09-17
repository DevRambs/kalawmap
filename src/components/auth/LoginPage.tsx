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
      borderColor: '#236eb2',
      background: 'rgba(35, 110, 178, 0.1)',
      boxShadow: '0 0 0 3px rgba(35, 110, 178, 0.1)',
    } : {}),
  });

  return (
    <div style={authStyles.formContainer}>
      <form onSubmit={handleSubmit} style={authStyles.form}>
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
          style={{
            ...authStyles.button,
            opacity: submitting ? 0.7 : 1,
            transform: submitting ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
        
        <button 
          type="button" 
          onClick={handleGoogle} 
          disabled={submitting} 
          style={{
            ...authStyles.secondaryButton,
            opacity: submitting ? 0.7 : 1,
          }}
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