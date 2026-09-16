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
      
      {/* Grounded Municipal LGU Ambient Background (Clean, Civic & Non-AI) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle municipal seal watermark centered */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[480px] h-[480px] sm:w-[620px] sm:h-[620px] opacity-[0.035] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>

        {/* Deep architectural gradients */}
        <div className="absolute top-0 left-0 right-0 h-[480px] bg-gradient-to-b from-[#7A1B22]/35 via-[#3D0A0E]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#0A0102] via-[#1A0306]/40 to-transparent" />
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
            {/* Official Government Badge */}
            <motion.div 
              variants={springFade}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#D4AF37]/30 shadow-xs mb-5 backdrop-blur-md"
            >
              <Building2 size={13} className="text-[#D4AF37]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/90">
                Republic of the Philippines • LGU Gasan
              </span>
            </motion.div>

            {/* Primary Headline - Responsive font scaling & safe mobile wrapping */}
            <motion.h1 variants={springFade} className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl drop-shadow-md px-1 sm:px-0">
              <span>Gasan Tricycle Records &amp; </span>
              <span className="text-[#D4AF37] block sm:inline">Application Management System</span>
            </motion.h1>

            {/* Subtitle / Portal Overview */}
            <motion.p variants={springFade} className="text-white/75 text-sm sm:text-base max-w-2xl mt-4 sm:mt-5 leading-relaxed font-normal px-2">
              The official motorized tricycle regulatory and franchise licensing portal of the Local Government Unit of Gasan, providing streamlined, transparent, and digital municipal services for operators and TODA associations.
            </motion.p>

            {/* TWO PRIMARY ACTION BUTTONS */}
            <motion.div variants={springFade} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 w-full max-w-md">
              
              {/* Sign In Button */}
              <Link
                to="/login"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white font-bold text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(122,27,34,0.45)] hover:shadow-[0_12px_28px_rgba(122,27,34,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-white/15 cursor-pointer"
              >
                <LogIn size={16} className="text-[#D4AF37]" />
                <span>Sign In</span>
              </Link>

              {/* Create Account Button */}
              <Link
                to="/register"
                className="w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm uppercase tracking-wider shadow-md border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <UserPlus size={16} className="text-[#D4AF37]" />
                <span>Create Account</span>
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
