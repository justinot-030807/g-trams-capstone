import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  UserPlus
} from 'lucide-react';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';
import LandingGuideCarousel from '../components/common/LandingGuideCarousel';
import LandingAnnouncements from '../components/common/LandingAnnouncements';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ operators: 0, todas: 0, franchises: 0 });

  // Fetch live public municipal stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/public-stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            operators: data.operators || 0,
            todas: data.todas || 0,
            franchises: data.franchises || 0
          });
        }
      } catch (err) {
        // Fallback default numbers if offline
        setStats({ operators: 120, todas: 11, franchises: 850 });
      }
    };
    fetchStats();
  }, []);

  // If already authenticated, redirect straight to their dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
    if (token) {
      if (role === 'admin' || role === 'administrator' || role === 'system admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (role === 'bplo staff') {
        navigate('/bplo-dashboard', { replace: true });
      } else if (role === 'cashier') {
        navigate('/cashier-dashboard', { replace: true });
      } else {
        navigate('/operator-dashboard', { replace: true });
      }
    }
  }, [navigate]);

  // Ensure light canvas consistency for auth and public pages
  useEffect(() => {
    document.documentElement.classList.add('auth-view');
    document.body.classList.add('auth-view');
    document.documentElement.style.backgroundColor = '#F6F5F3';
    document.body.style.backgroundColor = '#F6F5F3';
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
    <div className="relative w-full bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] flex flex-col overflow-x-hidden select-none min-h-screen">
      
      {/* Hero Section Container with Single Tricycle Background */}
      <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-hidden">
        
        {/* SINGLE TRICYCLE BACKGROUND WITH VELVET MAROON OVERLAY */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            src="/tricycle-home.jpg" 
            alt="Gasan Tricycle" 
            className="absolute inset-0 w-full h-full object-cover object-center scale-105" 
          />
          {/* Velvet Maroon Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A0408]/90 via-[#5E0D14]/70 to-[#3D080D]/75" />
          <div className="absolute inset-0 bg-black/25" />
        </div>

        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* MAIN HERO SECTION */}
        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-14 sm:pb-20 flex-grow flex flex-col items-center justify-center text-center">
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col items-center w-full"
          >
            {/* Primary Headline */}
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

            {/* TWO PRIMARY ACTION BUTTONS */}
            <motion.div variants={springFade} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 sm:mt-10 w-full max-w-md">
              
              {/* Log In Button */}
              <Link
                to="/login"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-lg bg-white hover:bg-[#F6F5F3] text-[#9E2A2B] font-bold text-sm uppercase tracking-wider shadow-xs hover:shadow transition-colors cursor-pointer whitespace-nowrap min-h-[48px]"
              >
                <div className="w-6 h-6 rounded-lg bg-[#9E2A2B]/10 flex items-center justify-center">
                  <LogIn size={15} className="text-[#9E2A2B]" />
                </div>
                <span>Log In</span>
              </Link>

              {/* Register Button */}
              <Link
                to="/register"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-lg bg-[#D4AF37] hover:bg-[#C29D2D] text-[#1C1917] font-bold text-sm uppercase tracking-wider shadow-xs hover:shadow transition-colors cursor-pointer whitespace-nowrap min-h-[48px]"
              >
                <div className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center">
                  <UserPlus size={15} className="text-[#1C1917]" />
                </div>
                <span>Register</span>
              </Link>
            </motion.div>

            {/* PUBLIC STATS DISPLAY (Numbers & Text Only - Clean Minimalist Design Without Box Backgrounds) */}
            <motion.div 
              variants={springFade}
              className="w-full max-w-4xl mx-auto mt-12 sm:mt-16 pt-8 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center"
            >
              {/* Stat 1: Registered Operators */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight tabular-nums drop-shadow-md">
                  {stats.operators > 0 ? stats.operators.toLocaleString() : '120+'}
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/85 mt-1.5 drop-shadow-xs">
                  Registered Operators
                </span>
              </div>

              {/* Stat 2: Accredited TODAs */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black text-[#D4AF37] tracking-tight tabular-nums drop-shadow-md">
                  {stats.todas > 0 ? stats.todas : '11'}
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/85 mt-1.5 drop-shadow-xs">
                  Accredited TODAs
                </span>
              </div>

              {/* Stat 3: Active Franchises */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight tabular-nums drop-shadow-md">
                  {stats.franchises > 0 ? stats.franchises.toLocaleString() : '850+'}
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/85 mt-1.5 drop-shadow-xs">
                  Active Franchises
                </span>
              </div>

              {/* Stat 4: Digital Verification */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black text-[#D4AF37] tracking-tight drop-shadow-md">
                  100%
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/85 mt-1.5 drop-shadow-xs">
                  Digital Verification
                </span>
              </div>
            </motion.div>

          </motion.div>
        </main>
      </div>

      {/* LOWER SECTION */}
      <div className="relative w-full bg-[#F6F5F3] dark:bg-[#14110F] overflow-hidden">
        {/* 3D Citizen's Charter Carousel */}
        <LandingGuideCarousel />

        {/* Municipal Bulletin Board (Dynamic from IT System Settings) */}
        <LandingAnnouncements />

        {/* BACKGROUND SEAL WATERMARK */}
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

      {/* Shared Full-Width Footer */}
      <AuthFooter />

    </div>
  );
};

export default Home;
