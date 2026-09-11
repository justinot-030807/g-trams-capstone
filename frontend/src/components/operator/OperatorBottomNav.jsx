import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, Settings, Users } from 'lucide-react';

const OperatorBottomNav = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentRole = String(role || localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  const isTodaPresident = currentRole === 'toda president' || currentRole === 'toda_president';

  const navItems = isTodaPresident ? [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/operator-dashboard',
      active: location.pathname === '/operator-dashboard'
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      path: '/submit-members',
      active: location.pathname === '/submit-members'
    },
    {
      id: 'apply',
      label: 'Apply',
      icon: PlusCircle,
      path: '/apply-franchise',
      active: location.pathname === '/apply-franchise' || location.pathname.startsWith('/renew-franchise')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/operator/settings',
      active: location.pathname === '/operator/settings'
    }
  ] : [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/operator-dashboard',
      active: location.pathname === '/operator-dashboard'
    },
    {
      id: 'apply',
      label: 'Apply',
      icon: PlusCircle,
      path: '/apply-franchise',
      active: location.pathname === '/apply-franchise' || location.pathname.startsWith('/renew-franchise')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/operator/settings',
      active: location.pathname === '/operator/settings'
    }
  ];

  return (
    <div className="fixed bottom-3 inset-x-3.5 sm:inset-x-6 z-40 md:hidden print:hidden max-w-md mx-auto pointer-events-none animate-spring-in">
      {/* Floating Glass Dock Container */}
      <nav id="tour-bottom-nav" className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-[0_10px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-3xl sm:rounded-full px-2 py-1.5 flex items-center justify-around transition-all">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  navigate(item.path);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
                item.active
                  ? 'text-[#7A1B22] dark:text-[#D4AF37]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                item.active 
                  ? 'bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 scale-105' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}>
                <Icon size={19} className={item.active ? 'stroke-[2.5]' : 'stroke-[2]'} />
                {item.active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37] shadow-xs" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 ${
                item.active ? 'font-black scale-105' : 'font-semibold'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default OperatorBottomNav;

