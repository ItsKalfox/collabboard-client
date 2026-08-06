import { useEffect, useState } from 'react';
import backgroundImage from './assets/background.jpg';

function App() {
  const [activeTab, setActiveTab] = useState('Projects');
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    document.title = 'CollabBoard';

    // Parse initial path for tab state
    const path = window.location.pathname.replace('/', '');
    if (path) {
      const capitalized = path.charAt(0).toUpperCase() + path.slice(1);
      if (['Home', 'Schedule', 'Projects', 'Settings'].includes(capitalized)) {
        setActiveTab(capitalized);
      }
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

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
  };

  const windowStyle = {
    width: '70vw',
    height: '85vh',
    borderRadius: '24px',
    background: 'rgba(30, 30, 30, 0.5)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: 'none',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  };

  const menuBarStyle = {
    width: '220px',
    height: '100%',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 20px',
    boxSizing: 'border-box',
    border: '1px solid rgba(255, 255, 255, 0.05)',
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
    color: activeTab === tabName ? '#fff' : '#aaa',
    background: activeTab === tabName ? '#111' : 'transparent',
    padding: '12px 20px',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
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
    backgroundColor: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '8px 20px',
    borderRadius: '20px',
    color: '#ddd',
    fontSize: '14px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  };

  const topBarActionsStyle = {
    display: 'flex',
    gap: '15px',
  };

  const iconButtonStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#ccc',
  };

  const tabTitleStyle = {
    fontSize: '36px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  };

  const tabs = ['Home', 'Schedule', 'Projects', 'Settings'];

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
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#888' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div style={{ color: '#ccc', fontSize: '14px', fontWeight: '500' }}>Name</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={mainContentStyle}>
          
          {/* Top Bar */}
          <div style={topBarStyle}>
            <div style={{ flex: 1 }}></div> {/* Spacer */}
            
            {/* Date and Time */}
            <div style={dateContainerStyle}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {currentDateTime}
            </div>

            {/* Actions: Email and Notification */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={topBarActionsStyle}>
                <div style={iconButtonStyle}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div style={iconButtonStyle}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Title */}
          <div>
            <h1 style={tabTitleStyle}>{activeTab}</h1>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;
