import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  UserPlus, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Award
} from 'lucide-react';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';
import PublicStats from '../components/common/PublicStats';

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

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="relative w-full bg-[#120204] text-white flex flex-col overflow-x-hidden select-none">
      
      {/* Ambient Radial Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-15%] w-[580px] h-[580px] bg-gradient-to-br from-[#9E1B27] via-[#C92A36] to-transparent rounded-full blur-[90px] opacity-75 animate-liquid-1" />
        <div className="absolute top-[50%] right-[-15%] w-[620px] h-[620px] bg-gradient-to-tl from-[#5A0E15] via-[#851821] to-[#360408] rounded-full blur-[100px] opacity-80 animate-liquid-2" />
        <div className="absolute top-[35%] right-[5%] w-[420px] h-[420px] bg-gradient-to-bl from-[#E03144]/50 via-[#8A141E] to-transparent rounded-full blur-[80px] animate-liquid-3" />

        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Hero Section Container (Full Height) */}
      <div className="relative min-h-[105vh] flex flex-col">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* MAIN HERO SECTION */}
        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32 flex-grow flex flex-col items-center justify-center text-center">
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col items-center w-full"
          >
            {/* Primary Headline - Responsive font scaling & safe mobile wrapping */}
            <motion.h1 variants={fadeIn} className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-snug sm:leading-tight max-w-4xl drop-shadow-md px-1 sm:px-0">
              <span>Gasan Tricycle Records &amp; </span>
              <span className="inline sm:inline-block sm:whitespace-nowrap">Application Management System</span>
            </motion.h1>

            {/* Subtitle / Portal Overview */}
            <motion.p variants={fadeIn} className="text-white/75 text-xs sm:text-sm lg:text-base max-w-2xl mt-4 sm:mt-5 leading-relaxed font-normal px-2">
              The official motorized tricycle regulatory and franchise licensing portal of the Local Government Unit of Gasan, providing streamlined, transparent, and digital municipal services.
            </motion.p>

            {/* TWO PRIMARY ACTION BUTTONS */}
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 w-full max-w-md">
              
              {/* Sign In Button */}
              <Link
                to="/login"
                className="relative overflow-hidden group w-full sm:w-1/2 flex items-center justify-center gap-2.5 py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white font-bold text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(122,27,34,0.45)] hover:shadow-[0_12px_28px_rgba(122,27,34,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-white/15 cursor-pointer"
              >
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />
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
            <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12 sm:mt-16 w-full text-left">
              
              <motion.div variants={fadeIn} className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
                  <FileText size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">Online Application</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-snug">
                  Submit new MTOP applications, renewal requests, and required digital documents without queuing.
                </p>
              </motion.div>

              <motion.div variants={fadeIn} className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">TODA Masterlist</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-snug">
                  Verified registry of accredited TODA associations, designated routes, and authorized operators.
                </p>
              </motion.div>

              <motion.div variants={fadeIn} className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
                  <Clock size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">Claim Stub & Tracking</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-snug">
                  Track approval milestones live and generate official printable payment claim stubs instantly.
                </p>
              </motion.div>

              <motion.div variants={fadeIn} className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="p-2 w-fit rounded-xl bg-[#7A1B22]/90 text-[#D4AF37] border border-[#D4AF37]/30 mb-3 shadow-sm">
                  <Award size={18} />
                </div>
                <h3 className="font-bold text-sm text-white">Official Compliance</h3>
                <p className="text-xs text-white/70 mt-1.5 leading-snug">
                  Full compliance with Municipal Ordinances, fare rates, and MTFRB safety inspection standards.
                </p>
              </motion.div>

            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* PUBLIC STATS SECTION (Scroll down to see) */}
      <PublicStats />

      {/* SHARED FULL-WIDTH FOOTER */}
      <AuthFooter />

    </div>
  );
};

export default Home;
