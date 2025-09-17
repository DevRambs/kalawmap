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
      borderColor: '#236eb2',
      background: 'rgba(35, 110, 178, 0.1)',
      boxShadow: '0 0 0 3px rgba(35, 110, 178, 0.1)',
    } : {}),
    ...(fieldName === 'confirmPassword' && password && confirmPassword && password !== confirmPassword ? {
      borderColor: '#ef4444',
      background: 'rgba(239, 68, 68, 0.1)',
    } : {}),
  });

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = password && confirmPassword && password !== confirmPassword;

  return (
    <div style={authStyles.formContainer}>
      <form onSubmit={handleSubmit} style={authStyles.form}>
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
          style={{
            ...authStyles.button,
            opacity: (submitting || passwordsDontMatch) ? 0.7 : 1,
            transform: submitting ? 'scale(0.98)' : 'scale(1)',
          }}
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