import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, Check } from 'lucide-react';

const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone (installed) mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 4 days)
    const lastDismissed = localStorage.getItem('gtrams_pwa_dismissed');
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 4) return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Delay prompt on iOS for smooth entrance
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chromium beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 2.5 seconds before presenting for better user experience
      setTimeout(() => setShowBanner(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback instruction for Android if prompt not available
      alert('To install G-TRAMS: tap the 3 dots (menu) in your browser and select "Install app" or "Add to Home screen".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('gtrams_pwa_dismissed', Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Floating PWA Install Banner */}
      <div 
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[999] bg-gradient-to-r from-[#7A1B22] via-[#8E2028] to-[#5A1419] text-white p-4 rounded-2xl shadow-2xl border-2 border-[#D4AF37]/50 animate-bounce-short transition-all"
        style={{
          boxShadow: '0 20px 35px -10px rgba(122, 27, 34, 0.65)'
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-white rounded-xl p-1 shadow-md flex items-center justify-center shrink-0 border border-white/20">
            <img src="/gasan-logo.png" alt="G-TRAMS" className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-black tracking-widest text-[#D4AF37] uppercase bg-black/25 px-2 py-0.5 rounded-full">
                LGU Mobile App
              </span>
            </div>
            <h4 className="text-sm font-black text-white leading-tight">Install G-TRAMS App</h4>
            <p className="text-xs text-white/80 font-medium leading-tight mt-1">
              Add to your phone for quick offline access and franchise notifications.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-95 text-slate-950 px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} className="stroke-[2.5]" />
                <span>Install Now</span>
              </button>

              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white text-xs font-semibold px-2 py-1.5 transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#7A1B22]/10 dark:bg-[#7A1B22]/30 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37]">
                  <Smartphone size={18} />
                </div>
                <h3 className="font-extrabold text-sm">Install on iPhone / iPad</h3>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
              Safari on iOS requires manual installation. Follow these 2 easy steps:
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 size={14} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">1. Tap the Share Button</p>
                  <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400 text-xs">Located at the bottom bar of your Safari browser.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare size={14} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">2. Tap "Add to Home Screen"</p>
                  <p className="text-slate-500 dark:text-slate-600 dark:text-slate-400 text-xs">Scroll down the share options and tap "Add to Home Screen".</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                setShowBanner(false);
              }}
              className="w-full bg-[#7A1B22] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#631419] transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              <span>Got it, thanks!</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallBanner;
