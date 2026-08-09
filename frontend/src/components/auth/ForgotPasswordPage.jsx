import React, { useState } from 'react';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Send, ArrowRight } from 'lucide-react';
import './auth.css';

export default function ForgotPasswordPage({ onNavigate = () => {} }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSentSuccess(true);
    }, 1000);
  };

  return (
    <div className="auth-fade-in">
      <div className="auth-header">
        <div className="auth-logo-badge">
          <KeyRound size={26} />
        </div>
        <h2 className="auth-title">Forgot Password?</h2>
        <p className="auth-subtitle">
          {sentSuccess
            ? 'We have sent password reset instructions to your email.'
            : 'Enter your registered email address to receive a password reset link.'}
        </p>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {sentSuccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Reset link sent!</strong>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                Check your inbox for <strong>{email}</strong> and follow the link to create a new password.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'var(--surface-hi)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)' }}>
              Next Step Options:
            </div>

            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => onNavigate('reset-password')}
              style={{ marginTop: 0 }}
            >
              <span>Proceed to Reset Password Page</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="auth-social-btn"
              onClick={() => onNavigate('verify-email')}
              style={{ justifyContent: 'center' }}
            >
              <span>Or Verify with Security Code</span>
            </button>
          </div>
        </div>
      ) : (
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
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span>Sending instructions...</span>
            ) : (
              <>
                <span>Send Reset Link</span>
                <Send size={18} />
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
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </button>
      </p>
    </div>
  );
}
