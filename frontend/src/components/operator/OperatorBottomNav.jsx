import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, HelpCircle, Settings } from 'lucide-react';

const OperatorBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'garage',
      label: 'Garage',
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
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      path: '/help-support',
      active: location.pathname === '/help-support'
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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden print:hidden">
      {/* Safe Area Container */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-2 flex items-center justify-around">
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
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                item.active
                  ? 'text-[#7A1B22] dark:text-[#D4AF37]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all ${
                item.active ? 'bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15' : ''
              }`}>
                <Icon size={20} className={item.active ? 'stroke-[2.5]' : 'stroke-[2]'} />
                {item.active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#7A1B22] dark:bg-[#D4AF37]" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${
                item.active ? 'font-black' : 'font-semibold'
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
