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
        className={`bg-slate-900 fixed inset-y-0 left-0 flex flex-col justify-between shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-white/5 print:hidden print-hide group ${
          isOperatorOrToda ? 'hidden md:flex' : 'flex'
        } ${
          isOpen 
            ? 'w-64 translate-x-0' 
            : 'w-20 -translate-x-full md:translate-x-0 md:hover:w-64'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-4 sm:p-5 flex items-center border-b border-white/5 shrink-0 bg-slate-950/50 ${isOpen ? 'justify-between' : 'justify-center md:group-hover:justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-1 shrink-0 overflow-hidden">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
            </div>
            <div className={`flex flex-col min-w-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 w-0 md:group-hover:w-auto hidden md:flex'}`}>
              <span className="text-white font-black text-sm tracking-wider whitespace-nowrap">G-TRAMS</span>
              <span className="text-slate-400 text-[10px] font-semibold tracking-tight truncate whitespace-nowrap">Municipality of Gasan</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            title="Toggle Sidebar"
            className={`text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none shrink-0 ${isOpen ? 'block' : 'hidden md:group-hover:block'}`}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto min-h-0 custom-sidebar-scroll overflow-x-hidden">
          {activeMenu.map((item, index) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigate(item.path)}
                  title={!isOpen ? item.name : undefined}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                    isActive 
                      ? 'bg-[#7A1B22] text-white shadow-md' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  } ${isOpen ? 'justify-between' : 'justify-center md:group-hover:justify-between'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="shrink-0">{item.icon}</div>
                    <span className={`truncate transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 md:group-hover:w-auto md:group-hover:opacity-100 hidden md:block'}`}>{item.name}</span>
                  </div>
                </button>
              );
            }

            if (item.type === 'dropdown') {
              const isExpanded = !!openSubMenus[item.id];
              const isAnySubActive = item.subItems.some(sub => sub.path === location.pathname);

              return (
                <div key={index} className="space-y-1">
                  <button
                    onClick={() => toggleSubMenu(item.id)}
                    title={!isOpen ? item.name : undefined}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                      isAnySubActive && !isExpanded 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    } ${isOpen ? 'justify-between' : 'justify-center md:group-hover:justify-between'}`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="shrink-0">{item.icon}</div>
                      <span className={`truncate transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 md:group-hover:w-auto md:group-hover:opacity-100 hidden md:block'}`}>{item.name}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 shrink-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 md:group-hover:w-auto md:group-hover:opacity-100 hidden md:flex'}`}>
                      {Boolean(item.badge) && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm ring-1 ring-[#7A1B22]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`} 
                      />
                    </div>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className={`py-1 space-y-0.5 ${isOpen ? 'ml-3 pl-3 border-l-2 border-slate-800' : 'md:group-hover:ml-3 md:group-hover:pl-3 md:group-hover:border-l-2 md:group-hover:border-slate-800 hidden md:group-hover:block'}`}>
                      {item.subItems.map((sub, idx) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleNavigate(sub.path)}
                            title={!isOpen ? sub.name : undefined}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                              isSubActive 
                                ? 'bg-slate-800 text-white' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            {Boolean(sub.badge) && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm">
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* User Profile & Logout - Bottom */}
        <div className={`p-4 border-t border-white/5 shrink-0 bg-slate-950/50 ${isOpen ? 'block' : 'flex flex-col items-center md:group-hover:block'}`}>
          <div className={`flex items-center gap-3 mb-3 ${!isOpen ? 'md:group-hover:flex justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {userData.profilePic ? (
                <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-slate-400" />
              )}
            </div>
            <div className={`flex flex-col min-w-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 md:group-hover:w-auto md:group-hover:opacity-100 hidden md:flex'}`}>
              <span className="text-white font-bold text-sm tracking-tight truncate">
                {userData.name}
              </span>
              <span className="text-[#D4AF37] text-[9px] font-black tracking-widest uppercase">
                {getRoleLabel()}
              </span>
            </div>
          </div>

          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            title={!isOpen ? t('nav.logOut', 'Log Out') : undefined}
            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 ${isOpen ? 'justify-center gap-2' : 'justify-center md:group-hover:justify-center md:group-hover:gap-2'}`}
          >
            <div className="shrink-0"><LogOut size={16} /></div>
            <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 md:group-hover:w-auto md:group-hover:opacity-100 hidden md:block'}`}>{t('nav.logOut', 'Log Out')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;