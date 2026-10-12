import React, { useState, useEffect } from 'react';
import { GASAN_BARANGAYS, TODA_LIST, getTodasForBarangay } from '../utils/constants';
import TermsPolicyModal from './common/TermsPolicyModal';
import { 
  Loader2, X, User, Mail, Phone, MapPin, Building2, ShieldCheck, ChevronDown,
  CheckCircle2, AlertTriangle, AlertCircle, Info 
} from 'lucide-react';

const GoogleOnboardingModal = ({ isOpen, onClose, googleProfile, onSuccess }) => {
  const [editableName, setEditableName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedToda, setSelectedToda] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Live TODA Roster Membership Status Check
  const [todaCheckResult, setTodaCheckResult] = useState(null);
  const [isCheckingToda, setIsCheckingToda] = useState(false);

  useEffect(() => {
    if (isOpen && googleProfile) {
      setError('');
      const initialName = (googleProfile.name || googleProfile.fullName || '').trim();
      setEditableName(initialName);
      setPhoneNumber(googleProfile.phoneNumber || googleProfile.phone || '');
      setSelectedBarangay('');
      setSelectedToda('');
      setTermsAccepted(false);
      setTodaCheckResult(null);
      setIsCheckingToda(false);
    }
  }, [isOpen, googleProfile]);

  useEffect(() => {
    if (!selectedToda || selectedToda === 'NON-TODA') {
      setTodaCheckResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingToda(true);
      try {
        const query = new URLSearchParams({
          todaName: selectedToda,
          name: editableName || '',
          barangay: selectedBarangay || ''
        });
        const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        const res = await fetch(`${baseUrl}/api/v1/franchises/check-toda-member?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTodaCheckResult(data);
        }
      } catch (e) {
        console.error('TODA check error in Google onboarding:', e);
      } finally {
        setIsCheckingToda(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedToda, editableName, selectedBarangay]);

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

    let formattedPhone = '';
    const trimmedPhone = (phoneNumber || '').trim();
    if (trimmedPhone) {
      const cleanPhone = trimmedPhone.replace(/[\s\-()]/g, '');
      const isValidPHPhone = /^09\d{9}$/.test(cleanPhone) || /^\+639\d{9}$/.test(cleanPhone);
      if (!isValidPHPhone) {
        setError('PLEASE ENTER A VALID PHILIPPINE MOBILE NUMBER (E.G. 09123456789) OR LEAVE IT BLANK.');
        return;
      }
      formattedPhone = cleanPhone.startsWith('+63') ? '0' + cleanPhone.slice(3) : cleanPhone;
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
        phone: formattedPhone || undefined,
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

  const inputClasses = "w-full pl-10 pr-3.5 h-[46px] sm:h-[48px] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-base sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors font-medium";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-onboarding-title"
    >
      {/* Centered Modal Card */}
      <div className="relative w-full max-w-[440px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1C1917] rounded-lg shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Top Gold & Maroon Decorative Ribbon */}
        <div className="h-1 w-full bg-[#9E2A2B]" />

        {/* Modal Header */}
        <div className="p-5 pb-2 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close setup modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center p-1 shrink-0">
              <img src="/gasan-logo.png" alt="Gasan Official Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#9E2A2B] uppercase block">
                Municipality of Gasan
              </span>
              <h2 id="google-onboarding-title" className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] leading-tight">
                Complete Registration
              </h2>
            </div>
          </div>

          {/* Step Indicator & Intro */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[11px] font-bold border border-amber-200 dark:border-amber-800/60">
              Step 2 of 2
            </span>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">
              Almost done! Piliin ang Barangay at TODA mo.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg p-2.5 text-center shadow-xs uppercase tracking-wide animate-shake">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          
          {/* Editable Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
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

          {/* Read-Only Google Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider">
                Google Account Email
              </label>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <ShieldCheck size={13} /> Verified
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
                <Mail size={18} />
              </div>
              <input
                type="text"
                value={email}
                readOnly
                disabled
                className="w-full pl-10 pr-3.5 h-[46px] sm:h-[48px] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-base sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Mobile Phone Number - Optional */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider">
                Phone Number (Mobile)
              </label>
              <span className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] bg-[#F6F5F3] dark:bg-[#14110F] px-2 py-0.5 rounded border border-[#E4E1DC] dark:border-[#2E2A27]">
                Optional
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
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
                maxLength={13}
                className={inputClasses}
                placeholder="09123456789 (Optional)"
              />
            </div>
            <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-1">
              Used for official SMS franchise notifications. You can also add this later in settings.
            </p>
          </div>

          {/* Barangay Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1">
              Barangay <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E] z-10">
                <MapPin size={18} />
              </div>
              <select
                value={selectedBarangay}
                onChange={(e) => {
                  const newBrgy = e.target.value;
                  setSelectedBarangay(newBrgy);
                  const valid = getTodasForBarangay(newBrgy);
                  if (!valid.includes(selectedToda)) {
                    setSelectedToda('');
                  }
                  if (error) setError('');
                }}
                required
                className={`w-full pl-10 pr-9 h-[46px] sm:h-[48px] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-base sm:text-sm outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors font-medium appearance-none cursor-pointer ${
                  !selectedBarangay ? 'text-[#6B6761] dark:text-[#A8A29E]' : 'text-[#1F1D1B] dark:text-[#F6F5F3]'
                }`}
              >
                <option value="" disabled className="text-[#6B6761]">Select Barangay</option>
                {GASAN_BARANGAYS.map((brgy) => (
                  <option key={brgy} value={brgy} className="text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {brgy}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* TODA Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1">
              TODA <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E] z-10">
                <Building2 size={18} />
              </div>
              <select
                value={selectedToda}
                onChange={(e) => {
                  setSelectedToda(e.target.value);
                  if (error) setError('');
                }}
                required
                disabled={!selectedBarangay}
                className={`w-full pl-10 pr-9 h-[46px] sm:h-[48px] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-base sm:text-sm outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors font-medium appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  !selectedToda ? 'text-[#6B6761] dark:text-[#A8A29E]' : 'text-[#1F1D1B] dark:text-[#F6F5F3]'
                }`}
              >
                <option value="" disabled className="text-[#6B6761]">
                  {!selectedBarangay ? 'Select Barangay first' : `Select TODA (${getTodasForBarangay(selectedBarangay).length} available)`}
                </option>
                {getTodasForBarangay(selectedBarangay).map((toda) => (
                  <option key={toda} value={toda} className="text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {toda}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Live TODA Roster & Jurisdiction Feedback */}
          {selectedToda && selectedToda !== 'NON-TODA' && (
            <div className="text-xs rounded-lg transition-all animate-fadeIn">
              {isCheckingToda ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Loader2 size={13} className="animate-spin shrink-0 text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <span>Checking official {selectedToda} masterlist...</span>
                </div>
              ) : todaCheckResult ? (
                <div className="space-y-1.5">
                  {todaCheckResult.jurisdictionStatus === 'mismatch' && (
                    <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-bold">Route Notice: </span>
                        <span>{todaCheckResult.jurisdictionWarning || `Barangay "${selectedBarangay}" is outside the official operational routes of ${selectedToda}.`}</span>
                      </div>
                    </div>
                  )}

                  {todaCheckResult.todaStatus === 'verified_member' ? (
                    <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="font-bold">Verified Member: </span>
                        <span>Name <strong>"{todaCheckResult.matchedMember || editableName}"</strong> is on the official approved roster of {selectedToda}.</span>
                      </div>
                    </div>
                  ) : todaCheckResult.todaStatus === 'not_in_roster' ? (
                    <div className="flex items-start gap-2 text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
                      <Info size={14} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="font-bold">Notice: </span>
                        <span>Your name is not currently in the digital roster of {selectedToda}. You can continue registration, but you will need to upload a <strong>TODA Endorsement Certificate</strong> when applying for a franchise.</span>
                      </div>
                    </div>
                  ) : todaCheckResult.todaStatus === 'pending_name' ? (
                    <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <Info size={14} className="shrink-0 mt-0.5 text-slate-500" />
                      <div>
                        <span className="font-bold">Digital Roster on File: </span>
                        <span>{selectedToda} has an approved masterlist. Make sure your full name above is correct to verify membership.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <Info size={14} className="shrink-0 mt-0.5 text-slate-500" />
                      <div>
                        <span className="font-bold">Status: </span>
                        <span>No digital roster on file for {selectedToda}. You can proceed with registration.</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Terms & Privacy Policy Checkbox */}
          <div className="flex items-center gap-3 min-h-[44px] pt-1">
            <input
              type="checkbox"
              id="google-onboarding-terms"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (error) setError('');
              }}
              className="w-5 h-5 rounded-md accent-[#9E2A2B] cursor-pointer shrink-0"
            />
            <label
              htmlFor="google-onboarding-terms"
              className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] leading-snug cursor-pointer font-medium select-none"
            >
              I accept the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
                className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer focus:outline-none"
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
              className="w-full flex items-center justify-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-3 rounded-lg text-base font-bold shadow-xs active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
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
