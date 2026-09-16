import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  UserPlus,
  Home
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
      <header className="relative z-30 w-full px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between border-b border-white/5 select-none shrink-0">
        
        {/* FAR LEFT: Gasan Seal + G-TRAMS (Clickable Link to Home) */}
        <a 
          href="/" 
          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer"
          title="Go to G-TRAMS Home (Refresh)"
        >
          <div className="relative shrink-0">
            <img 
              src="/gasan-logo.png" 
              alt="Gasan Official Seal" 
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.45)] group-hover:scale-105 transition-transform" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
              G-TRAMS
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase mt-0.5">
              Portal
            </span>
          </div>
        </a>

        {/* FAR RIGHT: Quick Links, Home Icon & Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Back to Home Icon Button */}
          <Link
            to="/"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-[#D4AF37] transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5"
            title="Back to Home"
          >
            <Home size={17} />
            <span className="hidden md:inline text-xs font-bold text-white/90">Home</span>
          </Link>

          {/* Contextual Nav Buttons */}
          {currentPath !== '/login' && (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7A1B22] via-[#9B222B] to-[#5A1419] shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer border border-white/10"
            >
              <LogIn size={13} className="text-[#D4AF37]" />
              <span>Sign In</span>
            </Link>
          )}

          {currentPath !== '/register' && (
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-[#120204] bg-[#D4AF37] hover:bg-[#E5C158] shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            >
              <UserPlus size={13} className="text-[#120204]" />
              <span>Register</span>
            </Link>
          )}

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Menu & Guidelines"
          >
            <Menu size={19} />
          </button>
        </div>

      </header>

      {/* SLIDE-OUT DRAWER (Animated Smooth Hamburger Menu) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md select-none"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#180407] to-[#0D0103] p-5 sm:p-6 flex flex-col justify-between shadow-2xl h-full overflow-y-auto"
            >
              
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <Link 
                    to="/" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <img src="/gasan-logo.png" alt="Gasan Seal" className="w-9 h-9 object-contain" />
                    <div>
                      <h3 className="font-black text-sm text-white tracking-wide">G-TRAMS PORTAL</h3>
                      <p className="text-xs text-[#D4AF37] font-semibold">Municipality of Gasan</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Navigation Links (No Harsh Borders) */}
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest px-1">Navigation</p>
                  
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      currentPath === '/' 
                        ? 'bg-gradient-to-r from-[#7A1B22] to-[#5A1419] text-white font-bold shadow-md' 
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Home size={16} className={currentPath === '/' ? 'text-[#D4AF37]' : 'text-white/50'} />
                      <span className="text-xs font-semibold">Home</span>
                    </div>
                    <ChevronRight size={14} className="text-white/40" />
                  </Link>

                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      currentPath === '/login' 
                        ? 'bg-gradient-to-r from-[#7A1B22] to-[#5A1419] text-white font-bold shadow-md' 
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LogIn size={16} className={currentPath === '/login' ? 'text-[#D4AF37]' : 'text-white/50'} />
                      <span className="text-xs font-semibold">Sign In</span>
                    </div>
                    <ChevronRight size={14} className="text-white/40" />
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      currentPath === '/register' 
                        ? 'bg-gradient-to-r from-[#7A1B22] to-[#5A1419] text-white font-bold shadow-md' 
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserPlus size={16} className={currentPath === '/register' ? 'text-[#D4AF37]' : 'text-white/50'} />
                      <span className="text-xs font-semibold">Create Account</span>
                    </div>
                    <ChevronRight size={14} className="text-white/40" />
                  </Link>

                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest px-1 pt-3">Official Links</p>

                  <a
                    href="https://gasan.ph"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-left text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={15} className="text-[#D4AF37]" />
                      <span>Official Municipality Website (gasan.ph)</span>
                    </div>
                    <ExternalLink size={13} className="text-white/40" />
                  </a>

                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-left text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FacebookIcon size={15} className="text-[#1877F2]" />
                      <span>LGU Gasan Facebook Page</span>
                    </div>
                    <ExternalLink size={13} className="text-white/40" />
                  </a>
                </div>

                {/* Municipal Support Information (De-BPLO'd) */}
                <div className="mt-5 p-4 rounded-3xl bg-white/[0.04] text-xs text-white/80 space-y-2">
                  <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
                    <Building2 size={16} />
                    <span>Municipal Helpdesk &amp; Support</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Ground Floor, Gasan Municipal Hall, Gasan, Marinduque
                  </p>
                  <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs">
                    <p className="flex items-center gap-2">
                      <Phone size={13} className="text-[#D4AF37]" />
                      <span>Hotline: <strong>(042) 342-1234</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={13} className="text-[#D4AF37]" />
                      <span>Email: <strong>bplo@gasan.ph</strong></span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 mt-4">
                <span>G-TRAMS Portal</span>
                <span className="font-mono">v2.4.0</span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
