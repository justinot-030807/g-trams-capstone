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
      
      {/* Hero Section Container with Single Tricycle Background */}
      <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-hidden">
        
        {/* SINGLE TRICYCLE BACKGROUND WITH VELVET MAROON OVERLAY (MATCHING LOGIN & REGISTER) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            src="/tricycle-home.jpg" 
            alt="Gasan Tricycle" 
            className="absolute inset-0 w-full h-full object-cover object-center scale-105" 
          />
          {/* Velvet Maroon Overlay - Lightened so tricycle photo is clearly visible with >= 4.5:1 text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A0408]/90 via-[#5E0D14]/70 to-[#3D080D]/75" />
          <div className="absolute inset-0 bg-black/25" />
        </div>

        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* MAIN HERO SECTION */}
        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-16 sm:pb-24 flex-grow flex flex-col items-center justify-center text-center">
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col items-center w-full"
          >
            {/* Primary Headline - Pure White */}
            <motion.h1 variants={springFade} className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight max-w-5xl px-1 sm:px-0 drop-shadow-md">
              <span className="block sm:inline">Gasan Tricycle Records &amp; </span>
              <span className="inline sm:inline-block sm:whitespace-nowrap text-white">
                Application Management System
              </span>
            </motion.h1>

            {/* Subtitle / Portal Overview */}
            <motion.p variants={springFade} className="text-white/90 text-sm sm:text-base max-w-2xl mt-4 sm:mt-5 leading-relaxed font-medium px-2 drop-shadow-sm [text-wrap:balance]">
              The official motorized tricycle regulatory and franchise licensing portal of the Local Government Unit of Gasan, providing streamlined, transparent, and digital municipal services for operators and TODA associations.
            </motion.p>

            {/* TWO PRIMARY ACTION BUTTONS (R21, R22, R30: EQUAL HEIGHT, SOLID WHITE LOG IN, GOLD REGISTER) */}
            <motion.div variants={springFade} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 sm:mt-10 w-full max-w-md">
              
              {/* Log In Button (Solid White for crisp contrast on dark hero - R21, R30) */}
              <Link
                to="/login"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-[#801820] font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer whitespace-nowrap min-h-[48px]"
              >
                <div className="w-6 h-6 rounded-full bg-[#801820]/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <LogIn size={15} className="text-[#801820]" />
                </div>
                <span>Log In</span>
              </Link>

              {/* Register Button (Warm Gold - R22, R30) */}
              <Link
                to="/register"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#1A0B0E] font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer whitespace-nowrap min-h-[48px]"
              >
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={15} className="text-[#1A0B0E]" />
                </div>
                <span>Register</span>
              </Link>

            </motion.div>

            {/* 4 CORE SERVICE CARDS (R24, R25: >=16px Titles, >=14px Body, Spelled Out Acronyms) */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-12 sm:mt-16 w-full text-left">
              
              {/* Card 1: Online Application */}
              {/* TODO: Confirm with Gasan Municipal Office if official name is Motorized Tricycle Operator's Permit (MTOP) */}
              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:bg-white/25 hover:border-white/45 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-white/20 text-white border border-white/30 mb-3 shadow-xs">
                  <FileText size={20} />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white tracking-wide">Online Application</h3>
                <p className="text-sm text-white/95 mt-2 leading-relaxed font-normal">
                  Submit new Motorized Tricycle Operator's Permit (MTOP) applications, renewal requests, and digital requirements without queuing.
                </p>
              </motion.div>

              {/* Card 2: TODA Masterlist */}
              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:bg-white/25 hover:border-white/45 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-white/20 text-white border border-white/30 mb-3 shadow-xs">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white tracking-wide">TODA Masterlist</h3>
                <p className="text-sm text-white/95 mt-2 leading-relaxed font-normal">
                  Verified registry of accredited TODA associations, designated zones, and authorized units.
                </p>
              </motion.div>

              {/* Card 3: Claim Stub & Tracking */}
              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:bg-white/25 hover:border-white/45 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-white/20 text-white border border-white/30 mb-3 shadow-xs">
                  <Clock size={20} />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white tracking-wide">Claim Stub &amp; Tracking</h3>
                <p className="text-sm text-white/95 mt-2 leading-relaxed font-normal">
                  Track approval milestones live and generate official printable payment claim stubs.
                </p>
              </motion.div>

              {/* Card 4: Official Compliance */}
              {/* TODO: Confirm with Gasan Municipal Office if official name is Municipal Tricycle Franchising and Regulatory Board (MTFRB) */}
              <motion.div variants={springFade} className="p-4 sm:p-5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:bg-white/25 hover:border-white/45 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2.5 w-fit rounded-xl bg-white/20 text-white border border-white/30 mb-3 shadow-xs">
                  <Award size={20} />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white tracking-wide">Official Compliance</h3>
                <p className="text-sm text-white/95 mt-2 leading-relaxed font-normal">
                  Full compliance with Gasan Municipal Ordinances, fare matrices, and Municipal Tricycle Franchising and Regulatory Board (MTFRB) standards.
                </p>
              </motion.div>

            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* LOWER WHITE SECTION */}
      <div className="relative w-full bg-slate-50 overflow-hidden">
        {/* 3D Citizen's Charter Carousel */}
        <LandingGuideCarousel />

        {/* Municipal Bulletin Board */}
        <LandingAnnouncements />

        {/* BACKGROUND SEAL WATERMARK - Pure watermark placed between Announcements and Public Stats */}
        <div className="relative w-full py-10 sm:py-16 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] opacity-[0.075] pointer-events-none">
            <img 
              src="/gasan-logo.png" 
              alt="Seal of Gasan Watermark" 
              className="w-full h-full object-contain filter grayscale" 
            />
          </div>
        </div>
      </div>

      {/* Public Stats Section */}
      <PublicStats />

      {/* Shared Full-Width Footer */}
      <AuthFooter />

    </div>
  );
};

export default Home;
