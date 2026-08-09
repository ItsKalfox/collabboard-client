import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import './auth.css';

export default function ResetPasswordPage({ onNavigate = () => {} }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <div className="auth-fade-in">
      <div className="auth-header">
        <div className="auth-logo-badge">
          <ShieldCheck size={26} />
        </div>
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Create a secure new password for your account</p>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Password successfully updated!</strong>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                Your account password has been changed. You can now sign in with your new password.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="auth-submit-btn"
            onClick={() => onNavigate('login')}
          >
            <span>Sign In Now</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">New Password</label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

            {newPassword && (
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
            <label className="auth-label">Confirm New Password</label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span>Updating password...</span>
            ) : (
              <>
                <span>Reset Password</span>
                <ShieldCheck size={18} />
              </>
            )}
          </button>
        </form>
      )}

      <p className="auth-footer-text" style={{ marginTop: '24px' }}>
        <button
          type="button"
          className="auth-link"
          onClick={() => onNavigate('login')}
          style={{ display: 'inline-flex', itemsCenter: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </button>
      </p>
    </div>
  );
}
