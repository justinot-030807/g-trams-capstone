import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  FileCheck, ShieldAlert, LogOut, User, Printer, 
  HelpCircle, ChevronDown, Folder, PanelLeftClose, Receipt
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage() || { t: (_, def) => def };
  const { socket } = useSocket() || {};
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userData] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      const storedName = localStorage.getItem('name');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        return {
          name: parsed.name || parsed.fullName || storedName || 'G-TRAMS',
          profilePic: parsed.profilePic || parsed.profilePicUrl || null
        };
      }
      if (storedName) {
        return { name: storedName, profilePic: null };
      }
    } catch {
      // silent
    }
    return { name: 'G-TRAMS', profilePic: null };
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  
  // Persist open submenu state in localStorage
  const [openSubMenus, setOpenSubMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('gtrams_open_submenus');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  let role = String(localStorage.getItem('role') || 'operator').toLowerCase().trim().replace(/_/g, ' ');

  const adminRoutes = [
    '/admin-dashboard', '/franchise-masterlist', '/franchise-approval', 
    '/manage-revocations', '/user-management', '/system-settings', 
    '/admin/settings', '/validate-toda', '/system-reports', '/admin/tickets'
  ];
  if (adminRoutes.includes(location.pathname)) {
    role = 'admin';
  }

  const isOperatorOrToda = role === 'operator' || role === 'toda president' || role === 'toda_president';
  const isCashier = role === 'cashier';
  const hideMobileSidebar = isOperatorOrToda || isCashier;

  const fetchChatUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    }
  }, []);

  // Listen for socket real-time chat and notifications
  useEffect(() => {
    if (role === 'admin' || role === 'administrator') {
      fetchChatUnreadCount();

      const handleUnreadUpdate = (e) => {
        if (e.detail?.count !== undefined) {
          setChatUnreadCount(e.detail.count);
        } else {
          fetchChatUnreadCount();
        }
      };

      window.addEventListener('chat_unread_updated', handleUnreadUpdate);
      const interval = setInterval(fetchChatUnreadCount, 15000);

      return () => {
        window.removeEventListener('chat_unread_updated', handleUnreadUpdate);
        clearInterval(interval);
      };
    }
  }, [role, fetchChatUnreadCount]);

  useEffect(() => {
    if (!socket) return;
    if (role !== 'admin' && role !== 'administrator') return;

    const onChatMessage = () => {
      fetchChatUnreadCount();
    };
    const onChatRead = () => {
      fetchChatUnreadCount();
    };
    const onNotification = (notif) => {
      if (notif?.type === 'chat') {
        fetchChatUnreadCount();
      }
    };

    socket.on('chat_message', onChatMessage);
    socket.on('chat_read', onChatRead);
    socket.on('notification', onNotification);

    return () => {
      socket.off('chat_message', onChatMessage);
      socket.off('chat_read', onChatRead);
      socket.off('notification', onNotification);
    };
  }, [socket, role, fetchChatUnreadCount]);

  const prevPathnameRef = useRef(location.pathname);

  // Automatically close sidebar strictly on mobile route navigation
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      if (window.innerWidth < 768 && onClose) {
        onClose();
      }
    }
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (role === 'admin' || role === 'administrator') {
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/reports`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.summary?.pending !== undefined) {
            setPendingCount(data.summary.pending);
          }
        })
        .catch(() => {});
    }
  }, [role]);

  const todaMenu = [
    { 
      type: 'link', 
      name: t('nav.dashboard', 'Dashboard'), 
      path: '/operator-dashboard', 
      icon: <LayoutDashboard size={18} /> 
    },
    { 
      type: 'link', 
      name: t('nav.submitMembers', 'Submit Members'), 
      path: '/submit-members', 
      icon: <Users size={18} /> 
    },
    { 
      type: 'link', 
      name: t('nav.applyRenew', 'Apply / Renew'), 
      path: '/apply-franchise', 
      icon: <FileText size={18} /> 
    },
    { 
      type: 'link', 
      name: t('nav.settings', 'Settings'), 
      path: '/operator/settings', 
      icon: <Settings size={18} /> 
    }
  ];

  const menuConfig = {
    'admin': [
      { 
        type: 'link', 
        name: t('nav.dashboard', 'Dashboard'), 
        path: '/admin-dashboard', 
        icon: <LayoutDashboard size={18} /> 
      },
      {
        type: 'dropdown',
        name: 'Franchise Records',
        id: 'franchises',
        icon: <Folder size={18} />,
        badge: pendingCount > 0 ? pendingCount : null,
        subItems: [
          { name: 'Masterlist', path: '/franchise-masterlist', icon: <FileText size={16} /> },
          { 
            name: 'Approvals Queue', 
            path: '/franchise-approval', 
            icon: <FileCheck size={16} />, 
            badge: pendingCount > 0 ? pendingCount : null 
          },
          { name: 'Revocations', path: '/manage-revocations', icon: <ShieldAlert size={16} /> }
        ]
      },
      {
        type: 'dropdown',
        name: 'TODA & Accounts',
        id: 'accounts',
        icon: <Users size={18} />,
        subItems: [
          { name: 'TODA Management', path: '/validate-toda', icon: <Users size={16} /> },
          { name: 'User Management', path: '/user-management', icon: <User size={16} /> }
        ]
      },
      { 
        type: 'link', 
        name: 'System Reports', 
        path: '/system-reports', 
        icon: <Printer size={18} /> 
      },
      { 
        type: 'link', 
        name: 'Live Chat & Support', 
        path: '/admin/tickets', 
        icon: <HelpCircle size={18} />,
        badge: chatUnreadCount > 0 ? chatUnreadCount : null
      },
      { 
        type: 'link', 
        name: t('nav.settings', 'Settings'), 
        path: '/admin/settings', 
        icon: <Settings size={18} /> 
      }
    ],
    'cashier': [
      { 
        type: 'link', 
        name: 'Cashier Terminal', 
        path: '/cashier-dashboard', 
        icon: <Receipt size={18} /> 
      },
      { 
        type: 'link', 
        name: t('nav.settings', 'Settings & Archive'), 
        path: '/cashier-settings', 
        icon: <Settings size={18} /> 
      }
    ],
    'operator': [
      { 
        type: 'link', 
        name: t('nav.dashboard', 'Dashboard'), 
        path: '/operator-dashboard', 
        icon: <LayoutDashboard size={18} /> 
      },
      { 
        type: 'link', 
        name: t('nav.applyRenew', 'Apply / Renew'), 
        path: '/apply-franchise', 
        icon: <FileText size={18} /> 
      },
      { 
        type: 'link', 
        name: t('nav.settings', 'Settings'), 
        path: '/operator/settings', 
        icon: <Settings size={18} /> 
      },
      { 
        type: 'link', 
        name: t('nav.helpSupport', 'Help & Support'), 
        path: '/help-support', 
        icon: <HelpCircle size={18} /> 
      }
    ],
    'toda president': todaMenu,
    'toda_president': todaMenu
  };

  const activeMenu = menuConfig[role] || menuConfig['operator'];

  // Auto-expand active dropdown without collapsing user-opened ones
  useEffect(() => {
    const currentMenu = menuConfig[role] || menuConfig['operator'];
    currentMenu.forEach(item => {
      if (item.type === 'dropdown') {
        const isCurrentInside = item.subItems.some(sub => 
          location.pathname === sub.path || (sub.path === '/franchise-approval' && location.pathname.startsWith('/franchise-approval/review'))
        );
        if (isCurrentInside) {
          setOpenSubMenus(prev => {
            if (prev[item.id]) return prev;
            const next = { ...prev, [item.id]: true };
            localStorage.setItem('gtrams_open_submenus', JSON.stringify(next));
            return next;
          });
        }
      }
    });
  }, [location.pathname, role]);

  const toggleSubMenu = (id) => {
    setOpenSubMenus(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('gtrams_open_submenus', JSON.stringify(next));
      return next;
    });
  };

  const getRoleLabel = () => {
    if (role === 'toda_president' || role === 'toda president') return t('nav.roleTodaPresident', 'TODA PRESIDENT');
    if (role === 'admin') return t('nav.roleAdmin', 'ADMINISTRATOR');
    if (role === 'cashier') return t('nav.roleCashier', 'MUNICIPAL CASHIER');
    return t('nav.roleOperator', 'OPERATOR');
  };

  return (
    <>
      <style>{`
        .custom-sidebar-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-sidebar-scroll::-webkit-scrollbar {
          display: none;
          width: 0px;
          height: 0px;
        }
      `}</style>

      {/* Solid Dim Overlay on Mobile (No blurry glassmorphism) */}
      {isOpen && !hideMobileSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-150 print:hidden print-hide"
          onClick={onClose}
        />
      )}

      <aside 
        className={`bg-[#9E2A2B] dark:bg-[#14110F] fixed inset-y-0 left-0 flex flex-col justify-between shadow-xs z-50 transition-all duration-200 ease-in-out border-r border-[#E4E1DC]/20 dark:border-[#2E2A27] print:hidden print-hide ${
          hideMobileSidebar ? 'hidden md:flex' : 'flex'
        } ${
          isOpen 
            ? 'w-64 translate-x-0' 
            : 'w-20 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4 flex items-center border-b border-white/10 dark:border-[#2E2A27] shrink-0 bg-[#7A1B22]/50 dark:bg-[#1C1917]/70 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 shrink-0 flex items-center justify-center">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-9 h-9 object-contain shrink-0" />
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-sm tracking-normal whitespace-nowrap">G-TRAMS</span>
                <span className="text-white/70 dark:text-[#A8A29E] text-xs font-normal truncate whitespace-nowrap">Municipality of Gasan</span>
              </div>
            )}
          </div>

          {/* Close button strictly on mobile drawer */}
          <button 
            onClick={onClose}
            title="Close Menu"
            className="md:hidden text-white/70 hover:text-white p-1 rounded-md transition-colors focus:outline-none shrink-0"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto min-h-0 custom-sidebar-scroll">
          {activeMenu.map((item, index) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.path;
              return (
                <div key={index} className="relative group/navitem">
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 768 && onClose) onClose();
                    }}
                    title={item.name}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-xs sm:text-sm transition-colors duration-100 ${
                      isActive 
                        ? 'border-l-4 border-[#D4AF37] bg-black/25 text-white font-medium pl-2' 
                        : 'border-l-4 border-transparent text-white/80 hover:bg-white/10 hover:text-white font-normal pl-2'
                    } ${isOpen ? 'justify-between' : 'justify-center'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 relative">
                        {item.icon}
                        {!isOpen && Boolean(item.badge) && (
                          <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </div>
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </div>

                    {isOpen && Boolean(item.badge) && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white shrink-0">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Icon Hover Tooltip (Only when sidebar is minimized) */}
                  {!isOpen && (
                    <div className="hidden md:flex absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1C1917] text-white text-xs rounded-md border border-[#2E2A27] whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] items-center gap-1.5 shadow-sm">
                      <span>{item.name}</span>
                      {Boolean(item.badge) && (
                        <span className="bg-red-600 text-white text-[9px] px-1 rounded-full font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            if (item.type === 'dropdown') {
              const isExpanded = !!openSubMenus[item.id];
              const isAnySubActive = item.subItems.some(sub => sub.path === location.pathname);

              return (
                <div key={index} className="space-y-0.5 relative group/navitem">
                  <button
                    onClick={() => toggleSubMenu(item.id)}
                    title={item.name}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-xs sm:text-sm transition-colors duration-100 ${
                      isAnySubActive 
                        ? 'border-l-4 border-[#D4AF37]/80 bg-black/20 text-white font-medium pl-2' 
                        : 'border-l-4 border-transparent text-white/80 hover:bg-white/10 hover:text-white font-normal pl-2'
                    } ${isOpen ? 'justify-between' : 'justify-center'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        {item.icon}
                      </div>
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </div>

                    {isOpen && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {Boolean(item.badge) && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform duration-150 ${isExpanded ? 'rotate-180 text-white' : 'text-white/60'}`} 
                        />
                      </div>
                    )}
                  </button>

                  {/* Submenu Items */}
                  {isExpanded && isOpen && (
                    <div className="pl-7 pr-1 space-y-0.5 pt-0.5">
                      {item.subItems.map((sub, sIdx) => {
                        const isSubActive = location.pathname === sub.path || (sub.path === '/franchise-approval' && location.pathname.startsWith('/franchise-approval/review'));
                        return (
                          <Link
                            key={sIdx}
                            to={sub.path}
                            onClick={() => {
                              if (window.innerWidth < 768 && onClose) onClose();
                            }}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors duration-100 ${
                              isSubActive 
                                ? 'bg-black/25 text-[#D4AF37] font-medium' 
                                : 'text-white/70 hover:text-white hover:bg-white/5 font-normal'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            {Boolean(sub.badge) && (
                              <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* User Profile & Logout - Bottom */}
        <div className={`p-3 border-t border-white/10 dark:border-[#2E2A27] shrink-0 bg-[#7A1B22]/40 dark:bg-[#1C1917]/70 ${isOpen ? 'space-y-2' : 'flex flex-col items-center gap-2'}`}>
          <div className={`flex items-center gap-2.5 ${isOpen ? 'px-2 py-1.5 rounded-md bg-black/15' : 'justify-center relative group/profile'}`}>
            <div className="w-8 h-8 rounded-full bg-black/20 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
              {userData.profilePic ? (
                <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={15} className="text-white/80" />
              )}
            </div>
            {isOpen ? (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-medium text-xs truncate leading-tight">
                  {userData.name}
                </span>
                <span className="text-[#D4AF37] text-[10px] font-semibold uppercase tracking-wider">
                  {getRoleLabel()}
                </span>
              </div>
            ) : (
              <div className="hidden md:flex absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1C1917] text-white text-xs rounded-md border border-[#2E2A27] whitespace-nowrap opacity-0 group-hover/profile:opacity-100 transition-opacity pointer-events-none z-[70]">
                {userData.name} ({getRoleLabel()})
              </div>
            )}
          </div>

          <div className="relative group/logout w-full flex justify-center">
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              title={!isOpen ? t('nav.logOut', 'Log Out') : undefined}
              className={`flex items-center justify-center rounded-md text-xs font-medium transition-colors duration-150 text-white/90 hover:text-white bg-white/10 hover:bg-red-700 dark:bg-black/30 dark:hover:bg-red-900 border border-white/10 ${isOpen ? 'w-full py-1.5 gap-2' : 'w-9 h-9'}`}
            >
              <LogOut size={15} />
              {isOpen && <span>{t('nav.logOut', 'Log Out')}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
