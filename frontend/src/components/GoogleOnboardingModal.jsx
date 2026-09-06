import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Phone, MapPin, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

const GASAN_BARANGAYS = [
  "Antipolo", "Bachao Ibaba", "Bachao Ilaya", "Bacong-Bacong", "Bahi", 
  "Bangbang", "Banot", "Banuyo", "Bognuyan", "Cabugao", "Dawis", "Dili", 
  "Libtangin", "Mahunig", "Mangiliol", "Masiga", "Matandang Gasan", "Pangi", 
  "Pinggan", "Tabionan", "Tapuyan", "Tiguion", 
  "Barangay I (Poblacion)", "Barangay II (Poblacion)", "Barangay III (Poblacion)"
];

const TODA_LIST = [
  "NON-TODA", "BATODA", "POB TODA", "NBI TODA", "GT TODA", "TIGUION TODA", 
  "BANGBANG IPIL TODA", "TAB TODA", "LUG TODA", "MASIGA TODA", "4B TODA", 
  "CT TODA", "TG TODA", "GC TODA", "MA TODA", "PG TODA", "MAT TODA", 
  "DPAB TODA", "MGN TODA", "GSTODA", "GS TODA", "TTODA", "TC TODA", 
  "NORTH TODA", "GASAN CENTRAL TODA", "BAHI TODA", "ILAYA TODA", "GTF TODA"
];

const GoogleOnboardingModal = ({ isOpen, onClose, googleProfile, onSubmit, isLoading, errorMessage = '' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    address: GASAN_BARANGAYS[0],
    contact: '',
    todaAssociation: 'NON-TODA'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (googleProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: googleProfile.name || '',
        contact: ''
      }));
    }
  }, [googleProfile]);

  if (!isOpen || !googleProfile) return null;

  const activeError = error || errorMessage;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      return setError('Please enter your full legal name.');
    }

    const trimmedContact = formData.contact.trim();
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(trimmedContact.replace(/[\s-]/g, ''))) {
      return setError('Please enter a valid PH mobile number (e.g. 09XXXXXXXXX).');
    }

    onSubmit({
      fullName: formData.fullName.trim(),
      address: formData.address,
      contact: trimmedContact,
      todaAssociation: formData.todaAssociation
    });
  };

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-2 focus:ring-[#7A1B22]/15 transition-all font-medium";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 z-10">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#7A1B22] via-[#8C2028] to-[#5A1419] p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#D4AF37]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-black text-base tracking-wide uppercase">
                  Complete Profile Information
                </h3>
                <p className="text-[11px] text-white/80 font-medium">
                  G-TRAMS Operator Registration via Google
                </p>
              </div>
            </div>

            {!isLoading && (
              <button 
                onClick={onClose} 
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="mt-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex items-center gap-2 text-[11px]">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Google Email Verified:</strong> No OTP verification code required for Google Sign-In.
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Email (Read-only) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Google Account Email
            </label>
            <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-600 font-semibold select-none">
              <span>{googleProfile.email}</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Verified ✓
              </span>
            </div>
          </div>

          {/* Full Legal Name (EDITABLE with explicit prompt) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-[#7A1B22] uppercase tracking-wider">
                Editable
              </span>
            </div>
            
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (error) setError('');
              }}
              className={inputClasses}
              placeholder="First Name, Middle Name, Last Name"
            />

            {/* Crucial user prompt as requested */}
            <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200/70 rounded-lg text-[11px] text-amber-900 font-medium flex items-start gap-1.5 leading-snug">
              <span className="text-amber-600 font-bold shrink-0">ℹ️ Notice:</span>
              <span>
                Please ensure you enter your <strong>full legal name</strong> (First Name, Middle Name, Last Name) matching your Driver's License or Valid ID for official MTOP franchise records.
              </span>
            </div>
          </div>

          {/* Address / Barangay */}
          <div>
            <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider mb-1">
              Barangay in Gasan <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={inputClasses}
            >
              {GASAN_BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Mobile Contact Number */}
          <div>
            <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider mb-1">
              Mobile Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.contact}
              onChange={(e) => {
                setFormData({ ...formData, contact: e.target.value });
                if (error) setError('');
              }}
              className={inputClasses}
              placeholder="09123456789"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Used for official LGU franchise notifications and SMS updates.
            </p>
          </div>

          {/* TODA Association */}
          <div>
            <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider mb-1">
              TODA Association
            </label>
            <select
              value={formData.todaAssociation}
              onChange={(e) => setFormData({ ...formData, todaAssociation: e.target.value })}
              className={inputClasses}
            >
              {TODA_LIST.map((toda) => (
                <option key={toda} value={toda}>{toda}</option>
              ))}
            </select>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A1B22] to-[#5A1419] hover:brightness-110 text-white py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Completing Registration...
                </>
              ) : (
                <>
                  Complete &amp; Continue to Dashboard
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default GoogleOnboardingModal;
