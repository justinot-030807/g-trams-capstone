import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, CheckCircle2, Clock, AlertTriangle, User, LogOut, FileText, Menu } from 'lucide-react';

const TopNavbar = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem('role') || 'operator');
  const [userName, setUserName] = useState(localStorage.getItem('name') || 'User');
  const [profilePic, setProfilePic] = useState(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // NOTIFICATION DATA (MOCK / DYNAMIC)
  const [notifications, setNotifications] = useState(() => {
    if (role === 'admin') {
      return [
        {
          id: 1,
          title: 'New Franchise Application',
          desc: 'Jay Vincent submitted a new franchise application for GSTODA.',
          time: '5 mins ago',
          type: 'pending',
          read: false,
          link: '/franchise-approval'
        },
        {
          id: 2,
          title: 'TODA Masterlist Updated',
          desc: 'Gasan Central TODA submitted updated member records.',
          time: '1 hour ago',
          type: 'info',
          read: false,
          link: '/validate-toda'
        }
      ];
    } else {
      return [
        {
          id: 1,
          title: 'Franchise Approved!',
          desc: 'Your application for Plate 45TYRFR4 is now active. You may print your MTOP permit.',
          time: '10 mins ago',
          type: 'success',
          read: false,
          link: '/operator-dashboard'
        },
        {
          id: 2,
          title: 'Renewal Reminder',
          desc: 'Annual renewal for 2027 will open 30 days before expiration.',
          time: 'Yesterday',
          type: 'reminder',
          read: true,
          link: '/operator-dashboard'
        }
      ];
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUserName(parsed.name || parsed.fullName || userName);
        setProfilePic(parsed.profilePic || parsed.profilePicUrl || null);
      } catch (e) {
        console.error(e);
      }
    }

    // Close dropdowns when clicking outside
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm">
      
      {/* Left: Mobile Burger Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
        <span className="hidden sm:inline-block font-extrabold text-[#7A1B22] text-sm tracking-wide">
          G-TRAMS <span className="text-slate-400 font-normal text-xs">• Portal</span>
        </span>
      </div>

      {/* Right: Notifications & Profile Pill */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* NOTIFICATION BELL ICON WITH RED BADGE */}
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
            
            {/* Pulsing Red Dot & Number Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN MODAL */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-[slideFadeUp_0.2s_ease-out_forwards]">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">Notifications</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{unreadCount} unread update{unreadCount !== 1 ? 's' : ''}</p>
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
                  <div className="p-6 text-center text-xs text-slate-400">Walang bagong notification.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'pending' && <Clock size={16} className="text-amber-500" />}
                        {notif.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {notif.type === 'info' && <FileText size={16} className="text-blue-500" />}
                        {notif.type === 'reminder' && <AlertTriangle size={16} className="text-orange-500" />}
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

        {/* PROFILE CHIP & DROPDOWN */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full sm:rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 transition-all"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7A1B22] text-[#D4AF37] font-bold text-xs flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              {profilePic ? (
                <img src={profilePic} alt="User" className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[120px]">{userName}</span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                {role === 'admin' ? 'Admin' : 'Operator'}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* PROFILE POPUP MENU */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-[slideFadeUp_0.15s_ease-out_forwards]">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="font-bold text-xs text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 capitalize">{role}</p>
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