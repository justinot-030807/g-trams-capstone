import React, { useState, useEffect } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { AlertCircle, Lock, Loader2, MessageSquare, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import FeedbackModal from '../components/common/FeedbackModal';
import { resilientApiFetch, DEFAULT_GOOGLE_CLIENT_ID } from '../utils/googleAuthUtils';

const AccountDeactivated = () => {
  const location = useLocation();
  const state = location.state;
  
  const contact = state?.contact || '';
  const reason = state?.reason || '';
  const initialAppealStatus = state?.appealStatus || 'none';
  const hasLocalPassword = state?.hasLocalPassword;
  const authProvider = state?.authProvider || '';
  const isGoogleOnlyHint = hasLocalPassword === false || authProvider === 'google';

  const [appealStatus, setAppealStatus] = useState(initialAppealStatus);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [verifyMethod, setVerifyMethod] = useState(isGoogleOnlyHint ? 'google' : 'password');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [isGoogleVerifying, setIsGoogleVerifying] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
  );
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    resilientApiFetch('/api/v1/auth/google-client-id', {}, 2)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.clientId) {
          setGoogleClientId(data.clientId);
        }
      })
      .catch(() => {});

    if (typeof window !== 'undefined' && !window.google?.accounts) {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
    return () => {
      active = false;
    };
  }, []);

  // If no state is passed, redirect to login
  if (!state || !state.contact) {
    return <Navigate to="/login" replace />;
  }

  const handleVerifyWithGoogle = () => {
    if (isGoogleVerifying) return;
    if (!googleClientId) {
      setFeedback({ type: 'error', message: 'Google verification is not configured on this server.' });
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      setFeedback({ type: 'warning', message: 'Google Identity Services is still loading. Please try again in a moment.' });
      return;
    }

    try {
      setIsGoogleVerifying(true);
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        prompt: 'consent select_account',
        callback: (tokenResponse) => {
          setIsGoogleVerifying(false);
          if (tokenResponse?.error || !tokenResponse?.access_token) {
            setFeedback({
              type: 'warning',
              message: 'Google verification was cancelled or did not complete. Please try again.'
            });
            return;
          }
          setGoogleAccessToken(tokenResponse.access_token);
        },
        error_callback: () => {
          setIsGoogleVerifying(false);
          setFeedback({
            type: 'error',
            message: 'Unable to open Google verification popup. Please allow popups and try again.'
          });
        }
      });
      tokenClient.requestAccessToken({ prompt: 'consent select_account' });
    } catch {
      setIsGoogleVerifying(false);
      setFeedback({ type: 'error', message: 'Failed to launch Google verification.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || appealStatus === 'pending') return;

    if (!message.trim()) {
      setFeedback({ type: 'warning', message: 'Please provide an appeal message.' });
      return;
    }

    if (verifyMethod === 'google') {
      if (!googleAccessToken) {
        setFeedback({ type: 'warning', message: 'Please click "Verify with Google" first to confirm your account identity.' });
        return;
      }
    } else if (!password) {
      setFeedback({ type: 'warning', message: 'Please provide both an appeal message and your password.' });
      return;
    }

    setIsLoading(true);
    try {
      const payload =
        verifyMethod === 'google'
          ? { contact, googleAccessToken, message: message.trim() }
          : { contact, password, message: message.trim() };

      const response = await resilientApiFetch('/api/v1/auth/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        setAppealStatus('pending');
        setFeedback({ 
          type: 'success', 
          title: 'Appeal Submitted',
          message: 'Your appeal has been submitted successfully. The administrator will review it.' 
        });
        setMessage('');
        setPassword('');
        setGoogleAccessToken('');
      } else {
        if (verifyMethod === 'google' && response.status === 401) {
          setGoogleAccessToken('');
        }
        if (verifyMethod === 'password' && String(data.message || '').toLowerCase().includes('google')) {
          setVerifyMethod('google');
        }
        setFeedback({ 
          type: 'error', 
          message: data.message || (verifyMethod === 'google'
            ? 'Failed to submit appeal. Please re-verify with the Google account linked to this profile.'
            : 'Failed to submit appeal. Please check your password.')
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Cannot connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] placeholder-[#6B6761] dark:placeholder-[#A8A29E] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#9E2A2B] transition-all font-medium min-h-[44px]";

  return (
    <div className="min-h-[100dvh] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center p-4">
      {feedback && (
        <FeedbackModal
          isOpen={true}
          type={feedback.type}
          title={feedback.title || (feedback.type === 'error' ? 'Error' : 'Notice')}
          message={feedback.message}
          onClose={() => setFeedback(null)}
          onConfirm={() => setFeedback(null)}
        />
      )}

      <div className="w-full max-w-md bg-white dark:bg-[#1C1917] rounded-xl shadow-xl overflow-hidden border border-[#E4E1DC] dark:border-[#2E2A27]">
        <div className="bg-red-500/10 p-5 sm:p-6 flex flex-col items-center text-center border-b border-red-500/20">
          <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-3">
            <ShieldAlert size={28} className="text-[#B91C1C]" />
          </div>
          <h1 className="text-lg font-bold text-[#B91C1C] tracking-[-0.02em] mb-1.5">Account Deactivated</h1>
          <p className="text-xs text-[#1F1D1B] dark:text-[#EAE7E1] font-medium bg-white/70 dark:bg-black/30 px-3.5 py-1.5 rounded-md border border-red-500/20">
            Dahilan: {reason || 'No reason provided'}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {appealStatus === 'pending' ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/15 rounded-xl mb-3">
                <AlertCircle size={22} className="text-amber-700 dark:text-amber-400" />
              </div>
              <h2 className="text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">Kasalukuyang Sinusuri ang Apela</h2>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-6 leading-relaxed">
                Naipasa na ang inyong apela at kasalukuyan itong sinusuri ng Municipal Administrator. Magpapadala ng abiso sa inyong rehistradong contact number.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 text-[#9E2A2B] dark:text-[#D4AF37] font-bold text-xs tracking-wide hover:underline min-h-[44px]"
              >
                <ArrowLeft size={16} /> Bumalik sa Log In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-3 text-center leading-relaxed">
                Kung sa tingin ninyo ay nagkaroon ng pagkakamali, maaari kayong magsumite ng opisyal na apela gamit ang form sa ibaba.
              </p>

              <div>
                <label className="block text-[13px] font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] mb-1.5">
                  Mensahe ng Apela (Appeal Message)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 text-[#6B6761] dark:text-[#A8A29E]">
                    <MessageSquare size={18} />
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ipaliwanag kung bakit dapat i-reactivate ang inyong account..."
                    className={`${inputClasses} pl-10 min-h-[100px] resize-none`}
                    required
                  />
                </div>
              </div>

              {/* Identity Verification Method Switcher (Password or Google) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
                    Verify account ownership
                  </span>
                  {hasLocalPassword !== false && (
                    <div className="inline-flex rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] p-0.5 border border-[#E4E1DC] dark:border-[#2E2A27]">
                      <button
                        type="button"
                        onClick={() => setVerifyMethod('password')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                          verifyMethod === 'password'
                            ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm'
                            : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                        }`}
                      >
                        Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerifyMethod('google')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                          verifyMethod === 'google'
                            ? 'bg-white dark:bg-[#1C1917] text-[#9E2A2B] dark:text-[#D4AF37] shadow-sm'
                            : 'text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3]'
                        }`}
                      >
                        Google
                      </button>
                    </div>
                  )}
                </div>

                {verifyMethod === 'google' ? (
                  <div className="p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2.5">
                    <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] leading-relaxed">
                      Sign in with your linked Google account (<strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{contact}</strong>) to verify your appeal without a local password.
                    </p>
                    {googleAccessToken ? (
                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D] dark:text-emerald-400">
                          <CheckCircle2 size={15} />
                          <span>Google identity confirmed</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleVerifyWithGoogle}
                          disabled={isGoogleVerifying}
                          className="text-[11px] font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                        >
                          Re-verify
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyWithGoogle}
                        disabled={isGoogleVerifying}
                        className="w-full flex items-center justify-center gap-2.5 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#25211E] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] py-2.5 px-4 rounded-lg text-xs font-bold shadow-sm transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
                      >
                        {isGoogleVerifying ? (
                          <Loader2 size={16} className="animate-spin text-[#6B6761]" />
                        ) : (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                        )}
                        <span>{isGoogleVerifying ? 'Verifying with Google...' : 'Verify with Google'}</span>
                      </button>
                    )}
                    {hasLocalPassword === false && (
                      <button
                        type="button"
                        onClick={() => setVerifyMethod('password')}
                        className="text-[11px] font-semibold text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] underline cursor-pointer"
                      >
                        Have a local password? Verify with password instead
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute top-1/2 -translate-y-1/2 left-3 text-[#6B6761] dark:text-[#A8A29E]">
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ilagay ang inyong password para sa verification"
                        className={`${inputClasses} pl-10`}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
                      Signed up with Google?{' '}
                      <button
                        type="button"
                        onClick={() => setVerifyMethod('google')}
                        className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        Verify with Google instead
                      </button>
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/login"
                  className="flex-1 flex justify-center items-center py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors min-h-[44px]"
                >
                  Kanselahin
                </Link>
                <button
                  type="submit"
                  disabled={isLoading || (verifyMethod === 'google' && !googleAccessToken)}
                  className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-white bg-[#9E2A2B] hover:bg-[#7A1B22] disabled:opacity-50 transition-colors shadow-sm min-h-[44px] cursor-pointer"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Ipasa ang Apela'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDeactivated;
