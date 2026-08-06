import { useEffect } from 'react';
import backgroundImage from './assets/background.jpg';

function App() {
  useEffect(() => {
    document.title = 'CollabBoard';
  }, []);

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
  };

  return (
    <div style={containerStyle}>
      <div style={windowStyle}></div>
    </div>
  );
}

export default App;
