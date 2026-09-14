import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';

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
      setError('PLEASE ENTER A VALID EMAIL OR PHONE NUMBER.');
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

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm font-medium";

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#120204] flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[580px] h-[580px] bg-gradient-to-br from-[#9E1B27] via-[#C92A36] to-transparent rounded-full blur-[85px] opacity-80 animate-liquid-1" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[620px] h-[620px] bg-gradient-to-tl from-[#5A0E15] via-[#851821] to-[#360408] rounded-full blur-[95px] opacity-85 animate-liquid-2" />
        <div className="absolute top-[25%] right-[10%] w-[420px] h-[420px] bg-gradient-to-bl from-[#E03144]/60 via-[#8A141E] to-transparent rounded-full blur-[75px] animate-liquid-3" />

        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* TOP FLUSH NAVBAR */}
      <AuthNavbar />

      {/* CENTERED AUTH CARD */}
      <main className="relative z-10 w-full max-w-[370px] mx-auto my-auto px-4 py-2 sm:py-3 flex flex-col items-center justify-center animate-card-entrance">
        <div className="w-full bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/50 p-4 sm:p-5">
          
          <div className="flex flex-col items-center mb-2.5 text-center">
            <div className="relative mb-1.5 animate-logo-entrance">
              <div className="w-11 h-11 bg-white border-2 border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.45)] rounded-full flex items-center justify-center p-0.5 overflow-hidden ring-4 ring-[#D4AF37]/30 shrink-0">
                <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wider uppercase animate-item-1">G-TRAMS PORTAL</h2>
            <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest animate-item-1">
              <span>MUNICIPALITY OF GASAN</span>
              <span>•</span>
              <span className="text-[#7A1B22]">OFFICIAL SYSTEM</span>
            </div>
          </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-[10px] sm:text-xs font-bold rounded-xl p-2.5 text-center shadow-sm animate-shake uppercase tracking-wide">
                <p>{error}</p>
                {error.toLowerCase().includes('maintenance') && (
                  <Link to="/maintenance" className="inline-block mt-1 font-black text-[#7A1B22] underline tracking-wider">
                    VIEW SYSTEM STATUS PAGE →
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-2.5">
              <div className="animate-item-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
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
                <div className="flex justify-between items-center mb-0.5">
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
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="text-right mt-0.5">
                  <Link 
                    to="/forgot-password" 
                    className="text-[9px] font-bold text-slate-500 hover:text-[#7A1B22] transition-colors uppercase tracking-wider"
                  >
                    FORGOT PASSWORD?
                  </Link>
                </div>
              </div>

              <div className="animate-item-4 pt-0.5">
                <button
                  type="submit"
                  disabled={isLoading || lockoutSeconds > 0}
                  className={`relative overflow-hidden group w-full flex items-center justify-center gap-2 text-white py-2 rounded-xl text-xs font-black shadow-md transition-all duration-300 uppercase tracking-wider cursor-pointer ${
                    isLoading || lockoutSeconds > 0
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] shadow-[#7A1B22]/30 hover:shadow-[#7A1B22]/60 hover:brightness-110 active:scale-[0.98]'
                  }`}
                >
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      SIGNING IN...
                    </>
                  ) : lockoutSeconds > 0 ? (
                    <>
                      LOCKED ({lockoutSeconds}s)
                    </>
                  ) : (
                    <>
                      <LogIn size={15} />
                      SIGN IN
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-2 animate-item-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-semibold text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* GOOGLE SIGN IN BUTTON */}
            <div className="animate-item-4">
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

            <div className="mt-2.5 pt-2 border-t border-slate-100 text-center animate-item-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                UNREGISTERED OPERATOR?{' '}
                <Link to="/register" className="font-black text-[#7A1B22] hover:underline">
                  CREATE AN ACCOUNT
                </Link>
              </p>
            </div>

          </div>
      </main>

      {/* SHARED FULL-WIDTH FOOTER */}
      <AuthFooter />

    </div>
  );
};

export default Login;
