import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let currentToken = localStorage.getItem('token');

    const initializeSocket = (token) => {
      if (!token) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }

      if (socketRef.current?.connected) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const newSocket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
      });

      newSocket.on('connect', () => setIsConnected(true));
      newSocket.on('disconnect', () => setIsConnected(false));
      newSocket.on('connect_error', () => setIsConnected(false));

      socketRef.current = newSocket;
      setSocket(newSocket);
    };

    // Initial check
    initializeSocket(currentToken);

    // Poll for token changes (since Login.jsx doesn't trigger storage event in same window)
    const interval = setInterval(() => {
      const newToken = localStorage.getItem('token');
      if (newToken !== currentToken) {
        currentToken = newToken;
        initializeSocket(newToken);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
