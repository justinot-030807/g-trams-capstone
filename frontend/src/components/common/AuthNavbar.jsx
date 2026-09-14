import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  Globe, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Building2,
  LogIn,
  UserPlus
} from 'lucide-react';
import TermsPolicyModal from './TermsPolicyModal';

const FacebookIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AuthNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* FULL-WIDTH TOP NAVBAR (Edge-to-Edge) */}
      <header className="relative z-30 w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between border-b border-white/5 select-none shrink-0">
        
        {/* FAR LEFT: Gasan Seal + G-TRAMS (Clickable Link to Home) */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer"
          title="Go to G-TRAMS Home"
        >
          <div className="relative shrink-0 animate-seal-float">
            <img 
              src="/gasan-logo.png" 
              alt="Gasan Official Seal" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.45)] group-hover:scale-105 transition-transform" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-white leading-none">
              G-TRAMS
            </span>
            <span className="text-[#D4AF37] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-0.5">
              Municipality of Gasan • Marinduque
            </span>
          </div>
        </Link>

        {/* FAR RIGHT: Quick Links & Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Contextual Nav Buttons (Hidden on small mobile if tight) */}
          {currentPath !== '/login' && (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer"
            >
              <LogIn size={13} className="text-[#D4AF37]" />
              <span>Sign In</span>
            </Link>
          )}

          {currentPath !== '/register' && (
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#D4AF37] hover:text-white bg-[#7A1B22]/60 hover:bg-[#7A1B22] border border-[#D4AF37]/30 transition-all cursor-pointer"
            >
              <UserPlus size={13} />
              <span>Register</span>
            </Link>
          )}

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Menu & Guidelines"
          >
            <Menu size={18} />
          </button>
        </div>

      </header>

      {/* SLIDE-OUT DRAWER (Hamburger Menu) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-sm sm:max-w-md bg-[#180407] border-l border-white/15 p-5 sm:p-6 flex flex-col justify-between shadow-2xl h-full animate-slide-left">
            
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <Link 
                  to="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <img src="/gasan-logo.png" alt="Gasan Seal" className="w-9 h-9 object-contain" />
                  <div>
                    <h3 className="font-black text-sm text-white">G-TRAMS PORTAL</h3>
                    <p className="text-[10px] text-[#D4AF37] font-semibold">Municipality of Gasan</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Navigation</p>
                
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    currentPath === '/' 
                      ? 'bg-[#7A1B22]/50 border-[#D4AF37]/50 text-white' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                >
                  <span className="text-xs font-semibold">Home</span>
                  <ChevronRight size={14} className="text-white/40" />
                </Link>

                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    currentPath === '/login' 
                      ? 'bg-[#7A1B22]/50 border-[#D4AF37]/50 text-white' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                >
                  <span className="text-xs font-semibold">Sign In</span>
                  <ChevronRight size={14} className="text-white/40" />
                </Link>

                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    currentPath === '/register' 
                      ? 'bg-[#7A1B22]/50 border-[#D4AF37]/50 text-white' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                >
                  <span className="text-xs font-semibold">Create Account</span>
                  <ChevronRight size={14} className="text-white/40" />
                </Link>

                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1 pt-3">Policy & Guidelines</p>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowTermsModal(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-[#D4AF37]" />
                    <span>Terms of Use & Privacy Policy</span>
                  </div>
                  <ChevronRight size={14} className="text-white/40" />
                </button>

                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1 pt-3">Official Links</p>

                <a
                  href="https://gasan.gov.ph"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-emerald-400" />
                    <span>Official Municipality Website (gasan.gov.ph)</span>
                  </div>
                  <ExternalLink size={13} className="text-white/40" />
                </a>

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FacebookIcon size={15} className="text-[#1877F2]" />
                    <span>LGU Gasan Facebook Page</span>
                  </div>
                  <ExternalLink size={13} className="text-white/40" />
                </a>
              </div>

              {/* BPLO Support Information */}
              <div className="mt-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
                  <Building2 size={15} />
                  <span>BPLO Helpdesk & Support</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Ground Floor, Gasan Municipal Hall, Gasan, Marinduque
                </p>
                <div className="pt-2 border-t border-white/10 space-y-1 text-[11px]">
                  <p className="flex items-center gap-2">
                    <Phone size={12} className="text-amber-300" />
                    <span>Hotline: <strong>(042) 342-1234</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={12} className="text-[#D4AF37]" />
                    <span>Email: <strong>bplo@gasan.gov.ph</strong></span>
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
              <span>G-TRAMS Portal</span>
              <span className="font-mono">v2.4.0</span>
            </div>

          </div>
        </div>
      )}

      {/* Simplified Terms & Privacy Modal */}
      <TermsPolicyModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        defaultLang="en"
        showAcceptButton={false}
      />
    </>
  );
};

export default AuthNavbar;
