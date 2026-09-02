import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const SidebarLayout = ({ children }) => {
  // Babasahin sa localStorage para hindi mag-reset sa sarado tuwing lilipat ng page
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return false;
      const saved = localStorage.getItem('gtrams_sidebar_open');
      if (saved !== null) return JSON.parse(saved);
      return true;
    }
    return true;
  });

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
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />

      {/* Main Content View (md:ml-64 para eksakto sa 16rem lapad ng Sidebar) */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        {/* Top Bar Header */}
        <TopNavbar 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar} 
        />

        {/* Page Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;