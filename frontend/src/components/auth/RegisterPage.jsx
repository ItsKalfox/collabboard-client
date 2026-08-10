import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import './auth.css';

export default function RegisterPage({ onNavigate = () => {} }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate password strength (0-3)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', class: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    if (score === 1) return { score: 1, label: 'Weak password', class: 'active-weak' };
    if (score === 2) return { score: 2, label: 'Medium strength', class: 'active-medium' };
    if (score === 3) return { score: 3, label: 'Strong password', class: 'active-strong' };
    return { score: 1, label: 'Weak password', class: 'active-weak' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please complete all form fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (!agreedTerms) {
      setError('You must agree to the Terms of Service to proceed.');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: fullName, email, password })
      });
      
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError('User is already exist');
        } else {
          setError(data.message || 'Something went wrong');
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess('Account created!');
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="auth-fade-in">
      {!success && (
        <div className="auth-header">
          <div className="auth-logo-badge">
            <UserPlus size={26} />
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join CollabBoard and start collaborating today</p>
        </div>
      )}

      {error && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--text-primary)', opacity: 0.9 }} />
            <h2 className="auth-title" style={{ margin: 0 }}>Account Created</h2>
            <p className="auth-subtitle" style={{ maxWidth: '280px', margin: '0 auto' }}>
              Your account has been set up successfully. You can now log in and start collaborating.
            </p>
          </div>
          <button 
            type="button" 
            className="auth-submit-btn" 
            onClick={() => onNavigate('login')}
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            Back to Login
          </button>
        </div>
      )}

      {!success && (
        <>
        <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <label className="auth-label">Full Name</label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <User size={18} />
            </div>
            <input
              type="text"
              className="auth-input"
              placeholder="Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Email Address</label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <Mail size={18} />
            </div>
            <input
              type="email"
              className="auth-input"
              placeholder="alex.morgan@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Password</label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Create strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-input-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {password && (
            <div className="password-strength-container">
              <div className="password-strength-bars">
                <div className={`password-strength-segment ${strength.score >= 1 ? strength.class : ''}`} />
                <div className={`password-strength-segment ${strength.score >= 2 ? strength.class : ''}`} />
                <div className={`password-strength-segment ${strength.score >= 3 ? strength.class : ''}`} />
              </div>
              <div className="password-strength-label">{strength.label}</div>
            </div>
          )}
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Confirm Password</label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-options-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              required
            />
            <span>
              I agree to the <button type="button" className="auth-link">Terms & Privacy Policy</button>
            </span>
          </label>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <span>Creating account...</span>
          ) : (
            <>
              <span>Create Free Account</span>
              <UserPlus size={18} />
            </>
          )}
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <button type="button" className="auth-link" onClick={() => onNavigate('login')}>
          Sign In
        </button>
      </p>
      </>
      )}
    </div>
  );
}
