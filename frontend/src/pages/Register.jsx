import React, { useState, useEffect } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../utils/constants';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, X, Loader2, CheckCircle2 } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import TermsPolicyModal from '../components/common/TermsPolicyModal';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';





const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingGoogle = location.state?.googleProfile;

  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: incomingGoogle?.name || '', 
    address: '', 
    contact: incomingGoogle?.email || '', 
    password: '', 
    confirmPassword: '', 
    todaAssociation: 'NON-TODA'
  });
  const [otpCode, setOtpCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsLang, setTermsLang] = useState('en');

  // Google Sign-In state
  const [googleProfileData, setGoogleProfileData] = useState(incomingGoogle || null);
  const [showGoogleToast, setShowGoogleToast] = useState(false);
  const [showGoogleWelcome, setShowGoogleWelcome] = useState(!!location.state?.fromGoogleLogin);

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

  useEffect(() => {
    if (incomingGoogle) {
      setGoogleProfileData(incomingGoogle);
      setFormData(prev => ({
        ...prev,
        name: incomingGoogle.name || prev.name,
        contact: incomingGoogle.email || prev.contact
      }));
      setShowGoogleToast(true);
      const timer = setTimeout(() => {
        setShowGoogleToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [incomingGoogle]);

  const isValidContact = (value) => {
    const trimmed = value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(09|\+639)\d{9}$/;
    return emailRegex.test(trimmed) || phoneRegex.test(trimmed.replace(/[\s-]/g, ''));
  };

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    setPasswordStrength(strength);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') checkPasswordStrength(value);
    if (error) setError('');
  };

  const handleSubmitRegisterForm = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // If registering via Google: No OTP required, instant registration and login!
    if (googleProfileData) {
      if (!formData.name || !formData.name.trim()) {
        return setError('PLEASE ENTER YOUR FULL LEGAL NAME.');
      }
      if (!formData.address) {
        return setError('PLEASE SELECT YOUR BARANGAY IN GASAN.');
      }
      if (!formData.contact || !isValidContact(formData.contact)) {
        return setError('PLEASE ENTER A VALID EMAIL OR PHONE NUMBER.');
      }
      if (!termsAccepted) {
        return setError('PLEASE ACCEPT THE TERMS AND PRIVACY POLICY.');
      }

      setIsLoading(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            googleProfile: googleProfileData,
            onboardingData: {
              fullName: formData.name.trim(),
              address: formData.address.trim(),
              contact: formData.contact.trim(),
              todaAssociation: formData.todaAssociation || 'NON-TODA',
              password: formData.password || ''
            }
          })
        });

        const data = await response.json();
        if (response.ok && data.token) {
          setSuccess('REGISTRATION SUCCESSFUL! LOGGING IN...');
          handleGoogleSuccess(data);
        } else {
          setError(data.message || 'REGISTRATION FAILED.');
        }
      } catch (err) {
        setError('CANNOT CONNECT TO THE SERVER.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Standard non-Google registration with OTP:
    handleRequestOTP(e);
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Validate contact format
    if (!isValidContact(formData.contact)) {
      return setError('PLEASE ENTER A VALID EMAIL OR PHONE NUMBER.');
    }

    if (passwordStrength < 3) {
      return setError('PASSWORD TOO WEAK. INCLUDE AT LEAST 8 CHARS, 1 UPPERCASE, 1 NUMBER, AND 1 SYMBOL.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('PASSWORDS DO NOT MATCH!');
    }

    if (!termsAccepted) {
      return setError('PLEASE ACCEPT THE TERMS AND PRIVACY POLICY.');
    }

    setIsLoading(true);
    const slowTimer = setTimeout(() => setError('YOUR NETWORK SEEMS SLOW. PLEASE WAIT...'), 8000);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      clearTimeout(slowTimer);
      const data = await response.json();
      if (response.ok) { 
        setSuccess('OTP CODE SENT SUCCESSFULLY!'); 
        setStep(2); 
      } else { 
        setError(data.message || 'REGISTRATION FAILED.'); 
      }
    } catch (err) { 
      setError('CANNOT CONNECT TO THE SERVER.'); 
    } finally { 
      clearTimeout(slowTimer);
      setIsLoading(false); 
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: formData.contact, otp: otpCode }),
      });
      if (response.ok) {
        setSuccess('ACCOUNT VERIFIED! REDIRECTING...');
        setTimeout(() => { navigate('/login'); }, 1800);
      } else {
        const data = await response.json();
        setError(data.message || 'INVALID OTP CODE.');
      }
    } catch (err) { 
      setError('CANNOT CONNECT TO THE SERVER.'); 
    }
  };

  const handleGoogleSuccess = (data) => {
    const rawRole = data.role || data.user?.role || '';
    const normalizedRole = String(rawRole).toLowerCase().trim().replace(/_/g, ' ');

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', normalizedRole);

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

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm font-medium";

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return { label: 'Empty', color: 'text-slate-400', bar: 'w-0 bg-slate-200' };
    if (passwordStrength === 1) return { label: 'Weak', color: 'text-red-500', bar: 'w-1/4 bg-red-500' };
    if (passwordStrength === 2) return { label: 'Fair', color: 'text-amber-500', bar: 'w-2/4 bg-amber-500' };
    if (passwordStrength === 3) return { label: 'Good', color: 'text-blue-500', bar: 'w-3/4 bg-blue-500' };
    return { label: 'Strong', color: 'text-emerald-500', bar: 'w-full bg-emerald-500' };
  };

  return (
    <div className="relative w-full bg-[#120204] flex flex-col overflow-x-hidden select-none">
      
      {/* Centered Floating Auto-Dismiss Toast for Google Account */}
      {showGoogleToast && googleProfileData && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-[92%] sm:w-auto px-4 py-2 rounded-2xl bg-slate-900/95 text-white border border-emerald-500/40 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-spring-in">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold truncate">
              Connected with Google: <strong className="text-emerald-300">{googleProfileData.email}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowGoogleToast(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

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

      <div className="relative min-h-[100dvh] md:min-h-[112vh] flex flex-col justify-between">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* CENTERED AUTH CARD */}
        <main className="relative z-10 w-full max-w-[400px] sm:max-w-[440px] mx-auto px-4 my-auto py-4 sm:py-6 flex flex-col items-center justify-center min-h-fit animate-card-entrance">
          <div className="w-full bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/50 p-4 sm:p-6 min-h-fit">
            {showGoogleWelcome ? (
              <div className="flex flex-col items-center justify-center text-center py-4 space-y-4 animate-in zoom-in-95">
                {googleProfileData?.picture && (
                  <img src={googleProfileData.picture} alt="Profile" className="w-16 h-16 rounded-full shadow-md mx-auto" />
                )}
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Welcome, {googleProfileData?.name}!</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  You're almost there! To complete your registration via Google, we just need a few more details about your TODA and Barangay.
                </p>
                <button type="button" onClick={() => setShowGoogleWelcome(false)} className="w-full bg-[#7A1B22] text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md mt-2 hover:bg-[#5a1419] transition-colors">
                  Proceed to Fill Form
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center mb-2.5 text-center">
              <div className="w-10 h-10 bg-white border-2 border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.45)] rounded-full flex items-center justify-center p-0.5 mx-auto mb-1.5 ring-4 ring-[#D4AF37]/30 overflow-hidden shrink-0 animate-logo-entrance">
                <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wider uppercase animate-item-1">
                {step === 1 ? 'REGISTER ACCOUNT' : 'VERIFY CONTACT'}
              </h2>
              <p className="text-[9px] sm:text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-widest animate-item-1">
                {step === 1 ? 'CREATE AN OPERATOR OR TODA ACCOUNT' : `CODE SENT TO ${formData.contact}`}
              </p>
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
                <p>{error}</p>
                {error.includes('ALREADY EXISTS') && (
                  <Link to="/login" className="inline-block mt-1 font-black text-[#7A1B22] underline tracking-wider">
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
                      {TODA_LIST.map((toda) => <option key={toda} value={toda}>{toda}</option>)}
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
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required={!googleProfileData} className={`${inputClasses} pr-8`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">CONFIRM</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required={!googleProfileData} className={`${inputClasses} pr-8`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* VISUAL PASSWORD STRENGTH METER */}
                {formData.password && (
                  <div className="space-y-0.5 pt-0 animate-item-3">
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="text-slate-500 uppercase">Strength:</span>
                      <span className={getStrengthLabel().color}>{getStrengthLabel().label}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${getStrengthLabel().bar}`} />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-1.5 pt-0.5 animate-item-4">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={termsAccepted} 
                    onChange={() => setTermsAccepted(!termsAccepted)} 
                    className="mt-0.5 accent-[#7A1B22] w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 leading-tight cursor-pointer font-medium uppercase tracking-tight">
                    I ACCEPT THE <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-bold text-[#7A1B22] hover:underline">TERMS & PRIVACY POLICY</button>.
                  </label>
                </div>
                
                <div className="animate-item-4 pt-1">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`relative overflow-hidden group w-full flex items-center justify-center gap-2 text-white py-2 rounded-xl text-xs font-black shadow-md transition-all uppercase tracking-wider cursor-pointer ${
                      isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] shadow-[#7A1B22]/25 hover:shadow-[#7A1B22]/50 hover:brightness-110 active:scale-[0.98]'
                    }`}
                  >
                    <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        {googleProfileData ? 'COMPLETING REGISTRATION...' : 'SENDING CODE...'}
                      </>
                    ) : googleProfileData ? (
                      <>
                        <CheckCircle2 size={15} /> COMPLETE REGISTRATION
                      </>
                    ) : (
                      <>
                        <UserPlus size={15} /> CONTINUE TO VERIFICATION
                      </>
                    )}
                  </button>

                  {googleProfileData && (
                    <div className="text-center pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleProfileData(null);
                          setFormData({
                            name: '',
                            address: '',
                            contact: '',
                            password: '',
                            confirmPassword: '',
                            todaAssociation: 'NON-TODA'
                          });
                          setError('');
                          setShowGoogleToast(false);
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancel Google Sign-in & Register Manually
                      </button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {step === 1 && (
              <>
                {/* DIVIDER */}
                <div className="flex items-center gap-3 my-2 animate-item-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* GOOGLE SIGN UP BUTTON */}
                <div className="animate-item-4">
                  <GoogleAuthButton 
                    text="Continue with Google"
                    onSuccess={handleGoogleSuccess}
                    onNewUser={(data) => {
                      if (data?.token) {
                        handleGoogleSuccess(data);
                      } else {
                        setGoogleProfileData(data);
                        setFormData(prev => ({
                          ...prev,
                          name: prev.name || data?.name || '',
                          contact: data?.email || prev.contact
                        }));
                        setShowGoogleToast(true);
                        setTimeout(() => setShowGoogleToast(false), 4000);
                      }
                    }}
                    onError={(msg) => setError(msg)}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-xl font-black text-slate-900 tracking-[0.3em] outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 shadow-inner" 
                    placeholder="000000" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-2 rounded-xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all uppercase tracking-wider"
                >
                  <CheckCircle2 size={15} /> VERIFY AND REGISTER
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#7A1B22] transition-colors uppercase tracking-wider"
                >
                  ← CHANGE CONTACT INFO
                </button>
              </form>
            )}

            {step === 1 && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-center animate-item-4">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  ALREADY HAVE AN ACCOUNT? <Link to="/login" className="font-black text-[#7A1B22] hover:underline">LOG IN HERE</Link>
                </p>
              </div>
            )}

              </>
            )}
          </div>
        </main>
      </div>

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
