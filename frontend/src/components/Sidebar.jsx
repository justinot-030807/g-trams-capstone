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
      { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={17} /> },
      { name: 'Masterlist', path: '/franchise-masterlist', icon: <FileText size={17} /> },
      { name: 'Approvals', path: '/franchise-approval', icon: <FileCheck size={17} /> },
      { name: 'TODA Management', path: '/validate-toda', icon: <Users size={17} /> },
      { name: 'Revocations', path: '/manage-revocations', icon: <ShieldAlert size={17} /> },
      { name: 'User Management', path: '/user-management', icon: <Users size={17} /> },
      { name: 'System Settings', path: '/system-settings', icon: <Settings size={17} /> },
      { name: 'System Reports', path: '/system-reports', icon: <Printer size={17} /> },
    ],
    'operator': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={17} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={17} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={17} /> },
      { name: 'Help & Support', path: '/help-support', icon: <HelpCircle size={17} /> },
    ],
    'toda_president': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={17} /> },
      { name: 'Submit TODA Members', path: '/submit-members', icon: <Users size={17} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={17} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={17} /> },
      { name: 'Help & Support', path: '/help-support', icon: <HelpCircle size={17} /> },
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
      {/* Mobile Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-3 left-3 z-[60] p-2 bg-[#7A1B22] text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl shadow-lg hover:bg-[#5A1419] transition-all focus:outline-none"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`w-64 bg-[#7A1B22] h-screen fixed top-0 left-0 flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Profile Header */}
        <div className="p-4 md:p-5 flex flex-col items-center border-b border-white/10 mt-10 md:mt-0 shrink-0">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-md border-2 border-[#D4AF37] overflow-hidden">
            {userData.profilePic ? (
              <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : role === 'admin' ? (
              <img src="/gasan-logo.png" alt="Gasan Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <User className="text-slate-400" size={28} />
            )}
          </div>
          
          <h1 className="text-white font-bold text-sm tracking-wide text-center leading-tight line-clamp-1 w-full px-2" title={userData.name}>
            {userData.name}
          </h1>
          
          <p className="text-[#D4AF37] text-[9px] font-bold uppercase tracking-widest mt-1 text-center bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">
            {getRoleLabel()}
          </p>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto min-h-0">
          {activeMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-white text-[#7A1B22] shadow font-bold' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Fixed Log Out Area */}
        <div className="p-3 border-t border-white/10 shrink-0 bg-[#7A1B22]">
          <button 
            onClick={() => { 
              localStorage.clear(); 
              navigate('/login'); 
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white/90 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-bold"
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