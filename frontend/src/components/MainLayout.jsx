import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import OperatorBottomNav from './operator/OperatorBottomNav';
import TodaZoneGuideModal from './operator/TodaZoneGuideModal';

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

  const [isRouteGuideOpen, setIsRouteGuideOpen] = useState(false);

  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  const isOperator = role === 'operator';

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

        <main className={`p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden ${isOperator ? 'pb-24 md:pb-8' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Operator Mobile Bottom Navigation */}
      {isOperator && (
        <OperatorBottomNav 
          onOpenRouteGuide={() => setIsRouteGuideOpen(true)}
        />
      )}

      {/* TODA Route & Zone Guide Modal */}
      <TodaZoneGuideModal 
        isOpen={isRouteGuideOpen} 
        onClose={() => setIsRouteGuideOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;