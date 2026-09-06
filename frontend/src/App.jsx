import { useEffect, useState, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import backgroundBL from './assets/background-BL.jpg';
import backgroundWH from './assets/background-WH.jpg';
import logoWH from './assets/logo-WH.png';
import logoBL from './assets/logo-BL.png';
import ProjectsPage from './components/projects/ProjectsPage';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Settings from './pages/Settings';
import AuthModule from './components/auth/AuthModule';
import ConfirmModal from './components/Board/ConfirmModal';
import { saveUserProfileToDB, getUserProfileFromDB } from './services/dbService';
import NetworkStatusBanner from './components/common/NetworkStatusBanner';
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

  const isDark = theme === 'dark';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isAuthRoute = authRoutes.includes(activeTab);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    handleTabClick('login');
    setIsLogoutConfirmOpen(false);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const restoreLocalSession = async () => {
    setSessionExpired(false);
    const localUserStr = localStorage.getItem('user');
    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr);
        if (parsed) {
          setCurrentUser(parsed);
          return true;
        }
      } catch (e) {
        // Fallback to IndexedDB
      }
    }
    const dbUser = await getUserProfileFromDB();
    if (dbUser) {
      setCurrentUser(dbUser);
      localStorage.setItem('user', JSON.stringify(dbUser));
      return true;
    }
    const fallbackUser = { id: 'offline-user', name: 'Workspace User', email: 'user@collabboard.local' };
    setCurrentUser(fallbackUser);
    localStorage.setItem('user', JSON.stringify(fallbackUser));
    return true;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (!authRoutes.includes(activeTab)) {
        setSessionExpired(true);
      }
      return;
    }

    // 1. OFFLINE-FIRST: Do NOT call /api/auth/me if device is offline.
    // Restore local session immediately and clear sessionExpired state.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      restoreLocalSession();
      return;
    }

    // 2. ONLINE / RACE CONDITION: Call /api/auth/me with AbortController timeout (2.5s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        // Genuine HTTP 401 or 403 response ONLY -> Session Expired
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentUser(null);
          if (!authRoutes.includes(activeTab)) {
            setSessionExpired(true);
          }
          return;
        }
        // Non-200 non-401 HTTP response -> preserve local session without expiring
        if (!res.ok) {
          await restoreLocalSession();
          return;
        }
        // HTTP 200 Success -> Authenticated
        const data = await res.json();
        if (data.status === 'success' && data.data && data.data.user) {
          setCurrentUser(data.data.user);
          setSessionExpired(false);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          saveUserProfileToDB(data.data.user);
        } else {
          await restoreLocalSession();
        }
      })
      .catch(async (err) => {
        // Genuine network error (Offline / Failed to fetch / AbortError) -> DO NOT EXPIRE SESSION
        clearTimeout(timeoutId);
        console.warn('Network error or fetch timeout during auth check. Preserving local user session:', err);
        await restoreLocalSession();
      });
  }, []);




  useEffect(() => {
    document.title = 'CollabBoard';

    const updateDateTime = () => {
      const now = new Date();
      const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentDateTime(now.toLocaleDateString('en-US', options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (authRoutes.includes(path)) {
        setActiveTab(path);
      } else if (path) {
        const capitalized = path.charAt(0).toUpperCase() + path.slice(1);
        if (['Dashboard', 'Board', 'Projects', 'Settings'].includes(capitalized)) {
          setActiveTab(capitalized);
        }
      } else {
        setActiveTab('Dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    window.history.pushState({}, '', '/' + tab.toLowerCase());
    setIsMenuOpen(false); // Close menu on mobile after selection
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setSessionExpired(false);
    localStorage.setItem('user', JSON.stringify(user));
    handleTabClick('Dashboard');
  };

  const [indicatorStyle, setIndicatorStyle] = useState({ opacity: 0 });
  const menuRefs = useRef({});

  useEffect(() => {
    const activeEl = menuRefs.current[activeTab];
    if (activeEl) {
      setIndicatorStyle({
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        width: activeEl.offsetWidth,
        opacity: 1
      });
    }
  }, [activeTab, isMenuOpen, currentUser]);

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
    colorScheme: isDark ? 'dark' : 'light',
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
      <NetworkStatusBanner />
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Log Out"
        message="Are you sure you want to log out?"
        onConfirm={handleLogout}
        confirmText="Logout"
      />
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
          <div className="menu-items" style={{ position: 'relative' }}>
            {/* Sliding Active Indicator */}
            <div
              style={{
                position: 'absolute',
                background: 'var(--item-active-bg)',
                borderRadius: '30px',
                transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                zIndex: 0,
                ...indicatorStyle
              }}
              className={!isDark ? 'light-shadow' : ''}
            />
            {tabs.map(tab => (
              <div
                key={tab}
                ref={el => menuRefs.current[tab] = el}
                className={`menu-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
                style={{ zIndex: 1, position: 'relative' }}
              >
                <span>{tab}</span>
              </div>
            ))}
          </div>

          {/* Profile */}
          <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {!currentUser ? (
              <>
                <div className="skeleton-box" style={{ width: '56px', height: '56px', borderRadius: '50%', marginBottom: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                  <div className="skeleton-box" style={{ width: '80%', height: '16px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '90%', height: '12px', borderRadius: '4px' }} />
                </div>
              </>
            ) : (
              <>
                <div className="profile-pic" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  width: '56px',
                  height: '56px',
                  marginBottom: '4px',
                  overflow: 'hidden'
                }}>
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="profile-name" style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}>{currentUser.name || 'User'}</div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                    marginTop: '2px'
                  }}>{currentUser.email || 'user@example.com'}</div>
                </div>
              </>
            )}

            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
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
              <button type="button" onClick={toggleTheme} className="theme-toggle-btn cursor-pointer icon-btn">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

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
              currentUser={currentUser}
              theme={theme}
            />
          ) : activeTab === 'Projects' ? (
            <ProjectsPage theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} onOpenBoard={handleOpenBoard} />
          ) : activeTab === 'Settings' ? (
            <Settings currentUser={currentUser} setCurrentUser={setCurrentUser} />
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
