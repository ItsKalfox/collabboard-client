import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { mockLogin } from '../../mock/mockAuthData';
import './auth.css';

export default function LoginPage({ onNavigate = () => {}, onLoginSuccess = () => {} }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await mockLogin(email, password);
      setSuccess(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-fade-in">
      <div className="auth-header">
        <div className="auth-logo-badge">
          <LogIn size={26} />
        </div>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your CollabBoard workspace account</p>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="auth-alert auth-alert-success">
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{success}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
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
          <div className="auth-label">
            <span>Password</span>
          </div>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="••••••••••••"
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
        </div>

        <div className="auth-options-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember this device</span>
          </label>
          <button
            type="button"
            className="auth-link auth-link-forgot"
            onClick={() => onNavigate('forgot-password')}
          >
            Forgot Password?
          </button>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In</span>
              <LogIn size={18} />
            </>
          )}
        </button>
      </form>


      <p className="auth-footer-text">
        Don't have an account?{' '}
        <button type="button" className="auth-link" onClick={() => onNavigate('register')}>
          Sign Up
        </button>
      </p>
    </div>
  );
}
