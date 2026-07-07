import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, UserPlus, KeyRound } from 'lucide-react';

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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match!');
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) { setSuccess('OTP code sent successfully!'); setStep(2); } 
      else { setError(data.message || 'Registration failed.'); }
    } catch (err) { setError('Cannot connect to the server.'); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/verify-otp', {
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
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputClasses} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={inputClasses} />
              </div>
            </div>
            
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#7A1B22] text-white py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-[#5A1419] active:scale-[0.98] transition-all duration-200 mt-2">
              <UserPlus size={18} /> Continue to Verification
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
      </div>
    </div>
  );
};

export default Register;