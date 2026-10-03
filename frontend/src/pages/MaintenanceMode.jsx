import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, RefreshCw, ShieldAlert, Phone, Mail, ArrowRight, Lock } from 'lucide-react';
import { HELP_DESK_EMAIL, HOTLINE_DISPLAY, HOTLINE_NUMBER } from '../utils/contactConfig';

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
    <div className="min-h-[100dvh] w-full bg-[#14110F] flex flex-col justify-between items-center px-4 py-8 sm:p-10 select-none text-white">
      
      {/* Top Header */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-xs border border-[#D4AF37] shrink-0">
          <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wider text-white">G-TRAMS</h1>
          <p className="text-[11px] text-[#D4AF37] font-semibold uppercase tracking-wider">Pamahalaang Bayan ng Gasan</p>
        </div>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-lg my-auto bg-[#1C1917] text-white rounded-lg shadow-xl border border-[#2E2A27] p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
        
        {/* Icon */}
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <Wrench size={32} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/20 mb-3 shadow-xs">
          <ShieldAlert size={13} /> Naka-iskedyul na Maintenance
        </span>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Pansamantalang Naka-offline ang System
        </h2>

        <p className="text-xs sm:text-sm text-[#A8A29E] mt-2 leading-relaxed font-normal">
          Kasalukuyang sumasailalim sa routine maintenance at database optimization ang G-TRAMS Portal para sa mas mabilis at ligtas na serbisyo.
        </p>

        <div className="my-5 p-4 rounded-lg bg-[#14110F] border border-[#2E2A27] text-left text-xs text-[#A8A29E] space-y-1.5">
          <p className="font-bold text-white flex items-center gap-2">
            <Lock size={14} className="text-[#D4AF37]" /> Public & Operator Access Paused
          </p>
          <p className="text-[11px] text-[#A8A29E] leading-relaxed">
            Ang pagpapasa ng bagong prangkisa, renewal, at member verification ay pansamantalang naka-pause upang maprotektahan ang data integrity.
          </p>
        </div>

        {statusMessage && (
          <div className={`mb-4 p-3 rounded-lg text-xs font-bold ${
            statusMessage.includes('ended') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-600/30' : 'bg-amber-500/10 text-amber-300 border border-amber-600/30'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={checkStatus}
            disabled={isChecking}
            className="flex-1 flex items-center justify-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-xs min-h-[44px] cursor-pointer"
          >
            <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? 'Sinusuri ang Server...' : 'Suriin ang Status'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2E2A27] hover:bg-[#3E3834] text-[#EAE7E1] font-bold rounded-lg text-xs transition-colors cursor-pointer min-h-[44px] border border-[#3E3834]"
          >
            Admin Log In <ArrowRight size={14} />
          </button>
        </div>

        {/* Hotline */}
        <div className="mt-6 pt-4 border-t border-[#2E2A27] flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[#A8A29E] font-medium">
          <a href={`tel:${HOTLINE_NUMBER}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone size={13} className="text-[#D4AF37]" /> {HOTLINE_DISPLAY}
          </a>
          <span className="hidden sm:inline">&bull;</span>
          <a href={`mailto:${HELP_DESK_EMAIL}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Mail size={13} className="text-[#D4AF37]" /> {HELP_DESK_EMAIL}
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-[#A8A29E] text-xs">
        &copy; 2026 Pamahalaang Bayan ng Gasan, Marinduque. All rights reserved.
      </footer>

    </div>
  );
};

export default MaintenanceMode;

