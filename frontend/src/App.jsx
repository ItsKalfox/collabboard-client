import { useEffect, useState } from 'react';
import backgroundBL from './assets/background-BL.jpg';
import backgroundWH from './assets/background-WH.jpg';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [theme, setTheme] = useState('dark');

  const isDark = theme === 'dark';

  useEffect(() => {
    document.title = 'CollabBoard';

    // Parse initial path for tab state
    const path = window.location.pathname.replace('/', '');
    if (path) {
      const capitalized = path.charAt(0).toUpperCase() + path.slice(1);
      if (['Dashboard', 'Schedule', 'Projects', 'Settings'].includes(capitalized)) {
        setActiveTab(capitalized);
      }
    } else {
      setActiveTab('Dashboard');
    }

    // Update Date and Time
    const updateDateTime = () => {
      const now = new Date();
      const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentDateTime(now.toLocaleDateString('en-US', options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    window.history.pushState({}, '', '/' + tab.toLowerCase());
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundImage: isDark ? `url(${backgroundBL})` : `url(${backgroundWH})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: isDark ? '#000000' : '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
    transition: 'background-image 0.3s ease, background-color 0.3s ease',
  };

  const windowStyle = {
    width: '70vw',
    height: '85vh',
    borderRadius: '24px',
    background: isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: isDark ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
    transition: 'all 0.3s ease',
  };

  const menuBarStyle = {
    width: '220px',
    height: '100%',
    borderRadius: '20px',
    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 20px',
    boxSizing: 'border-box',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
  };

  const logoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '40px',
  };

  const logoStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  };

  const menuItemsContainer = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    flex: 1,
    justifyContent: 'center',
  };

  const getMenuItemStyle = (tabName) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: activeTab === tabName ? (isDark ? '#fff' : '#000') : (isDark ? '#aaa' : '#555'),
    background: activeTab === tabName ? (isDark ? '#111' : '#fff') : 'transparent',
    padding: '12px 20px',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: (activeTab === tabName && !isDark) ? '0 4px 15px rgba(0, 0, 0, 0.05)' : 'none',
  });

  const profileContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  };

  const profilePicStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: isDark ? '#333' : '#ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s ease',
  };

  const mainContentStyle = {
    flex: 1,
    padding: '20px 40px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  const topBarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  };

  const dateContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
    padding: '8px 20px',
    borderRadius: '20px',
    color: isDark ? '#ddd' : '#333',
    fontSize: '14px',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
  };

  const topBarActionsStyle = {
    display: 'flex',
    gap: '15px',
  };

  const iconButtonStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 255, 255, 0.3)',
    color: isDark ? '#ccc' : '#333',
    transition: 'all 0.3s ease',
  };

  const tabTitleStyle = {
    fontSize: '36px',
    fontWeight: '600',
    color: isDark ? '#fff' : '#111',
    margin: 0,
    transition: 'color 0.3s ease',
  };

  const tabs = ['Dashboard', 'Schedule', 'Projects', 'Settings'];

  return (
    <div style={containerStyle}>
      <div style={windowStyle}>
        
        {/* Menu Bar Card */}
        <div style={menuBarStyle}>
          {/* Logo */}
          <div style={logoContainerStyle}>
            <img 
              src="/src/assets/logo.png" 
              alt="Logo" 
              style={logoStyle} 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          </div>

          {/* Menu Items */}
          <div style={menuItemsContainer}>
            {tabs.map(tab => (
              <div 
                key={tab} 
                style={getMenuItemStyle(tab)} 
                onClick={() => handleTabClick(tab)}
              >
                <span>{tab}</span>
              </div>
            ))}
          </div>

          {/* Profile */}
          <div style={profileContainerStyle}>
            <div style={profilePicStyle}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: isDark ? '#888' : '#777' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div style={{ color: isDark ? '#ccc' : '#333', fontSize: '14px', fontWeight: '500', transition: 'color 0.3s ease' }}>Name</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={mainContentStyle}>
          
          {/* Top Bar */}
          <div style={topBarStyle}>
            {/* Tab Title */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <h1 style={tabTitleStyle}>{activeTab}</h1>
            </div>
            
            {/* Date and Time */}
            <div style={dateContainerStyle}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {currentDateTime}
            </div>

            {/* Actions: Theme Toggle and Email */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={topBarActionsStyle}>
                
                {/* Theme Toggle Button */}
                <div style={iconButtonStyle} onClick={toggleTheme}>
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
                <div style={iconButtonStyle}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;
