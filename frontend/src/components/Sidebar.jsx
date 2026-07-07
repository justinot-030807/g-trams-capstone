import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, FileCheck, ShieldAlert, LogOut, Menu, X, User } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const [userData, setUserData] = useState({ name: 'G-TRAMS', profilePic: null });
  let role = localStorage.getItem('role') || 'operator';

  const adminRoutes = ['/admin-dashboard', '/franchise-masterlist', '/franchise-approval', '/manage-revocations', '/user-management', '/system-settings', '/validate-toda', '/system-reports'];
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
      { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={18} /> },
      { name: 'Masterlist', path: '/franchise-masterlist', icon: <FileText size={18} /> },
      { name: 'Approvals', path: '/franchise-approval', icon: <FileCheck size={18} /> },
      { name: 'TODA Management', path: '/validate-toda', icon: <Users size={18} /> },
      { name: 'Revocations', path: '/manage-revocations', icon: <ShieldAlert size={18} /> },
      { name: 'User Management', path: '/user-management', icon: <Users size={18} /> },
      { name: 'System Settings', path: '/system-settings', icon: <Settings size={18} /> },
    ],
    'operator': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={18} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={18} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={18} /> },
    ],
    'toda_president': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={18} /> },
      { name: 'Submit TODA Members', path: '/submit-members', icon: <Users size={18} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={18} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={18} /> },
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-3 left-3 z-[60] p-2 bg-[#7A1B22] text-[#D4AF37] border border-[#D4AF37]/50 rounded-lg shadow-md hover:bg-[#5A1419] hover:scale-105 transition-all duration-300 focus:outline-none group"
      >
        {isOpen ? (
          <X size={22} className="transform transition-transform group-hover:rotate-90" />
        ) : (
          <Menu size={22} className="transform transition-transform group-hover:scale-110" />
        )}
      </button>

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`w-64 bg-[#7A1B22] h-screen fixed top-0 left-0 flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-8 flex flex-col items-center border-b border-white/10 mt-12 md:mt-0">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-[#D4AF37] overflow-hidden">
            {userData.profilePic ? (
              <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : role === 'admin' ? (
              // FIX: Dito papasok ang Gasan Logo kapag Admin ang nag-login!
              <img src="/gasan-logo.png" alt="Gasan Logo" className="w-full h-full object-contain p-1.5" />
            ) : (
              <User className="text-slate-400" size={40} />
            )}
          </div>
          
          <h1 className="text-white font-bold tracking-wide text-center leading-tight line-clamp-1 w-full px-2" title={userData.name}>
            {userData.name}
          </h1>
          
          <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mt-1.5 text-center bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
            {getRoleLabel()}
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {activeMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-[#7A1B22] shadow-md transform scale-[1.02]' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => { 
              localStorage.clear(); 
              navigate('/login'); 
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/5 text-white/80 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;