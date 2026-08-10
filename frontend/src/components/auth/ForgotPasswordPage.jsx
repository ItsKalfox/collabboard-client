import React, { useState, useEffect, useRef } from 'react';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Send, ArrowRight, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import './auth.css';

export default function ForgotPasswordPage({ onNavigate = () => {} }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Reset, 3: Success
  const [email, setEmail] = useState('');
  
  // Step 2 state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Timer effect
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep(2);
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

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

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString, newPassword })
      });
      
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep(3);
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  const isResetDisabled = loading || otp.join('').length !== 6 || !newPassword || !confirmPassword || newPassword !== confirmPassword;

  return (
    <div className="auth-fade-in">
      {step !== 3 && (
        <div className="auth-header">
          <div className="auth-logo-badge">
            {step === 1 ? <KeyRound size={26} /> : <ShieldCheck size={26} />}
          </div>
          <h2 className="auth-title">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p className="auth-subtitle">
            {step === 1
              ? 'Enter your registered email address to receive an OTP.'
              : 'Enter the 6-digit OTP and create a secure new password.'}
          </p>
        </div>
      )}

      {error && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <form className="auth-form" onSubmit={handleSendOtp}>
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
              <span>Sending OTP...</span>
            ) : (
              <>
                <span>Send OTP</span>
                <Send size={18} />
              </>
            )}
          </button>
        </form>
      )}

      {step === 2 && (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <div className="auth-input-group" style={{ alignItems: 'center' }}>
            <label className="auth-label">Enter 6-digit OTP</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  style={{
                    width: '40px',
                    height: '48px',
                    textAlign: 'center',
                    fontSize: '20px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)'
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              OTP expires in: <strong style={{ color: timeLeft <= 60 ? '#ef4444' : 'inherit' }}>{formatTime(timeLeft)}</strong>
            </div>
          </div>

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

          <button type="submit" className="auth-submit-btn" disabled={isResetDisabled}>
            {loading ? (
              <span>Verifying & Resetting...</span>
            ) : (
              <>
                <span>Verify and Reset Password</span>
                <ShieldCheck size={18} />
              </>
            )}
          </button>
        </form>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--text-primary)', opacity: 0.9 }} />
            <h2 className="auth-title" style={{ margin: 0 }}>Password Reset</h2>
            <p className="auth-subtitle" style={{ maxWidth: '280px', margin: '0 auto' }}>
              Your password has been successfully updated. You can now log in with your new password.
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

      {step !== 3 && (
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
      )}
    </div>
  );
}
