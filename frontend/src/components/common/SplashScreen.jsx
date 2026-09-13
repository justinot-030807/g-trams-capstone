import React, { useState, useEffect } from 'react';

const SplashScreen = () => {
  const [shouldShow, setShouldShow] = useState(() => {
    if (typeof window === 'undefined') return false;

    // Check if app is running as an installed PWA on mobile (Standalone mode)
    const urlParams = new URLSearchParams(window.location.search);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      urlParams.get('source') === 'pwa';

    // DO NOT show splash screen on normal web browser unless running as installed PWA
    if (!isStandalone && !urlParams.has('splash')) {
      return false;
    }

    const shown = sessionStorage.getItem('gtrams_splash_shown');
    return !shown || urlParams.has('splash');
  });

  const [stage, setStage] = useState('init'); // 'init' -> 'enter' -> 'progress' -> 'exit' -> 'done'
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!shouldShow) return;

    // Stage 1: Trigger entry animation shortly after mount
    const tEnter = setTimeout(() => {
      setStage('enter');
      setProgress(25);
    }, 60);

    // Stage 2: Progress loading bar
    const tProg1 = setTimeout(() => {
      setProgress(65);
    }, 450);

    const tProg2 = setTimeout(() => {
      setProgress(100);
    }, 900);

    // Stage 3: Begin smooth fade out
    const tExit = setTimeout(() => {
      setStage('exit');
      sessionStorage.setItem('gtrams_splash_shown', 'true');
    }, 1250);

    // Stage 4: Remove from DOM
    const tDone = setTimeout(() => {
      setStage('done');
      setShouldShow(false);
    }, 1750);

    return () => {
      clearTimeout(tEnter);
      clearTimeout(tProg1);
      clearTimeout(tProg2);
      clearTimeout(tExit);
      clearTimeout(tDone);
    };
  }, [shouldShow]);

  if (!shouldShow || stage === 'done') return null;

  const isEntering = stage === 'enter' || stage === 'progress';
  const isExiting = stage === 'exit';

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 select-none transition-all duration-500 ease-in-out ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Centered Brand Content */}
      <div className="flex flex-col items-center justify-center space-y-4 px-6 text-center">
        {/* Seal / Logo with smooth entrance scale & subtle pulse */}
        <div
          className={`w-28 h-28 sm:w-36 sm:h-36 transition-all duration-700 ease-out transform ${
            isEntering
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-75 translate-y-3'
          }`}
        >
          <img
            src="/gasan-logo.png"
            alt="GTRAMS Logo"
            className="w-full h-full object-contain filter drop-shadow-md"
            loading="eager"
          />
        </div>

        {/* Text: ONLY GTRAMS */}
        <div
          className={`transition-all duration-700 delay-150 ease-out transform ${
            isEntering
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-90 translate-y-2'
          }`}
        >
          <h1 className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-[#7A1B22] dark:text-[#e84c58] font-sans">
            GTRAMS
          </h1>
        </div>

        {/* Maroon Loading Bar */}
        <div
          className={`w-44 sm:w-52 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700/60 shadow-inner mt-2 transition-all duration-700 delay-200 ease-out transform ${
            isEntering
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <div
            className="h-full bg-[#7A1B22] dark:bg-[#e84c58] rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
