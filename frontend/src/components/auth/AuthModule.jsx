import React, { useState } from 'react';
import AuthContainer from './AuthContainer';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import VerifyEmailPage from './VerifyEmailPage';

export default function AuthModule({
  theme = 'dark',
  toggleTheme = () => {},
  initialPage = 'login',
  onLoginSuccess = () => {}
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [userEmail, setUserEmail] = useState('alex.morgan@company.com');

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.history.pushState({}, '', '/' + page);
  };

  const handleRegisterSuccess = (email) => {
    if (email) setUserEmail(email);
    handleNavigate('verify-email');
  };

  return (
    <AuthContainer
      theme={theme}
      toggleTheme={toggleTheme}
      activePage={currentPage}
      onNavigate={handleNavigate}
    >
      {currentPage === 'login' && (
        <LoginPage
          onNavigate={handleNavigate}
          onLoginSuccess={onLoginSuccess}
        />
      )}
      {currentPage === 'register' && (
        <RegisterPage
          onNavigate={handleNavigate}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
      {currentPage === 'forgot-password' && (
        <ForgotPasswordPage
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'reset-password' && (
        <ResetPasswordPage
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'verify-email' && (
        <VerifyEmailPage
          onNavigate={handleNavigate}
          userEmail={userEmail}
        />
      )}
    </AuthContainer>
  );
}
