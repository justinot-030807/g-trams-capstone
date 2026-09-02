import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, ChevronDown, CheckCircle2, Clock, AlertTriangle, 
  User, LogOut, FileText, Menu, PanelLeftOpen, Settings,
  Moon, Sun, HelpCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const TopNavbar = ({ isSidebarOpen, onToggleSidebar }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(localStorage.getItem('role') || 'operator');
  const [userName, setUserName] = useState(localStorage.getItem('name') || 'User');
  const [profilePic, setProfilePic] = useState(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const storageKey = 'gtrams_read_notification_ids';
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      return [];
    }
  });

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

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
    const allIds = notifications.map(n => n.id);
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

  const getRoleBadge = () => {
    const normalized = String(role || '').toLowerCase().trim().replace(/_/g, ' ');
    if (normalized === 'toda president') return t('nav.roleTodaPresident', 'TODA PRESIDENT');
    if (normalized === 'admin' || normalized === 'administrator') return t('nav.roleAdmin', 'ADMINISTRATOR');
    return t('nav.roleOperator', 'OPERATOR');
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/admin-dashboard' || path === '/operator-dashboard') return t('nav.dashboard', 'Dashboard');
    if (path === '/franchise-masterlist') return 'Franchise Masterlist';
    if (path === '/franchise-approval') return 'Approvals Queue';
    if (path === '/manage-revocations') return 'Revocations';
    if (path === '/validate-toda') return 'TODA Management';
    if (path === '/user-management') return 'User Management';
    if (path === '/system-reports') return 'System Reports';
    if (path === '/apply-franchise') return t('nav.applyRenew', 'Apply / Renew');
    if (path.startsWith('/renew-franchise')) return 'Renew Franchise';
    if (path === '/submit-members') return t('nav.submitMembers', 'Submit Members');
    if (path === '/admin/settings' || path === '/operator/settings') return t('nav.settings', 'Settings');
    if (path === '/help-support') return t('nav.helpSupport', 'Help & Support');
    return 'G-TRAMS';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm transition-colors">
      
      {/* Left: Sidebar Toggle & Dynamic Breadcrumb Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Hide Menu" : "Show Menu"}
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 rounded-xl transition-colors focus:outline-none shrink-0"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <Menu size={20} className="md:hidden" /> : <PanelLeftOpen size={20} className="text-[#7A1B22] dark:text-[#D4AF37]" />}
        </button>

        <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-slate-700 shrink-0" />

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Right: 1-Click Dark Mode Toggle, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        
        {/* 1-Click Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none shrink-0"
        >
          {isDark ? (
            <Sun size={18} className="text-amber-400" />
          ) : (
            <Moon size={18} className="text-indigo-600 dark:text-indigo-400" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 rounded-xl border transition-all ${
              isNotifOpen 
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-[#7A1B22] dark:text-[#D4AF37]' 
                : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{t('nav.notifications', 'Notifications')}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {unreadCount > 0 ? `${unreadCount} ${t('nav.unreadUpdates', 'unread update(s)')}` : t('nav.allCaughtUp', 'All caught up')}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-[10px] font-bold text-[#7A1B22] dark:text-[#D4AF37] hover:underline"
                  >
                    {t('nav.markAllRead', 'Mark all read')}
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <Bell size={24} className="text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('nav.noNotifications', 'No new notifications')}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t('nav.noNotificationsDesc', 'System updates and approval notices will appear here.')}</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isRead = readIds.includes(notif.id);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                          !isRead ? 'bg-red-50/40 dark:bg-red-950/20' : ''
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
                            <p className={`text-xs truncate ${!isRead ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                              {notif.title}
                            </p>
                            {!isRead && <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">{notif.desc}</p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">{notif.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-full sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7A1B22] text-[#D4AF37] font-bold text-xs flex items-center justify-center shadow-inner overflow-hidden shrink-0 border border-[#D4AF37]/30">
              {profilePic ? (
                <img src={profilePic} alt="User" className="w-full h-full object-cover" />
              ) : role === 'admin' ? (
                <img src="/gasan-logo.png" alt="Admin" className="w-full h-full object-contain p-1" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[120px]">{userName}</span>
              <span className="text-[9px] font-bold text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider">
                {getRoleBadge()}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{userName}</p>
                <p className="text-[10px] text-[#7A1B22] dark:text-[#D4AF37] font-bold uppercase tracking-wide mt-0.5">{getRoleBadge()}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    const normalizedRole = String(role || '').toLowerCase().trim().replace(/_/g, ' ');
                    if (normalizedRole === 'admin' || normalizedRole === 'administrator') {
                      navigate('/admin/settings');
                    } else {
                      navigate('/operator/settings');
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <Settings size={15} className="text-[#7A1B22] dark:text-[#D4AF37]" /> {t('nav.settings', 'Settings')}
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/help-support');
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <HelpCircle size={15} className="text-slate-400" /> {t('nav.helpSupport', 'Help & Support')}
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    localStorage.clear();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut size={15} /> {t('nav.logOut', 'Log Out')}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopNavbar;