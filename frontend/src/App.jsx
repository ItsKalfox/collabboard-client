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
  const authRoutes = ['login', 'register', 'forgot-password', 'verify-email'];

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
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isAuthRoute = authRoutes.includes(activeTab);
  const isDark = theme === 'dark';

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.user) {
          setCurrentUser(data.data.user);
        } else {
          localStorage.removeItem('token');
          if (!authRoutes.includes(activeTab)) setSessionExpired(true);
        }
      })
      .catch(err => {
        console.error('Failed to fetch user:', err);
        if (!authRoutes.includes(activeTab)) setSessionExpired(true);
      });
    } else {
      if (!authRoutes.includes(activeTab)) {
        setSessionExpired(true);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    handleTabClick('Dashboard');
  };

  const [selectedProject, setSelectedProject] = useState(null);

  const handleOpenBoard = (project) => {
    setSelectedProject(project);
    handleTabClick('Board');
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
      <div className="app-container auth-bg-blur" style={themeVars}>
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
      {sessionExpired && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backdropFilter: 'blur(10px)',
          backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: isDark ? '#1f2937' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            padding: '32px 40px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            color: isDark ? '#ffffff' : '#111827',
            maxWidth: '400px',
            width: '90%'
          }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke={isDark ? '#fca5a5' : '#ef4444'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px auto', display: 'block' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '700' }}>Session Expired</h2>
            <p style={{ margin: '0 0 24px 0', color: isDark ? '#9ca3af' : '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>Your session is invalid or has expired. Please sign in again to continue.</p>
            <button 
              onClick={() => {
                setSessionExpired(false);
                handleTabClick('login');
              }}
              style={{
                background: isDark ? '#ffffff' : '#111827',
                color: isDark ? '#000000' : '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                fontSize: '14px',
                transition: 'opacity 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Go back to Login
            </button>
          </div>
        </div>
      )}
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
          <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div className="profile-pic" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              width: '56px',
              height: '56px',
              marginBottom: '4px'
            }}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
              <div className="profile-name" style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: '600'
              }}>{currentUser?.name || 'Loading...'}</div>
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                textAlign: 'center',
                marginTop: '2px'
              }}>{currentUser?.email || '...'}</div>
            </div>
            
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                setCurrentUser(null);
                handleTabClick('login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'transparent',
                border: '1px solid var(--menu-border)',
                color: 'var(--text-secondary)',
                padding: '8px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--menu-border)'; }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
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
            <Board 
              initialProjectId={typeof selectedProject === 'object' ? selectedProject?.id : selectedProject} 
              selectedProject={typeof selectedProject === 'object' ? selectedProject : null}
              onSelectProject={(id) => setSelectedProject(id)} 
            />
          ) : activeTab === 'Projects' ? (
            <ProjectsPage theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} onOpenBoard={handleOpenBoard} />
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
