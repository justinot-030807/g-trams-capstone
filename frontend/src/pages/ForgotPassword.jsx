import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false); // <-- ITO ANG BAGONG STATE PARA SA LOADING
  
  const [contact, setContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ---------- STEP 1: REQUEST OTP ----------
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Pigilan kung naglo-load pa
    
    setIsLoading(true); // I-set sa true pagkapindot
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
      setIsLoading(false); // I-set pabalik sa false pagkatapos mag-send
    }
  };

  // ---------- STEP 2: VERIFY & RESET PASSWORD ----------
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

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8 sm:p-10">
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-[#D4AF37] rounded-2xl shadow-sm flex items-center justify-center mb-5 border-t border-white/20">
            {step === 1 ? <ShieldAlert className="text-[#7A1B22]" size={32} /> : <KeyRound className="text-[#7A1B22]" size={32} />}
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 ? 'Enter your registered email or phone number to receive a reset code.' : 'Create a new password for your account.'}
          </p>
        </div>

        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl p-3 text-center">{error}</div>}
        {success && <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl p-3 text-center">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email or Phone Number</label>
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
              className={`w-full flex items-center justify-center gap-2 bg-[#7A1B22] text-white py-3.5 rounded-xl font-bold shadow-sm transition-all duration-200 mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#5A1419] active:scale-[0.98]'}`}
            >
              {/* Dynamic Button Text/Icon */}
              {isLoading ? <><Loader2 className="animate-spin" size={18} /> Sending...</> : 'Send Reset Code'}
            </button>

            <Link to="/login" className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#7A1B22] mt-4">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">Enter 6-Digit OTP Code</label>
              <input 
                type="text" 
                maxLength="6"
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value)} 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-black text-slate-900 tracking-[0.5em] outline-none focus:bg-white focus:border-[#7A1B22]" 
                placeholder="000000" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
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
              className={`w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-[#7A1B22] py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#c49f2b] active:scale-[0.98]'}`}
            >
              {isLoading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><RefreshCw size={18} /> Reset Password</>}
            </button>
            
            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs font-medium text-slate-500 hover:text-[#7A1B22] mt-2">
              Change contact information
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;