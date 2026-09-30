import React, { useState, useEffect } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../utils/constants';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Loader2, CheckCircle2, Check, X, ArrowLeft, User, Lock } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import GoogleOnboardingModal from '../components/GoogleOnboardingModal';
import TermsPolicyModal from '../components/common/TermsPolicyModal';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';
import InteractiveLogo from '../components/common/InteractiveLogo';
import { unwrapGoogleProfile, isValidContact } from '../utils/googleAuthUtils';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingGoogle = unwrapGoogleProfile(location.state?.googleProfile);

  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: incomingGoogle?.name || '', 
    address: '', 
    contact: incomingGoogle?.email || '', 
    password: '', 
    confirmPassword: '', 
    todaAssociation: 'BATODA',
    role: 'operator'
  });
  const [otpCode, setOtpCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google Sign-In Streamlined Onboarding
  const [googleOnboardingProfile, setGoogleOnboardingProfile] = useState(incomingGoogle || null);
  const [showGoogleOnboarding, setShowGoogleOnboarding] = useState(Boolean(incomingGoogle));

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

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const passwordRules = [
    { id: 'length', label: 'At least 8 characters', met: (formData.password || '').length >= 8 },
    { id: 'upper', label: 'At least 1 uppercase letter (A-Z)', met: /[A-Z]/.test(formData.password || '') },
    { id: 'lower', label: 'At least 1 lowercase letter (a-z)', met: /[a-z]/.test(formData.password || '') },
    { id: 'number', label: 'At least 1 number (0-9)', met: /[0-9]/.test(formData.password || '') },
    { id: 'special', label: 'At least 1 special symbol (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(formData.password || '') }
  ];
  const isPasswordQualified = passwordRules.every(r => r.met);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmitRegisterForm = async (e) => {
    e.preventDefault();
    handleRequestOTP(e);
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.name || formData.name.trim().length < 2) {
      return setError('PLEASE ENTER YOUR FULL LEGAL NAME (AT LEAST 2 CHARACTERS).');
    }

    if (!formData.address) {
      return setError('PLEASE SELECT YOUR BARANGAY IN GASAN.');
    }

    if (!formData.todaAssociation || formData.todaAssociation === 'NON-TODA') {
      return setError('ACCORDING TO MUNICIPAL ORDINANCE, OPERATORS MUST BELONG TO AN ACCREDITED TODA ASSOCIATION.');
    }

    // Validate contact format
    if (!isValidContact(formData.contact)) {
      return setError('PLEASE ENTER A VALID EMAIL OR PHONE NUMBER.');
    }

    if (!formData.password || formData.password.length < 8) {
      return setError('PASSWORD MUST BE AT LEAST 8 CHARACTERS LONG.');
    }

    if (!isPasswordQualified) {
      return setError('PASSWORD DOES NOT MEET ALL QUALIFICATIONS. PLEASE CHECK THE REQUIREMENTS LIST.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('PASSWORDS DO NOT MATCH!');
    }

    if (!termsAccepted) {
      return setError('PLEASE ACCEPT THE TERMS AND PRIVACY POLICY.');
    }

    setIsLoading(true);
    const slowTimer = setTimeout(() => setError('YOUR NETWORK SEEMS SLOW. PLEASE WAIT...'), 8000);

    const rawContact = formData.contact.trim();
    const cleanContact = rawContact.includes('@') ? rawContact.toLowerCase() : rawContact.replace(/[\s\-()]/g, '');

    const payload = {
      name: formData.name.trim(),
      fullName: formData.name.trim(),
      address: formData.address.trim(),
      contact: cleanContact,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      todaAssociation: formData.todaAssociation || 'NON-TODA',
      role: 'operator'
    };

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      clearTimeout(slowTimer);
      const data = await response.json();
      if (response.ok) { 
        setSuccess('OTP CODE SENT SUCCESSFULLY!'); 
        setResendCooldown(60);
        setStep(2); 
      } else { 
        let errorMsg = data.message || data.error || 'REGISTRATION FAILED.';
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const detailed = data.errors.map(err => err.message).filter(Boolean).join('. ');
          if (detailed) errorMsg = detailed;
        }
        setError(errorMsg.toUpperCase()); 
      }
    } catch { 
      setError('CANNOT CONNECT TO THE SERVER.'); 
    } finally { 
      clearTimeout(slowTimer);
      setIsLoading(false); 
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(''); setSuccess('');
    setIsLoading(true);

    const rawContact = formData.contact.trim();
    const cleanContact = rawContact.includes('@') ? rawContact.toLowerCase() : rawContact.replace(/[\s\-()]/g, '');

    const payload = {
      name: formData.name.trim(),
      fullName: formData.name.trim(),
      address: formData.address.trim(),
      contact: cleanContact,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      todaAssociation: formData.todaAssociation || 'NON-TODA',
      role: 'operator'
    };

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('NEW OTP CODE SENT SUCCESSFULLY!');
        setResendCooldown(60);
      } else {
        const errorMsg = data.message || data.error || 'FAILED TO RESEND OTP.';
        setError(errorMsg.toUpperCase());
      }
    } catch {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError(''); setSuccess('');
    setIsLoading(true);

    const rawContact = formData.contact.trim();
    const cleanContact = rawContact.includes('@') ? rawContact.toLowerCase() : rawContact.replace(/[\s\-()]/g, '');

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact: cleanContact, 
          otp: otpCode.trim() 
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('ACCOUNT VERIFIED! LOGGING IN...');
        if (data.token) {
          handleAuthSuccess(data);
        } else {
          setTimeout(() => { navigate('/login'); }, 1500);
        }
      } else {
        let errorMsg = data.message || data.error || 'INVALID OTP CODE.';
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const detailed = data.errors.map(err => err.message).filter(Boolean).join('. ');
          if (detailed) errorMsg = detailed;
        }
        setError(errorMsg.toUpperCase());
      }
    } catch { 
      setError('CANNOT CONNECT TO THE SERVER.'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (data) => {
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

    if (normalizedRole === 'admin' || normalizedRole === 'administrator') {
      navigate('/admin-dashboard');
    } else {
      navigate('/operator-dashboard');
    }
  };

  // Removed unused handleOnboardingSubmit

  const inputClasses = "w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-500 outline-none focus:bg-white focus:border-[#9E2A2B] focus:ring-4 focus:ring-[#9E2A2B]/15 transition-all duration-200 shadow-xs font-medium min-h-[46px] sm:min-h-[48px]";

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

        {/* MAIN SPLIT AUTH CONTAINER */}
        <main className="relative z-10 w-full max-w-5xl mx-auto px-4 my-auto py-6 sm:py-10 flex flex-col items-center justify-center animate-card-entrance">
          <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-fit">
            
            {/* LEFT COLUMN: HERO PHOTO BANNER WITH MAROON OVERLAY */}
            <div className="md:col-span-5 lg:col-span-5 relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 min-h-[220px] md:min-h-[580px]">
              {/* Background Photo */}
              <img 
                src="/tricycle-bg.jpg" 
                alt="Gasan Tricycle" 
                className="absolute inset-0 w-full h-full object-cover object-center" 
              />
              {/* Velvet Maroon Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#4A0A10]/95 via-[#801820]/80 to-[#70141B]/85" />
              <div className="absolute inset-0 bg-[#801820]/40 mix-blend-multiply" />

              {/* Top: Back Button */}
              <div className="relative z-10">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#801820]/90 hover:bg-[#9E2A2B] text-white border border-[#D4AF37] text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all w-fit cursor-pointer"
                >
                  <ArrowLeft size={14} className="text-[#D4AF37]" />
                  <span>Back</span>
                </Link>
              </div>

              {/* Bottom: Municipal Badge + Brand Title & Subtitle */}
              <div className="relative z-10 mt-auto pt-8">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#D4AF37] text-[#D4AF37] bg-black/25 text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-xs">
                  <span>MUNICIPALITY OF GASAN</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-2">
                  G-TRAMS
                </h1>
                <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-sm">
                  Gasan Tricycle Records &amp; Application Management System
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: CLEAN FORM PANEL */}
            <div className="md:col-span-7 lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-black text-[#801820] tracking-tight">
                  {step === 1 ? 'Create Account' : 'Verify Contact'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {step === 1 ? 'Fill in your details below to register your operator account.' : `Enter the 6-digit OTP sent to ${formData.contact}`}
                </p>
              </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
                <p>{error}</p>
                {error.includes('ALREADY EXISTS') && (
                  <Link to="/login" className="inline-block mt-1 font-black text-[#9E2A2B] underline tracking-wider">
                    CLICK HERE TO LOG IN →
                  </Link>
                )}
              </div>
            )}
            {success && (
              <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
                {success}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSubmitRegisterForm} className="space-y-2">
                <div className="animate-item-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">FULL NAME</label>
                  <input type="text" name="name" maxLength="50" value={formData.name} onChange={handleChange} required className={inputClasses} placeholder="Juan D. Cruz" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 animate-item-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">BARANGAY</label>
                    <select name="address" value={formData.address} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                      <option value="" disabled>Select Brgy</option>
                      {GASAN_BARANGAYS.map((brgy) => <option key={brgy} value={brgy}>{brgy}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">TODA ASSOCIATION</label>
                    <select name="todaAssociation" value={formData.todaAssociation} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                      <option value="" disabled>Select Accredited TODA</option>
                      {TODA_LIST.filter(toda => toda !== 'NON-TODA').map((toda) => <option key={toda} value={toda}>{toda}</option>)}
                    </select>
                  </div>
                </div>

                <div className="animate-item-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">EMAIL OR PHONE NUMBER</label>
                  <input type="text" name="contact" maxLength="50" value={formData.contact} onChange={handleChange} required className={inputClasses} placeholder="juan@gmail.com or 09123456789" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-item-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">PASSWORD</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className={`${inputClasses} pr-8`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-[#9E2A2B]">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">CONFIRM</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={`${inputClasses} pr-8`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-[#9E2A2B]">
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* PASSWORD QUALIFICATIONS CHECKLIST */}
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 text-left animate-item-3 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      PASSWORD QUALIFICATIONS
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isPasswordQualified ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isPasswordQualified ? '✓ ALL MET' : `${passwordRules.filter(r => r.met).length}/5 MET`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                    {passwordRules.map((rule) => {
                      const isMet = rule.met;
                      return (
                        <div
                          key={rule.id}
                          className={`flex items-center gap-1.5 text-[10.5px] leading-tight transition-colors duration-200 ${
                            isMet ? 'text-emerald-600 font-bold' : 'text-red-500 font-semibold'
                          }`}
                        >
                          {isMet ? (
                            <Check size={12} className="shrink-0 stroke-[3] text-emerald-600" />
                          ) : (
                            <X size={12} className="shrink-0 stroke-[2.5] text-red-500" />
                          )}
                          <span>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-start gap-1.5 pt-0.5 animate-item-4">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={termsAccepted} 
                    onChange={() => setTermsAccepted(!termsAccepted)} 
                    className="mt-0.5 accent-[#9E2A2B] w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 leading-tight cursor-pointer font-medium uppercase tracking-tight">
                    I ACCEPT THE <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-bold text-[#9E2A2B] hover:underline">TERMS & PRIVACY POLICY</button>.
                  </label>
                </div>
                
                <div className="animate-item-4 pt-1">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`relative overflow-hidden group w-full flex items-center justify-center gap-2 text-white py-2 rounded-xl text-xs font-black shadow-md transition-all uppercase tracking-wider cursor-pointer ${
                      isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#9E2A2B] via-[#8E2028] to-[#7A1B22] shadow-[#9E2A2B]/25 hover:shadow-[#9E2A2B]/50 hover:brightness-110 active:scale-[0.98]'
                    }`}
                  >
                    <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        SENDING CODE...
                      </>
                    ) : (
                      <>
                        <UserPlus size={15} /> CONTINUE TO VERIFICATION
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <>
                {/* DIVIDER */}
                <div className="flex items-center gap-3 my-2 animate-item-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* GOOGLE SIGN UP BUTTON */}
                <div className="animate-item-4">
                  <GoogleAuthButton 
                    text="CONTINUE WITH GOOGLE"
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
                    onError={(msg) => setError(typeof msg === 'string' ? msg : msg.message || 'Google Auth Error')}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-2.5 animate-item-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">
                    ENTER 6-DIGIT CODE
                  </label>
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
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-2 rounded-xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {isLoading ? 'VERIFYING...' : 'VERIFY AND REGISTER'}
                </button>
                <div className="flex items-center justify-between pt-1">
                  <button 
                    type="button" 
                    onClick={handleResendOTP} 
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-xs font-bold text-[#9E2A2B] hover:underline disabled:opacity-50 disabled:no-underline uppercase tracking-wider cursor-pointer"
                  >
                    {resendCooldown > 0 ? `RESEND IN ${resendCooldown}S` : 'RESEND CODE'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-xs font-bold text-slate-500 hover:text-[#9E2A2B] transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    ← CHANGE INFO
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-center animate-item-4">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  ALREADY HAVE AN ACCOUNT? <Link to="/login" className="font-black text-[#9E2A2B] hover:underline">LOG IN HERE &gt;</Link>
                </p>
              </div>
            )}
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

      {/* Terms & Privacy Policy Modal */}
      <TermsPolicyModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAccepted(true)}
        defaultLang="en"
      />

      {/* SHARED FULL-WIDTH FOOTER */}
      <AuthFooter />

    </div>
  );
};

export default Register;
