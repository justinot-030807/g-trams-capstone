import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, CheckCircle2, Clock, AlertTriangle, User, LogOut, FileText, Menu } from 'lucide-react';

const TopNavbar = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'operator';
  const [userName, setUserName] = useState(localStorage.getItem('name') || 'User');
  const [profilePic, setProfilePic] = useState(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const storageKey = `gtrams_notifications_${role}`;

  // Default initial list kung wala pang saved state sa browser
  const defaultAdminNotifs = [
    {
      id: 1,
      title: 'New Franchise Application',
      desc: 'Jay Vincent submitted a new application for GSTODA.',
      time: 'Recent',
      type: 'pending',
      read: false,
      link: '/franchise-approval'
    },
    {
      id: 2,
      title: 'TODA Masterlist Updated',
      desc: 'Gasan Central TODA submitted updated member records.',
      time: 'Recent',
      type: 'info',
      read: false,
      link: '/validate-toda'
    }
  ];

  const defaultOperatorNotifs = [
    {
      id: 1,
      title: 'Franchise Approved!',
      desc: 'Your application for Plate 45TYRFR4 is now active. You may print your MTOP permit.',
      time: 'Recent',
      type: 'success',
      read: false,
      link: '/operator-dashboard'
    }
  ];

  // Kunin ang notifications mula sa LocalStorage para hindi mag-reset sa refresh
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return role === 'admin' ? defaultAdminNotifs : defaultOperatorNotifs;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const storedName = localStorage.getItem('name');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUserName(parsed.name || parsed.fullName || storedName || 'User');
        setProfilePic(parsed.profilePic || parsed.profilePicUrl || null);
      } catch (e) {
        console.error(e);
      }
    } else if (storedName) {
      setUserName(storedName);
    }

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read at i-save agad sa LocalStorage
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Pag-click sa isang notification
  const handleNotificationClick = (notif) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setIsNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm">
      
      {/* Left Side: Mobile Burger Menu Only */}
      <div className="flex items-center">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors focus:outline-none"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right Side: Notification & Profile */}
      <div className="flex items-center gap-2 sm:gap-3.5 ml-auto">
        
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 rounded-xl border transition-all ${
              isNotifOpen 
                ? 'bg-slate-100 border-slate-300 text-[#7A1B22]' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell size={18} />
            
            {/* Lilitaw LAMANG ang red dot kapag may UNREAD notifications */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">Notifications</h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-[10px] font-bold text-[#7A1B22] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'pending' && <Clock size={15} className="text-amber-500" />}
                        {notif.type === 'success' && <CheckCircle2 size={15} className="text-emerald-500" />}
                        {notif.type === 'info' && <FileText size={15} className="text-blue-500" />}
                        {notif.type === 'reminder' && <AlertTriangle size={15} className="text-orange-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${!notif.read ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">{notif.desc}</p>
                        <span className="text-[9px] text-slate-400 font-medium mt-1 block">{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-full sm:rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7A1B22] text-[#D4AF37] font-bold text-xs flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              {profilePic ? (
                <img src={profilePic} alt="User" className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[110px]">{userName}</span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                {role === 'admin' ? 'Admin' : 'Operator'}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="font-bold text-xs text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 uppercase">{role}</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/manage-profile');
                }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <User size={14} /> Profile Settings
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopNavbar;