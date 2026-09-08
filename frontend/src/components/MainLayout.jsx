import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import OperatorBottomNav from './operator/OperatorBottomNav';

const MainLayout = ({ children }) => {
  // Default closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return false;
      const saved = localStorage.getItem('gtrams_sidebar_open');
      if (saved !== null) return JSON.parse(saved);
      return true;
    }
    return true;
  });

  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  const isOperator = role === 'operator';
  const isTodaPresident = role === 'toda president' || role === 'toda_president';
  const showBottomNav = isOperator || isTodaPresident;

  // Real-time user heartbeat ping
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const sendHeartbeat = () => {
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 90000);
    window.addEventListener('focus', sendHeartbeat);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', sendHeartbeat);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const nextState = !prev;
      if (window.innerWidth >= 768) {
        localStorage.setItem('gtrams_sidebar_open', JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    if (window.innerWidth >= 768) {
      localStorage.setItem('gtrams_sidebar_open', JSON.stringify(false));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />

      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <TopNavbar 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar} 
        />

        <main className={`p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden ${showBottomNav ? 'pb-24 md:pb-8' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation for Operator and TODA President */}
      {showBottomNav && (
        <OperatorBottomNav role={role} />
      )}
    </div>
  );
};

export default MainLayout;