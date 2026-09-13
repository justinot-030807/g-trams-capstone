import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  FileCheck, ShieldAlert, LogOut, User, Printer, 
  HelpCircle, ChevronDown, Folder, PanelLeftClose, Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userData, setUserData] = useState({ name: 'G-TRAMS', profilePic: null });
  const [pendingCount, setPendingCount] = useState(0);
  
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
    '/admin/settings', '/validate-toda', '/system-reports'
  ];
  if (adminRoutes.includes(location.pathname)) {
    role = 'admin';
  }

  const isOperatorOrToda = role === 'operator' || role === 'toda president' || role === 'toda_president';

  // Automatically close sidebar on mobile route navigation
  useEffect(() => {
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  }, [location.pathname]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const storedName = localStorage.getItem('name');
    
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUserData({
          name: parsed.name || parsed.fullName || storedName || 'G-TRAMS',
          profilePic: parsed.profilePic || parsed.profilePicUrl || null
        });
      } catch (e) {
        console.error(e);
      }
    } else if (storedName) {
      setUserData(prev => ({ ...prev, name: storedName }));
    }

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
        name: t('nav.settings', 'Settings'), 
        path: '/admin/settings', 
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
    activeMenu.forEach(item => {
      if (item.type === 'dropdown') {
        const isCurrentInside = item.subItems.some(sub => sub.path === location.pathname);
        if (isCurrentInside) {
          setOpenSubMenus(prev => {
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

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const getRoleLabel = () => {
    if (role === 'toda_president' || role === 'toda president') return t('nav.roleTodaPresident', 'TODA PRESIDENT');
    if (role === 'admin') return t('nav.roleAdmin', 'ADMINISTRATOR');
    return t('nav.roleOperator', 'OPERATOR');
  };

  return (
    <>
      <style>{`
        .custom-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .custom-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
        }
      `}</style>

      {isOpen && !isOperatorOrToda && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 print:hidden print-hide"
          onClick={onClose}
        />
      )}

      <aside 
        className={`bg-[#7A1B22] dark:bg-slate-900 fixed inset-y-0 left-0 flex flex-col justify-between shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-white/10 dark:border-white/5 print:hidden print-hide ${
          isOperatorOrToda ? 'hidden md:flex' : 'flex'
        } ${
          isOpen 
            ? 'w-64 translate-x-0' 
            : 'w-20 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4 sm:p-5 flex items-center border-b border-white/10 dark:border-white/5 shrink-0 bg-[#6c171e]/70 dark:bg-slate-950/60 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-10 h-10 object-contain drop-shadow-md shrink-0" />
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-white font-black text-sm tracking-wider whitespace-nowrap">G-TRAMS</span>
                <span className="text-white/60 dark:text-slate-400 text-[10px] font-semibold tracking-tight truncate whitespace-nowrap">Municipality of Gasan</span>
              </div>
            )}
          </div>

          {/* Close button strictly on mobile drawer only - removed on desktop so there's no duplicate button */}
          <button 
            onClick={onClose}
            title="Close Menu"
            className="md:hidden text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none shrink-0"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto min-h-0 custom-sidebar-scroll">
          {activeMenu.map((item, index) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.path;
              return (
                <div key={index} className="relative group/navitem">
                  <button
                    onClick={() => handleNavigate(item.path)}
                    title={item.name}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-150 ${
                      isActive 
                        ? 'bg-white text-[#7A1B22] dark:bg-slate-800 dark:text-white shadow-sm' 
                        : 'text-white/80 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white'
                    } ${isOpen ? 'justify-between' : 'justify-center'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 transition-transform duration-200 group-hover/navitem:scale-110 group-active/navitem:scale-95 origin-center">
                        {item.icon}
                      </div>
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </div>
                  </button>

                  {/* Icon Hover Tooltip (Only when sidebar is minimized) */}
                  {!isOpen && (
                    <div className="hidden md:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 group-hover/navitem:translate-x-0 -translate-x-1 transition-all duration-200 pointer-events-none z-[100] items-center gap-2">
                      <span>{item.name}</span>
                      {Boolean(item.badge) && (
                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
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
                <div key={index} className="space-y-1 relative group/navitem">
                  <button
                    onClick={() => toggleSubMenu(item.id)}
                    title={item.name}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-150 ${
                      isAnySubActive 
                        ? (isExpanded ? 'bg-white/15 dark:bg-slate-800/80 text-white' : 'bg-white/20 dark:bg-slate-800 text-white shadow-sm ring-1 ring-white/20') 
                        : 'text-white/80 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white'
                    } ${isOpen ? 'justify-between' : 'justify-center'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 transition-transform duration-200 group-hover/navitem:scale-110 group-active/navitem:scale-95 origin-center">
                        {item.icon}
                      </div>
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </div>

                    {isOpen && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {Boolean(item.badge) && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm ring-1 ring-[#7A1B22]">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : 'text-white/60 dark:text-slate-500'}`} 
                        />
                      </div>
                    )}
                  </button>

                  {/* Icon Hover Tooltip (When minimized and not hovering a subitem) */}
                  {!isOpen && (
                    <div className="hidden md:flex absolute left-full ml-3 top-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 group-hover/navitem:translate-x-0 -translate-x-1 transition-all duration-200 pointer-events-none z-[100] items-center gap-2">
                      <span>{item.name}</span>
                      {Boolean(item.badge) && (
                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sub folder items accordion (Visible in BOTH expanded and minimized modes!) */}
                  {isExpanded && (
                    <div className={
                      isOpen 
                        ? "ml-3 pl-3 py-1 border-l-2 border-white/20 dark:border-slate-800 space-y-1 animate-in fade-in duration-150" 
                        : "py-1 space-y-1.5 flex flex-col items-center bg-black/20 dark:bg-slate-950/40 rounded-xl mx-1 my-1 p-1 animate-in fade-in duration-150 border border-white/5"
                    }>
                      {item.subItems.map((sub, idx) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <div key={idx} className="relative group/subitem w-full flex justify-center">
                            <button
                              onClick={() => handleNavigate(sub.path)}
                              title={sub.name}
                              className={`flex items-center rounded-lg text-xs font-bold transition-colors duration-150 ${
                                isSubActive 
                                  ? 'bg-white text-[#7A1B22] dark:bg-slate-800 dark:text-white shadow-sm font-black' 
                                  : 'text-white/75 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white'
                              } ${isOpen ? 'w-full px-2.5 py-2 justify-between' : 'w-9 h-9 justify-center'}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="shrink-0 transition-transform duration-200 group-hover/subitem:scale-110 origin-center">
                                  {sub.icon}
                                </div>
                                {isOpen && <span className="truncate">{sub.name}</span>}
                              </div>

                              {isOpen && Boolean(sub.badge) && (
                                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm">
                                  {sub.badge}
                                </span>
                              )}
                            </button>

                            {/* Tooltip for sub folder icon in minimized mode */}
                            {!isOpen && (
                              <div className="hidden md:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover/subitem:opacity-100 transition-all pointer-events-none z-[100] items-center gap-1.5">
                                <span>{sub.name}</span>
                                {Boolean(sub.badge) && (
                                  <span className="bg-red-500 text-white text-[9px] px-1 rounded-full font-black">
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
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
        <div className={`p-3 border-t border-white/10 dark:border-white/5 shrink-0 bg-[#6c171e]/60 dark:bg-slate-950/60 ${isOpen ? 'space-y-2' : 'flex flex-col items-center gap-2'}`}>
          <div className={`flex items-center gap-2.5 ${isOpen ? 'px-2 py-1.5 rounded-xl bg-white/5 dark:bg-slate-800/50' : 'justify-center relative group/profile'}`}>
            <div className="w-9 h-9 rounded-full bg-black/20 dark:bg-slate-800 border border-white/20 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {userData.profilePic ? (
                <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-white/80 dark:text-slate-400" />
              )}
            </div>
            {isOpen ? (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-xs tracking-tight truncate leading-tight">
                  {userData.name}
                </span>
                <span className="text-[#D4AF37] text-[9px] font-black tracking-wider uppercase">
                  {getRoleLabel()}
                </span>
              </div>
            ) : (
              <div className="hidden md:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover/profile:opacity-100 transition-all pointer-events-none z-[70]">
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
              className={`flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 text-white/90 hover:text-white bg-white/10 hover:bg-red-600 dark:bg-white/5 dark:text-rose-400 dark:hover:bg-rose-500/10 border border-white/10 hover:border-red-500/40 shadow-xs ${isOpen ? 'w-full py-2 gap-2' : 'w-10 h-10'}`}
            >
              <div className="shrink-0 transition-transform duration-200 group-hover/logout:scale-125">
                <LogOut size={16} />
              </div>
              {isOpen && <span>{t('nav.logOut', 'Log Out')}</span>}
            </button>

            {!isOpen && (
              <div className="hidden md:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-rose-300 text-xs font-bold rounded-xl shadow-2xl border border-white/15 whitespace-nowrap opacity-0 group-hover/logout:opacity-100 transition-all pointer-events-none z-[70]">
                {t('nav.logOut', 'Log Out')}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;