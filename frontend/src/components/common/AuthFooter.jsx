import React from 'react';
import { Globe, Mail, Phone } from 'lucide-react';

const FacebookIcon = ({ size = 13, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AuthFooter = () => {
  return (
    <footer className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-white/50 text-[10px] sm:text-[11px] select-none shrink-0">
      
      {/* FAR-LEFT: Copyright */}
      <div className="text-left font-medium shrink-0">
        <span className="hidden sm:inline">© 2026 G-TRAMS • All Rights Reserved</span>
        <span className="sm:hidden">© 2026 G-TRAMS</span>
      </div>

      {/* CENTER: Social & Portal Quick Links */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 absolute left-1/2 -translate-x-1/2">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noreferrer"
          aria-label="LGU Gasan Official Facebook Page"
          title="LGU Gasan Facebook Page"
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/15 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
        >
          <FacebookIcon size={12} className="text-[#1877F2]" />
        </a>

        <a
          href="https://gasan.gov.ph"
          target="_blank"
          rel="noreferrer"
          aria-label="Official Municipality Portal"
          title="gasan.gov.ph (Official Portal)"
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
        >
          <Globe size={12} className="text-emerald-400" />
        </a>

        <a
          href="mailto:bplo@gasan.gov.ph"
          aria-label="BPLO Helpdesk Email"
          title="bplo@gasan.gov.ph"
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
        >
          <Mail size={12} className="text-[#D4AF37]" />
        </a>

        <a
          href="tel:0423421234"
          aria-label="BPLO Hotline"
          title="BPLO Hotline: (042) 342-1234"
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
        >
          <Phone size={11} className="text-amber-300" />
        </a>
      </div>

      {/* FAR-RIGHT: Version */}
      <div className="text-right font-mono text-[10px] text-white/40 tracking-wider shrink-0">
        v2.4.0
      </div>

    </footer>
  );
};

export default AuthFooter;
