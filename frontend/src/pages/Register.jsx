import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Globe, X, Loader2 } from 'lucide-react';
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

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsLang, setTermsLang] = useState('en'); // 'en' or 'tl'

  // Password Strength Logic
  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1; // Symbols
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

  // I-set ang loading sa true
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
    // I-set ang loading sa false kapag tapos na (success man o error)
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

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-20 h-20 bg-white border-2 border-[#D4AF37] shadow-md rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
            <img src="/gasan-logo.png" alt="Official Gasan Logo" className="w-full h-full object-cover scale-105" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{step === 1 ? 'Register Account' : 'Verify Contact'}</h2>
          <p className="text-xs text-slate-500 mt-1">{step === 1 ? 'Create an operator or TODA account' : `We sent a code to ${formData.contact}`}</p>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl p-3 text-center">{error}</div>}
        {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl p-3 text-center">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClasses} placeholder="Juan D. Cruz" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Barangay</label>
                <select name="address" value={formData.address} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                  <option value="" disabled>Select Brgy</option>
                  {gasanBarangays.map((brgy) => <option key={brgy} value={brgy}>{brgy}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">TODA Association</label>
                <select name="todaAssociation" value={formData.todaAssociation} onChange={handleChange} required className={`${inputClasses} cursor-pointer`}>
                  {TODA_LIST.map((toda) => <option key={toda} value={toda}>{toda}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email or Phone Number</label>
              <input type="text" name="contact" value={formData.contact} onChange={handleChange} required className={inputClasses} placeholder="juan@gmail.com or 09123456789" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className={`${inputClasses} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* PASSWORD STRENGTH INDICATOR */}
                {formData.password && (
                  <div className="mt-2 flex gap-1">
                    <div className={`h-1.5 w-full rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-slate-200'}`}></div>
                    <div className={`h-1.5 w-full rounded-full ${passwordStrength >= 2 ? 'bg-orange-400' : 'bg-slate-200'}`}></div>
                    <div className={`h-1.5 w-full rounded-full ${passwordStrength >= 3 ? 'bg-yellow-400' : 'bg-slate-200'}`}></div>
                    <div className={`h-1.5 w-full rounded-full ${passwordStrength >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                  </div>
                )}
                {formData.password && passwordStrength < 3 && (
                  <p className="text-[9px] text-red-500 mt-1 font-medium">Use 8+ chars, mix numbers & symbols (!@#).</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={`${inputClasses} pr-10`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7A1B22]">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* TERMS AND CONDITIONS CHECKBOX */}
            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                checked={termsAccepted} 
                onChange={() => setTermsAccepted(!termsAccepted)} 
                className="mt-1 accent-[#7A1B22] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 leading-tight cursor-pointer">
                I accept and understand the <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-bold text-[#7A1B22] hover:underline">Terms & Conditions and Privacy Policy</button>.
              </label>
            </div>
            
           <button 
  type="submit" 
  disabled={isLoading} // I-disable kapag naglo-load
  className={`w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 mt-2 ${
    isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#7A1B22] hover:bg-[#5A1419] active:scale-[0.98]'
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">Enter 6-Digit OTP Code</label>
              <input type="text" maxLength="6" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center text-2xl font-black text-slate-900 tracking-[0.5em] outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/20" placeholder="000000" />
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-[#7A1B22] py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-[#c49f2b] active:scale-[0.98] transition-all mt-2">
              Verify and Create Account
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs font-medium text-slate-500 hover:text-[#7A1B22]">Change contact information</button>
          </form>
        )}

        {step === 1 && (
          <p className="mt-6 text-center text-xs text-slate-500 font-medium">
            Already have an account? <Link to="/login" className="font-bold text-[#7A1B22] hover:underline">Log in here</Link>
          </p>
        )}

        {/* TERMS AND PRIVACY MODAL */}
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">
                  {termsLang === 'en' ? 'Terms & Privacy Policy' : 'Mga Tuntunin at Patakaran'}
                </h3>
                <div className="flex items-center gap-3">
                  {/* LANGUAGE TOGGLE */}
                  <button 
                    onClick={() => setTermsLang(termsLang === 'en' ? 'tl' : 'en')}
                    className="flex items-center gap-1 text-xs font-bold text-[#7A1B22] bg-[#7A1B22]/10 px-2 py-1 rounded-lg hover:bg-[#7A1B22]/20"
                  >
                    <Globe size={14} /> {termsLang === 'en' ? 'Tagalog' : 'English'}
                  </button>
                  <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4">
                {termsLang === 'en' ? (
                  <>
                    <p><strong>1. Data Collection and Usage:</strong> By using the G-TRAMS portal, you agree to the collection of your personal and vehicle information required for franchise registration and validation by the Local Government Unit of Gasan.</p>
                    <p><strong>2. Data Privacy Act of 2012:</strong> Your data is protected under Republic Act No. 10173. The information you provide will be kept confidential and will strictly be used for municipal processing, public transport regulation, and law enforcement purposes only.</p>
                    <p><strong>3. Accuracy of Information:</strong> You certify that all documents and details provided are true and correct. Submission of falsified documents may result in the revocation of your franchise and legal action.</p>
                    <p><strong>4. Account Security:</strong> You are responsible for keeping your login credentials secure. Do not share your password or OTP with anyone.</p>
                  </>
                ) : (
                  <>
                    <p><strong>1. Pagkolekta at Paggamit ng Datos:</strong> Sa paggamit ng G-TRAMS portal, sumasang-ayon ka sa pagkolekta ng iyong personal na impormasyon at detalye ng sasakyan na kailangan para sa pagpaparehistro ng prangkisa sa Lokal na Pamahalaan ng Gasan.</p>
                    <p><strong>2. Data Privacy Act of 2012:</strong> Ang iyong datos ay protektado sa ilalim ng Republic Act No. 10173. Ang impormasyong ibibigay mo ay mananatiling kumpidensyal at gagamitin lamang para sa regulasyon ng transportasyon at pagpapatupad ng batas.</p>
                    <p><strong>3. Katumpakan ng Impormasyon:</strong> Pinapatunayan mo na ang lahat ng dokumento at detalyeng ibinigay ay totoo at tama. Ang pagpapasa ng pekeng dokumento ay maaaring maging sanhi ng pagbawi ng iyong prangkisa at legal na aksyon.</p>
                    <p><strong>4. Seguridad ng Account:</strong> Ikaw ang responsable sa pag-iingat ng iyong account. Huwag ibigay ang iyong password o OTP sa ibang tao.</p>
                  </>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} 
                  className="bg-[#7A1B22] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#5A1419]"
                >
                  {termsLang === 'en' ? 'I Understand & Accept' : 'Naiintindihan at Tinatanggap Ko'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;