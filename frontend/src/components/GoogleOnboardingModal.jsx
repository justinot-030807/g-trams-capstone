import React, { useState, useEffect } from 'react';
import { GASAN_BARANGAYS, TODA_LIST } from '../utils/constants';
import TermsPolicyModal from './common/TermsPolicyModal';
import { Loader2, X, User, Mail, Phone, MapPin, Building2, ShieldCheck, ChevronDown } from 'lucide-react';

const GoogleOnboardingModal = ({ isOpen, onClose, googleProfile, onSuccess }) => {
  const [editableName, setEditableName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedToda, setSelectedToda] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && googleProfile) {
      setError('');
      const initialName = (googleProfile.name || googleProfile.fullName || '').trim();
      setEditableName(initialName);
      setPhoneNumber(googleProfile.phoneNumber || googleProfile.phone || '');
      setSelectedBarangay('');
      setSelectedToda('');
      setTermsAccepted(false);
    }
  }, [isOpen, googleProfile]);

  if (!isOpen || !googleProfile) return null;

  const email = (googleProfile.email || '').trim().toLowerCase();
  const picture = googleProfile.picture || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!editableName || editableName.trim().length < 2) {
      setError('PLEASE ENTER YOUR FULL LEGAL NAME (AT LEAST 2 CHARACTERS).');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    const isValidPHPhone = /^09\d{9}$/.test(cleanPhone) || /^\+639\d{9}$/.test(cleanPhone);
    if (!phoneNumber || !isValidPHPhone) {
      setError('PLEASE ENTER A VALID PHILIPPINE MOBILE NUMBER (E.G. 09123456789).');
      return;
    }

    if (!selectedBarangay) {
      setError('PLEASE SELECT YOUR BARANGAY IN GASAN.');
      return;
    }

    if (!selectedToda || selectedToda === 'NON-TODA') {
      setError('ACCORDING TO MUNICIPAL ORDINANCE, OPERATORS MUST SELECT AN ACCREDITED TODA.');
      return;
    }

    if (!termsAccepted) {
      setError('PLEASE ACCEPT THE TERMS & PRIVACY POLICY TO COMPLETE SETUP.');
      return;
    }

    setIsLoading(true);

    const formattedPhone = cleanPhone.startsWith('+63') ? '0' + cleanPhone.slice(3) : cleanPhone;

    const payload = {
      email,
      idToken: googleProfile.idToken || googleProfile.credential || undefined,
      credential: googleProfile.credential || googleProfile.idToken || undefined,
      accessToken: googleProfile.accessToken || undefined,
      googleProfile: {
        email,
        name: editableName.trim(),
        picture,
        googleId: googleProfile.googleId || ''
      },
      onboardingData: {
        fullName: editableName.trim(),
        name: editableName.trim(),
        address: selectedBarangay.trim(),
        todaAssociation: selectedToda.trim(),
        email,
        phone: formattedPhone,
        contact: formattedPhone || email,
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

  const inputClasses = "w-full pl-10 pr-3.5 h-[46px] sm:h-[48px] rounded-xl border border-slate-400 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-0 transition-all font-medium";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-onboarding-title"
    >
      {/* Centered Modal Card */}
      <div className="relative w-full max-w-[440px] max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Top Gold & Maroon Decorative Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#801820] via-[#D4AF37] to-[#801820]" />

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

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#801820]/10 border border-[#801820]/20 flex items-center justify-center p-1 shrink-0">
              <img src="/gasan-logo.png" alt="Gasan Official Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#801820] uppercase block">
                Municipality of Gasan
              </span>
              <h2 id="google-onboarding-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Complete Registration
              </h2>
            </div>
          </div>

          {/* Step Indicator & Intro (Task 20) */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
              Step 2 of 2
            </span>
            <p className="text-xs text-slate-600 font-medium">
              Almost done! Piliin ang Barangay at TODA mo.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl p-2.5 text-center shadow-xs uppercase tracking-wide animate-shake">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          
          {/* Editable Full Name (Task 21) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                name="fullName"
                value={editableName}
                onChange={(e) => {
                  setEditableName(e.target.value);
                  if (error) setError('');
                }}
                required
                maxLength={50}
                className={inputClasses}
                placeholder="Juan D. Cruz"
              />
            </div>
          </div>

          {/* Read-Only Google Email (Task 22) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Account Email
              </label>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <ShieldCheck size={13} /> Verified
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="text"
                value={email}
                readOnly
                disabled
                className="w-full pl-10 pr-3.5 h-[46px] sm:h-[48px] rounded-xl border border-slate-200 bg-slate-100 text-base sm:text-sm text-slate-600 font-medium cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Mobile Phone Number (Task 23: Philippine validation) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number (Mobile) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (error) setError('');
                }}
                required
                maxLength={13}
                className={inputClasses}
                placeholder="09123456789"
              />
            </div>
          </div>

          {/* Barangay Dropdown (Item 1: Consistent styling, gray placeholder, custom chevron) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Barangay <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                <MapPin size={18} />
              </div>
              <select
                value={selectedBarangay}
                onChange={(e) => {
                  setSelectedBarangay(e.target.value);
                  if (error) setError('');
                }}
                required
                className={`w-full pl-10 pr-9 h-[46px] sm:h-[48px] rounded-xl border border-slate-400 bg-white text-base sm:text-sm outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-0 transition-all font-medium appearance-none cursor-pointer ${
                  !selectedBarangay ? 'text-slate-500' : 'text-slate-900'
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

          {/* TODA Dropdown (Item 1: Consistent styling, gray placeholder, custom chevron) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              TODA <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                <Building2 size={18} />
              </div>
              <select
                value={selectedToda}
                onChange={(e) => {
                  setSelectedToda(e.target.value);
                  if (error) setError('');
                }}
                required
                className={`w-full pl-10 pr-9 h-[46px] sm:h-[48px] rounded-xl border border-slate-400 bg-white text-base sm:text-sm outline-none focus:outline-none focus:bg-white focus:border-[#801820] focus:ring-0 transition-all font-medium appearance-none cursor-pointer ${
                  !selectedToda ? 'text-slate-500' : 'text-slate-900'
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

          {/* Terms & Privacy Policy Checkbox (Task 13: 24px checkbox, min 44px touch target) */}
          <div className="flex items-center gap-3 min-h-[44px] pt-1">
            <input
              type="checkbox"
              id="google-onboarding-terms"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (error) setError('');
              }}
              className="w-6 h-6 rounded-md accent-[#801820] cursor-pointer shrink-0"
            />
            <label
              htmlFor="google-onboarding-terms"
              className="text-xs sm:text-sm text-slate-600 leading-snug cursor-pointer font-medium select-none"
            >
              I accept the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
                className="font-bold text-[#801820] hover:underline cursor-pointer focus:outline-none"
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
              className="w-full flex items-center justify-center gap-2 bg-[#801820] hover:bg-[#9E2A2B] text-white py-3 rounded-xl text-base font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
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
