import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2, Sparkles, FileText, ShieldCheck, Clock, Phone, ChevronRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    contact: '',
    password: ''
  });

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    let timer;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutSeconds]);

  const isValidContact = (value) => {
    const trimmed = value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(09|\+639)\d{9}$/;
    return emailRegex.test(trimmed) || phoneRegex.test(trimmed.replace(/[\s-]/g, ''));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading || lockoutSeconds > 0) return;

    setError('');

    // Input Format Validation (PH Mobile / Email)
    if (!isValidContact(formData.contact)) {
      setError('Please enter a valid PH mobile (09XXXXXXXXX) or email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFailedAttempts(0);
        setLockoutSeconds(0);
        const rawRole = data.role || data.user?.role || '';
        const normalizedRole = String(rawRole).toLowerCase().trim().replace(/_/g, ' ');
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', normalizedRole);

        if (data.name) localStorage.setItem('name', data.name);
        if (data.fullName) localStorage.setItem('name', data.fullName);
        if (data.user) {
          const userObj = { ...data.user };
          userObj.role = normalizedRole;
          localStorage.setItem('user', JSON.stringify(userObj));
          
          if (data.user.name || data.user.fullName) {
            localStorage.setItem('name', data.user.name || data.user.fullName);
          }
        }

        if (normalizedRole === 'admin' || normalizedRole === 'administrator') {
          navigate('/admin-dashboard');
        } else {
          navigate('/operator-dashboard');
        }
      } else {
        if (response.status === 503) {
          setError(data.message || 'The system is undergoing maintenance. Access is restricted for non-admin users.');
        } else if (response.status === 429) {
          const secs = data.retryAfterSeconds || 60;
          setLockoutSeconds(secs);
          setError(`TOO MANY ATTEMPTS. LOCKED FOR ${secs} SECONDS.`);
        } else {
          const newFails = failedAttempts + 1;
          setFailedAttempts(newFails);
          if (newFails >= 5) {
            setLockoutSeconds(60);
            setError('TOO MANY FAILED ATTEMPTS. ACCESS LOCKED FOR 60 SECONDS.');
          } else {
            setError(data.message || 'LOGIN FAILED. CHECK YOUR CREDENTIALS.');
          }
        }
      }
    } catch (err) {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm font-medium";

  return (
    <div className="relative min-h-screen w-full bg-[#120204] flex flex-col justify-between items-center px-4 py-6 sm:px-8 sm:py-8 lg:px-12 overflow-x-hidden select-none">
      
      {/* ADVANCED LIQUID AURORA KEYFRAMES */}
      <style>{`
        @keyframes liquidOrbit1 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          33% { transform: translate(90px, -60px) rotate(60deg) scale(1.22); }
          66% { transform: translate(-40px, 80px) rotate(120deg) scale(0.92); }
          100% { transform: translate(0px, 0px) rotate(180deg) scale(1); }
        }
        @keyframes liquidOrbit2 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1.05); }
          33% { transform: translate(-80px, 70px) rotate(-60deg) scale(1.28); }
          66% { transform: translate(70px, -50px) rotate(-120deg) scale(0.88); }
          100% { transform: translate(0px, 0px) rotate(-180deg) scale(1.05); }
        }
        @keyframes liquidOrbit3 {
          0% { transform: translate(0px, 0px) scale(0.95); opacity: 0.35; }
          50% { transform: translate(-60px, -50px) scale(1.3); opacity: 0.65; }
          100% { transform: translate(0px, 0px) scale(0.95); opacity: 0.35; }
        }
        @keyframes goldenPulseGlow {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.65; transform: translate(-45%, -55%) scale(1.35); }
        }
        @keyframes entranceCard {
          0% { opacity: 0; transform: scale(0.95) translateY(18px); }
          100% { opacity: 1; transform: scale(1) translateY(0px); }
        }
        @keyframes logoPop {
          0% { opacity: 0; transform: scale(0.6) rotate(-8deg); }
          70% { transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes itemFadeUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-liquid-1 { animation: liquidOrbit1 16s ease-in-out infinite alternate; }
        .animate-liquid-2 { animation: liquidOrbit2 20s ease-in-out infinite alternate; }
        .animate-liquid-3 { animation: liquidOrbit3 14s ease-in-out infinite alternate; }
        .animate-golden-glow { animation: goldenPulseGlow 11s ease-in-out infinite alternate; }

        .animate-card-entrance { animation: entranceCard 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-logo-entrance { animation: logoPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-item-1 { animation: itemFadeUp 0.5s ease-out 0.15s both; }
        .animate-item-2 { animation: itemFadeUp 0.5s ease-out 0.25s both; }
        .animate-item-3 { animation: itemFadeUp 0.5s ease-out 0.35s both; }
        .animate-item-4 { animation: itemFadeUp 0.5s ease-out 0.45s both; }
      `}</style>

      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[580px] h-[580px] bg-gradient-to-br from-[#9E1B27] via-[#C92A36] to-transparent rounded-full blur-[85px] opacity-80 animate-liquid-1" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[620px] h-[620px] bg-gradient-to-tl from-[#5A0E15] via-[#851821] to-[#360408] rounded-full blur-[95px] opacity-85 animate-liquid-2" />
        <div className="absolute top-[25%] right-[10%] w-[420px] h-[420px] bg-gradient-to-bl from-[#E03144]/60 via-[#8A141E] to-transparent rounded-full blur-[75px] animate-liquid-3" />
        <div className="absolute top-1/2 left-1/2 w-[480px] h-[480px] bg-gradient-to-r from-[#D4AF37]/35 via-[#F39C12]/20 to-transparent rounded-full blur-[105px] animate-golden-glow" />

        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* MAIN SPLIT-SCREEN CONTAINER */}
      <div className="w-full max-w-6xl my-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
        
        {/* LEFT HERO SECTION (Desktop Highlight Showcase) */}
        <div className="hidden lg:flex flex-col flex-1 text-left max-w-xl animate-item-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl border-2 border-[#D4AF37] shrink-0">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">G-TRAMS</h1>
              <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mt-1.5">Municipality of Gasan • Province of Marinduque</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white/95 tracking-tight leading-snug">
            Gasan Tricycle Records & Application Management System
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-2.5 leading-relaxed">
            The official digital portal of the Local Government Unit of Gasan for secure, streamlined, and transparent motorized tricycle franchise registration, renewal, and fleet management.
          </p>

          {/* 3 FEATURE CARDS */}
          <div className="grid grid-cols-1 gap-3 mt-6">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-sm hover:bg-white/15 transition-colors">
              <div className="p-2.5 rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-white/10 shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Online Application & Renewal</h3>
                <p className="text-[11px] text-white/70 leading-tight mt-0.5">Submit official franchise requirements and documents digitally without waiting in long queues.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-sm hover:bg-white/15 transition-colors">
              <div className="p-2.5 rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-white/10 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Verified TODA & Operator Registry</h3>
                <p className="text-[11px] text-white/70 leading-tight mt-0.5">Centralized masterlist ensuring legitimate operator credentials and authorized TODA associations.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-sm hover:bg-white/15 transition-colors">
              <div className="p-2.5 rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-white/10 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Real-Time Status & Claim Stub</h3>
                <p className="text-[11px] text-white/70 leading-tight mt-0.5">Monitor application approvals live and generate official printable payment claim stubs instantly.</p>
              </div>
            </div>
          </div>

          {/* LGU HELPDESK FOOTER BADGE */}
          <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-white/10 text-white/60 text-xs">
            <Phone size={14} className="text-[#D4AF37]" />
            <span>BPLO Helpdesk Hotline: <strong className="text-white">(042) 342-1234</strong> • <strong className="text-white">bplo@gasan.gov.ph</strong></span>
          </div>
        </div>

        {/* RIGHT AUTH CARD */}
        <div className="w-full max-w-[360px] sm:max-w-[400px] shrink-0 animate-card-entrance">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/50 p-6 sm:p-8">
            
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="relative mb-3 animate-logo-entrance">
                <div className="w-14 h-14 bg-white border-2 border-[#D4AF37] shadow-md rounded-full flex items-center justify-center p-0.5 overflow-hidden ring-4 ring-[#D4AF37]/25 shrink-0">
                  <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-wider uppercase animate-item-1">G-TRAMS PORTAL</h2>
              <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-item-1">
                <span>MUNICIPALITY OF GASAN</span>
                <span>•</span>
                <span className="text-[#7A1B22]">OFFICIAL SYSTEM</span>
              </div>
            </div>

            {localStorage.getItem('maintenance_mode') === 'true' && (
              <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 text-[10px] sm:text-xs font-bold rounded-xl p-2.5 text-center shadow-xs flex items-center justify-center gap-1.5 animate-pulse">
                <span>🛠️</span>
                <span>Scheduled Maintenance Active • Admin Access Only</span>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[10px] sm:text-xs font-bold rounded-xl p-3 text-center shadow-sm animate-shake uppercase tracking-wide">
                <p>{error}</p>
                {error.toLowerCase().includes('maintenance') && (
                  <Link to="/maintenance" className="inline-block mt-1.5 font-black text-[#7A1B22] underline tracking-wider">
                    VIEW SYSTEM STATUS PAGE →
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="animate-item-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  EMAIL OR PHONE NUMBER
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                  placeholder="juan@gmail.com or 09123456789"
                />
              </div>

              <div className="animate-item-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    PASSWORD
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`${inputClasses} pr-10`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link 
                    to="/forgot-password" 
                    className="text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] transition-colors uppercase tracking-wider"
                  >
                    FORGOT PASSWORD?
                  </Link>
                </div>
              </div>

              <div className="animate-item-4 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || lockoutSeconds > 0}
                  className={`w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-xs sm:text-sm font-black shadow-lg transition-all duration-300 uppercase tracking-wider ${
                    isLoading || lockoutSeconds > 0
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] shadow-[#7A1B22]/30 hover:shadow-[#7A1B22]/50 hover:brightness-110 active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      SIGNING IN...
                    </>
                  ) : lockoutSeconds > 0 ? (
                    <>
                      LOCKED ({lockoutSeconds}s)
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      SIGN IN
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center animate-item-4">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                UNREGISTERED OPERATOR?{' '}
                <Link to="/register" className="font-black text-[#7A1B22] hover:underline">
                  CREATE AN ACCOUNT
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-6 text-center text-white/70 text-[9px] sm:text-[10px] space-y-0.5 pb-2 animate-item-4 uppercase tracking-wider font-semibold">
        <p>G-TRAMS — GASAN TRICYCLE RECORDS SYSTEM</p>
        <p className="text-white/40 text-[8px] sm:text-[9px] normal-case font-normal">
          © 2026 Municipality of Gasan, Marinduque. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default Login;