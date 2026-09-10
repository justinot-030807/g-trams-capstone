import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, RefreshCw, Loader2, Phone, ShieldCheck, Clock, ChevronRight, Lock } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

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
        Account Recovery & Security Assistance
      </h2>
      <p className="text-white/75 text-xs sm:text-sm mt-2.5 leading-relaxed font-medium">
        Quickly regain access to your official G-TRAMS operator or TODA account through secure one-time password (OTP) verification.
      </p>

      {/* 3 FEATURE CARDS */}
      <div className="grid grid-cols-1 gap-3 mt-6">
        <div className="flex items-start justify-between gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm hover:bg-white/15 transition-colors group cursor-default">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#7A1B22] to-[#5A1419] text-[#D4AF37] border border-[#D4AF37]/30 shadow-md shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Fast OTP Verification</h3>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">Receive an instant 6-digit confirmation code via registered mobile number or email.</p>
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
              <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Encrypted Security Standard</h3>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">Your credentials and franchise records remain protected under municipal data privacy rules.</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40 group-hover:text-[#D4AF37] transition-colors shrink-0 mt-1" />
        </div>

        <div className="flex items-start justify-between gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm hover:bg-white/15 transition-colors group cursor-default">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#7A1B22] to-[#5A1419] text-[#D4AF37] border border-[#D4AF37]/30 shadow-md shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">BPLO Technical Support</h3>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">Need help updating your registered contact number? Contact the BPLO Helpdesk team during office hours.</p>
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
      <div className="w-full max-w-[350px] sm:max-w-[400px] shrink-0 animate-card-entrance">
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
          <div className="flex flex-col items-center mb-5 text-center">
            <div className="w-13 h-13 bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] rounded-2xl shadow-md flex items-center justify-center mb-2.5 ring-4 ring-[#D4AF37]/25 shrink-0 p-2.5">
              {step === 1 ? <ShieldAlert className="text-[#7A1B22]" size={24} /> : <KeyRound className="text-[#7A1B22]" size={24} />}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-wider uppercase">
              {step === 1 ? 'FORGOT PASSWORD?' : 'RESET PASSWORD'}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-widest">
              {step === 1 ? 'ENTER REGISTERED CONTACT' : 'CREATE A NEW PASSWORD'}
            </p>
          </div>

          {error && (
            <div className="mb-3.5 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
              {success}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  EMAIL OR PHONE NUMBER
                </label>
                <input 
                  type="text" 
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required 
                  className={inputClasses} 
                  placeholder="juan@gmail.com or 09123456789" 
                />
              </div>
              
              <div className="pt-1">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white py-3 rounded-xl text-xs font-black shadow-md transition-all uppercase tracking-wider ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={15} /> 
                      SENDING CODE...
                    </>
                  ) : (
                    'SEND RESET CODE'
                  )}
                </button>

                <Link 
                  to="/login" 
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] mt-4 transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft size={13} /> BACK TO LOGIN
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">
                  ENTER 6-DIGIT CODE
                </label>
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
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  NEW PASSWORD
                </label>
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
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  CONFIRM PASSWORD
                </label>
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
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-2.5 rounded-xl text-xs font-black shadow-md transition-all mt-1 uppercase tracking-wider ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-105 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={15} /> 
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} /> 
                    RESET PASSWORD
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] mt-2 transition-colors uppercase tracking-wider"
              >
                ← CHANGE CONTACT INFO
              </button>
            </form>
          )}

        </div>
      </div>

    </AuthLayout>
  );
};

export default ForgotPassword;