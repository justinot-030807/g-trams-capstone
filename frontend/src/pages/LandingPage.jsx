import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Smartphone, 
  Globe, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Info,
  Building2
} from 'lucide-react';
import TermsPolicyModal from '../components/common/TermsPolicyModal';

const FacebookIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // If already authenticated, redirect straight to their dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
    if (token) {
      if (role === 'admin' || role === 'administrator') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/operator-dashboard', { replace: true });
      }
    }
  }, [navigate]);

  // Ensure full-screen coverage without zoom gaps on laptops
  useEffect(() => {
    document.documentElement.classList.add('auth-view');
    document.body.classList.add('auth-view');
    document.documentElement.style.backgroundColor = '#120204';
    document.body.style.backgroundColor = '#120204';
    return () => {
      document.documentElement.classList.remove('auth-view');
      document.body.classList.remove('auth-view');
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#120204] text-white flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* Dynamic Ambient Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[580px] h-[580px] bg-gradient-to-br from-[#9E1B27] via-[#C92A36] to-transparent rounded-full blur-[90px] opacity-75 animate-liquid-1" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[620px] h-[620px] bg-gradient-to-tl from-[#5A0E15] via-[#851821] to-[#360408] rounded-full blur-[100px] opacity-80 animate-liquid-2" />
        <div className="absolute top-[35%] right-[5%] w-[420px] h-[420px] bg-gradient-to-bl from-[#E03144]/50 via-[#8A141E] to-transparent rounded-full blur-[80px] animate-liquid-3" />

        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* TOP NAVBAR */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative shrink-0 animate-seal-float">
            <img 
              src="/gasan-logo.png" 
              alt="Gasan Official Seal" 
              className="w-11 h-11 sm:w-13 sm:h-13 object-contain filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.45)] group-hover:scale-105 transition-transform" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">G-TRAMS</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30">v2.4.0</span>
            </div>
            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mt-0.5">Municipality of Gasan • Marinduque</p>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Login Link (Desktop) */}
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer"
          >
            <LogIn size={14} className="text-[#D4AF37]" />
            <span>Sign In</span>
          </Link>

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Menu size={20} />
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
                <div className="flex items-center gap-2.5">
                  <img src="/gasan-logo.png" alt="Seal" className="w-9 h-9 object-contain" />
                  <div>
                    <h3 className="font-black text-sm text-white">G-TRAMS PORTAL</h3>
                    <p className="text-[10px] text-[#D4AF37] font-semibold">Municipality of Gasan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">Navigation & Legal</p>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowTermsModal(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-[#D4AF37]" />
                    <span>Terms of Use & Privacy Policy</span>
                  </div>
                  <ChevronRight size={14} className="text-white/40" />
                </button>

                <a
                  href="https://gasan.gov.ph"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={16} className="text-emerald-400" />
                    <span>Official Municipality Website (gasan.gov.ph)</span>
                  </div>
                  <ExternalLink size={13} className="text-white/40" />
                </a>

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FacebookIcon size={16} className="text-[#1877F2]" />
                    <span>LGU Gasan Facebook Page</span>
                  </div>
                  <ExternalLink size={13} className="text-white/40" />
                </a>
              </div>

              {/* BPLO Information Box */}
              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-2">
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
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
              <span>G-TRAMS Portal</span>
              <span className="font-mono">v2.4.0</span>
            </div>

          </div>
        </div>
      )}

      {/* MAIN HERO & ACTION SECTION */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 my-auto text-center flex flex-col items-center">
        
        {/* Floating Official Seal */}
        <div className="relative mb-4 sm:mb-6 animate-seal-float">
          <img 
            src="/gasan-logo.png" 
            alt="Official Seal of Gasan" 
            className="w-20 h-20 sm:w-28 sm:h-28 object-contain filter drop-shadow-[0_8px_30px_rgba(212,175,55,0.45)]"
          />
        </div>

        {/* Municipality Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4 shadow-sm">
          <span>Bayan ng Gasan</span>
          <span>•</span>
          <span>Lalawigan ng Marinduque</span>
        </div>

        {/* Big Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight max-w-3xl drop-shadow-md">
          Gasan Tricycle Records & Application Management System
        </h1>

        <p className="text-white/75 text-xs sm:text-base max-w-2xl mt-3 sm:mt-4 leading-relaxed font-normal">
          Ang opisyal na digital transport portal ng Lokal na Pamahalaan ng Gasan para sa mabilis, transparent, at maayos na prangkisa ng motorized tricycle.
        </p>

        {/* TWO PRIMARY CALL-TO-ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 mt-6 sm:mt-8 w-full max-w-md">
          
          {/* Sign In Button */}
          <Link
            to="/login"
            className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(122,27,34,0.45)] hover:shadow-[0_15px_30px_rgba(122,27,34,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-white/15 cursor-pointer"
          >
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />
            <LogIn size={17} />
            <span>Mag-Sign In</span>
          </Link>

          {/* Create Account Button */}
          <Link
            to="/register"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <UserPlus size={17} className="text-[#D4AF37]" />
            <span>Gumawa ng Account</span>
          </Link>

        </div>

        {/* 4 FEATURE HIGHLIGHT CARDS (Consolidated) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12 w-full text-left">
          
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-all">
            <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-2.5 shadow-sm">
              <FileText size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">Online Application</h3>
            <p className="text-[11px] text-white/70 mt-1 leading-tight">
              Magpasa ng OR/CR at franchise requirements online nang hindi pumipila.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-all">
            <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-2.5 shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">TODA Registry</h3>
            <p className="text-[11px] text-white/70 mt-1 leading-tight">
              Rehistrado at lehitimong masterlist ng mga operators at TODA associations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-all">
            <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-2.5 shadow-sm">
              <Clock size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">Claim Stub & Status</h3>
            <p className="text-[11px] text-white/70 mt-1 leading-tight">
              Subaybayan ang approval live at mag-print ng official QR payment claim stub.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-all">
            <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-2.5 shadow-sm">
              <Smartphone size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">PWA Mobile Ready</h3>
            <p className="text-[11px] text-white/70 mt-1 leading-tight">
              Madaling buksan at i-install sa phone para sa mga tricycle operators.
            </p>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-white/50 text-[10px] shrink-0 select-none">
        <div className="text-center sm:text-left font-medium">
          <span>© 2026 Municipality of Gasan, Marinduque</span>
          <span className="hidden sm:inline mx-1.5 opacity-40">•</span>
          <span className="hidden sm:inline text-white/40">G-TRAMS</span>
        </div>

        {/* Social & Official Icons */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="LGU Gasan Official Facebook Page"
            title="LGU Gasan Facebook Page"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/15 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
          >
            <FacebookIcon size={13} className="text-[#1877F2]" />
          </a>

          <a
            href="https://gasan.gov.ph"
            target="_blank"
            rel="noreferrer"
            aria-label="Official Municipality Portal"
            title="gasan.gov.ph (Official Portal)"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
          >
            <Globe size={13} className="text-emerald-400" />
          </a>

          <a
            href="mailto:bplo@gasan.gov.ph"
            aria-label="BPLO Helpdesk Email"
            title="bplo@gasan.gov.ph"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
          >
            <Mail size={13} className="text-[#D4AF37]" />
          </a>

          <a
            href="tel:0423421234"
            aria-label="BPLO Hotline"
            title="BPLO Hotline: (042) 342-1234"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 hover:text-white border border-white/10 flex items-center justify-center text-white/80 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
          >
            <Phone size={12} className="text-amber-300" />
          </a>
        </div>

        {/* Right: Version text */}
        <div className="text-center sm:text-right font-mono text-[10px] text-white/40 tracking-wider">
          v2.4.0
        </div>
      </footer>

      {/* Simplified Terms & Privacy Modal */}
      <TermsPolicyModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        showAcceptButton={false}
      />

    </div>
  );
};

export default LandingPage;
