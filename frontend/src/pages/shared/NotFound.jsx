import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#F6F5F3] dark:bg-[#14110F] p-4">
      <div className="text-center max-w-md bg-white dark:bg-[#1C1917] p-8 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm">
        <AlertTriangle size={56} className="mx-auto text-amber-600 dark:text-amber-400 mb-4" />
        <h1 className="text-2xl font-bold text-[#1F1D1B] dark:text-white mb-2">404 - Pahina Hindi Natagpuan</h1>
        <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mb-6 font-medium">
          Ang hinahanap mong pahina ay wala na o inilipat sa ibang lokasyon.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer min-h-[44px]"
        >
          <ArrowLeft size={16} />
          Bumalik sa Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
