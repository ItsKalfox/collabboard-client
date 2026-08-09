import { useEffect, useState } from 'react';
import backgroundBL from './assets/background-BL.jpg';
import backgroundWH from './assets/background-WH.jpg';
import logoWH from './assets/logo-WH.png';
import logoBL from './assets/logo-BL.png';
import ProjectsPage from './components/projects/ProjectsPage';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import AuthModule from './components/auth/AuthModule';
import './App.css';

function App() {
  const authRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'verify-email'];

  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.replace('/', '');
    if (authRoutes.includes(path)) {
      return path;
    }
    if (path) {
      const capitalized = path.charAt(0).toUpperCase() + path.slice(1);
      if (['Dashboard', 'Board', 'Projects', 'Settings'].includes(capitalized)) {
        return capitalized;
      }
    }
    return 'Dashboard';
  });

  const [currentDateTime, setCurrentDateTime] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    document.title = 'CollabBoard';

    const updateDateTime = () => {
      const now = new Date();
      const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentDateTime(now.toLocaleDateString('en-US', options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    window.history.pushState({}, '', '/' + tab.toLowerCase());
    setIsMenuOpen(false); // Close menu on mobile after selection
  };

  const handleLoginSuccess = () => {
    handleTabClick('Dashboard');
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  const themeVars = {
    '--bg-image': isDark ? `url(${backgroundBL})` : `url(${backgroundWH})`,
    '--bg-color': isDark ? '#000000' : '#ffffff',
    '--window-bg': isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(255, 255, 255, 0.25)',
    '--window-border': isDark ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
    '--window-shadow': isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
    '--menu-bg': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
    '--menu-border': isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 255, 255, 0.3)',
    '--text-primary': isDark ? '#fff' : '#111',
    '--text-secondary': isDark ? '#aaa' : '#555',
    '--text-tertiary': isDark ? '#ccc' : '#333',
    '--item-active-bg': isDark ? '#111' : '#fff',
    '--item-active-color': isDark ? '#fff' : '#000',
    '--avatar-bg': isDark ? '#333' : '#ddd',
    '--avatar-icon': isDark ? '#888' : '#777',
  };

  const tabs = ['Dashboard', 'Board', 'Projects', 'Settings'];

  if (authRoutes.includes(activeTab)) {
    return (
      <div className="app-container" style={themeVars}>
        <AuthModule 
          theme={theme} 
          toggleTheme={toggleTheme} 
          initialPage={activeTab} 
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className="app-container" style={themeVars}>
      <div className="app-window">

        {/* Mobile Overlay */}
        <div
          className={`mobile-overlay ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        ></div>

        {/* Menu Bar Card */}
        <div className={`menu-bar ${isMenuOpen ? 'open' : ''}`}>
          {/* Logo */}
          <div className="logo-container">
            <img
              src={isDark ? logoWH : logoBL}
              alt="Logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Menu Items */}
          <div className="menu-items">
            {tabs.map(tab => (
              <div
                key={tab}
                className={`menu-item ${activeTab === tab ? 'active' : ''} ${!isDark && activeTab === tab ? 'light-shadow' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                <span>{tab}</span>
              </div>
            ))}
          </div>

          {/* Profile */}
          <div className="profile-container">
            <div className="profile-pic">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--avatar-icon)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="profile-name">Name</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">

          {/* Top Bar */}
          <div className="top-bar">
            {/* Tab Title */}
            <div className="tab-title-container">
              <button
                className="burger-btn"
                onClick={() => setIsMenuOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h1 className="tab-title">{activeTab}</h1>
            </div>

            {/* Date and Time */}
            <div className="date-container">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {currentDateTime}
            </div>

            {/* Actions: Theme Toggle and Email */}
            <div className="top-bar-actions">

              {/* Theme Toggle Button */}
              <div className="icon-btn" onClick={toggleTheme}>
                {isDark ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </div>

              {/* Email Button */}
              <div className="icon-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Page Content */}
          {activeTab === 'Dashboard' ? (
            <Dashboard />
          ) : activeTab === 'Board' ? (
            <Board />
          ) : activeTab === 'Projects' ? (
            <ProjectsPage theme={theme} toggleTheme={toggleTheme} />
          ) : (
            <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>
              {activeTab} content view...
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default App;
