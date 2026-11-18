import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

const getSessionIdentity = () => {
  const token = localStorage.getItem('token') || '';
  let uid = localStorage.getItem('userId') || '';
  if (!uid) {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      uid = u._id || u.id || u.email || '';
    } catch {}
  }
  return `${token}::${uid}`;
};

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const notifAbortRef = useRef(null);
  const unreadAbortRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const getHeaders = (reqToken) => ({
    'Authorization': `Bearer ${reqToken ?? localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  // Fetch notifications from backend (session-scoped + AbortController to prevent cross-account race)
  const fetchNotifications = useCallback(async () => {
    const reqToken = localStorage.getItem('token');
    if (!reqToken) return;
    const reqSessionKey = getSessionIdentity();

    if (notifAbortRef.current) {
      notifAbortRef.current.abort();
    }
    const controller = new AbortController();
    notifAbortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/api/v1/notifications`, {
        headers: getHeaders(reqToken),
        signal: controller.signal,
      });

      if (controller.signal.aborted || getSessionIdentity() !== reqSessionKey) return;

      if (res.ok) {
        const data = await res.json();
        if (controller.signal.aborted || getSessionIdentity() !== reqSessionKey) return;
        setNotifications(Array.isArray(data.notifications) ? data.notifications : (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      // Silent fail / ignore AbortError
    } finally {
      if (!controller.signal.aborted && getSessionIdentity() === reqSessionKey) {
        setIsLoading(false);
      }
    }
  }, [API_URL]);

  // Fetch unread count (session-scoped + AbortController)
  const fetchUnreadCount = useCallback(async () => {
    const reqToken = localStorage.getItem('token');
    if (!reqToken) return;
    const reqSessionKey = getSessionIdentity();

    if (unreadAbortRef.current) {
      unreadAbortRef.current.abort();
    }
    const controller = new AbortController();
    unreadAbortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
        headers: getHeaders(reqToken),
        signal: controller.signal,
      });

      if (controller.signal.aborted || getSessionIdentity() !== reqSessionKey) return;

      if (res.ok) {
        const data = await res.json();
        if (controller.signal.aborted || getSessionIdentity() !== reqSessionKey) return;
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      // Silent fail / ignore AbortError
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

  // Mark all notifications as read without deleting history
  const markAllRead = useCallback(async () => {
    try {
      // Optimistic state update: mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);

      // Broadcast event across components and tabs
      try {
        localStorage.setItem('gtrams_all_notifs_read_at', Date.now().toString());
        window.dispatchEvent(new Event('gtrams_all_notifs_read'));
      } catch {}

      await fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders(),
      });
    } catch (err) {
      // Silent fail
    }
  }, [API_URL]);

  // Delete individual notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      await fetch(`${API_URL}/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (err) {
      // Silent fail
    }
  }, [API_URL]);

  // Track active user session (token + userId) and clear/re-fetch notifications on account switch or logout
  useEffect(() => {
    const abortPendingFetches = () => {
      if (notifAbortRef.current) {
        notifAbortRef.current.abort();
        notifAbortRef.current = null;
      }
      if (unreadAbortRef.current) {
        unreadAbortRef.current.abort();
        unreadAbortRef.current = null;
      }
    };

    const clearCachedSessionData = () => {
      abortPendingFetches();
      setNotifications([]);
      setUnreadCount(0);
      try {
        localStorage.removeItem('gtrams_all_notifs_read_at');
        localStorage.removeItem('gtrams_cached_notifications');
      } catch {}
    };

    let currentIdentity = getSessionIdentity();
    if (localStorage.getItem('token')) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      clearCachedSessionData();
      setIsLoading(false);
    }

    const syncSessionNotifications = () => {
      const nextIdentity = getSessionIdentity();
      if (nextIdentity !== currentIdentity) {
        currentIdentity = nextIdentity;
        clearCachedSessionData();
        if (localStorage.getItem('token')) {
          setIsLoading(true);
          fetchNotifications();
          fetchUnreadCount();
        } else {
          setIsLoading(false);
        }
      }
    };

    const interval = setInterval(syncSessionNotifications, 1000);
    window.addEventListener('storage', syncSessionNotifications);
    window.addEventListener('focus', syncSessionNotifications);
    window.addEventListener('gtrams-auth-change', syncSessionNotifications);
    window.addEventListener('gtrams-auth-changed', syncSessionNotifications);

    return () => {
      clearInterval(interval);
      abortPendingFetches();
      window.removeEventListener('storage', syncSessionNotifications);
      window.removeEventListener('focus', syncSessionNotifications);
      window.removeEventListener('gtrams-auth-change', syncSessionNotifications);
      window.removeEventListener('gtrams-auth-changed', syncSessionNotifications);
    };
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

    const handleNotificationDeleted = (data) => {
      if (data?.id) {
        setNotifications(prev => prev.filter(n => n._id !== data.id));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    const handleNotificationsMarkedRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    const handleNotificationsCleared = () => {
      setNotifications([]);
      setUnreadCount(0);
    };

    socket.on('notification', handleNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notification_deleted', handleNotificationDeleted);
    socket.on('notifications_marked_read', handleNotificationsMarkedRead);
    socket.on('notifications_read_all', handleNotificationsCleared);
    socket.on('notifications_cleared', handleNotificationsCleared);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notification_deleted', handleNotificationDeleted);
      socket.off('notifications_marked_read', handleNotificationsMarkedRead);
      socket.off('notifications_read_all', handleNotificationsCleared);
      socket.off('notifications_cleared', handleNotificationsCleared);
    };
  }, [socket]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead,
    deleteNotification,
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
