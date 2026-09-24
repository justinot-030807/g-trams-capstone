import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/v1/notifications`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data.notifications) ? data.notifications : (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      // Silent fail — notifications are non-critical
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      // Silent fail
    }
  }, [API_URL]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      // Silent fail
    }
  }, [API_URL]);

  // Mark all notifications as read
  const markAllRead = useCallback(async () => {
    try {
      // Optimistic state update: mark all current notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Broadcast event across components and tabs
      try {
        localStorage.setItem('gtrams_all_notifs_read_at', Date.now().toString());
        window.dispatchEvent(new Event('gtrams_all_notifs_read'));
      } catch {}

      const res = await fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      if (!res.ok) {
        // Fallback to DELETE for legacy backends
        await fetch(`${API_URL}/api/v1/notifications/read-all`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
      }
    } catch (err) {
      // Silent fail
    }
  }, [API_URL]);

  // Initial fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleNotificationRead = (data) => {
      if (data?.id) {
        setNotifications(prev => prev.map(n => n._id === data.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    const handleNotificationsReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    socket.on('notification', handleNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notifications_read_all', handleNotificationsReadAll);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notifications_read_all', handleNotificationsReadAll);
    };
  }, [socket]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead,
    fetchNotifications,
    fetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
