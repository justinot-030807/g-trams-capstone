import React, { useState, useEffect, useRef } from 'react';
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
import InteractiveLogo from './InteractiveLogo';
import { 
  HELP_DESK_EMAIL, 
  HOTLINE_DISPLAY, 
  HOTLINE_NUMBER, 
  MUNICIPAL_WEBSITE, 
  FB_PAGE_URL, 
  OFFICE_LOCATION 
} from '../../utils/contactConfig';

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
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  // Accessible Escape key listener & Body scroll lock (R39)
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      } else if (e.key === 'Tab' && drawerRef.current) {
        // Focus trap inside drawer
        const focusable = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    // Auto-focus the close button or first element in drawer
    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const closeBtn = drawerRef.current.querySelector('button[aria-label="Close navigation menu"]');
        closeBtn?.focus();
      }
    }, 50);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isMenuOpen]);

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <>
      {/* FULL-WIDTH TOP NAVBAR (Velvet Maroon Header) */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-[#9E2A2B] border-b border-[#7A1B22] text-white shadow-xs flex items-center justify-between select-none shrink-0 transition-colors">
        
        {/* FAR LEFT: Interactive Flip Medallion (G-TRAMS <-> Sangguniang Bayan Seal) */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          <InteractiveLogo 
            size="w-11 h-11 sm:w-13 sm:h-13"
            showBadgeHint={false}
          />
          <Link 
            to="/" 
            className="flex flex-col group cursor-pointer"
            title="Go to G-TRAMS Home"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-none group-hover:text-[#D4AF37] transition-colors">
              G-TRAMS
            </span>
            <span className="text-[9px] sm:text-[10px] text-white/80 font-semibold tracking-wider uppercase mt-0.5">
              Pamahalaang Bayan ng Gasan
            </span>
          </Link>
        </div>

        {/* FAR RIGHT: Quick Links, Home Icon & Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Back to Home Icon Button */}
          <Link
            to="/"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1.5 min-h-[44px]"
            title="Back to Home"
          >
            <Home size={17} />
            <span className="hidden md:inline text-xs font-bold text-white">Home</span>
          </Link>

          {/* Contextual Nav Buttons */}
          {currentPath !== '/login' && (
            <Link
              to="/login"
              aria-current={currentPath === '/login' ? 'page' : undefined}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#9E2A2B] bg-white hover:bg-[#F6F5F3] shadow-xs transition-all cursor-pointer border border-white/40 min-h-[44px]"
            >
              <LogIn size={13} className="text-[#9E2A2B]" />
              <span>Log In</span>
            </Link>
          )}

          {currentPath !== '/register' && (
            <Link
              to="/register"
              aria-current={currentPath === '/register' ? 'page' : undefined}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#14110F] bg-[#D4AF37] hover:bg-[#c29e2f] shadow-xs transition-all cursor-pointer min-h-[44px]"
            >
              <UserPlus size={13} className="text-[#14110F]" />
              <span>Register</span>
            </Link>
          )}

          {/* Hamburger Menu Button (R39 Accessible Trigger) */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
            aria-label="Open Navigation Menu"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            onClick={handleCloseMenu}
            className="fixed inset-0 z-50 flex justify-end bg-black/60 select-none"
            role="presentation"
          >
            <motion.div 
              ref={drawerRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              className="relative w-full max-w-sm sm:max-w-md bg-[#1C1917] border-l border-[#2E2A27] p-5 sm:p-6 flex flex-col justify-between shadow-xl h-full overflow-y-auto text-white"
            >
              
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#2E2A27]">
                  <div className="flex items-center gap-2.5">
                    <InteractiveLogo size="w-9 h-9" />
                    <Link 
                      to="/" 
                      onClick={handleCloseMenu}
                      className="cursor-pointer"
                    >
                      <h3 className="font-bold text-sm text-white tracking-wide">G-TRAMS PORTAL</h3>
                      <p className="text-xs text-[#D4AF37] font-semibold">Pamahalaang Bayan ng Gasan</p>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseMenu}
                    aria-label="Close navigation menu"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A8A29E] hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider px-1">Navigation</p>
                  
                  <Link
                    to="/"
                    onClick={handleCloseMenu}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer min-h-[44px] ${
                      currentPath === '/' 
                        ? 'bg-[#9E2A2B] text-white font-bold shadow-xs' 
                        : 'bg-[#14110F] hover:bg-[#2E2A27] text-[#EAE7E1] border border-[#2E2A27]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Home size={16} className={currentPath === '/' ? 'text-[#D4AF37]' : 'text-[#A8A29E]'} />
                      <span className="text-xs font-semibold">Home</span>
                    </div>
                    <ChevronRight size={14} className="text-white/40" />
                  </Link>

                  <Link
                    to="/login"
                    onClick={handleCloseMenu}
                    aria-current={currentPath === '/login' ? 'page' : undefined}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer min-h-[44px] ${
                      currentPath === '/login' 
                        ? 'bg-[#9E2A2B] text-white font-bold shadow-xs' 
                        : 'bg-[#14110F] hover:bg-[#2E2A27] text-[#EAE7E1] border border-[#2E2A27]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LogIn size={16} className={currentPath === '/login' ? 'text-[#D4AF37]' : 'text-white/60'} />
                      <span className="text-sm font-semibold">Log In</span>
                    </div>
                    <ChevronRight size={14} className="text-white/40" />
                  </Link>

                  <Link
                    to="/register"
                    onClick={handleCloseMenu}
                    aria-current={currentPath === '/register' ? 'page' : undefined}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#1A0B0E] font-black transition-all cursor-pointer shadow-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserPlus size={16} className="text-[#1A0B0E]" />
                      <span className="text-sm font-black">Register</span>
                    </div>
                    <ChevronRight size={14} className="text-[#1A0B0E]/60" />
                  </Link>

                  <p className="text-xs font-bold text-amber-200/90 uppercase tracking-widest px-1 pt-3">Official Links</p>

                  <a
                    href={MUNICIPAL_WEBSITE}
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
                    href={FB_PAGE_URL}
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

                {/* Municipal Support Information (R35, R36 Config Integration) */}
                <div className="mt-5 p-4 rounded-3xl bg-white/[0.04] text-xs text-white/80 space-y-2">
                  <div className="flex items-center gap-2 text-[#D4AF37] font-bold">
                    <Building2 size={16} />
                    <span>Municipal Helpdesk &amp; Support</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {OFFICE_LOCATION}
                  </p>
                  <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-white/90">
                    <p className="flex items-center gap-2">
                      <Phone size={13} className="text-[#D4AF37]" />
                      <span>Hotline: <a href={`tel:${HOTLINE_NUMBER}`} className="font-bold underline text-white hover:text-amber-200">{HOTLINE_DISPLAY}</a></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={13} className="text-[#D4AF37]" />
                      <span>Email: <a href={`mailto:${HELP_DESK_EMAIL}`} className="font-bold underline text-white hover:text-amber-200">{HELP_DESK_EMAIL}</a></span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/60 mt-4">
                <span>G-TRAMS Portal</span>
                <span className="font-mono text-white/80">v2.4.0</span>
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
