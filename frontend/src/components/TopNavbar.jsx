import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, ChevronDown, CheckCircle2, Clock, AlertTriangle, 
  User, Users, LogOut, FileText, Menu, PanelLeftOpen, Settings,
  Moon, Sun, HelpCircle, ArrowLeft, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useTextSize } from '../context/TextSizeContext';
import { 
  getNotificationVisuals, 
  formatRelativeTime 
} from '../utils/notificationUtils';

const TopNavbar = ({ isSidebarOpen, onToggleSidebar }) => {
  const { t, language, changeLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { textScale, cycleTextScale, scaleLabel } = useTextSize();
  const { 
    notifications: ctxNotifs, 
    unreadCount: ctxUnreadCount,
    markAsRead: ctxMarkRead, 
    markAllRead: ctxMarkAllRead,
    deleteNotification: ctxDeleteNotification 
  } = useNotifications();
  
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(localStorage.getItem('role') || 'operator');
  const [userName, setUserName] = useState(localStorage.getItem('name') || 'User');
  const [profilePic, setProfilePic] = useState(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Notifications sourced solely from database via context
  const allNotifs = useMemo(() => {
    const isRoleAdmin = String(role || '').toLowerCase().includes('admin');
    const isRoleCashier = String(role || '').toLowerCase().includes('cashier');
    return (Array.isArray(ctxNotifs) ? ctxNotifs : []).map((n) => {
      let defaultLink = '/operator-dashboard';
      if (isRoleAdmin) defaultLink = '/franchise-masterlist';
      if (isRoleCashier) defaultLink = '/cashier-dashboard';
      if (n?.type === 'chat') defaultLink = isRoleAdmin ? '/admin/tickets' : '/operator-dashboard';

      return {
        id: n?._id,
        isRead: Boolean(n?.isRead),
        title: n?.title || 'Notification',
        desc: n?.message || '',
        rawTime: n?.createdAt,
        time: n?.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent',
        type: n?.type || 'info',
        link: n?.link || defaultLink
      };
    });
  }, [ctxNotifs, role]);

  const unreadCount = ctxUnreadCount ?? allNotifs.filter(n => !n.isRead).length;

  const [isMaintenanceActive, setIsMaintenanceActive] = useState(() => localStorage.getItem('maintenance_mode') === 'true');

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

    // Live system settings sync (maintenance mode, fiscal year, fees)
    const fetchSystemSettings = async () => {
      try {
        const setRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
        if (setRes.ok) {
          const setJson = await setRes.json();
          if (setJson.data) {
            const d = setJson.data;
            const isMaint = d.maintenanceMode === true;
            setIsMaintenanceActive(isMaint);
            localStorage.setItem('maintenance_mode', isMaint ? 'true' : 'false');
            if (d.fiscalYear) localStorage.setItem('fiscal_year', d.fiscalYear);
            if (d.franchiseFee) localStorage.setItem('franchise_fee', d.franchiseFee);
            if (d.validityNew) localStorage.setItem('validity_new', d.validityNew);
            if (d.validityRenew) localStorage.setItem('validity_renew', d.validityRenew);
            
            const currentRole = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
            if (isMaint && currentRole !== 'admin' && currentRole !== 'administrator') {
              navigate('/maintenance');
            }
          }
        }
      } catch (setErr) {
        // Silent fail
      }
    };

    fetchSystemSettings();
    const interval = setInterval(fetchSystemSettings, 30000);

    const handleSettingsUpdate = () => {
      const isMaint = localStorage.getItem('maintenance_mode') === 'true';
      setIsMaintenanceActive(isMaint);
      const storedRole = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
      if (isMaint && storedRole !== 'admin' && storedRole !== 'administrator') {
        navigate('/maintenance');
      }
    };
    window.addEventListener('gtrams_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('gtrams_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
      clearInterval(interval);
    };
  }, [navigate]);

  const markAllAsRead = () => {
    ctxMarkAllRead();
  };

  const handleNotificationClick = (notif) => {
    if (notif?.id) {
      ctxMarkRead(notif.id);
    }
    setIsNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleDeleteNotification = (e, notifId) => {
    e.stopPropagation();
    ctxDeleteNotification(notifId);
  };

  const getRoleBadge = () => {
    const normalized = String(role || '').toLowerCase().trim().replace(/_/g, ' ');
    if (normalized === 'toda president') return t('nav.roleTodaPresident', 'TODA PRESIDENT');
    if (normalized === 'admin' || normalized === 'administrator') return t('nav.roleAdmin', 'ADMINISTRATOR');
    if (normalized === 'cashier') return t('nav.roleCashier', 'MUNICIPAL CASHIER');
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

  const normalizedRole = String(role || '').toLowerCase().trim().replace(/_/g, ' ');
  const isOperatorOrToda = normalizedRole === 'operator' || normalizedRole === 'toda president' || normalizedRole === 'toda_president';
  const isCashier = normalizedRole === 'cashier';
  const isDashboard = location.pathname === '/operator-dashboard';

  return (
    <header className={`sticky top-0 z-30 bg-white dark:bg-[#1C1917] border-b border-[#E4E1DC] dark:border-[#2E2A27] px-4 sm:px-6 py-2.5 items-center justify-between shadow-xs transition-colors print:hidden print-hide ${
      isOperatorOrToda && isDashboard ? 'hidden md:flex' : 'flex'
    }`}>
      
      {/* 1. MOBILE NATIVE HEADER (For Operator/TODA on Inner Pages) */}
      {isOperatorOrToda && !isDashboard && (
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/operator-dashboard');
                }
              }}
              className="group flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg bg-[#F6F5F3] hover:bg-[#EAE7E1] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] transition-all cursor-pointer border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs shrink-0"
              title="Back"
              aria-label="Back"
            >
              <div className="w-6 h-6 rounded-md bg-white dark:bg-[#1C1917] shadow-xs flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
                <ArrowLeft size={14} className="text-[#1F1D1B] dark:text-[#EAE7E1]" />
              </div>
              <span className="text-xs font-semibold tracking-wide uppercase hidden sm:block">Back</span>
            </button>
            <h1 className="text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] truncate">
              {getBreadcrumbTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Text Size Accessibility Button */}
            <button
              type="button"
              onClick={cycleTextScale}
              title={`Text Size: ${scaleLabel} (Click to resize)`}
              aria-label={`Text Size: ${scaleLabel}`}
              className="px-2.5 h-9 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-xs font-mono select-none"
            >
              <span>{textScale === 'xlarge' ? 'A++' : textScale === 'large' ? 'A+' : 'A'}</span>
            </button>

            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Theme: Dark Mode (Click for Light Mode)" : "Theme: Light Mode (Click for Dark Mode)"}
              className="w-9 h-9 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {isDark ? (
                <Moon size={17} className="text-[#D4AF37]" />
              ) : (
                <Sun size={17} className="text-[#B45309]" />
              )}
            </button>

            {/* Notification Bell with Popup */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
                  isNotifOpen 
                    ? 'bg-[#EAE7E1] dark:bg-[#2E2A27] border-[#9E2A2B] dark:border-[#D4AF37] text-[#9E2A2B] dark:text-[#D4AF37]' 
                    : 'bg-[#F6F5F3] dark:bg-[#14110F] border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                }`}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#B91C1C] px-1 text-[9px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/60 z-40" 
                    onClick={() => setIsNotifOpen(false)} 
                  />
                  <div className="fixed inset-x-3 top-16 bg-white dark:bg-[#1C1917] rounded-lg shadow-lg border border-[#E4E1DC] dark:border-[#2E2A27] py-3 z-50">
                  <div className="px-4 pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">{t('nav.notifications', 'Notifications')}</h3>
                      <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                        {unreadCount > 0 ? `${unreadCount} ${t('nav.unreadUpdates', 'unread update(s)')}` : t('nav.allCaughtUp', 'All caught up')}
                      </p>
                    </div>
                    {allNotifs.length > 0 && (
                      <button 
                        onClick={markAllAsRead} 
                        className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        {t('nav.markAllRead', 'Mark all read')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E4E1DC]/40 dark:divide-[#2E2A27]/40">
                    {allNotifs.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-full flex items-center justify-center mb-2.5">
                          <Bell size={18} className="text-[#8C827A]" />
                        </div>
                        <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">{t('nav.noNotifications', 'No new notifications')}</p>
                        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">{t('nav.allCaughtUp', 'All caught up')}</p>
                      </div>
                    ) : (
                      allNotifs.map((notif) => {
                        const visuals = getNotificationVisuals(notif);
                        const IconComponent = visuals.icon;
                        const timeStr = formatRelativeTime(notif.rawTime || notif.time, language);

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`group p-3 flex items-start gap-2.5 hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]/50 transition-colors cursor-pointer relative ${
                              !notif.isRead ? 'bg-[#9E2A2B]/5 dark:bg-[#9E2A2B]/10' : 'bg-transparent'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${visuals.iconBg}`}>
                                <IconComponent size={14} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className={`text-xs ${!notif.isRead ? 'font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]' : 'font-medium text-[#6B6761] dark:text-[#A8A29E]'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.isRead && <span className="w-1.5 h-1.5 bg-[#9E2A2B] dark:bg-[#D4AF37] rounded-full shrink-0" />}
                              </div>
                              <p className="text-[11px] text-[#57534E] dark:text-[#D6D3D1] leading-snug break-words">
                                {notif.desc}
                              </p>
                              <span className="text-[10px] font-mono text-[#8C827A] mt-1 block">
                                {timeStr}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(e, notif.id)}
                              className="absolute top-2.5 right-2 p-1 text-[#8C827A] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-opacity cursor-pointer rounded"
                              title="Dismiss"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 2. DESKTOP / ADMIN STANDARD HEADER */}
      <div className={`items-center justify-between w-full ${isOperatorOrToda && !isDashboard ? 'hidden md:flex' : 'flex'}`}>
        {/* Left: Sidebar Toggle & Global Search Bar */}
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
            className={`p-2 text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] active:bg-[#EAE7E1] dark:active:bg-[#2E2A27] rounded-lg transition-colors focus:outline-none shrink-0 ${
              isOperatorOrToda || isCashier ? 'hidden md:flex' : 'flex'
            }`}
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? (
              <PanelLeftOpen size={20} className="text-[#6B6761] dark:text-[#A8A29E] rotate-180" />
            ) : (
              <PanelLeftOpen size={20} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
            )}
          </button>

          {/* Global Search Bar */}
          <div className="hidden sm:flex items-center w-full max-w-sm relative group">
            <div className="absolute left-3 text-[#6B6761] dark:text-[#A8A29E] group-focus-within:text-[#9E2A2B] dark:group-focus-within:text-[#D4AF37] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder:text-[#6B6761] dark:placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim() !== '') {
                  navigate(`/franchise-masterlist?search=${encodeURIComponent(e.target.value)}`);
                }
              }}
            />
          </div>
          
          {isMaintenanceActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-[#B45309] dark:text-[#FBBF24] text-[9px] sm:text-xs font-semibold uppercase tracking-wider border border-amber-200 dark:border-amber-800/80 animate-pulse ml-2">
              <span className="inline sm:hidden">🛠️ Maint</span>
              <span className="hidden sm:inline">🛠️ Maintenance Active</span>
            </span>
          )}
        </div>

      {/* Right: 1-Click Dark Mode Toggle, Notifications & Simplified User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* 1-Click Quick Text Size Accessibility Button */}
        <button
          type="button"
          onClick={cycleTextScale}
          title={`Text Size: ${scaleLabel} (Click to resize)`}
          aria-label={`Text Size: ${scaleLabel}`}
          className="px-2.5 py-1.5 h-[38px] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold text-xs transition-colors focus:outline-none shrink-0 cursor-pointer shadow-xs font-mono flex items-center justify-center active:scale-95 select-none"
        >
          <span>{textScale === 'xlarge' ? 'A++' : textScale === 'large' ? 'A+' : 'A'}</span>
        </button>

        {/* 1-Click Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Theme: Dark Mode (Click for Light Mode)" : "Theme: Light Mode (Click for Dark Mode)"}
          className="p-2 h-[38px] w-[38px] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] flex items-center justify-center transition-colors focus:outline-none shrink-0 cursor-pointer shadow-xs"
        >
          {isDark ? (
            <Moon size={18} className="text-[#D4AF37]" />
          ) : (
            <Sun size={18} className="text-[#B45309]" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 h-[38px] w-[38px] flex items-center justify-center rounded-lg border transition-colors shadow-xs cursor-pointer ${
              isNotifOpen 
                ? 'bg-[#EAE7E1] dark:bg-[#2E2A27] border-[#9E2A2B] dark:border-[#D4AF37] text-[#9E2A2B] dark:text-[#D4AF37]' 
                : 'bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#B91C1C] px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-start sm:items-end p-0 sm:p-4 sm:pt-16 sm:pr-8 pointer-events-none">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/60 transition-opacity animate-in fade-in duration-200 pointer-events-auto" 
                onClick={() => setIsNotifOpen(false)} 
              />

              {/* Notification Card */}
              <div 
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full sm:w-96 bg-white dark:bg-[#1C1917] rounded-lg shadow-lg border border-[#E4E1DC] dark:border-[#2E2A27] py-3 text-[#1F1D1B] dark:text-[#F6F5F3] animate-in slide-in-from-bottom sm:slide-in-from-top-2 duration-200 max-h-[85vh] flex flex-col pointer-events-auto"
              >
                {/* Header */}
                <div className="px-4 pb-2.5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Bell size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                      <h4 className="font-semibold text-xs text-[#1F1D1B] dark:text-[#F6F5F3]">
                        {t('nav.notifications', 'Notifications')}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} ${t('nav.unreadUpdates', 'unread update(s)')}` : t('nav.allCaughtUp', 'All caught up')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {allNotifs.length > 0 && (
                      <button 
                        type="button"
                        onClick={markAllAsRead} 
                        className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        {t('nav.markAllRead', 'Mark all read')}
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-2 py-2 pb-8 sm:pb-2 divide-y divide-[#E4E1DC]/40 dark:divide-[#2E2A27]/40">
                  {allNotifs.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center h-48">
                      <div className="w-12 h-12 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-full flex items-center justify-center mb-3">
                        <Bell size={22} className="text-[#8C827A]" />
                      </div>
                      <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                        {t('nav.noNotifications', 'No new notifications')}
                      </p>
                      <p className="text-[11px] text-[#8C827A] dark:text-[#A8A29E] mt-0.5 max-w-[200px] leading-relaxed">
                        {t('nav.allCaughtUp', 'All caught up')}
                      </p>
                    </div>
                  ) : (
                    allNotifs.map((notif) => {
                      const visuals = getNotificationVisuals(notif);
                      const IconComponent = visuals.icon;
                      const timeStr = formatRelativeTime(notif.rawTime || notif.time, language);

                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setIsNotifOpen(false);
                            handleNotificationClick(notif);
                          }}
                          className={`group p-3 rounded-md flex items-start gap-2.5 transition-colors cursor-pointer relative hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]/50 ${
                            !notif.isRead 
                              ? 'bg-[#9E2A2B]/5 dark:bg-[#9E2A2B]/10' 
                              : 'bg-transparent'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center shadow-xs ${visuals.iconBg}`}>
                              <IconComponent size={14} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h5 className={`text-xs ${!notif.isRead ? 'font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]' : 'font-medium text-[#6B6761] dark:text-[#A8A29E]'}`}>
                                {notif?.title || 'Notification'}
                              </h5>
                              {!notif.isRead && <span className="w-1.5 h-1.5 bg-[#9E2A2B] dark:bg-[#D4AF37] rounded-full shrink-0 shadow-xs" />}
                            </div>
                            <p className="text-[11px] text-[#57534E] dark:text-[#D6D3D1] leading-snug break-words">
                              {notif.desc}
                            </p>
                            <span className="text-[10px] font-mono text-[#8C827A] mt-1 block">
                              {timeStr || notif?.time}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            className="absolute top-2.5 right-2 p-1 text-[#8C827A] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-opacity cursor-pointer rounded"
                            title="Dismiss"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Simplified User Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] transition-colors focus:outline-none cursor-pointer"
            title="Profile Options"
          >
            <div className="w-full h-full rounded-full bg-[#9E2A2B] text-[#D4AF37] font-semibold text-xs flex items-center justify-center shadow-inner overflow-hidden border border-[#D4AF37]/30">
              {profilePic ? (
                <img src={profilePic} alt="User" className="w-full h-full object-cover" />
              ) : role === 'admin' ? (
                <img src="/gasan-logo.png" alt="Admin" className="w-full h-full object-contain p-1" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1C1917] rounded-lg shadow-lg border border-[#E4E1DC] dark:border-[#2E2A27] py-2 z-50">
              <div className="px-4 py-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
                <p className="font-semibold text-xs text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{userName}</p>
                <p className="text-xs text-[#9E2A2B] dark:text-[#D4AF37] font-semibold uppercase tracking-wider mt-0.5">{getRoleBadge()}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    const normalizedRole = String(role || '').toLowerCase().trim().replace(/_/g, ' ');
                    if (normalizedRole === 'admin' || normalizedRole === 'administrator') {
                      navigate('/admin/settings');
                    } else if (normalizedRole === 'cashier') {
                      navigate('/cashier-settings');
                    } else {
                      navigate('/operator/settings');
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Settings size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> {t('nav.settings', 'Settings')}
                </button>
              </div>

              <div className="pt-1 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('name');
                    localStorage.removeItem('user');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('gtrams_apply_draft');
                    localStorage.removeItem('reapply_target');
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-[#B91C1C] dark:text-[#EF4444] hover:bg-[#B91C1C]/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut size={15} /> {t('nav.logOut', 'Log Out')}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      </div>
    </header>
  );
};

export default TopNavbar;

