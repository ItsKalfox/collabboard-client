import React, { useState, useEffect } from 'react';
import logoWH from '../../assets/logo-WH.png';
import loginBg from '../../assets/login-bg.png';
import './auth.css';

export default function AuthContainer({
  activePage = 'login',
  onNavigate = () => {},
  children
}) {
  const isSignUp = activePage === 'register';

  // State to hold the content that is currently visible, updated halfway through animation
  const [displayState, setDisplayState] = useState({
    page: activePage,
    children: children,
    isSignUpContent: isSignUp
  });

  useEffect(() => {
    if (activePage !== displayState.page) {
      // Trigger the content swap halfway through the 600ms animation (300ms)
      const timer = setTimeout(() => {
        setDisplayState({
          page: activePage,
          children: children,
          isSignUpContent: activePage === 'register'
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Update immediately for normal re-renders (like typing in input fields)
      setDisplayState(prev => ({
        ...prev,
        children: children
      }));
    }
  }, [activePage, children, displayState.page]);

  return (
    <div className="auth-page-container dark">
      <div 
        className={`auth-split-window ${isSignUp ? 'is-signup' : ''} ${displayState.isSignUpContent ? 'is-signup-content' : ''}`}
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
            {displayState.children}
          </div>
        </div>
      </div>
    </div>
  );
}
