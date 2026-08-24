import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';

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

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError(''); setSuccess('');

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('OTP sent successfully! Please check your inbox.');
        setStep(2); 
      } else {
        setError(data.message || 'Error finding account.');
      }
    } catch (err) {
      setError('Cannot connect to the server.');
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
      return setError('Passwords do not match!');
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
        setSuccess('Password reset successful! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      setError('Cannot connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm";

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#3D0A0E] via-[#6B141B] to-[#200406] flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#7A1B22]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md my-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/40 p-8 sm:p-10">
          
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] rounded-2xl shadow-md flex items-center justify-center mb-4 ring-4 ring-[#D4AF37]/20">
              {step === 1 ? <ShieldAlert className="text-[#7A1B22]" size={32} /> : <KeyRound className="text-[#7A1B22]" size={32} />}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {step === 1 ? 'Enter your registered email or phone number to receive a reset code.' : 'Create a new secure password for your account.'}
            </p>
          </div>

          {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-semibold rounded-xl p-3 text-center shadow-sm">{error}</div>}
          {success && <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold rounded-xl p-3 text-center shadow-sm">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email or Phone Number</label>
                <input 
                  type="text" 
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required 
                  className={inputClasses} 
                  placeholder="juan@gmail.com or 09123456789" 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A1B22] to-[#5A1419] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#7A1B22]/30 transition-all duration-200 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-[#66151B] hover:to-[#480E12] active:scale-[0.98]'}`}
              >
                {isLoading ? <><Loader2 className="animate-spin" size={18} /> Sending...</> : 'Send Reset Code'}
              </button>

              <Link to="/login" className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-[#7A1B22] mt-4 transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-center">Enter 6-Digit Code</label>
                <input 
                  type="text" 
                  maxLength="6"
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-center text-2xl font-black text-slate-900 tracking-[0.4em] outline-none focus:bg-white focus:border-[#7A1B22]" 
                  placeholder="000000" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
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
                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-3.5 rounded-xl text-sm font-black shadow-lg shadow-[#D4AF37]/30 transition-all mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-105 active:scale-[0.98]'}`}
              >
                {isLoading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><RefreshCw size={18} /> Reset Password</>}
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#7A1B22] mt-2 transition-colors">
                ← Change contact information
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center text-white/70 text-xs space-y-1 pb-2">
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

export default ForgotPassword;