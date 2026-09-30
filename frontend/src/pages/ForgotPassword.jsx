import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [contact, setContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Ensure light canvas consistency for auth view
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

  const isValidContact = (value) => {
    const trimmed = value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(09|\+639)\d{9}$/;
    return emailRegex.test(trimmed) || phoneRegex.test(trimmed.replace(/[\s-]/g, ''));
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError(''); setSuccess('');

    if (!isValidContact(contact)) {
      return setError('PLEASE ENTER A VALID EMAIL OR PHONE NUMBER.');
    }

    setIsLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('OTP CODE SENT SUCCESSFULLY!');
        setStep(2); 
      } else {
        setError(data.message || 'ERROR FINDING ACCOUNT.');
      }
    } catch (err) {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(''); setSuccess('');

    if (newPassword.length < 6) {
      setIsLoading(false);
      return setError('PASSWORD MUST BE AT LEAST 6 CHARACTERS LONG!');
    }

    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      return setError('PASSWORDS DO NOT MATCH!');
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: contact,
          otp: otpCode,
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('PASSWORD RESET SUCCESSFUL! REDIRECTING...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'INVALID OR EXPIRED OTP.');
      }
    } catch (err) {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-500 outline-none focus:bg-white focus:border-[#9E2A2B] focus:ring-4 focus:ring-[#9E2A2B]/15 transition-all shadow-xs font-medium min-h-[46px] sm:min-h-[48px]";

  return (
    <div className="relative w-full bg-slate-50 flex flex-col overflow-x-hidden select-none min-h-screen">
      
      {/* Zero-Lag Lightweight Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[420px] h-[420px] opacity-[0.035] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>
      </div>

      <div className="relative min-h-[100dvh] flex flex-col justify-between">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* CENTERED AUTH CARD */}
        <main className="relative z-10 w-full max-w-[400px] sm:max-w-[440px] mx-auto px-4 my-auto py-6 sm:py-8 flex flex-col items-center justify-center min-h-fit animate-card-entrance">
          <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/90 p-5 sm:p-7 min-h-fit">
            
            <div className="flex flex-col items-center mb-3 text-center">
              <div className="w-11 h-11 bg-white border-2 border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.45)] rounded-full flex items-center justify-center p-0.5 overflow-hidden ring-4 ring-[#D4AF37]/30 shrink-0 mb-1.5 animate-logo-entrance">
                {step === 1 ? <ShieldAlert className="text-[#9E2A2B]" size={22} /> : <KeyRound className="text-[#9E2A2B]" size={22} />}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wider uppercase animate-item-1">
                {step === 1 ? 'FORGOT PASSWORD?' : 'RESET PASSWORD'}
              </h2>
              <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest animate-item-1">
                <span>{step === 1 ? 'ENTER REGISTERED CONTACT' : 'CREATE A NEW PASSWORD'}</span>
                <span>•</span>
                <span className="text-[#9E2A2B]">SECURE RECOVERY</span>
              </div>
            </div>

            {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">{error}</div>}
            {success && <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">{success}</div>}

            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-3">
                <div className="animate-item-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">EMAIL OR PHONE NUMBER</label>
                  <input 
                    type="text" 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required 
                    className={inputClasses} 
                    placeholder="juan@gmail.com or 09123456789" 
                  />
                </div>
                
                <div className="animate-item-3 pt-1">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`relative overflow-hidden group w-full flex items-center justify-center gap-2 text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all uppercase tracking-wider cursor-pointer ${
                      isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#9E2A2B] via-[#8E2028] to-[#7A1B22] shadow-[#9E2A2B]/25 hover:shadow-[#9E2A2B]/50 hover:brightness-110 active:scale-[0.98]'
                    }`}
                  >
                    <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />
                    {isLoading ? <><Loader2 className="animate-spin" size={16} /> SENDING CODE...</> : 'SEND RESET CODE'}
                  </button>

                  {isLoading && (
                    <p className="text-xs text-slate-500 text-center mt-2 animate-pulse font-medium">
                      Connecting to secure gateway, please wait...
                    </p>
                  )}

                  <Link to="/login" className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#9E2A2B] mt-3 transition-colors uppercase tracking-wider">
                    <ArrowLeft size={13} /> BACK TO LOGIN
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-3 animate-item-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">ENTER 6-DIGIT CODE</label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-xl font-black text-slate-900 tracking-[0.3em] outline-none focus:bg-white focus:border-[#9E2A2B] focus:ring-4 focus:ring-[#9E2A2B]/15 shadow-inner" 
                    placeholder="000000" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">NEW PASSWORD</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                    className={inputClasses} 
                    placeholder="••••••••" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">CONFIRM PASSWORD</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    className={inputClasses} 
                    placeholder="••••••••" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={16} /> PROCESSING...</> : <><RefreshCw size={16} /> RESET PASSWORD</>}
                </button>
                
                <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#9E2A2B] mt-2 transition-colors uppercase tracking-wider cursor-pointer">
                  ← CHANGE CONTACT INFO
                </button>
              </form>
            )}

          </div>
        </main>
      </div>

      {/* SHARED FULL-WIDTH FOOTER */}
      <AuthFooter />

    </div>
  );
};

export default ForgotPassword;
