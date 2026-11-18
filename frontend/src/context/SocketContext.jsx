import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const activeTokenRef = useRef(null);

  useEffect(() => {
    let currentToken = localStorage.getItem('token');

    const teardownSocket = () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      activeTokenRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };

    const initializeSocket = (token) => {
      if (!token) {
        teardownSocket();
        return;
      }

      if (socketRef.current && activeTokenRef.current === token) {
        if (!socketRef.current.connected) {
          socketRef.current.connect();
        }
        return;
      }

      // Token changed or previous socket belongs to another session — disconnect immediately
      teardownSocket();

      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = rawApiUrl.includes('workers.dev')
        ? 'https://g-trams-web2.onrender.com'
        : rawApiUrl;
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
      newSocket.on('connect_error', (err) => {
        setIsConnected(false);
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('authentication error') || msg.includes('expired') || msg.includes('deactivated')) {
          newSocket.disconnect();
        }
      });

      activeTokenRef.current = token;
      socketRef.current = newSocket;
      setSocket(newSocket);
    };

    const syncToken = () => {
      const newToken = localStorage.getItem('token');
      if (newToken !== currentToken) {
        currentToken = newToken;
        initializeSocket(newToken);
      }
    };

    // Initial check
    initializeSocket(currentToken);

    // Poll & listen for token changes across login/logout/session updates
    const interval = setInterval(syncToken, 1000);
    window.addEventListener('storage', syncToken);
    window.addEventListener('focus', syncToken);
    window.addEventListener('gtrams-auth-change', syncToken);
    window.addEventListener('gtrams-auth-changed', syncToken);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncToken);
      window.removeEventListener('focus', syncToken);
      window.removeEventListener('gtrams-auth-change', syncToken);
      window.removeEventListener('gtrams-auth-changed', syncToken);
      teardownSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
