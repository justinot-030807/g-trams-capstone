import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2, FileText, ShieldCheck, Clock, Phone, ChevronRight } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import AuthLayout from '../components/AuthLayout';

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

    // Validate contact format (PH mobile number or email)
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
        handleAuthSuccess(data);
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

  const handleAuthSuccess = (data) => {
    setFailedAttempts(0);
    setLockoutSeconds(0);
    const rawRole = data.role || data.user?.role || '';
    const normalizedRole = String(rawRole).toLowerCase().trim().replace(/_/g, ' ');
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', normalizedRole);

    const currentUserId = data.user?._id || data.user?.id || data._id || data.id || '';
    if (currentUserId) localStorage.setItem('userId', currentUserId);

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

    // Immediately dispatch initial presence ping
    if (data.token) {
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      if (baseUrl) {
        fetch(`${baseUrl}/api/v1/auth/heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${data.token}`, 'Content-Type': 'application/json' }
        })
        .then(res => {
          if (res.status === 404) {
            fetch(`${baseUrl}/api/v1/auth/profile`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${data.token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ language: localStorage.getItem('gtrams_lang') || 'en' })
            }).catch(() => {});
          }
        })
        .catch(() => {
          fetch(`${baseUrl}/api/v1/auth/profile`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${data.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: localStorage.getItem('gtrams_lang') || 'en' })
          }).catch(() => {});
        });
      }
    }

    if (normalizedRole === 'admin' || normalizedRole === 'administrator') {
      navigate('/admin-dashboard');
    } else {
      navigate('/operator-dashboard');
    }
  };

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm font-medium";

  // LEFT HERO SECTION (Desktop showcase)
  const leftHero = (
    <div className="hidden lg:flex flex-col flex-1 text-left max-w-xl animate-item-1">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl border-2 border-[#D4AF37] ring-4 ring-[#D4AF37]/25 shrink-0">
          <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none drop-shadow-md">G-TRAMS</h1>
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mt-1.5">Municipality of Gasan • Province of Marinduque</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white/95 tracking-tight leading-snug drop-shadow-sm">
        Gasan Tricycle Records & Application Management System
      </h2>
      <p className="text-white/75 text-xs sm:text-sm mt-2.5 leading-relaxed font-medium">
        The official digital portal of the Local Government Unit of Gasan for secure, streamlined, and transparent motorized tricycle franchise registration, renewal, and fleet management.
      </p>

      {/* 3 FEATURE CARDS */}
      <div className="grid grid-cols-1 gap-3 mt-6">
        <div className="flex items-start justify-between gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm hover:bg-white/15 transition-colors group cursor-default">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#7A1B22] to-[#5A1419] text-[#D4AF37] border border-[#D4AF37]/30 shadow-md shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Online Application & Renewal</h3>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">Submit official franchise requirements and documents digitally without waiting in long queues.</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40 group-hover:text-[#D4AF37] transition-colors shrink-0 mt-1" />
        </div>

        <div className="flex items-start justify-between gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm hover:bg-white/15 transition-colors group cursor-default">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#7A1B22] to-[#5A1419] text-[#D4AF37] border border-[#D4AF37]/30 shadow-md shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Verified TODA & Operator Registry</h3>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">Centralized masterlist ensuring legitimate operator credentials and authorized TODA associations.</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40 group-hover:text-[#D4AF37] transition-colors shrink-0 mt-1" />
        </div>

        <div className="flex items-start justify-between gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm hover:bg-white/15 transition-colors group cursor-default">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#7A1B22] to-[#5A1419] text-[#D4AF37] border border-[#D4AF37]/30 shadow-md shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Real-Time Status & Claim Stub</h3>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">Monitor application approvals live and generate official printable payment claim stubs instantly.</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40 group-hover:text-[#D4AF37] transition-colors shrink-0 mt-1" />
        </div>
      </div>

      {/* LGU HELPDESK FOOTER BADGE */}
      <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-white/15 text-white/70 text-xs">
        <Phone size={14} className="text-[#D4AF37]" />
        <span>BPLO Helpdesk Hotline: <strong className="text-white font-bold">(042) 342-1234</strong> • <strong className="text-white font-bold">bplo@gasan.gov.ph</strong></span>
      </div>
    </div>
  );

  return (
    <AuthLayout leftHero={leftHero}>
      
      {/* RIGHT AUTH CARD */}
      <div className="w-full max-w-[360px] sm:max-w-[400px] shrink-0 animate-card-entrance">
        <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/60 p-6 sm:p-8 overflow-hidden">
          
          {/* Decorative Gold Top-Right Corner Accent */}
          <div 
            className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#D4AF37] via-[#F3E5AB] to-transparent pointer-events-none opacity-90"
            style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          />
          <div 
            className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl from-[#B8860B] to-[#D4AF37] pointer-events-none opacity-95"
            style={{ clipPath: 'polygon(100% 0, 25% 0, 100% 75%)' }}
          />
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="relative mb-3 animate-logo-entrance">
              <div className="w-14 h-14 bg-white border-2 border-[#D4AF37] shadow-md rounded-full flex items-center justify-center p-0.5 overflow-hidden ring-4 ring-[#D4AF37]/25 shrink-0">
                <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-wider uppercase">G-TRAMS PORTAL</h2>
            <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>MUNICIPALITY OF GASAN</span>
              <span>•</span>
              <span className="text-[#7A1B22]">OFFICIAL SYSTEM</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[10px] sm:text-xs font-bold rounded-xl p-3 text-center shadow-sm uppercase tracking-wide">
              <p>{error}</p>
              {error.toLowerCase().includes('maintenance') && (
                <Link to="/maintenance" className="inline-block mt-1.5 font-black text-[#7A1B22] underline tracking-wider">
                  VIEW SYSTEM STATUS PAGE →
                </Link>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                EMAIL OR PHONE NUMBER
              </label>
              <div className="relative">
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
            </div>

            <div>
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

            <div className="pt-1">
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

          {/* DIVIDER */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* GOOGLE SIGN IN BUTTON */}
          <div>
            <GoogleAuthButton 
              text="Continue with Google"
              onSuccess={handleAuthSuccess}
              onNewUser={(data) => {
                if (data?.token) {
                  handleAuthSuccess(data);
                } else {
                  navigate('/register', { 
                    state: { 
                      googleProfile: data,
                      fromGoogleLogin: true 
                    } 
                  });
                }
              }}
              onError={(msg) => setError(msg)}
            />
          </div>

          {/* REGISTER LINK */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
              UNREGISTERED OPERATOR?{' '}
              <Link to="/register" className="font-black text-[#7A1B22] hover:underline inline-flex items-center gap-0.5">
                <span>CREATE AN ACCOUNT</span>
                <ChevronRight size={13} className="inline" />
              </Link>
            </p>
          </div>

        </div>
      </div>

    </AuthLayout>
  );
};

export default Login;