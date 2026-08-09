import React from 'react';
import logoWH from '../../assets/logo-WH.png';
import loginBg from '../../assets/login-bg.png';
import './auth.css';

export default function AuthContainer({
  activePage = 'login',
  onNavigate = () => {},
  children
}) {
  return (
    <div className="auth-page-container dark">
      <div 
        className="auth-split-window"
        style={{ 
          backgroundImage: `url(${loginBg})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        {/* Left Side: Transparent area with text */}
        <div className="auth-left-pane">
          {/* Logo at Top Left */}
          <div className="auth-left-logo">
            <img 
              src={logoWH} 
              alt="CollabBoard Logo" 
              style={{ height: '36px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          
          <div className="auth-left-text">
            <h1>CollabBoard</h1>
            <p>Your ultimate Kanban board for seamless team collaboration and project tracking.</p>
          </div>
        </div>

        {/* Right Side: Glassmorphism Login Form */}
        <div className="auth-right-pane auth-card auth-fade-in">
          <div className="auth-right-content">
            {/* Page Content Container */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
