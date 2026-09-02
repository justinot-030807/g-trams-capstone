import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    contact: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const rawRole = data.role || data.user?.role || '';
        const normalizedRole = String(rawRole).toLowerCase().trim().replace(/_/g, ' ');
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', normalizedRole);

        // Sine-save agad ang pangalan at user info para kumpleto ang profile sa portal
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
        } else if (normalizedRole === 'operator' || normalizedRole === 'toda president') {
          navigate('/operator-dashboard');
        } else {
          navigate('/operator-dashboard');
        }
      } else {
        setError(data.message || 'LOGIN FAILED. CHECK YOUR CREDENTIALS.');
      }
    } catch (err) {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm font-medium";

  return (
    <div className="relative min-h-screen w-full bg-[#120204] flex flex-col justify-between items-center px-4 py-6 sm:p-6 overflow-hidden select-none">
      
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
          0% { opacity: 0; transform: scale(0.94) translateY(20px); }
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

      {/* Main Glass Card */}
      <div className="w-full max-w-[350px] sm:max-w-[390px] my-auto relative z-10 animate-card-entrance">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/50 p-5 sm:p-7">
          
          <div className="flex flex-col items-center mb-5 text-center">
            <div className="relative mb-2.5 animate-logo-entrance">
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

          {error && (
            <div className="mb-3.5 bg-red-50/90 border border-red-200 text-red-700 text-[11px] font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="animate-item-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                EMAIL OR PHONE NUMBER
              </label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                disabled={isLoading}
                required
                className={`${inputClasses} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="juan@gmail.com or 09123456789"
              />
            </div>

            <div className="animate-item-3">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={`${inputClasses} pr-10 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22] p-1 disabled:opacity-40"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end animate-item-3">
              <Link to="/forgot-password" className="text-[10px] font-bold text-[#7A1B22] hover:underline uppercase tracking-wider">
                FORGOT PASSWORD?
              </Link>
            </div>

            <div className="animate-item-4 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-[#7A1B22]/25 active:scale-[0.98] transition-all tracking-wider uppercase ${
                  isLoading ? 'opacity-70 cursor-not-allowed brightness-95' : 'hover:brightness-110'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    AUTHENTICATING...
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

          <div className="mt-4 pt-3.5 border-t border-slate-100 text-center animate-item-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              UNREGISTERED OPERATOR?{' '}
              <Link to="/register" className="text-[#7A1B22] hover:underline font-black">
                CREATE AN ACCOUNT
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Modern Footer */}
      <footer className="relative z-10 mt-4 text-center text-white/70 text-[9px] sm:text-[10px] space-y-0.5 pb-1 animate-item-4 uppercase tracking-wider font-semibold">
        <p>G-TRAMS — GASAN TRICYCLE RECORDS SYSTEM</p>
        <p className="text-white/40 text-[8px] sm:text-[9px] normal-case font-normal">
          © 2026 Municipality of Gasan, Marinduque. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default Login;