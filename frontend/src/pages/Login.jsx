import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
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
    setError('');

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/operator-dashboard');
        }
      } else {
        setError(data.message || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError('Cannot connect to the server. Make sure backend is running.');
    }
  };

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm";

  return (
    <div className="relative min-h-screen w-full bg-[#1F0406] flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden select-none">
      
      {/* CSS KEYFRAMES PARA SA ENTRANCE & STAGGER ANIMATION */}
      <style>{`
        @keyframes floatSlow1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(70px, -60px) scale(1.15); }
          66% { transform: translate(-40px, 50px) scale(0.9); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-60px, 70px) scale(1.2); }
          66% { transform: translate(50px, -40px) scale(0.85); }
        }
        @keyframes entranceCard {
          0% { opacity: 0; transform: scale(0.92) translateY(30px); }
          100% { opacity: 1; transform: scale(1) translateY(0px); }
        }
        @keyframes logoPop {
          0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          70% { transform: scale(1.1) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes itemFadeUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-blob-1 { animation: floatSlow1 18s ease-in-out infinite; }
        .animate-blob-2 { animation: floatSlow2 22s ease-in-out infinite; }
        .animate-card-entrance {
          animation: entranceCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-logo-entrance {
          animation: logoPop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-item-1 { animation: itemFadeUp 0.6s ease-out 0.2s both; }
        .animate-item-2 { animation: itemFadeUp 0.6s ease-out 0.3s both; }
        .animate-item-3 { animation: itemFadeUp 0.6s ease-out 0.4s both; }
        .animate-item-4 { animation: itemFadeUp 0.6s ease-out 0.5s both; }
      `}</style>

      {/* Living Ambient Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-[#7A1B22] via-[#9B2A33] to-transparent rounded-full blur-[90px] opacity-75 animate-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-tl from-[#5A1419] via-[#851D25] to-[#D4AF37]/20 rounded-full blur-[100px] opacity-70 animate-blob-2" />
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Glass Card with Entrance Animation */}
      <div className="w-full max-w-md my-auto relative z-10 animate-card-entrance">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white/40 p-8 sm:p-10 transition-all duration-300">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="relative mb-4 group animate-logo-entrance">
              <div className="w-20 h-20 bg-white border-2 border-[#D4AF37] shadow-lg rounded-full flex items-center justify-center p-1 overflow-hidden ring-4 ring-[#D4AF37]/30 transition-transform duration-300 group-hover:scale-105">
                <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight animate-item-1">G-TRAMS Portal</h2>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider animate-item-1">
              <span>Municipality of Gasan</span>
              <span>•</span>
              <span className="text-[#7A1B22] font-bold">Official System</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl p-3.5 text-center shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="animate-item-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email or Phone Number
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`${inputClasses} pr-12`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1 animate-item-3">
              <Link to="/forgot-password" className="text-xs font-bold text-[#7A1B22] hover:text-[#5A1419] hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="animate-item-4">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#7A1B22]/30 hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 mt-2 tracking-wide"
              >
                <LogIn size={18} />
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center animate-item-4">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Unregistered operator?{' '}
              <Link to="/register" className="font-bold text-[#7A1B22] hover:underline">
                Create an account
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center text-white/70 text-xs space-y-1 pb-2 animate-item-4">
        <div className="flex items-center justify-center gap-2 font-medium tracking-wide">
          <ShieldCheck size={14} className="text-[#D4AF37]" />
          <span>G-TRAMS — Gasan Tricycle Records and Application Management System</span>
        </div>
        <p className="text-white/50 text-[11px]">
          © 2026 Municipality of Gasan, Marinduque. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default Login;