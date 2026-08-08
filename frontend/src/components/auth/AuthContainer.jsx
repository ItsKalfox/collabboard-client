import React, { useEffect, useRef } from 'react';
import { Sun, Moon, ShieldCheck } from 'lucide-react';
import './auth.css';

export default function AuthContainer({
  theme = 'dark',
  toggleTheme = () => {},
  activePage = 'login',
  onNavigate = () => {},
  children
}) {
  const isDark = theme !== 'light';
  const tabRefs = useRef({});

  useEffect(() => {
    if (tabRefs.current[activePage]) {
      tabRefs.current[activePage].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activePage]);

  const navItems = [
    { id: 'login', label: 'Login' },
    { id: 'register', label: 'Register' },
    { id: 'forgot-password', label: 'Forgot Password' },
    { id: 'reset-password', label: 'Reset Password' },
    { id: 'verify-email', label: 'Verify Email' }
  ];

  return (
    <div className="auth-page-container">
      <div className={`auth-card ${isDark ? '' : 'light'} auth-fade-in`}>
        {/* Top Control Bar with Icon-Only Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)' }}>
            <ShieldCheck size={14} color="var(--accent-color)" />
            <span>CollabBoard Auth</span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun size={18} color="#f59e0b" />
            ) : (
              <Moon size={18} color="#4f46e5" />
            )}
          </button>
        </div>

        {/* Auth Pages Selector Header */}
        <div className="auth-nav-header">
          {navItems.map((item) => (
            <button
              key={item.id}
              ref={(el) => (tabRefs.current[item.id] = el)}
              className={`auth-nav-tab ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Page Content Container */}
        {children}
      </div>
    </div>
  );
}
