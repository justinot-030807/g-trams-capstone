import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  UserPlus, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Award,
  Globe, 
  Mail, 
  Phone
} from 'lucide-react';
import AuthNavbar from '../components/common/AuthNavbar';

const FacebookIcon = ({ size = 13, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Home = () => {
  const navigate = useNavigate();

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
      
      {/* Ambient Radial Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[580px] h-[580px] bg-gradient-to-br from-[#9E1B27] via-[#C92A36] to-transparent rounded-full blur-[90px] opacity-75 animate-liquid-1" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[620px] h-[620px] bg-gradient-to-tl from-[#5A0E15] via-[#851821] to-[#360408] rounded-full blur-[100px] opacity-80 animate-liquid-2" />
        <div className="absolute top-[35%] right-[5%] w-[420px] h-[420px] bg-gradient-to-bl from-[#E03144]/50 via-[#8A141E] to-transparent rounded-full blur-[80px] animate-liquid-3" />

        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* TOP FLUSH NAVBAR */}
      <AuthNavbar />

      {/* MAIN HERO SECTION */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 my-auto text-center flex flex-col items-center">
        
        {/* LGU Civic Sub-Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-4 shadow-sm animate-item-1">
          <span>Municipality of Gasan</span>
          <span className="opacity-40">•</span>
          <span>Province of Marinduque</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight max-w-3xl drop-shadow-md animate-item-2">
          Gasan Tricycle Records & Application Management System
        </h1>

        {/* Subtitle / Portal Overview */}
        <p className="text-white/75 text-xs sm:text-base max-w-2xl mt-3.5 sm:mt-4 leading-relaxed font-normal animate-item-2">
          The official motorized tricycle regulatory and franchise licensing portal of the Local Government Unit of Gasan, providing streamlined, transparent, and digital municipal services.
        </p>

        {/* TWO PRIMARY ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md animate-item-3">
          
          {/* Sign In Button */}
          <Link
            to="/login"
            className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(122,27,34,0.45)] hover:shadow-[0_12px_28px_rgba(122,27,34,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-white/15 cursor-pointer"
          >
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />
            <LogIn size={16} className="text-[#D4AF37]" />
            <span>Sign In</span>
          </Link>

          {/* Create Account Button */}
          <Link
            to="/register"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <UserPlus size={16} className="text-[#D4AF37]" />
            <span>Create Account</span>
          </Link>

        </div>

        {/* 4 CORE SERVICE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-10 sm:mt-14 w-full text-left animate-item-4">
          
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
            <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
              <FileText size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">Online Application</h3>
            <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">
              Submit new MTOP applications, renewal requests, and required digital documents without queuing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
            <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">TODA Masterlist</h3>
            <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">
              Verified registry of accredited TODA associations, designated routes, and authorized operators.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
            <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
              <Clock size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">Claim Stub & Tracking</h3>
            <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">
              Track approval milestones live and generate official printable payment claim stubs instantly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
            <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
              <Award size={18} />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-white">Official Compliance</h3>
            <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">
              Full compliance with Municipal Ordinances, fare rates, and MTFRB safety inspection standards.
            </p>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-white/50 text-[10px] shrink-0 select-none">
        
        {/* Left: Copyright */}
        <div className="text-center sm:text-left font-medium">
          <span>© 2026 Municipality of Gasan, Marinduque</span>
          <span className="hidden sm:inline mx-1.5 opacity-40">•</span>
          <span className="hidden sm:inline text-white/40">G-TRAMS</span>
        </div>

        {/* Center: Social & Portal Links */}
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

        {/* Right: Plain Text Version Only */}
        <div className="text-center sm:text-right font-mono text-[10px] text-white/40 tracking-wider">
          v2.4.0
        </div>

      </footer>

    </div>
  );
};

export default Home;
