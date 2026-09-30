import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  UserPlus, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Award,
  CheckCircle2,
  Building2
} from 'lucide-react';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';
import PublicStats from '../components/common/PublicStats';
import LandingGuideCarousel from '../components/common/LandingGuideCarousel';
import LandingAnnouncements from '../components/common/LandingAnnouncements';

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

  // Ensure light canvas consistency for auth and public pages
  useEffect(() => {
    document.documentElement.classList.add('auth-view');
    document.body.classList.add('auth-view');
    document.documentElement.style.backgroundColor = '#f8fafc';
    document.body.style.backgroundColor = '#f8fafc';
    return () => {
      document.documentElement.classList.remove('auth-view');
      document.body.classList.remove('auth-view');
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const springFade = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 90, damping: 18 } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  return (
    <div className="relative w-full bg-slate-50 text-slate-900 flex flex-col overflow-x-hidden select-none min-h-screen">
      
      {/* Lightweight, zero-lag subtle watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[480px] h-[480px] sm:w-[620px] sm:h-[620px] opacity-[0.03] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>
      </div>

      {/* Hero Section Container */}
      <div className="relative min-h-[100dvh] flex flex-col justify-between">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* MAIN HERO SECTION */}
        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-16 sm:pb-28 flex-grow flex flex-col items-center justify-center text-center">
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col items-center w-full"
          >
            {/* Official Institutional Pill Badge */}
            <motion.div 
              variants={springFade} 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#9E2A2B]/20 text-[#801820] text-xs font-bold uppercase tracking-wider mb-5 shadow-xs hover:border-[#D4AF37] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LGU Gasan • Sangguniang Bayan MTFRB Portal</span>
            </motion.div>

            {/* Primary Headline - Responsive font scaling & safe mobile wrapping */}
            <motion.h1 variants={springFade} className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-5xl px-1 sm:px-0">
              <span className="block sm:inline">Gasan Tricycle Records &amp; </span>
              <span className="inline sm:inline-block sm:whitespace-nowrap bg-gradient-to-r from-[#801820] via-[#9E2A2B] to-[#70141b] bg-clip-text text-transparent">
                Application Management System
              </span>
            </motion.h1>

            {/* Subtitle / Portal Overview */}
            <motion.p variants={springFade} className="text-slate-600 text-sm sm:text-base max-w-2xl mt-4 sm:mt-5 leading-relaxed font-normal px-2">
              The official motorized tricycle regulatory and franchise licensing portal of the Local Government Unit of Gasan, providing streamlined, transparent, and digital municipal services for operators and TODA associations.
            </motion.p>

            {/* TWO PRIMARY ACTION BUTTONS */}
            <motion.div variants={springFade} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 sm:mt-10 w-full max-w-md">
              
              {/* Sign In Button (Velvet Maroon) */}
              <Link
                to="/login"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#801820] via-[#9E2A2B] to-[#801820] hover:from-[#9E2A2B] hover:to-[#70141b] text-white font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-xl hover:shadow-[#9E2A2B]/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 ring-2 ring-[#D4AF37]/40 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <LogIn size={14} className="text-[#D4AF37]" />
                </div>
                <span>Sign In</span>
              </Link>

              {/* Create Account Button (Warm Gold) */}
              <Link
                to="/register"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#1A0B0E] font-black text-sm uppercase tracking-wider shadow-md hover:shadow-xl hover:shadow-[#D4AF37]/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={14} className="text-[#1A0B0E]" />
                </div>
                <span>Create Account</span>
              </Link>

            </motion.div>

            {/* Official Trust Strip */}
            <motion.div variants={springFade} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" /> 100% Online Processing
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" /> Accredited TODA Registry
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" /> Live MTOP Status Tracking
              </span>
            </motion.div>

            {/* 4 CORE SERVICE CARDS */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-12 sm:mt-16 w-full text-left">
              
              <motion.div variants={springFade} className="group p-5 rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#9E2A2B] hover:border-t-[#D4AF37] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/20 flex items-center justify-center group-hover:bg-[#9E2A2B] group-hover:text-white transition-colors shadow-xs">
                      <FileText size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#9E2A2B]/10 group-hover:text-[#9E2A2B] transition-colors">
                      ONLINE FILING
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#9E2A2B] transition-colors">Online Application</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Submit new MTOP applications, renewal requests, and digital requirements without queuing.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#9E2A2B] group-hover:translate-x-1 transition-transform">
                  <span>File Application &rarr;</span>
                </div>
              </motion.div>

              <motion.div variants={springFade} className="group p-5 rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#9E2A2B] hover:border-t-[#D4AF37] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/20 flex items-center justify-center group-hover:bg-[#9E2A2B] group-hover:text-white transition-colors shadow-xs">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#9E2A2B]/10 group-hover:text-[#9E2A2B] transition-colors">
                      ACCREDITED
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#9E2A2B] transition-colors">TODA Masterlist</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Verified registry of accredited TODA associations, designated zones, and authorized units.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#9E2A2B] group-hover:translate-x-1 transition-transform">
                  <span>View Registry &rarr;</span>
                </div>
              </motion.div>

              <motion.div variants={springFade} className="group p-5 rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#9E2A2B] hover:border-t-[#D4AF37] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/20 flex items-center justify-center group-hover:bg-[#9E2A2B] group-hover:text-white transition-colors shadow-xs">
                      <Clock size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#9E2A2B]/10 group-hover:text-[#9E2A2B] transition-colors">
                      REAL-TIME
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#9E2A2B] transition-colors">Claim Stub &amp; Tracking</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Track approval milestones live and generate official printable payment claim stubs.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#9E2A2B] group-hover:translate-x-1 transition-transform">
                  <span>Track Stub &rarr;</span>
                </div>
              </motion.div>

              <motion.div variants={springFade} className="group p-5 rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#9E2A2B] hover:border-t-[#D4AF37] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/20 flex items-center justify-center group-hover:bg-[#9E2A2B] group-hover:text-white transition-colors shadow-xs">
                      <Award size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#9E2A2B]/10 group-hover:text-[#9E2A2B] transition-colors">
                      ORDINANCES
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#9E2A2B] transition-colors">Official Compliance</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Full compliance with Gasan Municipal Ordinances, fare matrices, and MTFRB standards.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#9E2A2B] group-hover:translate-x-1 transition-transform">
                  <span>View Guidelines &rarr;</span>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* 3D Citizen's Charter Carousel */}
      <LandingGuideCarousel />

      {/* Municipal Bulletin Board */}
      <LandingAnnouncements />

      {/* Public Stats Section (100% Maroon & Gold) */}
      <PublicStats />

      {/* Shared Full-Width Footer */}
      <AuthFooter />

    </div>
  );
};

export default Home;
