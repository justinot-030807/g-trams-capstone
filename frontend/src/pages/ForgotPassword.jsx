import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, RefreshCw, Loader2, User, Lock, Phone, Mail, Eye, EyeOff, Check, X } from 'lucide-react';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';
import { resilientApiFetch } from '../utils/googleAuthUtils';
import { sanitizeDualContactInput } from '../utils/contactValidation';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [isDeliveryError, setIsDeliveryError] = useState(false);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingBackup, setIsSendingBackup] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [contact, setContact] = useState('');
  const [activeContactTarget, setActiveContactTarget] = useState('');
  const [resetChallengeToken, setResetChallengeToken] = useState('');
  const [backupInfo, setBackupInfo] = useState({
    hasBackupContact: false,
    hasRecoveryEmail: false,
    hasRecoveryPhone: false,
    maskedRecoveryEmail: '',
    maskedRecoveryPhone: '',
    maskedBackupContact: '',
    maskedPrimaryContact: '',
    activeChannel: 'primary',
    manualTarget: ''
  });
  const [showManualRecoveryInput, setShowManualRecoveryInput] = useState(false);
  const [manualRecoveryContact, setManualRecoveryContact] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = [
    { id: 'length', label: 'At least 8 characters', met: (newPassword || '').length >= 8 },
    { id: 'upper', label: 'At least 1 uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword || '') },
    { id: 'lower', label: 'At least 1 lowercase letter (a-z)', met: /[a-z]/.test(newPassword || '') },
    { id: 'number', label: 'At least 1 number (0-9)', met: /[0-9]/.test(newPassword || '') },
    { id: 'special', label: 'At least 1 special symbol (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(newPassword || '') }
  ];
  const isPasswordQualified = passwordRules.every(r => r.met);

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

  // Ensure light canvas consistency for auth view
  useEffect(() => {
    document.documentElement.classList.add('auth-view');
    document.body.classList.add('auth-view');
    document.documentElement.style.backgroundColor = '#F6F5F3';
    document.body.style.backgroundColor = '#F6F5F3';
    return () => {
      document.documentElement.classList.remove('auth-view');
      document.body.classList.remove('auth-view');
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const isValidContact = (value) => {
    const trimmed = String(value || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(09|\+639)\d{9}$/;
    return emailRegex.test(trimmed) || phoneRegex.test(trimmed.replace(/[\s-]/g, ''));
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setIsDeliveryError(false);
    setSuccess('');

    if (!isValidContact(contact)) {
      return setError('Please enter a valid email or phone number.');
    }

    setIsLoading(true);

    try {
      const response = await resilientApiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const dest = data.destination || contact.trim();
        const inferredChannel = data.recoveryUsed
          ? (dest.includes('@') ? 'recovery_email' : 'recovery_phone')
          : 'primary';
        setResetChallengeToken(data.resetChallengeToken || '');
        setActiveContactTarget(dest);
        setBackupInfo({
          hasBackupContact: Boolean(data.hasBackupContact || data.hasRecoveryEmail || data.hasRecoveryPhone),
          hasRecoveryEmail: Boolean(data.hasRecoveryEmail),
          hasRecoveryPhone: Boolean(data.hasRecoveryPhone),
          maskedRecoveryEmail: data.maskedRecoveryEmail || '',
          maskedRecoveryPhone: data.maskedRecoveryPhone || '',
          maskedBackupContact: data.maskedBackupContact || '',
          maskedPrimaryContact: data.maskedPrimaryContact || contact.trim(),
          activeChannel: inferredChannel,
          manualTarget: ''
        });
        setShowManualRecoveryInput(false);
        setResendCooldown(60);
        setSuccess(data.message || 'Verification code sent successfully.');
        setStep(2); 
      } else if (response.status === 503) {
        setIsDeliveryError(true);
        setError(data.message || 'Unable to deliver verification code right now. Please wait a moment and try again.');
      } else {
        setError(data.message || 'Error finding account.');
      }
    } catch {
      setError('Cannot connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToBackupContact = async (options) => {
    if (isSendingBackup || isLoading) return;
    setError('');
    setIsDeliveryError(false);
    setSuccess('');

    const opts = typeof options === 'string'
      ? { recoveryTarget: options }
      : (options && typeof options === 'object' ? options : {});

    const targetRecovery = typeof opts.recoveryTarget === 'string' && opts.recoveryTarget.trim()
      ? opts.recoveryTarget.trim()
      : '';
    const requestedChannel = opts.preferredChannel || '';

    if (targetRecovery && !isValidContact(targetRecovery)) {
      return setError('Please enter a valid recovery email or phone number.');
    }

    setIsSendingBackup(true);
    try {
      let payload;
      let nextChannel = 'primary';

      if (targetRecovery) {
        payload = {
          contact: contact.trim(),
          recoveryTarget: targetRecovery,
          useBackupContact: true
        };
        nextChannel = 'manual';
      } else if (requestedChannel === 'recovery_email' || requestedChannel === 'recovery_phone') {
        payload = {
          contact: contact.trim(),
          preferredChannel: requestedChannel,
          useBackupContact: true
        };
        nextChannel = requestedChannel;
      } else if (requestedChannel === 'primary') {
        payload = {
          contact: contact.trim(),
          useBackupContact: false
        };
        nextChannel = 'primary';
      } else {
        const wantBackup = backupInfo.activeChannel === 'primary';
        payload = {
          contact: contact.trim(),
          useBackupContact: wantBackup
        };
        nextChannel = wantBackup ? 'backup' : 'primary';
      }

      const response = await resilientApiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setResetChallengeToken(data.resetChallengeToken || '');
        setOtpCode('');

        if (targetRecovery) {
          setActiveContactTarget(data.destination || targetRecovery);
          setBackupInfo(prev => ({
            ...prev,
            hasBackupContact: Boolean(data.hasBackupContact ?? true),
            hasRecoveryEmail: Boolean(data.hasRecoveryEmail ?? prev.hasRecoveryEmail),
            hasRecoveryPhone: Boolean(data.hasRecoveryPhone ?? prev.hasRecoveryPhone),
            maskedRecoveryEmail: data.maskedRecoveryEmail || prev.maskedRecoveryEmail,
            maskedRecoveryPhone: data.maskedRecoveryPhone || prev.maskedRecoveryPhone,
            maskedBackupContact: data.maskedBackupContact || targetRecovery,
            activeChannel: 'manual',
            manualTarget: targetRecovery
          }));
          setShowManualRecoveryInput(false);
        } else {
          const isBackupDest = nextChannel !== 'primary';
          const fallbackDest = nextChannel === 'recovery_email'
            ? (backupInfo.maskedRecoveryEmail || backupInfo.maskedBackupContact)
            : nextChannel === 'recovery_phone'
            ? (backupInfo.maskedRecoveryPhone || backupInfo.maskedBackupContact)
            : isBackupDest
            ? (backupInfo.maskedBackupContact || 'Backup Contact')
            : contact.trim();

          setActiveContactTarget(data.destination || fallbackDest);
          setBackupInfo(prev => ({
            ...prev,
            hasBackupContact: Boolean(data.hasBackupContact ?? prev.hasBackupContact),
            hasRecoveryEmail: Boolean(data.hasRecoveryEmail ?? prev.hasRecoveryEmail),
            hasRecoveryPhone: Boolean(data.hasRecoveryPhone ?? prev.hasRecoveryPhone),
            maskedRecoveryEmail: data.maskedRecoveryEmail || prev.maskedRecoveryEmail,
            maskedRecoveryPhone: data.maskedRecoveryPhone || prev.maskedRecoveryPhone,
            maskedBackupContact: data.maskedBackupContact || prev.maskedBackupContact,
            activeChannel: nextChannel,
            manualTarget: ''
          }));
        }
        setResendCooldown(60);
        setSuccess(
          data.message ||
          (nextChannel !== 'primary'
            ? `Verification code sent to your recovery contact.`
            : `Verification code sent to your primary contact.`)
        );
      } else if (response.status === 503) {
        setIsDeliveryError(true);
        setError(data.message || 'Unable to deliver verification code right now. Please wait a moment and try again.');
      } else {
        setError(data.message || 'Could not send verification code to recovery contact.');
      }
    } catch {
      setError('Cannot connect to the server. Please try again.');
    } finally {
      setIsSendingBackup(false);
    }
  };

  const handleResendCurrentOTP = async () => {
    if (resendCooldown > 0 || isLoading || isSendingBackup) return;
    setError('');
    setIsDeliveryError(false);
    setSuccess('');
    setIsSendingBackup(true);

    try {
      let payload;
      if (backupInfo.activeChannel === 'manual' && backupInfo.manualTarget) {
        payload = {
          contact: contact.trim(),
          recoveryTarget: backupInfo.manualTarget,
          useBackupContact: true
        };
      } else if (backupInfo.activeChannel === 'recovery_email' || backupInfo.activeChannel === 'recovery_phone') {
        payload = {
          contact: contact.trim(),
          preferredChannel: backupInfo.activeChannel,
          useBackupContact: true
        };
      } else {
        payload = {
          contact: contact.trim(),
          useBackupContact: backupInfo.activeChannel !== 'primary'
        };
      }

      const response = await resilientApiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        if (data.resetChallengeToken) {
          setResetChallengeToken(data.resetChallengeToken);
        }
        setResendCooldown(60);
        setSuccess(data.message || 'New verification code sent successfully.');
      } else if (response.status === 503) {
        setIsDeliveryError(true);
        setError(data.message || 'Unable to deliver verification code right now. Please try again shortly.');
      } else {
        setError(data.message || 'Failed to resend verification code.');
      }
    } catch {
      setError('Cannot connect to the server. Please try again.');
    } finally {
      setIsSendingBackup(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');
    setIsDeliveryError(false);
    setSuccess('');

    if (!newPassword || newPassword.length < 8 || !isPasswordQualified) {
      setIsLoading(false);
      return setError('Password must meet all security qualifications (min. 8 chars, uppercase, lowercase, number, and symbol).');
    }

    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      return setError('Passwords do not match.');
    }

    try {
      const lookupContact = (backupInfo.activeChannel === 'manual' && backupInfo.manualTarget)
        ? backupInfo.manualTarget
        : (activeContactTarget && !activeContactTarget.includes('*'))
        ? activeContactTarget
        : contact.trim();

      const response = await resilientApiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: lookupContact,
          otp: otpCode.trim(),
          newPassword: newPassword,
          ...(resetChallengeToken ? { resetChallengeToken } : {})
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Invalid or expired verification code.');
      }
    } catch {
      setError('Cannot connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 sm:py-3 text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors font-medium min-h-[46px] sm:min-h-[48px]";

  return (
    <div className="relative w-full bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col overflow-x-hidden min-h-screen">
      
      {/* Zero-Lag Lightweight Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[420px] h-[420px] opacity-[0.035] pointer-events-none select-none">
          <img src="/gasan-logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>
      </div>

      <div className="relative min-h-[100dvh] flex flex-col justify-between">
        {/* TOP FLUSH NAVBAR */}
        <AuthNavbar />

        {/* CENTERED CLEAN AUTH CARD */}
        <main className="relative z-10 w-full max-w-md mx-auto px-4 my-auto py-8 sm:py-12 flex flex-col items-center justify-center">
          <div className="w-full bg-white dark:bg-[#1C1917] rounded-lg shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27] p-6 sm:p-8">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#9E2A2B] dark:text-[#F5E6B3]">
                {step === 1 ? <ShieldAlert size={24} /> : <KeyRound size={24} />}
              </div>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#9E2A2B] dark:text-[#F6F5F3] tracking-[-0.025em]">
                {step === 1 ? 'Forgot password?' : 'Reset password'}
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium mt-1.5 leading-relaxed">
                {step === 1 
                  ? 'Enter your registered email or phone number to receive a 6-digit verification code.' 
                  : `Enter the 6-digit verification code sent to ${activeContactTarget || contact} and create your new password.`}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className={`mb-4 border text-xs font-semibold rounded-lg p-3 text-center leading-relaxed ${
                  isDeliveryError
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-[#B45309] dark:text-amber-300'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-[#B91C1C] dark:text-red-400'
                }`}
              >
                <p>{error}</p>
                {isDeliveryError && (
                  <p className="mt-1 text-[11px] font-medium opacity-90">
                    The delivery gateway is temporarily unavailable. Your info is preserved — please retry in a moment.
                  </p>
                )}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[#15803D] dark:text-emerald-400 text-xs font-semibold rounded-lg p-3 text-center">
                {success}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                    Email or phone number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
                      <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      maxLength={60}
                      value={contact}
                      onChange={(e) => setContact(sanitizeDualContactInput(e.target.value))}
                      required 
                      className={`w-full pl-10 pr-3.5 py-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors font-medium min-h-[46px]`} 
                      placeholder="Enter email or phone number" 
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-3 rounded-lg text-sm font-bold shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Sending Code...
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>

                  {isLoading && (
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] text-center mt-2 animate-pulse font-medium">
                      Connecting to secure gateway, please wait...
                    </p>
                  )}

                  <div className="text-center mt-4">
                    <Link to="/login" className="inline-flex items-center gap-1.5 py-1.5 text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline transition-colors">
                      <ArrowLeft size={13} /> Back to Login
                    </Link>
                  </div>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5 text-center">
                    6-digit verification code
                  </label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value)} 
                    required 
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2.5 text-center text-2xl font-extrabold tabular-nums text-[#1F1D1B] dark:text-[#F6F5F3] tracking-[0.3em] font-mono outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] shadow-inner" 
                    placeholder="000000" 
                  />

                  {/* OTP Recovery Contact Switcher (When primary contact is inaccessible/not working) */}
                  <div className="mt-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs space-y-2">
                    {backupInfo.hasRecoveryEmail && backupInfo.hasRecoveryPhone ? (
                      <div className="space-y-2">
                        <p className="text-[#6B6761] dark:text-[#A8A29E] font-medium leading-snug">
                          Choose where to receive your verification code:
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          <button
                            type="button"
                            disabled={isSendingBackup}
                            onClick={() => handleSendToBackupContact({ preferredChannel: 'recovery_email' })}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-50 ${
                              backupInfo.activeChannel === 'recovery_email'
                                ? 'bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 border-[#9E2A2B] dark:border-[#D4AF37] text-[#9E2A2B] dark:text-[#D4AF37] font-bold'
                                : 'bg-white dark:bg-[#1C1917] border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] hover:border-[#9E2A2B]/50 font-semibold'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                              <Mail size={13} className="shrink-0" />
                              <span className="truncate">Recovery Email ({backupInfo.maskedRecoveryEmail})</span>
                            </span>
                            <span className="text-[11px] shrink-0">
                              {backupInfo.activeChannel === 'recovery_email' ? 'Active' : 'Send'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isSendingBackup}
                            onClick={() => handleSendToBackupContact({ preferredChannel: 'recovery_phone' })}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-50 ${
                              backupInfo.activeChannel === 'recovery_phone'
                                ? 'bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 border-[#9E2A2B] dark:border-[#D4AF37] text-[#9E2A2B] dark:text-[#D4AF37] font-bold'
                                : 'bg-white dark:bg-[#1C1917] border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] hover:border-[#9E2A2B]/50 font-semibold'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                              <Phone size={13} className="shrink-0" />
                              <span className="truncate">Recovery Phone ({backupInfo.maskedRecoveryPhone})</span>
                            </span>
                            <span className="text-[11px] shrink-0">
                              {backupInfo.activeChannel === 'recovery_phone' ? 'Active' : 'Send'}
                            </span>
                          </button>

                          {backupInfo.activeChannel !== 'primary' && (
                            <button
                              type="button"
                              disabled={isSendingBackup}
                              onClick={() => handleSendToBackupContact({ preferredChannel: 'primary' })}
                              className="text-left font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline pt-0.5 cursor-pointer disabled:opacity-50"
                            >
                              {isSendingBackup ? 'Sending...' : `Send to Primary Contact (${backupInfo.maskedPrimaryContact}) instead`}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : backupInfo.hasBackupContact ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium leading-snug">
                          {backupInfo.activeChannel !== 'primary'
                            ? `Code sent to your Backup Contact (${backupInfo.maskedRecoveryEmail || backupInfo.maskedRecoveryPhone || backupInfo.maskedBackupContact}).`
                            : 'Di na gumagana o walang natanggap sa primary contact?'}
                        </span>
                        <button
                          type="button"
                          disabled={isSendingBackup}
                          onClick={() =>
                            handleSendToBackupContact(
                              backupInfo.activeChannel !== 'primary'
                                ? { preferredChannel: 'primary' }
                                : backupInfo.hasRecoveryEmail
                                ? { preferredChannel: 'recovery_email' }
                                : backupInfo.hasRecoveryPhone
                                ? { preferredChannel: 'recovery_phone' }
                                : undefined
                            )
                          }
                          className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline shrink-0 text-left sm:text-right cursor-pointer disabled:opacity-50"
                        >
                          {isSendingBackup
                            ? 'Sending...'
                            : backupInfo.activeChannel !== 'primary'
                            ? 'Send to Primary Contact instead'
                            : `Receive OTP via Backup (${backupInfo.maskedRecoveryEmail || backupInfo.maskedRecoveryPhone || backupInfo.maskedBackupContact})`}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium">
                            Di na gumagana ang {contact}?
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowManualRecoveryInput(!showManualRecoveryInput)}
                            className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline shrink-0 cursor-pointer"
                          >
                            {showManualRecoveryInput ? 'Cancel' : 'Receive OTP sa Backup Contact'}
                          </button>
                        </div>
                        {showManualRecoveryInput && (
                          <div className="mt-2.5 flex gap-2">
                            <input
                              type="text"
                              maxLength={60}
                              value={manualRecoveryContact}
                              onChange={(e) => setManualRecoveryContact(sanitizeDualContactInput(e.target.value))}
                              placeholder="Enter recovery email or 0912..."
                              className="flex-1 px-3 py-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-xs text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B]"
                            />
                            <button
                              type="button"
                              disabled={isSendingBackup || !manualRecoveryContact.trim()}
                              onClick={() => handleSendToBackupContact({ recoveryTarget: manualRecoveryContact.trim() })}
                              className="px-3 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              {isSendingBackup ? 'Sending...' : 'Send OTP'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                      className={`w-full pl-10 pr-10 py-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors font-medium min-h-[46px]`} 
                      placeholder="••••••••" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B6761] hover:text-[#9E2A2B] dark:text-[#A8A29E] dark:hover:text-[#D4AF37] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {Boolean(newPassword && newPassword.length > 0) && (
                    <div className="mt-2 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-2.5 text-left space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                          Password Qualifications
                        </span>
                        <span className={`text-[11px] font-bold tabular-nums ${isPasswordQualified ? 'text-[#15803D] dark:text-emerald-400' : 'text-[#6B6761] dark:text-[#A8A29E]'}`}>
                          {isPasswordQualified ? '✓ All Met' : `${passwordRules.filter(r => r.met).length}/5 Met`}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {passwordRules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`flex items-center gap-1.5 text-[11px] leading-tight ${
                              rule.met ? 'text-[#15803D] dark:text-emerald-400 font-bold' : 'text-[#6B6761] dark:text-[#A8A29E] font-medium'
                            }`}
                          >
                            {rule.met ? (
                              <Check size={12} className="shrink-0 stroke-[3] text-[#15803D] dark:text-emerald-400" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#A8A29E] dark:bg-[#6B6761] shrink-0 mx-0.5" />
                            )}
                            <span>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                      className={`w-full pl-10 pr-10 py-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] transition-colors font-medium min-h-[46px]`} 
                      placeholder="••••••••" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B6761] hover:text-[#9E2A2B] dark:text-[#A8A29E] dark:hover:text-[#D4AF37] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                
                <div className="pt-2 space-y-2.5">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-3 rounded-lg text-sm font-bold shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} /> Reset Password
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading || isSendingBackup}
                      onClick={handleResendCurrentOTP}
                      className="py-1.5 text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer tabular-nums"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setStep(1);
                        setResetChallengeToken('');
                        setOtpCode('');
                        setError('');
                        setIsDeliveryError(false);
                        setSuccess('');
                      }} 
                      className="py-1.5 text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-colors cursor-pointer"
                    >
                      ← Change Contact Info
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </main>
      </div>

      {/* SHARED FULL-WIDTH FOOTER */}
      <AuthFooter />

    </div>
  );
};

export default ForgotPassword;
