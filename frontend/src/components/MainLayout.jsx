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

  // Ensure sidebar is closed on mobile when bottom navigation is active
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && showBottomNav) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showBottomNav]);

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
    const interval = setInterval(sendHeartbeat, 20000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };

    window.addEventListener('focus', sendHeartbeat);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', sendHeartbeat);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200 print:bg-white print:text-black print:block print:min-h-0">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />

      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out print:ml-0 print:p-0 print:m-0 print:w-full print:block ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <TopNavbar 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar} 
        />

        <main className={`p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden print:p-0 print:m-0 print:overflow-visible print:block ${showBottomNav ? 'pb-24 md:pb-8' : ''}`}>
          <div className="max-w-7xl mx-auto print:max-w-full print:m-0 print:p-0 print:w-full">
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