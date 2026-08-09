import React, { useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import logoWH from '../../assets/logo-WH.png';
import logoBL from '../../assets/logo-BL.png';
import './auth.css';

export default function AuthContainer({
  theme = 'dark',
  toggleTheme = () => {},
  activePage = 'login',
  onNavigate = () => {},
  children
}) {
  const isDark = theme !== 'light';

  return (
    <div className="auth-page-container">
      <div className={`auth-card ${isDark ? '' : 'light'} auth-fade-in`}>
        {/* Top Control Bar with Logo and Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src={isDark ? logoWH : logoBL} 
              alt="CollabBoard Logo" 
              style={{ height: '30px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
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
              <Sun size={18} color="black" />
            ) : (
              <Moon size={18} color="black" />
            )}
          </button>
        </div>

        {/* Page Content Container */}
        {children}
      </div>
    </div>
  );
}
