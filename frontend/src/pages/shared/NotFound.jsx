import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="text-center max-w-md">
        <AlertTriangle size={64} className="mx-auto text-amber-500 mb-6" />
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">404 - Page Not Found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7A1B22] dark:bg-[#D4AF37] hover:bg-[#5A1419] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
