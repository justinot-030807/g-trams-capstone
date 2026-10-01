import React, { useState, useEffect } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../utils/constants';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  Check, 
  X, 
  ArrowLeft, 
  User, 
  Lock, 
  MapPin, 
  Building2, 
  Mail, 
  AlertCircle,
  ChevronDown
} from 'lucide-react';
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
    todaAssociation: '',
    role: 'operator'
  });
  const [otpCode, setOtpCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
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
    setHasAttemptedSubmit(true);
    setError(''); setSuccess('');

    if (!formData.name || formData.name.trim().length < 2) {
      return setError('PLEASE ENTER YOUR FULL LEGAL NAME (AT LEAST 2 CHARACTERS).');
    }

    if (!formData.address) {
      return setError('PLEASE SELECT YOUR BARANGAY IN GASAN.');
    }

    if (!formData.todaAssociation || formData.todaAssociation === '' || formData.todaAssociation === 'NON-TODA') {
      return setError('ACCORDING TO MUNICIPAL ORDINANCE, OPERATORS MUST SELECT AN ACCREDITED TODA.');
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

  const inputClasses = "w-full pl-10 pr-3.5 h-[46px] sm:h-[48px] rounded-xl border border-slate-400 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-0 transition-all font-medium";

  return (
    <div className="relative w-full bg-white flex flex-col overflow-x-hidden min-h-screen">
      
      {/* Zero-Lag Lightweight Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[420px] h-[420px] opacity-[0.035] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>
      </div>

      <div className="relative flex flex-col flex-1 min-h-screen">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* MAIN FULL-WIDTH SPLIT LAYOUT */}
        <main className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 min-h-0 bg-white">
          
          {/* LEFT COLUMN: HERO PHOTO BANNER WITH LIGHTENED MAROON OVERLAY */}
          <div className="md:col-span-5 lg:col-span-5 relative overflow-hidden flex flex-col justify-end p-4 sm:p-6 md:p-10 lg:p-12 h-24 sm:h-28 md:h-auto md:min-h-full md:self-stretch bg-[#3D080D]">
            {/* Background Photo (Tricycle 2 for Register) */}
            <img 
              src="/tricycle-register.jpg" 
              alt="Gasan Tricycle" 
              className="absolute inset-0 w-full h-full object-cover object-center" 
            />
            {/* Velvet Maroon Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A0408]/90 via-[#5E0D14]/70 to-[#3D080D]/75" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Bottom: Tagline */}
            <div className="relative z-10 pb-1 sm:pb-2 md:pb-4">
              <p className="text-xs sm:text-sm md:text-base text-white font-semibold leading-snug max-w-sm drop-shadow-xs">
                Gasan Tricycle Records &amp; Application Management System
              </p>
              <p className="hidden md:block text-xs text-amber-200/90 font-medium mt-1">
                Official Tricycle Franchising &amp; Regulatory Portal
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: CLEAN FORM PANEL (No card) */}
          <div className="md:col-span-7 lg:col-span-7 flex flex-col items-center justify-start px-4 sm:px-8 md:px-14 lg:px-20 pt-3 sm:pt-6 md:pt-10 pb-4 sm:pb-8 bg-white min-h-full">
            <div className="w-full max-w-xl">
              <div className="mb-4 sm:mb-5">
                <h1 className="text-2xl sm:text-3xl font-black text-[#801820] tracking-tight leading-tight">
                  {step === 1 ? 'Register' : 'Verify contact'}
                </h1>
                <div className="w-10 h-1 bg-[#F0B429] rounded-full mt-2" />
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                  {step === 1 ? 'Create your operator account to apply online.' : `Enter the 6-digit OTP sent to ${formData.contact}`}
                </p>
              </div>

              {error && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-3 text-center shadow-xs tracking-wide">
                  <p>{error}</p>
                  {error.includes('ALREADY EXISTS') && (
                    <Link to="/login" className="inline-block mt-1 font-black text-[#801820] underline tracking-wider">
                      Click here to log in →
                    </Link>
                  )}
                </div>
              )}
              {success && (
                <div className="mb-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl p-3 text-center shadow-xs tracking-wide">
                  {success}
                </div>
              )}

              {/* STEP 1: REGISTRATION FORM */}
              {step === 1 && (
                <>
                  {/* GOOGLE SIGN UP AT TOP */}
                  <div className="mb-3">
                    <GoogleAuthButton 
                      text="Continue with Google"
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
                    <div className="flex items-center gap-3 my-2.5 sm:my-3">
                      <div className="flex-1 h-px bg-slate-300" />
                      <span className="text-xs font-semibold text-slate-600">Or register with email/phone</span>
                      <div className="flex-1 h-px bg-slate-300" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmitRegisterForm} className="space-y-2.5 sm:space-y-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User size={18} />
                        </div>
                        <input 
                          type="text" 
                          name="name" 
                          maxLength="50" 
                          value={formData.name} 
                          onChange={handleChange} 
                          autoComplete="name" 
                          required 
                          className={inputClasses} 
                          placeholder="Juan D. Cruz" 
                        />
                      </div>
                    </div>
                    
                    {/* Barangay & TODA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Barangay</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                            <MapPin size={18} />
                          </div>
                          <select 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            required 
                            className={`w-full pl-10 pr-9 h-[46px] sm:h-[48px] rounded-xl border border-slate-400 bg-white text-base sm:text-sm outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-0 transition-all font-medium appearance-none cursor-pointer ${
                              !formData.address ? 'text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            <option value="" disabled className="text-slate-500">Select Barangay</option>
                            {GASAN_BARANGAYS.map((brgy) => (
                              <option key={brgy} value={brgy} className="text-slate-900">
                                {brgy}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">TODA</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                            <Building2 size={18} />
                          </div>
                          <select 
                            name="todaAssociation" 
                            value={formData.todaAssociation} 
                            onChange={handleChange} 
                            required 
                            className={`w-full pl-10 pr-9 h-[46px] sm:h-[48px] rounded-xl border border-slate-400 bg-white text-base sm:text-sm outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-0 transition-all font-medium appearance-none cursor-pointer ${
                              !formData.todaAssociation ? 'text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            <option value="" disabled className="text-slate-500">Select TODA</option>
                            {TODA_LIST.filter(toda => toda !== 'NON-TODA').map((toda) => (
                              <option key={toda} value={toda} className="text-slate-900">
                                {toda}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email or Phone Number */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 normal-case mb-2">Email or phone number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail size={18} />
                        </div>
                        <input 
                          type="text" 
                          name="contact" 
                          maxLength="50" 
                          value={formData.contact} 
                          onChange={handleChange} 
                          autoComplete="username"
                          inputMode="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck="false"
                          required 
                          className={inputClasses} 
                          placeholder="juan@gmail.com or 09123456789" 
                        />
                      </div>
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 normal-case mb-2">Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock size={18} />
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => {
                              setIsPasswordFocused(false);
                              setPasswordBlurred(true);
                            }}
                            autoComplete="new-password"
                            required 
                            className={`${inputClasses} pr-10`} 
                            placeholder="Enter password" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#801820] cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {/* MOBILE ONLY: Directly below Password field (Only shows when typing) */}
                        <div className="block sm:hidden mt-2">
                          {Boolean(formData.password && formData.password.length > 0) && (
                            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-left space-y-2 shadow-xs transition-all animate-in fade-in slide-in-from-top-1 duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">
                                  Password Qualifications
                                </span>
                                <span className={`text-[11px] font-bold ${isPasswordQualified ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {isPasswordQualified ? '✓ All Met' : `${passwordRules.filter(r => r.met).length}/5 Met`}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-y-1.5">
                                {passwordRules.map((rule) => {
                                  const isMet = rule.met;
                                  const showRed = hasAttemptedSubmit || (passwordBlurred && formData.password);
                                  return (
                                    <div
                                      key={rule.id}
                                      className={`flex items-center gap-1.5 text-xs leading-tight transition-colors duration-200 ${
                                        isMet ? 'text-emerald-600 font-bold' : showRed ? 'text-red-500 font-semibold' : 'text-slate-500 font-medium'
                                      }`}
                                    >
                                      {isMet ? (
                                        <Check size={13} className="shrink-0 stroke-[3] text-emerald-600" />
                                      ) : showRed ? (
                                        <X size={13} className="shrink-0 stroke-[2.5] text-red-500" />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mx-1" />
                                      )}
                                      <span>{rule.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 normal-case mb-2">Confirm password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock size={18} />
                          </div>
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            name="confirmPassword" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            autoComplete="new-password"
                            required 
                            className={`${inputClasses} pr-10`} 
                            placeholder="Re-enter password" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#801820] cursor-pointer"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {/* Password Mismatch Notice (Task 12) */}
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1.5">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>Hindi magkapareho ang password.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DESKTOP ONLY: Full-width below the two-column row (Only shows when typing) */}
                    {Boolean(formData.password && formData.password.length > 0) && (
                      <div className="hidden sm:block">
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-left space-y-2 shadow-xs transition-all animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                              Password Qualifications
                            </span>
                            <span className={`text-[11px] font-bold ${isPasswordQualified ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {isPasswordQualified ? '✓ All Met' : `${passwordRules.filter(r => r.met).length}/5 Met`}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5">
                            {passwordRules.map((rule) => {
                              const isMet = rule.met;
                              const showRed = hasAttemptedSubmit || (passwordBlurred && formData.password);
                              return (
                                <div
                                  key={rule.id}
                                  className={`flex items-center gap-1.5 text-xs sm:text-[13px] leading-tight transition-colors duration-200 ${
                                    isMet ? 'text-emerald-600 font-bold' : showRed ? 'text-red-500 font-semibold' : 'text-slate-500 font-medium'
                                  }`}
                                >
                                  {isMet ? (
                                    <Check size={13} className="shrink-0 stroke-[3] text-emerald-600" />
                                  ) : showRed ? (
                                    <X size={13} className="shrink-0 stroke-[2.5] text-red-500" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mx-1" />
                                  )}
                                  <span>{rule.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Terms Checkbox (Task 13: 24px checkbox, 44px min row, isolated modal click) */}
                    <div className="flex items-center gap-3 min-h-[44px] pt-1">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        checked={termsAccepted} 
                        onChange={() => setTermsAccepted(!termsAccepted)} 
                        className="w-6 h-6 rounded-md accent-[#801820] cursor-pointer shrink-0"
                      />
                      <label htmlFor="terms" className="text-sm text-slate-600 leading-snug cursor-pointer font-medium select-none">
                        I accept the{' '}
                        <button 
                          type="button" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setShowTermsModal(true); 
                          }} 
                          className="font-bold text-[#801820] hover:underline focus:outline-none"
                        >
                          Terms &amp; Privacy Policy
                        </button>.
                      </label>
                    </div>
                    
                    {/* Submit CTA */}
                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-[#801820] hover:bg-[#9E2A2B] text-white py-3 rounded-xl text-base font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[46px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />
                            <span>Sending code...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} /> Continue to Verification
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* BOTTOM LINKS */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-600 font-medium">
                      Already have an account?{' '}
                      <Link to="/login" className="font-bold text-[#801820] hover:underline">
                        Log In
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 normal-case mb-2 text-center">
                      Enter 6-digit code
                    </label>
                    <input 
                      type="text" 
                      maxLength="6" 
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value)} 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-center text-2xl font-black text-slate-900 tracking-[0.3em] outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-0 shadow-inner" 
                      placeholder="000000" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[#801820] hover:bg-[#9E2A2B] text-white py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[46px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Verify and Register</span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      type="button" 
                      onClick={handleResendOTP} 
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-xs font-bold text-[#801820] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-xs font-bold text-slate-500 hover:text-[#801820] transition-colors cursor-pointer"
                    >
                      ← Change Info
                    </button>
                  </div>
                </form>
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
