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

  // Ensure dark canvas consistency for auth view
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
    <div className="relative w-full bg-[#120204] text-white flex flex-col overflow-x-hidden select-none">
      
      {/* Dynamic Animated Ambient Background with Official Gasan Seal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated ambient gradient blobs */}
        <div className="absolute top-[-10%] left-[-15%] w-[580px] h-[580px] bg-gradient-to-br from-[#9E1B27] via-[#C92A36] to-transparent rounded-full blur-[90px] opacity-70 animate-liquid-1" />
        <div className="absolute top-[45%] right-[-15%] w-[620px] h-[620px] bg-gradient-to-tl from-[#5A0E15] via-[#851821] to-[#360408] rounded-full blur-[100px] opacity-75 animate-liquid-2" />
        <div className="absolute top-[30%] right-[10%] w-[420px] h-[420px] bg-gradient-to-bl from-[#E03144]/40 via-[#8A141E] to-transparent rounded-full blur-[80px] animate-liquid-3" />

        {/* Subtle official Gasan seal watermark centered */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[480px] h-[480px] sm:w-[620px] sm:h-[620px] opacity-[0.045] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>
      </div>

      {/* Hero Section Container */}
      <div className="relative min-h-[92vh] sm:min-h-[96vh] flex flex-col justify-between">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* MAIN HERO SECTION */}
        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-20 sm:pb-32 flex-grow flex flex-col items-center justify-center text-center">
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col items-center w-full"
          >
            {/* Primary Headline - Responsive font scaling & safe mobile wrapping */}
            <motion.h1 variants={springFade} className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl drop-shadow-md px-1 sm:px-0">
              Gasan Tricycle Records &amp; Application Management System
            </motion.h1>

            {/* Subtitle / Portal Overview */}
            <motion.p variants={springFade} className="text-white/75 text-sm sm:text-base max-w-2xl mt-4 sm:mt-5 leading-relaxed font-normal px-2">
              The official motorized tricycle regulatory and franchise licensing portal of the Local Government Unit of Gasan, providing streamlined, transparent, and digital municipal services for operators and TODA associations.
            </motion.p>

            {/* TWO PRIMARY ACTION BUTTONS */}
            <motion.div variants={springFade} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 sm:mt-10 w-full max-w-md">
              
              {/* Sign In Button */}
              <Link
                to="/login"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7A1B22] via-[#9B222B] to-[#5A1419] text-white font-bold text-sm uppercase tracking-wider shadow-[0_10px_25px_-5px_rgba(155,34,43,0.65),0_0_15px_rgba(212,175,55,0.25)] hover:shadow-[0_15px_30px_-5px_rgba(155,34,43,0.85),0_0_25px_rgba(212,175,55,0.45)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-[#D4AF37]/50 hover:border-[#D4AF37] cursor-pointer"
              >
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[260%] transition-transform duration-1000 ease-out pointer-events-none" />
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <LogIn size={14} className="text-[#D4AF37]" />
                </div>
                <span className="drop-shadow-xs">Sign In</span>
              </Link>

              {/* Create Account Button */}
              <Link
                to="/register"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] text-white font-bold text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_25px_rgba(212,175,55,0.3)] border border-[#D4AF37]/60 hover:border-[#D4AF37] hover:scale-[1.03] active:scale-[0.98] backdrop-blur-xl transition-all duration-300 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#D4AF37]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={14} className="text-[#D4AF37]" />
                </div>
                <span className="drop-shadow-xs">Create Account</span>
              </Link>

            </motion.div>

            {/* 4 CORE SERVICE CARDS */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-12 sm:mt-16 w-full text-left">
              
              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-xs">
                  <FileText size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">Online Application</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                  Submit new MTOP applications, renewal requests, and digital requirements without queuing.
                </p>
              </motion.div>

              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-xs">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">TODA Masterlist</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                  Verified registry of accredited TODA associations, designated zones, and authorized units.
                </p>
              </motion.div>

              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-xs">
                  <Clock size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">Claim Stub &amp; Tracking</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                  Track approval milestones live and generate official printable payment claim stubs.
                </p>
              </motion.div>

              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/10 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-xs">
                  <Award size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">Official Compliance</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                  Full compliance with Gasan Municipal Ordinances, fare matrices, and MTFRB standards.
                </p>
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
