import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Dark Overlay Backdrop para sa Mobile kapag bukas ang Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60 transition-all duration-300">
        {/* Top Navbar Component */}
        <TopNavbar onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Content Page */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;