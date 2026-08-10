import React, { useState, useEffect } from 'react';
import logoWH from '../../assets/logo-WH.png';
import logoBL from '../../assets/logo-BL.png';
import backgroundBL from '../../assets/background-BL.jpg';
import backgroundWH from '../../assets/background-WH.jpg';
import './auth.css';

export default function AuthContainer({
  activePage = 'login',
  onNavigate = () => {},
  theme = 'dark',
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
    <div className={`auth-page-container ${theme}`}>
      <div 
        className={`auth-split-window ${isSignUp ? 'is-signup' : ''} ${displayState.isSignUpContent ? 'is-signup-content' : ''}`}
        style={{ 
          backgroundImage: theme === 'dark' ? `url(${backgroundBL})` : `url(${backgroundWH})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        {/* Left Side: Transparent area with text */}
        <div className="auth-left-pane">
          {/* Logo at Top Left */}
          <div className="auth-left-logo">
            <img 
              src={theme === 'dark' ? logoWH : logoBL} 
              alt="CollabBoard Logo" 
              style={{ height: '48px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          
          <div className="auth-left-text">
            <h1>CollabBoard</h1>
            <p>Your ultimate Kanban board for seamless team collaboration and project tracking.</p>
          </div>
        </div>

        {/* Right Side: Glassmorphism Login Form */}
        <div className={`auth-right-pane auth-card ${theme === 'light' ? 'light' : ''} auth-fade-in`}>
          <div className="auth-right-content">
            {/* Page Content Container */}
            {displayState.children}
          </div>
        </div>
      </div>
    </div>
  );
}
