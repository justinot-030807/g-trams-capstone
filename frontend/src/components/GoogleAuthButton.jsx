import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { unwrapGoogleProfile } from '../utils/googleAuthUtils';

const GoogleAuthButton = ({ onSuccess, onNewUser, onError, text = 'CONTINUE WITH GOOGLE', className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [clientId, setClientId] = useState(envClientId || '');

  // Fetch client ID from backend (Render) if not set in frontend env (Vercel)
  useEffect(() => {
    if (!envClientId) {
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/google-client-id`)
        .then(res => res.json())
        .then(data => {
          if (data && data.clientId) {
            setClientId(data.clientId);
          }
        })
        .catch(err => console.warn('Could not fetch google-client-id from server:', err));
    }
  }, [envClientId]);

  // Handle One Tap credential response (ID Token JWT)
  const handleOneTapCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setIsLoading(true);

    let decodedProfile = null;
    try {
      decodedProfile = unwrapGoogleProfile(response.credential);
    } catch (dErr) {
      console.warn('Google One Tap JWT decode note:', dErr);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken: response.credential,
          credential: response.credential,
          token: response.credential,
          email: decodedProfile?.email || undefined,
          googleProfile: decodedProfile
        })
      });

      const data = await res.json();
      if (!res.ok) { 
        if (data.accountDeactivated) { 
          if (onError) onError(data); 
          return; 
        } 
        let errorMsg = data.message || 'Google authentication failed.';
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const detailed = data.errors.map(err => err.message).filter(Boolean).join('. ');
          if (detailed) errorMsg = detailed;
        }
        throw new Error(errorMsg); 
      }

      if (data.isNewUser) {
        onNewUser({
          ...(data.googleProfile || decodedProfile || {}),
          credential: response.credential,
          idToken: response.credential
        });
      } else {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Google One Tap error:', err);
      if (onError) onError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google One Tap if client ID exists
  const initializeGoogleOneTap = () => {
    if (!clientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleOneTapCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Triggers Google One Tap bottom sheet (similar to Figma)
      window.google.accounts.id.prompt();
    } catch (err) {
      console.warn('Google One Tap init note:', err);
    }
  };

  // 1. Load official Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadGsiScript = () => {
      if (!window.google?.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initializeGoogleOneTap();
        };
        document.body.appendChild(script);
      } else {
        initializeGoogleOneTap();
      }
    };

    loadGsiScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // 4. Handle button click -> Open official Google Account Chooser popup
  const handleButtonClick = () => {
    // If no Google Client ID is configured yet, show setup guide modal instead of browser prompt
    if (!clientId) {
      setShowConfigModal(true);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      if (onError) onError('Google Identity Services is still loading. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        prompt: 'consent select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setIsLoading(false);
            console.warn('Google sign-in closed or error:', tokenResponse);
            return;
          }

          try {
            // Directly fetch verified userinfo from Google's official endpoint
            let directGoogleProfile = null;
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              if (userInfoRes.ok) {
                const uData = await userInfoRes.json();
                directGoogleProfile = {
                  email: (uData.email || '').toLowerCase().trim(),
                  name: uData.name || '',
                  picture: uData.picture || '',
                  googleId: uData.sub || ''
                };
              }
            } catch (uErr) {
              console.warn('Direct Google userinfo fetch warning:', uErr);
            }

            // Fallback to openidconnect endpoint if oauth2/v3/userinfo was blocked or failed
            if (!directGoogleProfile) {
              try {
                const oidcRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (oidcRes.ok) {
                  const oData = await oidcRes.json();
                  directGoogleProfile = {
                    email: (oData.email || '').toLowerCase().trim(),
                    name: oData.name || '',
                    picture: oData.picture || '',
                    googleId: oData.sub || ''
                  };
                }
              } catch (oErr) {
                console.warn('Direct Google OIDC userinfo warning:', oErr);
              }
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                accessToken: tokenResponse.access_token,
                token: tokenResponse.access_token,
                email: directGoogleProfile?.email || undefined,
                googleProfile: directGoogleProfile
              })
            });

            const data = await res.json();
            if (!res.ok) { 
              if (data.accountDeactivated) { 
                if (onError) onError(data); 
                return; 
              } 
              let errorMsg = data.message || 'Google authentication failed.';
              if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                const detailed = data.errors.map(err => err.message).filter(Boolean).join('. ');
                if (detailed) errorMsg = detailed;
              }
              throw new Error(errorMsg); 
            }

            if (data.isNewUser) {
              onNewUser({
                ...(data.googleProfile || directGoogleProfile || {}),
                accessToken: tokenResponse.access_token
              });
            } else {
              onSuccess(data);
            }
          } catch (err) {
            console.error('Google OAuth error:', err);
            if (onError) onError(err.message || 'Failed to complete Google Sign-In.');
          } finally {
            setIsLoading(false);
          }
        }
      });

      // Opens Google "Choose an account" dialog
      tokenClient.requestAccessToken({ prompt: 'consent select_account' });
    } catch (err) {
      setIsLoading(false);
      console.error('Error requesting Google access token:', err);
      if (onError) onError(err.message || 'Failed to open Google account chooser.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors active:scale-[0.98] disabled:opacity-50 min-h-[44px] cursor-pointer ${className}`}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-[#6B6761]" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        )}
        <span>{text}</span>
      </button>

      {/* Setup Guide Modal if VITE_GOOGLE_CLIENT_ID is missing */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 animate-in fade-in"
            onClick={() => setShowConfigModal(false)}
          />
          <div className="relative bg-white dark:bg-[#1C1917] rounded-lg shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-md p-6 overflow-hidden z-10 animate-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-wide">
                    Google OAuth Client ID Required
                  </h3>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">
                    To show the official Google Account Chooser
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1.5 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-[#6B6761] dark:text-[#A8A29E] space-y-3 leading-relaxed mb-5">
              <p>
                To display the official Google account chooser on your live site, Google requires a registered <strong>Client ID</strong>.
              </p>
              
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-3 space-y-1.5 font-mono text-xs">
                <div className="text-[#6B6761] dark:text-[#A8A29E] font-sans font-bold text-xs uppercase">Add Environment Variable in Render or Vercel:</div>
                <div className="text-[#9E2A2B] dark:text-[#D4AF37] font-bold select-all bg-white dark:bg-[#1C1917] px-2 py-1 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                  GOOGLE_CLIENT_ID
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">Where to add it:</p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[#6B6761] dark:text-[#A8A29E]">
                  <li><strong>Render (Backend):</strong> Add <code className="text-[#1F1D1B] dark:text-[#F6F5F3] font-bold">GOOGLE_CLIENT_ID</code> in your Render Service Environment Variables.</li>
                  <li><strong>Vercel (Frontend):</strong> Or add <code className="text-[#1F1D1B] dark:text-[#F6F5F3] font-bold">VITE_GOOGLE_CLIENT_ID</code> in your Vercel Project Settings.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs min-h-[44px] cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
