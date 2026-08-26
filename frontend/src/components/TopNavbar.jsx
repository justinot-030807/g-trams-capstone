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

  const storageKey = 'gtrams_read_notification_ids';

  // Base notification list
  const baseNotifications = role === 'admin' ? [
    {
      id: 'admin_notif_1',
      title: 'New Franchise Application',
      desc: 'An operator submitted a new application for franchise approval.',
      time: 'Recent',
      type: 'pending',
      link: '/franchise-approval'
    },
    {
      id: 'admin_notif_2',
      title: 'TODA Masterlist Update',
      desc: 'A TODA president submitted updated member records.',
      time: 'Recent',
      type: 'info',
      link: '/validate-toda'
    }
  ] : [
    {
      id: 'op_notif_1',
      title: 'Franchise Updates',
      desc: 'Check your dashboard for real-time MTOP status and approval notices.',
      time: 'Recent',
      type: 'success',
      link: '/operator-dashboard'
    }
  ];

  // Persistent read state gamit ang LocalStorage IDs
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      return [];
    }
  });

  const unreadCount = baseNotifications.filter(n => !readIds.includes(n.id)).length;

  useEffect(() => {
    const fetchFreshUser = async () => {
      const storedRole = localStorage.getItem('role');
      const storedName = localStorage.getItem('name');
      const userStr = localStorage.getItem('user');

      if (storedRole) setRole(storedRole);
      if (storedName && storedName !== 'User') setUserName(storedName);

      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          if (parsed.name || parsed.fullName) setUserName(parsed.name || parsed.fullName);
          if (parsed.role) setRole(parsed.role);
          if (parsed.profilePic || parsed.profilePicUrl) setProfilePic(parsed.profilePic || parsed.profilePicUrl);
        } catch (e) {
          console.error(e);
        }
      }

      // Kumuha agad sa backend kung available ang token para laging updated ang name & role
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.name || data.fullName) {
              const nameToSet = data.name || data.fullName;
              setUserName(nameToSet);
              localStorage.setItem('name', nameToSet);
            }
            if (data.role) {
              setRole(data.role);
              localStorage.setItem('role', data.role);
            }
            if (data.profilePic) setProfilePic(data.profilePic);
            localStorage.setItem('user', JSON.stringify(data));
          }
        } catch {}
      }
    };

    fetchFreshUser();

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    const allIds = baseNotifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleNotificationClick = (notif) => {
    if (!readIds.includes(notif.id)) {
      const updated = [...readIds, notif.id];
      setReadIds(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
    setIsNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  // Formatted Role Label
  const getRoleBadge = () => {
    if (role === 'toda_president') return 'TODA PRESIDENT';
    if (role === 'admin') return 'ADMINISTRATOR';
    return 'OPERATOR';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm">
      
      {/* Left: Mobile Burger Menu Only */}
      <div className="flex items-center">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors focus:outline-none"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right: Notifications & Profile */}
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
            
            {/* Lilitaw LANG ang red dot kapag may unread */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                {baseNotifications.map((notif) => {
                  const isRead = readIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !isRead ? 'bg-red-50/40' : ''
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
                          <p className={`text-xs truncate ${!isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {notif.title}
                          </p>
                          {!isRead && <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">{notif.desc}</p>
                        <span className="text-[9px] text-slate-400 font-medium mt-1 block">{notif.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
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
              <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[120px]">{userName}</span>
              <span className="text-[9px] font-bold text-[#7A1B22] uppercase tracking-wider">
                {getRoleBadge()}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="font-bold text-xs text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-[#7A1B22] font-bold uppercase">{getRoleBadge()}</p>
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