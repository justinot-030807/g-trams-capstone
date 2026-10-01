import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2, ArrowLeft, User, Lock, FileText, Clock, Ticket } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import GoogleOnboardingModal from '../components/GoogleOnboardingModal';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';
import InteractiveLogo from '../components/common/InteractiveLogo';
import { unwrapGoogleProfile, isValidContact } from '../utils/googleAuthUtils';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    contact: '',
    password: ''
  });
  const [googleOnboardingProfile, setGoogleOnboardingProfile] = useState(null);
  const [showGoogleOnboarding, setShowGoogleOnboarding] = useState(false);

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

  // Ensure warm off-white canvas consistency for auth view
  useEffect(() => {
    document.documentElement.classList.add('auth-view');
    document.body.classList.add('auth-view');
    document.documentElement.style.backgroundColor = '#F8F5F3';
    document.body.style.backgroundColor = '#F8F5F3';
    return () => {
      document.documentElement.classList.remove('auth-view');
      document.body.classList.remove('auth-view');
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

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
      setError('PLEASE ENTER A VALID EMAIL OR PHONE NUMBER.');
      return;
    }

    setIsLoading(true);

    const slowNetworkTimer = setTimeout(() => {
      setError('YOUR NETWORK SEEMS SLOW. PLEASE WAIT WHILE WE CONNECT...');
    }, 8000);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      clearTimeout(slowNetworkTimer);

      const data = await response.json();

      if (response.ok) {
        handleAuthSuccess(data);
      } else {
        if (response.status === 503) {
          setError(data.message || 'The system is undergoing maintenance. Access is restricted for non-admin users.');
        } else if (response.status === 403 && data.accountDeactivated === true) {
          navigate('/account-deactivated', { state: { contact: data.contact, reason: data.reason, appealStatus: data.appealStatus } });
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
    } catch {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      clearTimeout(slowNetworkTimer);
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
    } else if (normalizedRole === 'cashier') {
      navigate('/cashier-dashboard');
    } else {
      navigate('/operator-dashboard');
    }
  };

  const inputClasses = "w-full pl-10 pr-3.5 h-[46px] sm:h-[48px] rounded-xl border border-slate-400 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-2 focus:ring-[#801820] focus:ring-offset-2 focus:ring-offset-white transition-all font-medium";

  return (
    <div className="relative w-full bg-[#F8F5F3] flex flex-col overflow-x-hidden min-h-screen">
      
      {/* Zero-Lag Lightweight Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[420px] h-[420px] opacity-[0.035] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>
      </div>

      <div className="relative flex flex-col flex-1 min-h-screen">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full flex flex-col bg-[#F8F5F3]">
          
          {/* TOP HERO BANNER (SLIM) */}
          <div className="relative w-full h-24 sm:h-28 md:h-32 overflow-hidden flex flex-col justify-end p-4 sm:p-5 bg-[#3D080D] shrink-0">
            {/* Background Photo (Tricycle 1 for Login) */}
            <img 
              src="/tricycle-login.jpg" 
              alt="Gasan Tricycle" 
              className="absolute inset-0 w-full h-full object-cover object-center" 
            />
            {/* Equal Velvet Maroon Overlay - identical brightness & >=4.5:1 text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A0408]/90 via-[#5E0D14]/70 to-[#3D080D]/75" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Bottom: Tagline with text-wrap: balance (Item 7) */}
            <div className="relative z-10 max-w-md mx-auto w-full pb-2 text-center sm:text-left">
              <p className="text-xs sm:text-sm md:text-base text-white font-semibold leading-snug drop-shadow-xs [text-wrap:balance]">
                Gasan Tricycle Records &amp; Application Management System
              </p>
            </div>
          </div>

          {/* FLOATING WHITE CARD OVERLAPPING HERO BY 20px (Items 1, 2) */}
          <div className="relative z-10 w-full max-w-md mx-auto px-4 -mt-5 flex-1 flex flex-col justify-between pb-8">
            <div className="bg-white rounded-[20px] p-5 sm:p-7 shadow-[0_4px_16px_rgba(116,26,44,0.08)] border border-slate-100">
              
              {/* HEADING, GOLD ACCENT BAR & SUBTITLE (Items 4, 6) */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#801820] tracking-tight leading-tight">
                  Welcome back
                </h1>
                {/* 40x4px gold bar under heading */}
                <div className="w-10 h-1 bg-[#F0B429] rounded-full mt-2" />
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                  Log in to track your application and claim stub.
                </p>
              </div>

              {error && (
                <div className={`mt-4 text-xs font-bold rounded-xl p-3 text-center shadow-xs animate-shake tracking-wide ${
                  error.toLowerCase().includes('google')
                    ? 'bg-amber-50 border border-amber-300 text-amber-900 leading-relaxed'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  <p>{error}</p>
                  {error.toLowerCase().includes('maintenance') && (
                    <Link to="/maintenance" className="inline-block mt-1 font-black text-[#801820] underline tracking-wider">
                      View System Status Page →
                    </Link>
                  )}
                </div>
              )}

              {/* FORM: 24px below subtitle (mt-6) */}
              <form onSubmit={handleLogin} className="mt-6">
                {/* Email or Phone Number: label to input is 8px (mb-2) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 normal-case mb-2">
                    Email or phone number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      autoComplete="username"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      required
                      className={inputClasses}
                      placeholder="Enter your email or phone number"
                    />
                  </div>
                </div>

                {/* Password: 20px below input (mt-5) */}
                <div className="mt-5">
                  <label className="block text-sm font-semibold text-slate-700 normal-case mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      required
                      className={`${inputClasses} pr-10`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#801820] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Forgot Password?: 12px below its input (mt-3) */}
                  <div className="text-right mt-3">
                    <Link 
                      to="/forgot-password" 
                      className="text-xs sm:text-sm font-bold text-[#801820] hover:underline transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                {/* Log In Button: 24px below Forgot Password (mt-6) */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading || lockoutSeconds > 0}
                    className="w-full flex items-center justify-center gap-2 bg-[#801820] hover:bg-[#9E2A2B] text-white py-3 rounded-xl text-base font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[46px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />
                        <span>Logging in...</span>
                      </>
                    ) : lockoutSeconds > 0 ? (
                      `Locked (${lockoutSeconds}s)`
                    ) : (
                      'Log In'
                    )}
                  </button>
                </div>
              </form>

              {/* OR DIVIDER: 20px above and below (my-5) */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-300" />
                <span className="text-xs font-bold text-slate-600">OR</span>
                <div className="flex-1 h-px bg-slate-300" />
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
                      const cleanProfile = unwrapGoogleProfile(data) || data;
                      setGoogleOnboardingProfile(cleanProfile);
                      setShowGoogleOnboarding(true);
                    }
                  }}
                  onError={(err) => {
                    if (err && err.accountDeactivated) {
                      navigate('/account-deactivated', {
                        state: {
                          contact: err.contact || formData.contact,
                          reason: err.reason,
                          appealStatus: err.appealStatus
                        }
                      });
                    } else {
                      setError(typeof err === 'string' ? err : err.message || 'Google Auth Error');
                    }
                  }}
                />
              </div>

              {/* REGISTER LINK: 20px below Google button (mt-5) */}
              <div className="mt-5 text-center">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-bold text-[#801820] hover:underline">
                    Register
                  </Link>
                </p>
              </div>

              {/* TRUST STRIP (Item 8: Exactly 3 items, 13-14px) */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-[13px] text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <FileText size={15} className="text-[#801820] shrink-0" />
                  <span>Apply online</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-[#801820] shrink-0" />
                  <span>Track your status</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Ticket size={15} className="text-[#801820] shrink-0" />
                  <span>Get your claim stub</span>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Streamlined Google Onboarding Modal (Quick 5-Second Setup) */}
      <GoogleOnboardingModal
        isOpen={showGoogleOnboarding}
        onClose={() => {
          setShowGoogleOnboarding(false);
          setGoogleOnboardingProfile(null);
        }}
        googleProfile={googleOnboardingProfile}
        onSuccess={handleAuthSuccess}
      />

      {/* COMPACT FOOTER ON LOGIN (Item 9) */}
      <AuthFooter compact={true} />

    </div>
  );
};

export default Login;
