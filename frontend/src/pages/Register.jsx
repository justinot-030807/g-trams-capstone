import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Globe, X, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (passwordStrength < 3) return setError('Your password is too weak. Please include symbols, numbers, and uppercase letters.');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match!');
    if (!termsAccepted) return setError('You must accept the Terms and Conditions to proceed.');

    setIsLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) { 
        setSuccess('OTP code sent successfully!'); 
        setStep(2); 
      } else { 
        setError(data.message || 'Registration failed.'); 
      }
    } catch (err) { 
      setError('Cannot connect to the server.'); 
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
        setSuccess('Account Verified! Redirecting to login...');
        setTimeout(() => { navigate('/login'); }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid OTP code.');
      }
    } catch (err) { setError('Cannot connect to the server.'); }
  };

  const inputClasses = "w-full bg-slate-50/90 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 transition-all duration-200 shadow-sm";

  return (
    <div className="relative min-h-screen w-full bg-[#1F0406] flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden select-none">
      
      {/* FLOATING LIQUID ANIMATION */}
      <style>{`
        @keyframes floatSlow1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(80px, -50px) scale(1.15); }
          66% { transform: translate(-50px, 60px) scale(0.9); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-70px, 60px) scale(1.2); }
          66% { transform: translate(60px, -50px) scale(0.85); }
        }
        .animate-blob-1 { animation: floatSlow1 20s ease-in-out infinite; }
        .animate-blob-2 { animation: floatSlow2 24s ease-in-out infinite; }
      `}</style>

      {/* DYNAMIC ORBS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[550px] h-[550px] bg-gradient-to-bl from-[#7A1B22] via-[#A31D24] to-transparent rounded-full blur-[100px] opacity-75 animate-blob-1" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#5A1419] via-[#851D25] to-[#D4AF37]/25 rounded-full blur-[110px] opacity-70 animate-blob-2" />
        
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Glass Card */}
      <div className="w-full max-w-lg my-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white/40 p-6 sm:p-8">
          
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-white border-2 border-[#D4AF37] shadow-lg rounded-full flex items-center justify-center p-1 mx-auto mb-3 ring-4 ring-[#D4AF37]/30 overflow-hidden">
              <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {step === 1 ? 'Register Account' : 'Verify Contact'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {step === 1 ? 'Create an operator or TODA account' : `Enter the 6-digit code sent to ${formData.contact}`}
            </p>
          </div>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-semibold rounded-xl p-3 text-center shadow-sm">{error}</div>}
          {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold rounded-xl p-3 text-center shadow-sm">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClasses} placeholder="Juan D. Cruz" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Barangay</label>
                  <select name="address" value={formData.address} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                    <option value="" disabled>Select Brgy</option>
                    {gasanBarangays.map((brgy) => <option key={brgy} value={brgy}>{brgy}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">TODA Association</label>
                  <select name="todaAssociation" value={formData.todaAssociation} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                    {TODA_LIST.map((toda) => <option key={toda} value={toda}>{toda}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email or Phone Number</label>
                <input type="text" name="contact" value={formData.contact} onChange={handleChange} required className={inputClasses} placeholder="juan@gmail.com or 09123456789" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className={`${inputClasses} pr-10`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-1.5 flex gap-1">
                      <div className={`h-1 w-full rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-slate-200'}`}></div>
                      <div className={`h-1 w-full rounded-full ${passwordStrength >= 2 ? 'bg-orange-400' : 'bg-slate-200'}`}></div>
                      <div className={`h-1 w-full rounded-full ${passwordStrength >= 3 ? 'bg-yellow-400' : 'bg-slate-200'}`}></div>
                      <div className={`h-1 w-full rounded-full ${passwordStrength >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                    </div>
                  )}
                  {formData.password && passwordStrength < 3 && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">Mix upper, numbers & symbols.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={`${inputClasses} pr-10`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={termsAccepted} 
                  onChange={() => setTermsAccepted(!termsAccepted)} 
                  className="mt-0.5 accent-[#7A1B22] w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 leading-snug cursor-pointer">
                  I accept and understand the <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-bold text-[#7A1B22] hover:underline">Terms & Conditions and Privacy Policy</button>.
                </label>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all duration-200 mt-2 ${
                  isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] shadow-[#7A1B22]/30 hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending Verification Code...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Continue to Verification
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input 
                  type="text" 
                  maxLength="6" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-center text-2xl font-black text-slate-900 tracking-[0.4em] outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-4 focus:ring-[#7A1B22]/15 shadow-inner" 
                  placeholder="000000" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#3D0A0E] py-3.5 rounded-xl text-sm font-black shadow-lg shadow-[#D4AF37]/30 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <CheckCircle2 size={18} /> Verify and Create Account
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#7A1B22] transition-colors"
              >
                ← Change contact information
              </button>
            </form>
          )}

          {step === 1 && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Already have an account? <Link to="/login" className="font-bold text-[#7A1B22] hover:underline">Log in here</Link>
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 tracking-tight">
                {termsLang === 'en' ? 'Terms & Privacy Policy' : 'Mga Tuntunin at Patakaran'}
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setTermsLang(termsLang === 'en' ? 'tl' : 'en')}
                  className="flex items-center gap-1 text-xs font-bold text-[#7A1B22] bg-[#7A1B22]/10 px-2.5 py-1.5 rounded-lg hover:bg-[#7A1B22]/20 transition-all"
                >
                  <Globe size={14} /> {termsLang === 'en' ? 'Tagalog' : 'English'}
                </button>
                <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-red-500 p-1"><X size={20} /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
              {termsLang === 'en' ? (
                <>
                  <p><strong>1. Data Collection:</strong> By using G-TRAMS, you consent to the storage and validation of your operator credentials by the Local Government Unit of Gasan.</p>
                  <p><strong>2. Data Privacy Act of 2012:</strong> Protected under RA 10173. Data will strictly be used for municipal processing, transport regulation, and law enforcement.</p>
                  <p><strong>3. Accuracy:</strong> Submitting falsified information or credentials may result in immediate franchise revocation and legal penalty.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Pagkolekta ng Datos:</strong> Sa paggamit ng G-TRAMS, sumasang-ayon ka sa pagproseso ng iyong impormasyon ng Lokal na Pamahalaan ng Gasan.</p>
                  <p><strong>2. Data Privacy Act of 2012:</strong> Protektado sa ilalim ng RA 10173. Eksklusibong gagamitin para sa regulasyon at opisyal na talaan ng munisipyo.</p>
                  <p><strong>3. Katumpakan:</strong> Ang pagpapasa ng pekeng dokumento ay magiging dahilan ng agarang pagbawi ng prangkisa.</p>
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} 
                className="bg-[#7A1B22] text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:bg-[#5A1419]"
              >
                {termsLang === 'en' ? 'I Understand & Accept' : 'Naiintindihan at Tinatanggap Ko'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default Register;