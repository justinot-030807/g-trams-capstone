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

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm font-medium";

  return (
    <div className="relative w-full bg-[#120204] flex flex-col overflow-x-hidden select-none">
      
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

      <div className="relative min-h-[100vh] flex flex-col">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* CENTERED AUTH CARD */}
        <main className="relative z-10 w-full max-w-[370px] mx-auto flex-grow flex flex-col items-center justify-center animate-card-entrance py-8">
          <div className="w-full bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/50 p-4 sm:p-5">
            
            <div className="flex flex-col items-center mb-2.5 text-center">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center mb-1.5 ring-4 ring-[#D4AF37]/30 shrink-0 animate-logo-entrance">
                {step === 1 ? <ShieldAlert className="text-[#7A1B22]" size={20} /> : <KeyRound className="text-[#7A1B22]" size={20} />}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wider uppercase animate-item-1">
                {step === 1 ? 'FORGOT PASSWORD?' : 'RESET PASSWORD'}
              </h2>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-widest animate-item-1">
                {step === 1 ? 'ENTER REGISTERED CONTACT' : 'CREATE A NEW PASSWORD'}
              </p>
            </div>

            {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold rounded-xl p-2 text-center shadow-sm uppercase tracking-wide">{error}</div>}
            {success && <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl p-2 text-center shadow-sm uppercase tracking-wide">{success}</div>}

            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-2.5">
                <div className="animate-item-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">EMAIL OR PHONE NUMBER</label>
                  <input 
                    type="text" 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required 
                    className={inputClasses} 
                    placeholder="juan@gmail.com or 09123456789" 
                  />
                </div>
                
                <div className="animate-item-3 pt-0.5">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white py-2 rounded-xl text-xs font-black shadow-md transition-all uppercase tracking-wider ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'}`}
                  >
                    {isLoading ? <><Loader2 className="animate-spin" size={15} /> SENDING CODE...</> : 'SEND RESET CODE'}
                  </button>

                  {isLoading && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1.5 animate-pulse font-medium">
                      Connecting to secure gateway, please wait...
                    </p>
                  )}

                  <Link to="/login" className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] mt-2.5 transition-colors uppercase tracking-wider">
                    <ArrowLeft size={13} /> BACK TO LOGIN
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-2.5 animate-item-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5 text-center">ENTER 6-DIGIT CODE</label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center text-lg font-black text-slate-900 tracking-[0.3em] outline-none focus:bg-white focus:border-[#7A1B22]" 
                    placeholder="000000" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">NEW PASSWORD</label>
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
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">CONFIRM PASSWORD</label>
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
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-2 rounded-xl text-xs font-black shadow-md transition-all mt-1 uppercase tracking-wider ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-105 active:scale-[0.98]'}`}
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={15} /> PROCESSING...</> : <><RefreshCw size={15} /> RESET PASSWORD</>}
                </button>
                
                <button type="button" onClick={() => setStep(1)} className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] mt-1 transition-colors uppercase tracking-wider">
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
