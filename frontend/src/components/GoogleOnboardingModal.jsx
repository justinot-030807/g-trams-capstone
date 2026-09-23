import React, { useState, useEffect } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../utils/constants';
import TermsPolicyModal from './common/TermsPolicyModal';
import { Loader2, X } from 'lucide-react';

const GoogleOnboardingModal = ({ isOpen, onClose, googleProfile, onSuccess }) => {
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedToda, setSelectedToda] = useState('NON-TODA');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedBarangay('');
      setSelectedToda('NON-TODA');
      setTermsAccepted(false);
    }
  }, [isOpen]);

  if (!isOpen || !googleProfile) return null;

  const email = (googleProfile.email || '').trim().toLowerCase();
  const name = (googleProfile.name || googleProfile.fullName || email.split('@')[0] || 'Operator').trim();
  const picture = googleProfile.picture || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!selectedBarangay) {
      setError('PLEASE SELECT YOUR BARANGAY IN GASAN.');
      return;
    }

    if (!termsAccepted) {
      setError('PLEASE ACCEPT THE TERMS & PRIVACY POLICY TO COMPLETE SETUP.');
      return;
    }

    setIsLoading(true);

    const payload = {
      email,
      idToken: googleProfile.idToken || googleProfile.credential || undefined,
      credential: googleProfile.credential || googleProfile.idToken || undefined,
      accessToken: googleProfile.accessToken || undefined,
      googleProfile: {
        email,
        name,
        picture,
        googleId: googleProfile.googleId || ''
      },
      onboardingData: {
        fullName: name,
        name: name,
        address: selectedBarangay.trim(),
        todaAssociation: (selectedToda || 'NON-TODA').trim(),
        email,
        contact: email,
        role: 'operator'
      }
    };

    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || data.error || 'Failed to complete registration.';
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          msg = data.errors.map(err => err.message).filter(Boolean).join('. ');
        }
        setError(msg.toUpperCase());
        return;
      }

      if (data.token) {
        onSuccess(data);
      } else {
        setError('UNEXPECTED SERVER RESPONSE. PLEASE TRY AGAIN.');
      }
    } catch {
      setError('CANNOT CONNECT TO SERVER. PLEASE CHECK YOUR NETWORK.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-onboarding-title"
    >
      {/* Centered Modal Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Top Gold & Maroon Decorative Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7A1B22] via-[#D4AF37] to-[#7A1B22]" />

        {/* Modal Header */}
        <div className="p-5 pb-2 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close setup modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-full bg-[#7A1B22]/10 border border-[#7A1B22]/20 flex items-center justify-center p-1 shrink-0">
              <img src="/gasan-logo.png" alt="Gasan Official Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#7A1B22] uppercase block">
                Municipality of Gasan
              </span>
              <h2 id="google-onboarding-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Complete Registration
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Please select your barangay and association to continue.
          </p>
        </div>

        {/* Google Identity Verified Card */}
        <div className="mx-5 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center gap-3">
          <div className="relative shrink-0">
            {picture ? (
              <img 
                src={picture} 
                alt={name} 
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7A1B22] to-[#9E1B27] text-white flex items-center justify-center font-black text-base shadow-xs">
                {(name || email || 'O')[0].toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
            <p className="text-xs text-slate-500 truncate">{email}</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-2.5 text-center shadow-xs uppercase tracking-wide animate-shake">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          
          {/* Barangay Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Barangay in Gasan <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => {
                setSelectedBarangay(e.target.value);
                if (error) setError('');
              }}
              required
              className="w-full bg-slate-50/90 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-3 focus:ring-[#7A1B22]/15 transition-all shadow-2xs font-medium cursor-pointer"
            >
              <option value="" disabled>Select your Barangay</option>
              {GASAN_BARANGAYS.map((brgy) => (
                <option key={brgy} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>
          </div>

          {/* TODA Association Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              TODA Association
            </label>
            <select
              value={selectedToda}
              onChange={(e) => setSelectedToda(e.target.value)}
              className="w-full bg-slate-50/90 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-[#7A1B22] focus:ring-3 focus:ring-[#7A1B22]/15 transition-all shadow-2xs font-medium cursor-pointer"
            >
              {TODA_LIST.map((toda) => (
                <option key={toda} value={toda}>
                  {toda}
                </option>
              ))}
            </select>
          </div>

          {/* Terms & Privacy Policy Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="google-onboarding-terms"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (error) setError('');
              }}
              className="mt-0.5 accent-[#7A1B22] w-4 h-4 rounded cursor-pointer shrink-0"
            />
            <label
              htmlFor="google-onboarding-terms"
              className="text-xs text-slate-600 leading-snug cursor-pointer font-medium select-none"
            >
              I accept the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowTermsModal(true);
                }}
                className="font-bold text-[#7A1B22] hover:underline cursor-pointer"
              >
                Terms &amp; Privacy Policy
              </button>.
            </label>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer ${
                isLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#7A1B22] to-[#9B2A33] hover:brightness-105 active:scale-[0.99] shadow-[#7A1B22]/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Embedded Terms & Privacy Policy Modal */}
      <TermsPolicyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
        }}
        defaultLang="en"
        showAcceptButton={true}
      />
    </div>
  );
};

export default GoogleOnboardingModal;
