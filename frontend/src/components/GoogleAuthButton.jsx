import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const GoogleAuthButton = ({ onSuccess, onNewUser, onError, text = 'Continue with Google', className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Load official Google Identity Services script
    if (typeof window !== 'undefined' && !window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    setIsLoading(true);
    try {
      const idToken = response.credential;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed.');
      }

      if (data.isNewUser) {
        onNewUser(data.googleProfile);
      } else {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      if (onError) onError(err.message || 'Error signing in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    // 1. If Google Client ID is configured in .env, use official Google Identity Services
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse
        });
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google prompt initialization note:', err);
      }
    }

    // 2. Fallback / Quick Sandbox Mode if VITE_GOOGLE_CLIENT_ID is not yet configured:
    // Allows testing the onboarding flow and real name prompt immediately without waiting for Google Cloud Console!
    const simulatedEmail = window.prompt(
      "G-TRAMS Google Sign-In:\nPakilagay ang iyong Gmail address para masubukan ang Google Onboarding:",
      "operator.gasan@gmail.com"
    );

    if (!simulatedEmail || !simulatedEmail.trim()) return;

    const trimmed = simulatedEmail.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      alert('Pakilagay ang wastong email address.');
      return;
    }

    const defaultName = trimmed.split('@')[0].replace(/[._-]/g, ' ');
    const capitalName = defaultName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    setIsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleProfile: {
          email: trimmed,
          name: capitalName,
          picture: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          googleId: 'google_' + Math.random().toString(36).substring(2, 10)
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.isNewUser) {
          onNewUser(data.googleProfile);
        } else if (data.token) {
          onSuccess(data);
        } else {
          throw new Error(data.message || 'Failed to authenticate');
        }
      })
      .catch(err => {
        if (onError) onError(err.message || 'Error communicating with server.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <button
      type="button"
      onClick={handleButtonClick}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin text-slate-500" />
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
  );
};

export default GoogleAuthButton;
