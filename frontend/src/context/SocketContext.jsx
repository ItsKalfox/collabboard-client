import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    const newSocket = io(apiUrl, {
      autoConnect: false,
      auth: { token }
    });
    setSocket(newSocket);
    newSocket.connect();

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        setConnectionState('disconnected');
      } else {
        // Network drop or server crash, Socket.IO auto-reconnects
        setConnectionState('reconnecting');
      }
    });

    newSocket.io.on('reconnect_attempt', () => {
      setConnectionState('reconnecting');
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
      setConnectionState('reconnecting'); // It will automatically keep retrying
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionState }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Custom hook to consume the SocketContext
 */
export const useSocket = () => {
  return useContext(SocketContext);
};
