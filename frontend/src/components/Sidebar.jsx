import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  FileCheck, ShieldAlert, LogOut, User, Printer, 
  HelpCircle, ChevronDown, Folder, PanelLeftClose, Layers
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userData, setUserData] = useState({ name: 'G-TRAMS', profilePic: null });
  const [pendingCount, setPendingCount] = useState(0);
  const [openSubMenus, setOpenSubMenus] = useState({});
  let role = localStorage.getItem('role') || 'operator';

  const adminRoutes = [
    '/admin-dashboard', '/franchise-masterlist', '/franchise-approval', 
    '/manage-revocations', '/user-management', '/system-settings', 
    '/validate-toda', '/system-reports'
  ];
  if (adminRoutes.includes(location.pathname)) {
    role = 'admin';
  }

  // AUTOMATIC CLOSE ON MOBILE VIEW TUWING LILIPAT NG ROUTE
  useEffect(() => {
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  }, [location.pathname]);

  // Load User Data & Pending Badges
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

    if (role === 'admin') {
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

  // STRUCTURED MENU NAVIGATION
  const menuConfig = {
    'admin': [
      { 
        type: 'link', 
        name: 'Dashboard', 
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
        type: 'dropdown',
        name: 'System & Reports',
        id: 'system',
        icon: <Settings size={18} />,
        subItems: [
          { name: 'System Settings', path: '/system-settings', icon: <Settings size={16} /> },
          { name: 'System Reports', path: '/system-reports', icon: <Printer size={16} /> }
        ]
      }
    ],
    'operator': [
      { 
        type: 'link', 
        name: 'Dashboard', 
        path: '/operator-dashboard', 
        icon: <LayoutDashboard size={18} /> 
      },
      {
        type: 'dropdown',
        name: 'Franchise Services',
        id: 'op_services',
        icon: <Layers size={18} />,
        subItems: [
          { name: 'Apply / Renew', path: '/apply-franchise', icon: <FileText size={16} /> },
          { name: 'My Profile', path: '/manage-profile', icon: <User size={16} /> }
        ]
      },
      { 
        type: 'link', 
        name: 'Help & Support', 
        path: '/help-support', 
        icon: <HelpCircle size={18} /> 
      }
    ],
    'toda_president': [
      { 
        type: 'link', 
        name: 'Dashboard', 
        path: '/operator-dashboard', 
        icon: <LayoutDashboard size={18} /> 
      },
      {
        type: 'dropdown',
        name: 'TODA Portal',
        id: 'toda_portal',
        icon: <Users size={18} />,
        subItems: [
          { name: 'Submit Members', path: '/submit-members', icon: <Users size={16} /> },
          { name: 'Apply / Renew', path: '/apply-franchise', icon: <FileText size={16} /> },
          { name: 'My Profile', path: '/manage-profile', icon: <User size={16} /> }
        ]
      },
      { 
        type: 'link', 
        name: 'Help & Support', 
        path: '/help-support', 
        icon: <HelpCircle size={18} /> 
      }
    ]
  };

  const activeMenu = menuConfig[role] || menuConfig['operator'];

  // Kusang buksan ang accordion ng active route
  useEffect(() => {
    activeMenu.forEach(item => {
      if (item.type === 'dropdown') {
        const isCurrentInside = item.subItems.some(sub => sub.path === location.pathname);
        if (isCurrentInside) {
          setOpenSubMenus(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname, role]);

  const toggleSubMenu = (id) => {
    setOpenSubMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const getRoleLabel = () => {
    if (role === 'toda_president') return 'TODA PRESIDENT';
    if (role === 'admin') return 'ADMINISTRATOR';
    return 'OPERATOR';
  };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside 
        className={`w-64 bg-[#7A1B22] h-[100dvh] fixed top-0 left-0 flex flex-col justify-between shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-white/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Section */}
        <div className="p-4 sm:p-5 flex flex-col items-center border-b border-white/10 shrink-0 relative bg-[#6c171e]/50">
          <button 
            onClick={onClose}
            title="Hide Sidebar"
            className="absolute top-3.5 right-3.5 text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
          >
            <PanelLeftClose size={18} />
          </button>

          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-md border-2 border-[#D4AF37] overflow-hidden shrink-0">
            {userData.profilePic ? (
              <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : role === 'admin' ? (
              <img src="/gasan-logo.png" alt="Gasan Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
              <User className="text-slate-400" size={26} />
            )}
          </div>
          
          <h1 className="text-white font-bold text-xs sm:text-sm tracking-wide text-center leading-tight line-clamp-1 w-full px-2" title={userData.name}>
            {userData.name}
          </h1>
          
          <p className="text-[#D4AF37] text-[8px] sm:text-[9px] font-black uppercase tracking-widest mt-1 text-center bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">
            {getRoleLabel()}
          </p>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto min-h-0">
          {activeMenu.map((item, index) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                    isActive 
                      ? 'bg-white text-[#7A1B22] shadow-sm scale-[1.01]' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                      isAnySubActive && !isExpanded 
                        ? 'bg-white/15 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {item.icon}
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-white/15 ml-4">
                      {item.subItems.map((sub, subIdx) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <button
                            key={subIdx}
                            onClick={() => handleNavigate(sub.path)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                              isSubActive 
                                ? 'bg-white text-[#7A1B22] font-black shadow-sm' 
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {sub.icon}
                              <span className="truncate">{sub.name}</span>
                            </div>

                            {Boolean(sub.badge) && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-sm ring-1 ring-[#7A1B22]">
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

        {/* Footer Logout */}
        <div className="p-3 border-t border-white/10 shrink-0 bg-[#651419]">
          <button 
            onClick={() => { 
              localStorage.clear(); 
              navigate('/login'); 
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white/90 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-black uppercase tracking-wider"
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;