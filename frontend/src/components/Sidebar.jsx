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
    },
    { 
      type: 'link', 
      name: t('nav.helpSupport', 'Help & Support'), 
      path: '/help-support', 
      icon: <HelpCircle size={18} /> 
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

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside 
        className={`w-64 bg-[#7A1B22] h-[100dvh] fixed top-0 left-0 flex flex-col justify-between shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-white/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#6c171e]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-md border-2 border-[#D4AF37] p-1 shrink-0 overflow-hidden">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-black text-sm tracking-wider">G-TRAMS</span>
              <span className="text-white/60 text-[10px] font-semibold tracking-tight truncate">Municipality of Gasan</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            title="Hide Sidebar"
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none shrink-0"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto min-h-0 custom-sidebar-scroll">
          {activeMenu.map((item, index) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                    isActive 
                      ? 'bg-white text-[#7A1B22] shadow-sm scale-[1.01]' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.name}</span>
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                      isAnySubActive && !isExpanded 
                        ? 'bg-white/15 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.icon}
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {Boolean(item.badge) && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm ring-1 ring-[#7A1B22]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown 
                        size={15} 
                        className={`transition-transform duration-200 text-white/60 ${isExpanded ? 'rotate-180 text-white' : ''}`} 
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pl-5 pr-1 py-1 space-y-1 border-l-2 border-white/15 ml-3.5 animate-in fade-in duration-150">
                      {item.subItems.map((sub, subIdx) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <button
                            key={subIdx}
                            onClick={() => handleNavigate(sub.path)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                              isSubActive 
                                ? 'bg-white text-[#7A1B22] font-black shadow-sm' 
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {sub.icon}
                              <span className="truncate">{sub.name}</span>
                            </div>

                            {Boolean(sub.badge) && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm ring-1 ring-[#7A1B22] shrink-0">
                                {sub.badge}
                              </span>
                            )}
                          </button>
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

        <div className="p-3 border-t border-white/10 shrink-0 bg-[#651419]">
          <button 
            onClick={() => { 
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              localStorage.removeItem('name');
              localStorage.removeItem('user');
              navigate('/login'); 
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white/90 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-black uppercase tracking-wider"
          >
            <LogOut size={15} />
            {t('nav.logOut', 'Log Out')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;