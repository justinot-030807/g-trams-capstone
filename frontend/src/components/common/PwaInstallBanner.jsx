import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, Check } from 'lucide-react';
import { toast } from 'sonner';

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
      toast.info('To install G-TRAMS: tap the browser menu (3 dots) and select "Install app" or "Add to Home screen".', {
        duration: 6000,
      });
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
      {/* Floating PWA Install Banner (anchored bottom-left on desktop so it never collides with bottom-right widgets) */}
      <div 
        className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-sm z-[999] bg-gradient-to-r from-[#9E2A2B] via-[#8E2028] to-[#7A1B22] text-white p-4 rounded-xl shadow-xl border border-[#D4AF37]/50 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-white rounded-xl p-1 shadow-md flex items-center justify-center shrink-0 border border-white/20">
            <img src="/gasan-logo.png" alt="G-TRAMS" className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold tracking-wider text-[#F5E6B3] uppercase bg-black/30 px-2 py-0.5 rounded-full">
                LGU Mobile App
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white leading-tight">Install G-TRAMS App</h4>
            <p className="text-xs text-white/85 font-medium leading-tight mt-1">
              Add to your phone for quick offline access and franchise notifications.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="bg-[#D4AF37] hover:bg-[#c29e2f] active:scale-[0.98] text-[#14110F] px-3.5 py-2 min-h-[38px] rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} className="stroke-[2.5]" />
                <span>Install Now</span>
              </button>

              <button
                onClick={handleDismiss}
                className="text-white/75 hover:text-white text-xs font-semibold px-2 py-1.5 transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Close"
            aria-label="Dismiss install banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#1C1917] rounded-xl p-6 max-w-sm w-full shadow-xl border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3]">
            <div className="flex items-center justify-between mb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37]">
                  <Smartphone size={18} />
                </div>
                <h3 className="font-bold text-sm">Install on iPhone / iPad</h3>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                aria-label="Close iOS instructions"
                className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1.5 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mb-4 leading-relaxed font-medium">
              Safari on iOS requires manual installation. Follow these 2 easy steps:
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3 p-3 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="w-7 h-7 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 size={14} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">1. Tap the Share Button</p>
                  <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs mt-0.5">Located at the bottom bar of your Safari browser.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#15803D] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare size={14} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">2. Tap "Add to Home Screen"</p>
                  <p className="text-[#6B6761] dark:text-[#A8A29E] text-xs mt-0.5">Scroll down the share options and tap "Add to Home Screen".</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                setShowBanner(false);
              }}
              className="w-full bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-[#14110F] py-2.5 min-h-[44px] rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
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
