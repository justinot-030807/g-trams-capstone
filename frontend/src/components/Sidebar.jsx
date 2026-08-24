import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  FileCheck, ShieldAlert, LogOut, Menu, X, User, Printer, HelpCircle 
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const [userData, setUserData] = useState({ name: 'G-TRAMS', profilePic: null });
  let role = localStorage.getItem('role') || 'operator';

  const adminRoutes = [
    '/admin-dashboard', '/franchise-masterlist', '/franchise-approval', 
    '/manage-revocations', '/user-management', '/system-settings', 
    '/validate-toda', '/system-reports'
  ];
  if (adminRoutes.includes(location.pathname)) {
    role = 'admin';
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const storedName = localStorage.getItem('name');
    
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUserData({
          name: parsed.name || parsed.fullName || storedName || 'G-TRAMS',
          profilePic: parsed.profilePic || parsed.profilePicUrl || parsed.profilePicture || null
        });
      } catch (e) {
        console.error(e);
      }
    } else if (storedName) {
      setUserData(prev => ({ ...prev, name: storedName }));
    }
  }, []);

  const menu = {
    'admin': [
      { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={16} /> },
      { name: 'Masterlist', path: '/franchise-masterlist', icon: <FileText size={16} /> },
      { name: 'Approvals', path: '/franchise-approval', icon: <FileCheck size={16} /> },
      { name: 'TODA Management', path: '/validate-toda', icon: <Users size={16} /> },
      { name: 'Revocations', path: '/manage-revocations', icon: <ShieldAlert size={16} /> },
      { name: 'User Management', path: '/user-management', icon: <Users size={16} /> },
      { name: 'System Settings', path: '/system-settings', icon: <Settings size={16} /> },
      { name: 'System Reports', path: '/system-reports', icon: <Printer size={16} /> },
    ],
    'operator': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={16} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={16} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={16} /> },
      { name: 'Help & Support', path: '/help-support', icon: <HelpCircle size={16} /> },
    ],
    'toda_president': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={16} /> },
      { name: 'Submit TODA Members', path: '/submit-members', icon: <Users size={16} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={16} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={16} /> },
      { name: 'Help & Support', path: '/help-support', icon: <HelpCircle size={16} /> },
    ]
  };

  const activeMenu = menu[role] || menu['operator'];

  const getRoleLabel = () => {
    if (role === 'toda_president') return 'TODA PRESIDENT';
    if (role === 'admin') return 'ADMINISTRATOR';
    return 'OPERATOR';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[60] p-2 bg-[#7A1B22] text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl shadow-lg hover:bg-[#5A1419] transition-all focus:outline-none"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel with 100dvh */}
      <aside 
        className={`w-60 bg-[#7A1B22] h-[100dvh] fixed top-0 left-0 flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Compact Header with Mobile Close Icon */}
        <div className="p-3.5 flex flex-col items-center border-b border-white/10 shrink-0 relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-2.5 right-2.5 text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center mb-1.5 shadow-md border-2 border-[#D4AF37] overflow-hidden shrink-0">
            {userData.profilePic ? (
              <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : role === 'admin' ? (
              <img src="/gasan-logo.png" alt="Gasan Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
              <User className="text-slate-400" size={22} />
            )}
          </div>
          
          <h1 className="text-white font-bold text-xs tracking-wide text-center leading-tight line-clamp-1 w-full px-1" title={userData.name}>
            {userData.name}
          </h1>
          
          <p className="text-[#D4AF37] text-[8px] font-bold uppercase tracking-widest mt-0.5 text-center bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
            {getRoleLabel()}
          </p>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 px-2.5 py-1.5 space-y-0.5 overflow-y-auto min-h-0">
          {activeMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'bg-white text-[#7A1B22] shadow-sm font-bold' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Always Visible Fixed Logout Button */}
        <div className="p-2.5 border-t border-white/10 shrink-0 bg-[#651419]">
          <button 
            onClick={() => { 
              localStorage.clear(); 
              navigate('/login'); 
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white/90 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-xs font-bold"
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;