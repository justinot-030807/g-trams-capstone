import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Dark Overlay Backdrop para sa Mobile kapag bukas ang Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - ipinapasa natin ang state kung bukas o sarado */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        
        {/* MOBILE TOP HEADER (Lilitaw lang kapag maliit ang screen / mobile view) */}
        <header className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between md:hidden sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors focus:outline-none"
              aria-label="Open Menu"
            >
              {/* ITO YUNG BURGER ICON */}
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#7A1B22] text-lg tracking-wider">G-TRAMS</span>
            </div>
          </div>
        </header>

        {/* Content Page */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;