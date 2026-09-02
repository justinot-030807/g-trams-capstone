import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';

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
      return setError('PLEASE ENTER A VALID PH MOBILE (09XXXXXXXXX) OR EMAIL ADDRESS.');
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

      {/* Card Container */}
      <div className="w-full max-w-[350px] sm:max-w-[390px] my-auto relative z-10 animate-card-entrance">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/50 p-5 sm:p-7">
          
          <div className="flex flex-col items-center mb-4 text-center">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] rounded-2xl shadow-md flex items-center justify-center mb-2 ring-4 ring-[#D4AF37]/25 shrink-0 animate-logo-entrance">
              {step === 1 ? <ShieldAlert className="text-[#7A1B22]" size={22} /> : <KeyRound className="text-[#7A1B22]" size={22} />}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-wider uppercase animate-item-1">
              {step === 1 ? 'FORGOT PASSWORD?' : 'RESET PASSWORD'}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-widest animate-item-1">
              {step === 1 ? 'ENTER REGISTERED CONTACT' : 'CREATE A NEW PASSWORD'}
            </p>
          </div>

          {error && <div className="mb-3.5 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">{error}</div>}
          {success && <div className="mb-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-3">
              <div className="animate-item-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">EMAIL OR PHONE NUMBER</label>
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
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white py-2.5 sm:py-3 rounded-xl text-xs font-black shadow-md transition-all uppercase tracking-wider ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'}`}
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={15} /> SENDING CODE...</> : 'SEND RESET CODE'}
                </button>

                <Link to="/login" className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] mt-3 transition-colors uppercase tracking-wider">
                  <ArrowLeft size={13} /> BACK TO LOGIN
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-2.5 animate-item-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">ENTER 6-DIGIT CODE</label>
                <input 
                  type="text" 
                  maxLength="6" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg font-black text-slate-900 tracking-[0.3em] outline-none focus:bg-white focus:border-[#7A1B22]" 
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
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-2.5 rounded-xl text-xs font-black shadow-md transition-all mt-1 uppercase tracking-wider ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-105 active:scale-[0.98]'}`}
              >
                {isLoading ? <><Loader2 className="animate-spin" size={15} /> PROCESSING...</> : <><RefreshCw size={15} /> RESET PASSWORD</>}
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] mt-1 transition-colors uppercase tracking-wider">
                ← CHANGE CONTACT INFO
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-4 text-center text-white/70 text-[9px] sm:text-[10px] space-y-0.5 pb-1 animate-item-4 uppercase tracking-wider font-semibold">
        <p>G-TRAMS — GASAN TRICYCLE RECORDS & APPLICATION MANAGEMENT SYSTEM</p>
        <p className="text-white/40 text-[8px] sm:text-[9px] normal-case font-normal">
          © 2026 Municipality of Gasan, Marinduque. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default ForgotPassword;