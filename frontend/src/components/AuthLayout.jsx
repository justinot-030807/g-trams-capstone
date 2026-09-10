import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, HelpCircle, X, Phone, Mail, MapPin, Clock, CheckCircle2, ShieldCheck, Code, Users } from 'lucide-react';

const AuthLayout = ({ children, leftHero }) => {
  const location = useLocation();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const isHomeActive = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full bg-[#140204] flex flex-col justify-between overflow-x-hidden select-none text-slate-100 font-sans">
      
      {/* KEYFRAME ANIMATIONS */}
      <style>{`
        @keyframes subtleKenBurns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.05) translate(-1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes liquidOrbit1 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          33% { transform: translate(70px, -50px) rotate(60deg) scale(1.15); }
          66% { transform: translate(-30px, 60px) rotate(120deg) scale(0.95); }
          100% { transform: translate(0px, 0px) rotate(180deg) scale(1); }
        }
        @keyframes liquidOrbit2 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1.05); }
          33% { transform: translate(-60px, 50px) rotate(-60deg) scale(1.2); }
          66% { transform: translate(50px, -40px) rotate(-120deg) scale(0.9); }
          100% { transform: translate(0px, 0px) rotate(-180deg) scale(1.05); }
        }
        @keyframes goldenPulseGlow {
          0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.55; transform: translate(-46%, -52%) scale(1.25); }
        }
        @keyframes entranceCard {
          0% { opacity: 0; transform: scale(0.96) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0px); }
        }
        @keyframes modalFadeIn {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0px); }
        }

        .animate-ken-burns {
          animation: subtleKenBurns 28s ease-in-out infinite alternate;
        }
        .animate-liquid-1 { animation: liquidOrbit1 18s ease-in-out infinite alternate; }
        .animate-liquid-2 { animation: liquidOrbit2 22s ease-in-out infinite alternate; }
        .animate-golden-glow { animation: goldenPulseGlow 12s ease-in-out infinite alternate; }
        .animate-card-entrance { animation: entranceCard 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-modal-in { animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* BACKGROUND IMAGE LAYER: GASAN MUNICIPAL BUILDING */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/gasan-building.jpg"
          alt="Gasan Municipal Building"
          className="w-full h-full object-cover object-center scale-100 animate-ken-burns opacity-60"
        />
        
        {/* RICH MAROON OVERLAY WITH GRADIENT & OPACITY */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#240306]/92 via-[#4A0A11]/84 to-[#180204]/94" 
        />
        <div 
          className="absolute inset-0 bg-gradient-to-t from-[#100102]/95 via-transparent to-[#1F0306]/75" 
        />

        {/* AMBIENT AURORA GLOWS */}
        <div className="absolute top-[-10%] left-[-10%] w-[520px] h-[520px] bg-gradient-to-br from-[#9E1B27]/60 via-[#C92A36]/40 to-transparent rounded-full blur-[90px] opacity-75 animate-liquid-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[580px] h-[580px] bg-gradient-to-tl from-[#5A0E15]/70 via-[#851821]/50 to-transparent rounded-full blur-[100px] opacity-80 animate-liquid-2" />
        <div className="absolute top-1/2 left-1/2 w-[440px] h-[440px] bg-gradient-to-r from-[#D4AF37]/20 via-[#F39C12]/15 to-transparent rounded-full blur-[110px] animate-golden-glow" />

        {/* SUBTLE DOT MATRIX OVERLAY */}
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.95) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* BOTTOM DECORATIVE CURVED WAVES (MAROON & GOLD) */}
        <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-36 md:h-44 pointer-events-none">
          <svg 
            viewBox="0 0 1440 180" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-full object-cover preserve-3d"
            preserveAspectRatio="none"
          >
            {/* Deep maroon base wave */}
            <path 
              d="M0,180 L1440,180 L1440,110 C1280,145 1060,165 820,130 C580,95 320,135 0,115 Z" 
              fill="#3A070C" 
              fillOpacity="0.85"
            />
            {/* Gold ribbon accent wave */}
            <path 
              d="M0,150 C260,115 540,150 780,120 C1020,90 1260,125 1440,95 L1440,110 C1260,140 1020,105 780,135 C540,165 260,130 0,165 Z" 
              fill="url(#goldGradientWave)" 
              fillOpacity="0.9"
            />
            {/* Front smooth wave */}
            <path 
              d="M0,180 L1440,180 L1440,135 C1180,160 940,125 680,150 C420,175 180,140 0,155 Z" 
              fill="#1F0306" 
              fillOpacity="0.95"
            />
            <defs>
              <linearGradient id="goldGradientWave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8A6B1A" />
                <stop offset="35%" stopColor="#D4AF37" />
                <stop offset="70%" stopColor="#F5D77F" />
                <stop offset="100%" stopColor="#AA821A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TOP NAVIGATION BAR */}
      {/* ======================================================== */}
      <header className="relative z-30 w-full bg-[#35070C]/85 backdrop-blur-md border-b border-[#D4AF37]/35 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* LEFT: SEAL & LOGO BRANDING */}
          <Link to="/login" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center p-1 shadow-md border border-[#D4AF37] ring-2 ring-[#D4AF37]/30 transition-transform group-hover:scale-105">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black text-white tracking-wider leading-none group-hover:text-amber-300 transition-colors">
                G-TRAMS
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase mt-1">
                Municipality of Gasan <span className="hidden sm:inline">• Province of Marinduque</span>
              </span>
            </div>
          </Link>

          {/* CENTER: NAVIGATION LINKS (Desktop) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Home */}
            <Link
              to="/login"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                isHomeActive 
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#240306] shadow-md shadow-[#D4AF37]/20 font-black' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home size={15} />
              <span>Home</span>
            </Link>

            {/* About */}
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <BookOpen size={15} />
              <span>About</span>
            </button>

            {/* Help & Support */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <HelpCircle size={15} />
              <span>Help & Support</span>
            </button>
          </nav>

          {/* RIGHT: SLOGAN BANNER (Desktop) & MOBILE ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            
            {/* Desktop Angled Slogan Ribbon */}
            <div className="hidden lg:flex items-center">
              <div 
                className="relative flex items-center bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] text-[#240306] pl-5 pr-6 py-2 rounded-l-md font-black shadow-lg"
                style={{
                  clipPath: 'polygon(12px 0%, 100% 0%, 100% 100%, 0% 100%)'
                }}
              >
                <div className="text-right leading-tight">
                  <p className="text-[11px] uppercase tracking-wide font-black">Efficient Records. Better Service.</p>
                  <p className="text-[10px] tracking-widest uppercase text-[#5A0E15] font-extrabold">A Stronger Gasan.</p>
                </div>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAboutModal(true)}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 text-[11px] font-bold tracking-wider hover:bg-white/20 border border-white/15 active:scale-95"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="px-2.5 py-1 rounded-lg bg-[#D4AF37] text-[#240306] text-[11px] font-black tracking-wider shadow-sm hover:brightness-105 active:scale-95"
              >
                Help
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTENT WRAPPER */}
      {/* ======================================================== */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-4 sm:px-8 sm:py-8 lg:px-12 w-full max-w-7xl mx-auto">
        <div className="w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-14 my-auto">
          {/* Left Hero Section (Desktop Highlight Showcase) */}
          {leftHero}

          {/* Right Auth Card Slot */}
          {children}
        </div>
      </main>

      {/* ======================================================== */}
      {/* FOOTER */}
      {/* ======================================================== */}
      <footer className="relative z-20 w-full px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
          
          {/* Left / Center: Copyright info */}
          <div className="text-white/80 text-[10px] sm:text-xs space-y-0.5 tracking-wider">
            <p className="font-bold tracking-wide text-white/90 uppercase">
              G-TRAMS — GASAN TRICYCLE RECORDS & APPLICATION MANAGEMENT SYSTEM
            </p>
            <p className="text-white/60 text-[9px] sm:text-[10px] font-medium">
              © {new Date().getFullYear()} Municipality of Gasan, Marinduque. All rights reserved.
            </p>
          </div>

          {/* Right: Marinduque Mountains & Palm Tree Line Art */}
          <div className="hidden sm:flex items-center gap-3 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
            <svg width="120" height="34" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D4AF37]">
              {/* Mountain ridge line art */}
              <path d="M5 35 L30 18 L48 27 L72 10 L98 29 L115 20 L135 35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              {/* Secondary contour */}
              <path d="M22 35 L40 25 L55 32 L85 17 L105 28 L122 35" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
              {/* Palm tree */}
              <path d="M125 35 Q123 20 121 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M121 12 Q112 8 108 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M121 12 Q116 3 121 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M121 12 Q128 5 133 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M121 12 Q131 12 135 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              {/* Small sun */}
              <circle cx="72" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>

        </div>
      </footer>

      {/* ======================================================== */}
      {/* ABOUT MODAL */}
      {/* ======================================================== */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-modal-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#D4AF37]/30 text-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] p-5 sm:p-6 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border-2 border-[#D4AF37] shrink-0">
                  <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-wide text-white">About G-TRAMS</h3>
                  <p className="text-[11px] sm:text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
                    Municipality of Gasan • Business Permits & Licensing Office
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
              >
                <X size={18} />
              </button>

              {/* Decorative accent */}
              <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-[#D4AF37]/20 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 mb-1.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7A1B22]" />
                  What is G-TRAMS?
                </h4>
                <p>
                  The <strong className="text-slate-900 font-bold">Gasan Tricycle Records & Application Management System (G-TRAMS)</strong> is the official digital governance platform designed for the Local Government Unit (LGU) of Gasan, Marinduque. It streamlines the motorized tricycle franchise lifecycle—from initial application and documentation to automated renewals, violation tracking, and real-time TODA compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                    <CheckCircle2 size={16} className="text-[#7A1B22]" />
                    Paperless & Streamlined
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Eliminates redundant paperwork, prevents physical queues at the municipal hall, and enables 24/7 digital submissions.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                    <ShieldCheck size={16} className="text-[#7A1B22]" />
                    Legitimate TODA Masterlist
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ensures all operators and drivers hold valid municipal franchises linked to recognized TODA routes across all 25 barangays.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4">
                <h5 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1">
                  LGU Gasan Mission & Vision
                </h5>
                <p className="text-amber-800 text-xs leading-relaxed">
                  "To foster a modern, responsive, and accountable public transport regulatory framework that empowers local operators, protects commuters, and ensures a safe, prosperous Gasan."
                </p>
              </div>

              {/* CAPSTONE PROJECT HIGHLIGHT BOX */}
              <div className="bg-gradient-to-br from-[#7A1B22]/10 via-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#7A1B22] text-[#D4AF37] text-[9px] font-black uppercase tracking-wider">
                    Academic Capstone Project
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">
                    BS Information Technology
                  </span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  <strong className="text-slate-900 font-bold">G-TRAMS</strong> was conceptualized and engineered as an official academic capstone research initiative aimed at solving real-world municipal transport challenges in the <strong className="text-slate-900 font-bold">Municipality of Gasan, Marinduque</strong>. The system modernizes tricycle franchise records, operator registries, document approvals, and claim stub generation into a secure, paperless digital portal.
                </p>
              </div>

              {/* DEVELOPMENT TEAM / MEET THE DEVELOPERS */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-[#7A1B22]" />
                    Meet the Development Team
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Project Proponents
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Developed by our dedicated capstone team with individual specialized responsibilities:
                </p>

                <div className="space-y-2.5">
                  {/* FEATURED: Justine S. Lachica (Lead Programmer / Core Developer) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border-2 border-[#D4AF37] shadow-sm relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-[#D4AF37] font-black flex items-center justify-center text-sm shadow-md shrink-0 border-2 border-[#D4AF37]">
                          JL
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-black text-slate-900 text-sm group-hover:text-[#7A1B22] transition-colors">
                              Justine S. Lachica
                            </h5>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#240306] px-2 py-0.5 rounded-full shadow-xs">
                              Lead Core Developer
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-[#7A1B22] mt-0.5">
                            Programmer / Developer 1 • Full-Stack System Architect
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium sm:text-right bg-white/80 sm:bg-transparent px-2 py-1 rounded-lg border sm:border-0 border-slate-200">
                        Primary System Development & Engineering
                      </span>
                    </div>
                  </div>

                  {/* 2x2 GRID FOR TEAM MEMBERS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Ian Rey */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#D4AF37] transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                        IR
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-[#7A1B22] transition-colors">
                          Ian Rey
                        </h5>
                        <span className="inline-block text-[10px] font-semibold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md mt-0.5">
                          Leader / Project Manager
                        </span>
                      </div>
                    </div>

                    {/* Jhude Michail Martin */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#D4AF37] transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                        JM
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-[#7A1B22] transition-colors">
                          Jhude Michail Martin
                        </h5>
                        <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md mt-0.5">
                          Programmer / Developer 2
                        </span>
                      </div>
                    </div>

                    {/* Jay Vincent Motol */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#D4AF37] transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                        JM
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-[#7A1B22] transition-colors">
                          Jay Vincent Motol
                        </h5>
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-0.5">
                          Researcher / Documentation
                        </span>
                      </div>
                    </div>

                    {/* Jhon Kyn Axix Cabrigas */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#D4AF37] transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                        JC
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-[#7A1B22] transition-colors">
                          Jhon Kyn Axix Cabrigas
                        </h5>
                        <span className="inline-block text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md mt-0.5">
                          System / Business Analyst
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="px-5 py-2 rounded-xl bg-[#7A1B22] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#5A1419] transition-colors"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HELP & SUPPORT MODAL */}
      {/* ======================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-modal-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#D4AF37]/30 text-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] p-5 sm:p-6 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border-2 border-[#D4AF37] shrink-0">
                  <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-wide text-white">Help & Support Desk</h3>
                  <p className="text-[11px] sm:text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
                    Business Permits & Licensing Office (BPLO) Helpdesk
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              
              {/* Contact Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#7A1B22]/10 text-[#7A1B22] shrink-0 mt-0.5">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Helpdesk Hotline</h5>
                    <p className="text-slate-700 font-semibold text-xs mt-0.5">(042) 342-1234</p>
                    <p className="text-[10px] text-slate-400">Toll-free landline during municipal office hours</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#7A1B22]/10 text-[#7A1B22] shrink-0 mt-0.5">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Official Email</h5>
                    <p className="text-slate-700 font-semibold text-xs mt-0.5">bplo@gasan.gov.ph</p>
                    <p className="text-[10px] text-slate-400">Response within 24–48 hours</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#7A1B22]/10 text-[#7A1B22] shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Physical Office</h5>
                    <p className="text-slate-700 font-semibold text-xs mt-0.5">Ground Floor, Gasan Municipal Building</p>
                    <p className="text-[10px] text-slate-400">Poblacion, Gasan, Marinduque</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#7A1B22]/10 text-[#7A1B22] shrink-0 mt-0.5">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Office Hours</h5>
                    <p className="text-slate-700 font-semibold text-xs mt-0.5">Monday – Friday: 8:00 AM – 5:00 PM</p>
                    <p className="text-[10px] text-slate-400">Excluding Philippine official holidays</p>
                  </div>
                </div>
              </div>

              {/* Quick FAQs */}
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-2.5 uppercase tracking-wider">
                  Frequently Asked Questions (FAQs)
                </h4>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900 text-xs">How do I register if I am a new tricycle operator?</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Click "CREATE AN ACCOUNT" on the login page. Enter your legal name, your Gasan barangay, contact phone number, TODA association, and create a secure password.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900 text-xs">What documents are required for renewal?</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      You will need scanned copies or clear photos of your LTO OR/CR, current Barangay Clearance, Driver's License, and TODA Certificate of Membership.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900 text-xs">How do I get my official payment claim stub?</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Once your digital application is approved by the BPLO, your operator dashboard will generate a printable Claim Stub with an official QR code for municipal cashier payment.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-[#7A1B22] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#5A1419] transition-colors"
              >
                Close Helpdesk
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AuthLayout;
