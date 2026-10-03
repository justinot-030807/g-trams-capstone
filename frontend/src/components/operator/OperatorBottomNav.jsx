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
    <div 
      className="fixed bottom-0 inset-x-0 z-40 md:hidden print:hidden bg-white dark:bg-[#1C1917] border-t border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav id="tour-bottom-nav" className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
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
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors cursor-pointer min-h-[48px] ${
                item.active
                  ? 'text-[#9E2A2B] dark:text-[#D4AF37]'
                  : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
              }`}
            >
              <div className={`relative p-1 rounded-md transition-colors shrink-0 ${
                item.active 
                  ? 'bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15' 
                  : 'hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]'
              }`}>
                <Icon size={18} className={item.active ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
              </div>
              <span className={`text-[11px] sm:text-xs mt-0.5 tracking-normal truncate w-full text-center leading-tight ${
                item.active ? 'font-semibold' : 'font-normal'
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

