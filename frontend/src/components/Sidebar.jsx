import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  FileCheck, ShieldAlert, LogOut, X, User, Printer, HelpCircle 
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userData, setUserData] = useState({ name: 'G-TRAMS', profilePic: null });
  const [pendingCount, setPendingCount] = useState(0);
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
  }, [role, location.pathname]);

  const menu = {
    'admin': [
      { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={18} /> },
      { name: 'Masterlist', path: '/franchise-masterlist', icon: <FileText size={18} /> },
      { 
        name: 'Approvals', 
        path: '/franchise-approval', 
        icon: <FileCheck size={18} />, 
        badge: pendingCount > 0 ? pendingCount : null 
      },
      { name: 'TODA Management', path: '/validate-toda', icon: <Users size={18} /> },
      { name: 'Revocations', path: '/manage-revocations', icon: <ShieldAlert size={18} /> },
      { name: 'User Management', path: '/user-management', icon: <Users size={18} /> },
      { name: 'System Settings', path: '/system-settings', icon: <Settings size={18} /> },
      { name: 'System Reports', path: '/system-reports', icon: <Printer size={18} /> },
    ],
    'operator': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={18} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={18} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={18} /> },
      { name: 'Help & Support', path: '/help-support', icon: <HelpCircle size={18} /> },
    ],
    'toda_president': [
      { name: 'Dashboard', path: '/operator-dashboard', icon: <LayoutDashboard size={18} /> },
      { name: 'Submit TODA Members', path: '/submit-members', icon: <Users size={18} /> },
      { name: 'Apply/Renew', path: '/apply-franchise', icon: <FileText size={18} /> },
      { name: 'Profile', path: '/manage-profile', icon: <Users size={18} /> },
      { name: 'Help & Support', path: '/help-support', icon: <HelpCircle size={18} /> },
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
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside 
        className={`w-64 bg-[#7A1B22] h-[100dvh] fixed top-0 left-0 flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Profile / Header Section */}
        <div className="p-5 flex flex-col items-center border-b border-white/10 shrink-0 relative">
          <button 
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2.5 shadow-md border-2 border-[#D4AF37] overflow-hidden shrink-0">
            {userData.profilePic ? (
              <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : role === 'admin' ? (
              <img src="/gasan-logo.png" alt="Gasan Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <User className="text-slate-400" size={30} />
            )}
          </div>
          
          <h1 className="text-white font-bold text-sm tracking-wide text-center leading-tight line-clamp-1 w-full px-2" title={userData.name}>
            {userData.name}
          </h1>
          
          <p className="text-[#D4AF37] text-[9px] font-bold uppercase tracking-widest mt-1 text-center bg-[#D4AF37]/10 px-3 py-0.5 rounded-full border border-[#D4AF37]/20">
            {getRoleLabel()}
          </p>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3.5 py-3 space-y-1 overflow-y-auto min-h-0">
          {activeMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'bg-white text-[#7A1B22] shadow-sm font-bold scale-[1.01]' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  {item.icon}
                  <span className="truncate">{item.name}</span>
                </div>

                {Boolean(item.badge) && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-sm ring-2 ring-[#7A1B22]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Footer Section */}
        <div className="p-3.5 border-t border-white/10 shrink-0 bg-[#6b161c]">
          <button 
            onClick={() => { 
              localStorage.clear(); 
              navigate('/login'); 
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white/90 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-bold"
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