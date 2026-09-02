import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, RefreshCw, ShieldAlert, Phone, Mail, ArrowRight, Lock } from 'lucide-react';

const MaintenanceMode = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const checkStatus = async () => {
    setIsChecking(true);
    setStatusMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`);
      if (res.ok) {
        const json = await res.json();
        const isMaint = json.data?.maintenanceMode ?? false;
        localStorage.setItem('maintenance_mode', isMaint ? 'true' : 'false');

        if (!isMaint) {
          setStatusMessage('Maintenance mode has ended! Redirecting...');
          setTimeout(() => {
            const role = (localStorage.getItem('role') || '').toLowerCase();
            if (role === 'admin' || role === 'administrator') {
              navigate('/admin-dashboard');
            } else if (localStorage.getItem('token')) {
              navigate('/operator-dashboard');
            } else {
              navigate('/login');
            }
          }, 1200);
        } else {
          setStatusMessage('System is still under active maintenance. Please check back shortly.');
        }
      } else {
        setStatusMessage('Unable to reach server. Please try again in a few moments.');
      }
    } catch {
      setStatusMessage('Network error. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#120204] flex flex-col justify-between items-center px-4 py-8 sm:p-10 select-none relative overflow-hidden text-white">
      
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7A1B22]/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/20 rounded-full blur-[110px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center p-1 shadow-md border-2 border-[#D4AF37] shrink-0">
          <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-wider text-white">G-TRAMS</h1>
          <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Municipality of Gasan</p>
        </div>
      </header>

      {/* Main Card */}
      <main className="relative z-10 w-full max-w-lg my-auto bg-white/95 backdrop-blur-2xl text-slate-900 rounded-3xl shadow-2xl border border-white/40 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300">
        
        {/* Animated Icon */}
        <div className="w-18 h-18 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-orange-200">
          <Wrench size={36} className="animate-bounce" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-widest border border-orange-200 mb-3 shadow-xs">
          <ShieldAlert size={12} /> Scheduled System Maintenance
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          System Temporarily Offline
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-medium">
          The G-TRAMS Portal is currently undergoing scheduled database optimizations and system updates by the Local Government Unit of Gasan.
        </p>

        <div className="my-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1.5">
          <p className="font-bold text-slate-800 flex items-center gap-2">
            <Lock size={14} className="text-[#7A1B22]" /> Public & Operator Access Paused
          </p>
          <p className="text-[11px] text-slate-500 leading-snug">
            Franchise submissions, renewals, and member validation are temporarily locked to ensure data integrity during maintenance.
          </p>
        </div>

        {statusMessage && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-bold ${
            statusMessage.includes('ended') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={checkStatus}
            disabled={isChecking}
            className="flex-1 flex items-center justify-center gap-2 bg-[#7A1B22] text-white py-3 px-4 rounded-xl text-xs font-bold hover:bg-[#5A1419] active:scale-95 transition-all shadow-md"
          >
            <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? 'Checking Server...' : 'Check Status'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Admin Sign In <ArrowRight size={14} />
          </button>
        </div>

        {/* Hotline */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Phone size={12} className="text-[#7A1B22]" /> (042) 342-1234
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Mail size={12} className="text-[#7A1B22]" /> bplo@gasan.gov.ph
          </span>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-white/50 text-[10px]">
        © 2026 Municipality of Gasan, Marinduque. All rights reserved.
      </footer>

    </div>
  );
};

export default MaintenanceMode;
