import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, RefreshCw, Loader2, User, Lock, Phone, Mail, Eye, EyeOff, Check, X } from 'lucide-react';
import AuthNavbar from '../components/common/AuthNavbar';
import AuthFooter from '../components/common/AuthFooter';
import { resilientApiFetch } from '../utils/googleAuthUtils';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingBackup, setIsSendingBackup] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [contact, setContact] = useState('');
  const [activeContactTarget, setActiveContactTarget] = useState('');
  const [backupInfo, setBackupInfo] = useState({
    hasBackupContact: false,
    maskedBackupContact: '',
    maskedPrimaryContact: '',
    activeChannel: 'primary'
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
    
    setError(''); setSuccess('');

    if (!isValidContact(contact)) {
      return setError('PLEASE ENTER A VALID EMAIL OR PHONE NUMBER.');
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
        setActiveContactTarget(data.destination || contact.trim());
        setBackupInfo({
          hasBackupContact: Boolean(data.hasBackupContact),
          maskedBackupContact: data.maskedBackupContact || '',
          maskedPrimaryContact: data.maskedPrimaryContact || contact.trim(),
          activeChannel: data.recoveryUsed ? 'backup' : 'primary'
        });
        setShowManualRecoveryInput(false);
        setResendCooldown(60);
        setSuccess(data.message || 'OTP CODE SENT SUCCESSFULLY!');
        setStep(2); 
      } else {
        setError(data.message || 'ERROR FINDING ACCOUNT.');
      }
    } catch {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToBackupContact = async (customRecoveryValue) => {
    if (isSendingBackup || isLoading) return;
    setError(''); setSuccess('');

    const targetRecovery = typeof customRecoveryValue === 'string' && customRecoveryValue.trim()
      ? customRecoveryValue.trim()
      : '';

    if (targetRecovery && !isValidContact(targetRecovery)) {
      return setError('PLEASE ENTER A VALID RECOVERY EMAIL OR PHONE NUMBER.');
    }

    setIsSendingBackup(true);
    try {
      const wantBackup = targetRecovery ? true : (backupInfo.activeChannel !== 'backup');
      const payload = targetRecovery
        ? { contact: targetRecovery, useBackupContact: true }
        : { contact: contact.trim(), useBackupContact: wantBackup };

      const response = await resilientApiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (targetRecovery) {
          setActiveContactTarget(targetRecovery);
          setBackupInfo(prev => ({
            ...prev,
            activeChannel: 'backup',
            maskedBackupContact: targetRecovery
          }));
          setShowManualRecoveryInput(false);
        } else {
          setActiveContactTarget(
            wantBackup
              ? (data.destination || backupInfo.maskedBackupContact || 'Backup Contact')
              : contact.trim()
          );
          setBackupInfo(prev => ({
            ...prev,
            hasBackupContact: Boolean(data.hasBackupContact ?? prev.hasBackupContact),
            maskedBackupContact: data.maskedBackupContact || prev.maskedBackupContact,
            activeChannel: wantBackup ? 'backup' : 'primary'
          }));
        }
        setResendCooldown(60);
        setSuccess(
          data.message ||
          (wantBackup
            ? `OTP CODE SENT TO YOUR RECOVERY CONTACT (${targetRecovery || backupInfo.maskedBackupContact})!`
            : `OTP CODE SENT TO YOUR PRIMARY CONTACT!`)
        );
      } else {
        setError(data.message || 'COULD NOT SEND OTP TO RECOVERY CONTACT.');
      }
    } catch {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsSendingBackup(false);
    }
  };

  const handleResendCurrentOTP = async () => {
    if (resendCooldown > 0 || isLoading || isSendingBackup) return;
    setError(''); setSuccess('');
    setIsSendingBackup(true);

    try {
      const isUsingManual = activeContactTarget && activeContactTarget !== contact.trim() && ! activeContactTarget.includes('*');
      const payload = isUsingManual
        ? { contact: activeContactTarget }
        : { contact: contact.trim(), useBackupContact: backupInfo.activeChannel === 'backup' };

      const response = await resilientApiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setResendCooldown(60);
        setSuccess('NEW OTP CODE SENT SUCCESSFULLY!');
      } else {
        setError(data.message || 'FAILED TO RESEND OTP CODE.');
      }
    } catch {
      setError('CANNOT CONNECT TO THE SERVER.');
    } finally {
      setIsSendingBackup(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(''); setSuccess('');

    if (!newPassword || newPassword.length < 8 || !isPasswordQualified) {
      setIsLoading(false);
      return setError('PASSWORD MUST MEET ALL SECURITY QUALIFICATIONS (MIN. 8 CHARS, UPPERCASE, LOWERCASE, NUMBER, AND SYMBOL)!');
    }

    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      return setError('PASSWORDS DO NOT MATCH!');
    }

    try {
      const lookupContact = (activeContactTarget && !activeContactTarget.includes('*'))
        ? activeContactTarget
        : contact.trim();

      const response = await resilientApiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: lookupContact,
          otp: otpCode,
          newPassword: newPassword
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess('PASSWORD RESET SUCCESSFUL! REDIRECTING...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'INVALID OR EXPIRED OTP.');
      }
    } catch {
      setError('CANNOT CONNECT TO THE SERVER.');
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
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#9E2A2B]/10 flex items-center justify-center text-[#9E2A2B]">
                {step === 1 ? <ShieldAlert size={24} /> : <KeyRound size={24} />}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#9E2A2B] tracking-tight">
                {step === 1 ? 'Forgot Password?' : 'Reset Password'}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] font-medium mt-1.5 leading-relaxed">
                {step === 1 
                  ? 'Enter your registered email or phone number to receive a 6-digit verification code.' 
                  : `Enter the 6-digit verification code sent to ${activeContactTarget || contact} and create your new password.`}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg p-3 text-center shadow-xs tracking-wide">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg p-3 text-center shadow-xs tracking-wide">
                {success}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6761] dark:text-[#A8A29E]">
                      <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
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
                    className="w-full flex items-center justify-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-3 rounded-lg text-sm font-bold shadow-xs active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
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
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline transition-colors">
                      <ArrowLeft size={13} /> Back to Login
                    </Link>
                  </div>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5 text-center">
                    6-Digit Verification Code
                  </label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value)} 
                    required 
                    className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3 py-2.5 text-center text-2xl font-black text-[#1F1D1B] dark:text-[#F6F5F3] tracking-[0.3em] font-mono outline-none focus:outline-none focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] shadow-inner" 
                    placeholder="000000" 
                  />

                  {/* OTP Recovery Contact Switcher (When primary contact is inaccessible/not working) */}
                  <div className="mt-3 p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs">
                    {backupInfo.hasBackupContact ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#6B6761] dark:text-[#A8A29E] font-medium leading-snug">
                          {backupInfo.activeChannel === 'backup'
                            ? `Code sent to your Backup Contact (${backupInfo.maskedBackupContact}).`
                            : 'Di na gumagana o walang natanggap sa primary contact?'}
                        </span>
                        <button
                          type="button"
                          disabled={isSendingBackup}
                          onClick={() => handleSendToBackupContact()}
                          className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline shrink-0 text-left sm:text-right cursor-pointer disabled:opacity-50"
                        >
                          {isSendingBackup
                            ? 'Sending...'
                            : backupInfo.activeChannel === 'backup'
                            ? 'Send to Primary Contact instead'
                            : `Receive OTP via Backup (${backupInfo.maskedBackupContact})`}
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
                              value={manualRecoveryContact}
                              onChange={(e) => setManualRecoveryContact(e.target.value)}
                              placeholder="Enter recovery email or 0912..."
                              className="flex-1 px-3 py-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-xs text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B]"
                            />
                            <button
                              type="button"
                              disabled={isSendingBackup || !manualRecoveryContact.trim()}
                              onClick={() => handleSendToBackupContact(manualRecoveryContact)}
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
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    New Password
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
                        <span className={`text-[11px] font-bold ${isPasswordQualified ? 'text-emerald-600' : 'text-[#6B6761] dark:text-[#A8A29E]'}`}>
                          {isPasswordQualified ? '✓ All Met' : `${passwordRules.filter(r => r.met).length}/5 Met`}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {passwordRules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`flex items-center gap-1.5 text-[11px] leading-tight ${
                              rule.met ? 'text-emerald-600 font-bold' : 'text-[#6B6761] dark:text-[#A8A29E] font-medium'
                            }`}
                          >
                            {rule.met ? (
                              <Check size={12} className="shrink-0 stroke-[3] text-emerald-600" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E4E1DC] dark:bg-[#2E2A27] shrink-0 mx-0.5" />
                            )}
                            <span>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] uppercase tracking-wider mb-1.5">
                    Confirm Password
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
                    className="w-full flex items-center justify-center gap-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white py-3 rounded-lg text-sm font-bold shadow-xs active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
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
                      className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-xs font-bold text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-colors cursor-pointer"
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
