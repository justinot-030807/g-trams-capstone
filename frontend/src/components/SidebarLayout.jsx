import React from 'react';
import Sidebar from './Sidebar';

const SidebarLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 lg:p-8 pt-16 md:pt-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;