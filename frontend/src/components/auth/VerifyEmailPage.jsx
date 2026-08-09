import React, { useState, useRef, useEffect } from 'react';
import { MailCheck, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import './auth.css';

export default function VerifyEmailPage({ onNavigate = () => {}, userEmail = 'alex.morgan@company.com' }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(59);
  const [resendMessage, setResendMessage] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setResendMessage('A new 6-digit verification code has been sent to your email.');
    setResendTimer(60);
    setTimeout(() => setResendMessage(''), 4000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
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
          <MailCheck size={26} />
        </div>
        <h2 className="auth-title">Verify Your Email</h2>
        <p className="auth-subtitle">
          We sent a 6-digit verification code to <br />
          <strong style={{ color: 'var(--text)' }}>{userEmail}</strong>
        </p>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {resendMessage && (
        <div className="auth-alert auth-alert-success">
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{resendMessage}</span>
        </div>
      )}

      {success ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Email Account Verified!</strong>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                Your email address has been verified. Welcome to CollabBoard!
              </div>
            </div>
          </div>

          <button
            type="button"
            className="auth-submit-btn"
            onClick={() => onNavigate('login')}
          >
            <span>Proceed to Workspace</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label" style={{ justifyContent: 'center', marginBottom: '8px' }}>
              Enter 6-Digit Verification Code
            </label>

            <div className="otp-container" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span>Verifying code...</span>
            ) : (
              <>
                <span>Confirm & Verify</span>
                <CheckCircle2 size={18} />
              </>
            )}
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
            {resendTimer > 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                Resend code in <strong style={{ color: 'var(--accent-color)' }}>{resendTimer}s</strong>
              </span>
            ) : (
              <button
                type="button"
                className="auth-link"
                onClick={handleResendCode}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} />
                <span>Resend Verification Code</span>
              </button>
            )}
          </div>
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
