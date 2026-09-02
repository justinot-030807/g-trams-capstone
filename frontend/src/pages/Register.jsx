import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Globe, X, Loader2, CheckCircle2, Sparkles, FileText, ShieldCheck, Clock, Phone, AlertCircle } from 'lucide-react';

const gasanBarangays = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", "Pinggan", "Tabionan", "Tapuyan", "Tiguion", "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

const TODA_LIST = [
  "NON-TODA", "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", "BANGBANG IPIL TODA", "TAB TODA", "LUG TODA", "MASIGA TODA", "4B TODA", "CT TODA", "TG TODA", "GC TODA", "MA TODA", "PG TODA", "MAT TODA", "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", "TC TODA", "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", "ILAYA TODA", "GTF TODA"
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', address: '', contact: '', password: '', confirmPassword: '', todaAssociation: 'NON-TODA'
  });
  const [otpCode, setOtpCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsLang, setTermsLang] = useState('en');

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

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Input Format Validation
    if (!isValidContact(formData.contact)) {
      return setError('PLEASE ENTER A VALID PH MOBILE (09XXXXXXXXX) OR EMAIL ADDRESS.');
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

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
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

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm font-medium";

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return { label: 'Empty', color: 'text-slate-400', bar: 'w-0 bg-slate-200' };
    if (passwordStrength === 1) return { label: 'Weak', color: 'text-red-500', bar: 'w-1/4 bg-red-500' };
    if (passwordStrength === 2) return { label: 'Fair', color: 'text-amber-500', bar: 'w-2/4 bg-amber-500' };
    if (passwordStrength === 3) return { label: 'Good', color: 'text-blue-500', bar: 'w-3/4 bg-blue-500' };
    return { label: 'Strong', color: 'text-emerald-500', bar: 'w-full bg-emerald-500' };
  };

  return (
    <div className="relative min-h-screen w-full bg-[#120204] flex flex-col justify-between items-center px-4 py-6 sm:px-8 sm:py-8 lg:px-12 overflow-x-hidden select-none">
      
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
          0% { opacity: 0; transform: scale(0.95) translateY(18px); }
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

      {/* MAIN SPLIT-SCREEN CONTAINER */}
      <div className="w-full max-w-6xl my-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
        
        {/* LEFT HERO SECTION (Desktop Highlight Showcase) */}
        <div className="hidden lg:flex flex-col flex-1 text-left max-w-xl animate-item-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl border-2 border-[#D4AF37] shrink-0">
              <img src="/gasan-logo.png" alt="Gasan Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">G-TRAMS</h1>
              <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mt-1.5">Municipality of Gasan • Province of Marinduque</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white/95 tracking-tight leading-snug">
            Operator & TODA Account Registration
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-2.5 leading-relaxed">
            Create your official G-TRAMS account to access digital franchise applications, renewal requests, real-time tracking, and downloadable claim stubs.
          </p>

          {/* 2 FEATURE CARDS */}
          <div className="grid grid-cols-1 gap-3 mt-6">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-sm hover:bg-white/15 transition-colors">
              <div className="p-2.5 rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-white/10 shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Digital Document Processing</h3>
                <p className="text-[11px] text-white/70 leading-tight mt-0.5">Upload OR/CR, valid IDs, and required municipal certificates directly online.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-sm hover:bg-white/15 transition-colors">
              <div className="p-2.5 rounded-xl bg-[#7A1B22]/80 text-[#D4AF37] border border-white/10 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Verified TODA Affiliation</h3>
                <p className="text-[11px] text-white/70 leading-tight mt-0.5">Securely linked to your recognized TODA association and registered Barangay for official compliance.</p>
              </div>
            </div>
          </div>

          {/* LGU HELPDESK FOOTER BADGE */}
          <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-white/10 text-white/60 text-xs">
            <Phone size={14} className="text-[#D4AF37]" />
            <span>Need Assistance? Contact BPLO: <strong className="text-white">(042) 342-1234</strong> • <strong className="text-white">bplo@gasan.gov.ph</strong></span>
          </div>
        </div>

        {/* RIGHT CARD CONTAINER */}
        <div className="w-full max-w-[370px] sm:max-w-[420px] shrink-0 animate-card-entrance">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] border border-white/50 p-5 sm:p-7">
            
            <div className="flex flex-col items-center mb-4 text-center">
              <div className="w-14 h-14 bg-white border-2 border-[#D4AF37] shadow-md rounded-full flex items-center justify-center p-0.5 mx-auto mb-2 ring-4 ring-[#D4AF37]/25 overflow-hidden shrink-0 animate-logo-entrance">
                <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-wider uppercase animate-item-1">
                {step === 1 ? 'REGISTER ACCOUNT' : 'VERIFY CONTACT'}
              </h2>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-widest animate-item-1">
                {step === 1 ? 'CREATE AN OPERATOR OR TODA ACCOUNT' : `CODE SENT TO ${formData.contact}`}
              </p>
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
                <p>{error}</p>
                {error.includes('ALREADY EXISTS') && (
                  <Link to="/login" className="inline-block mt-1 font-black text-[#7A1B22] underline tracking-wider">
                    CLICK HERE TO LOG IN →
                  </Link>
                )}
              </div>
            )}
            {success && (
              <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl p-2.5 text-center shadow-sm uppercase tracking-wide">
                {success}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-2.5">
                <div className="animate-item-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">FULL NAME</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClasses} placeholder="Juan D. Cruz" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 animate-item-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">BARANGAY</label>
                    <select name="address" value={formData.address} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                      <option value="" disabled>Select Brgy</option>
                      {gasanBarangays.map((brgy) => <option key={brgy} value={brgy}>{brgy}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">TODA ASSOCIATION</label>
                    <select name="todaAssociation" value={formData.todaAssociation} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                      {TODA_LIST.map((toda) => <option key={toda} value={toda}>{toda}</option>)}
                    </select>
                  </div>
                </div>

                <div className="animate-item-3">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">EMAIL OR PHONE NUMBER</label>
                  <input type="text" name="contact" value={formData.contact} onChange={handleChange} required className={inputClasses} placeholder="juan@gmail.com or 09123456789" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-item-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">PASSWORD</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className={`${inputClasses} pr-8`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">CONFIRM</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={`${inputClasses} pr-8`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* VISUAL PASSWORD STRENGTH METER */}
                {formData.password && (
                  <div className="space-y-1 pt-0.5 animate-item-3">
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="text-slate-500 uppercase">Strength:</span>
                      <span className={getStrengthLabel().color}>{getStrengthLabel().label}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${getStrengthLabel().bar}`} />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-1.5 pt-1 animate-item-4">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={termsAccepted} 
                    onChange={() => setTermsAccepted(!termsAccepted)} 
                    className="mt-0.5 accent-[#7A1B22] w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[10px] text-slate-600 leading-tight cursor-pointer font-medium uppercase tracking-tight">
                    I ACCEPT THE <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-bold text-[#7A1B22] hover:underline">TERMS & PRIVACY POLICY</button>.
                  </label>
                </div>
                
                <div className="animate-item-4 pt-1.5">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-xs font-black shadow-md transition-all uppercase tracking-wider ${
                      isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] shadow-[#7A1B22]/25 hover:brightness-110 active:scale-[0.98]'
                    }`}
                  >
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

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-3 animate-item-2">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-center text-xl font-black text-slate-900 tracking-[0.3em] outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 shadow-inner" 
                    placeholder="000000" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-2.5 rounded-xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all uppercase tracking-wider"
                >
                  <CheckCircle2 size={15} /> VERIFY AND REGISTER
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-[#7A1B22] transition-colors uppercase tracking-wider"
                >
                  ← CHANGE CONTACT INFO
                </button>
              </form>
            )}

            {step === 1 && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 text-center animate-item-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  ALREADY HAVE AN ACCOUNT? <Link to="/login" className="font-black text-[#7A1B22] hover:underline">LOG IN HERE</Link>
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white/20">
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-xs text-slate-900 tracking-wider uppercase">
                {termsLang === 'en' ? 'TERMS & PRIVACY POLICY' : 'MGA TUNTUNIN AT PATAKARAN'}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTermsLang(termsLang === 'en' ? 'tl' : 'en')}
                  className="flex items-center gap-1 text-[9px] font-bold text-[#7A1B22] bg-[#7A1B22]/10 px-2 py-0.5 rounded-md uppercase"
                >
                  <Globe size={11} /> {termsLang === 'en' ? 'Tagalog' : 'English'}
                </button>
                <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-red-500 p-0.5"><X size={16} /></button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto text-xs text-slate-600 space-y-2.5 leading-relaxed font-medium">
              {termsLang === 'en' ? (
                <>
                  <p><strong>1. Data Collection:</strong> By using G-TRAMS, you consent to the storage and validation of your operator credentials by the Local Government Unit of Gasan.</p>
                  <p><strong>2. Data Privacy Act of 2012:</strong> Protected under RA 10173. Data will strictly be used for transport regulation.</p>
                  <p><strong>3. Accuracy:</strong> Submitting falsified information may result in franchise revocation.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Pagkolekta ng Datos:</strong> Sumasang-ayon ka sa pagproseso ng iyong impormasyon ng Lokal na Pamahalaan ng Gasan.</p>
                  <p><strong>2. Data Privacy Act of 2012:</strong> Protektado sa ilalim ng RA 10173 para sa opisyal na talaan ng munisipyo.</p>
                  <p><strong>3. Katumpakan:</strong> Ang pekeng dokumento ay dahilan ng agarang pagbawi ng prangkisa.</p>
                </>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} 
                className="bg-[#7A1B22] text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider"
              >
                {termsLang === 'en' ? 'ACCEPT' : 'TANGGAPIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 mt-6 text-center text-white/70 text-[9px] sm:text-[10px] space-y-0.5 pb-2 animate-item-4 uppercase tracking-wider font-semibold">
        <p>G-TRAMS — GASAN TRICYCLE RECORDS & APPLICATION MANAGEMENT SYSTEM</p>
        <p className="text-white/40 text-[8px] sm:text-[9px] normal-case font-normal">
          © 2026 Municipality of Gasan, Marinduque. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default Register;