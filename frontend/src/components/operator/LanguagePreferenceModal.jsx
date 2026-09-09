import React, { useState } from 'react';
import { Languages, Check, ArrowRight, Sparkles, Globe, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LanguagePreferenceModal = ({ isOpen, onConfirm }) => {
  const { language, changeLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(language || 'fil');

  if (!isOpen) return null;

  const handleSelect = (lang) => {
    setSelectedLang(lang);
    changeLanguage(lang);
  };

  const handleContinue = () => {
    changeLanguage(selectedLang);
    if (onConfirm) {
      onConfirm(selectedLang);
    }
  };

  const isFilipino = selectedLang === 'fil';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dynamic Ambient Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-none" />

      {/* Decorative Glow Orbs */}
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7A1B22]/20 dark:bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#D4AF37]/15 dark:bg-[#7A1B22]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6 sm:p-8 animate-spring-in z-10 overflow-hidden">
        {/* Top Multi-Stop Luxury Gradient Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1B22] via-[#D4AF37] to-[#7A1B22]" />

        {/* Hero Icon with Ambient Ring */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7A1B22]/20 to-[#D4AF37]/30 dark:from-[#D4AF37]/20 dark:to-[#7A1B22]/20 blur-md" />
          <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shadow-md">
            <Globe size={30} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
            {isFilipino ? 'Pumili ng Wikang Nais Gamitin' : 'Select Your Preferred Language'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            {isFilipino 
              ? 'Piliin ang wikang pinaka-komportable para sa iyo. Awtomatikong aangkop ang buong portal.'
              : 'Select your preferred language. The entire portal will seamlessly adapt to your choice.'}
          </p>
        </div>

        {/* Language Selection Cards */}
        <div className="space-y-3 mb-5">
          {/* Filipino / Tagalog */}
          <button
            type="button"
            onClick={() => handleSelect('fil')}
            className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between touch-bounce active:scale-[0.98] cursor-pointer group ${
              selectedLang === 'fil'
                ? 'border-2 border-[#7A1B22] dark:border-[#D4AF37] bg-gradient-to-r from-[#7A1B22]/5 via-amber-500/5 to-transparent dark:from-[#D4AF37]/15 dark:to-transparent shadow-md'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                🇵🇭
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Filipino (Tagalog)</h3>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#7A1B22]/10 dark:bg-[#D4AF37]/20 text-[#7A1B22] dark:text-[#D4AF37] border border-[#7A1B22]/15 dark:border-[#D4AF37]/30">
                    Inirerekomenda
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Madaling gamitin para sa mga tsuper at operator
                </p>
              </div>
            </div>

            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-2 transition-all ${
              selectedLang === 'fil'
                ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-md ring-2 ring-[#7A1B22]/30 dark:ring-[#D4AF37]/30'
                : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 bg-transparent'
            }`}>
              {selectedLang === 'fil' ? (
                <Check size={15} className="stroke-[3]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors" />
              )}
            </div>
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between touch-bounce active:scale-[0.98] cursor-pointer group ${
              selectedLang === 'en'
                ? 'border-2 border-[#7A1B22] dark:border-[#D4AF37] bg-gradient-to-r from-[#7A1B22]/5 via-amber-500/5 to-transparent dark:from-[#D4AF37]/15 dark:to-transparent shadow-md'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                🇺🇸
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">English</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Official municipal and transport regulatory terms
                </p>
              </div>
            </div>

            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-2 transition-all ${
              selectedLang === 'en'
                ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-md ring-2 ring-[#7A1B22]/30 dark:ring-[#D4AF37]/30'
                : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 bg-transparent'
            }`}>
              {selectedLang === 'en' ? (
                <Check size={15} className="stroke-[3]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors" />
              )}
            </div>
          </button>
        </div>

        {/* Live Interactive Sample Phrase Box */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#7A1B22] dark:text-[#D4AF37] shrink-0 mt-0.5">
            <MessageSquare size={14} />
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-0.5">
              {isFilipino ? 'Halimbawa sa Dashboard:' : 'Dashboard Preview:'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 italic">
              {isFilipino
                ? '"Magandang araw! Handa na ang iyong Claim Stub voucher para sa Municipal Cashier."'
                : '"Good day! Your Claim Stub voucher is ready for the Municipal Cashier."'}
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 px-6 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-[#7A1B22] to-[#922129] hover:from-[#5A1419] hover:to-[#7A1B22] dark:from-[#D4AF37] dark:to-[#bfa035] dark:text-slate-950 dark:hover:from-[#c29e2f] dark:hover:to-[#a88625] transition-all shadow-lg hover:shadow-xl touch-bounce active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer group"
        >
          <span>
            {isFilipino ? 'I-save at Magpatuloy sa Dashboard' : 'Confirm & Continue to Dashboard'}
          </span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Bottom Helper Note */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-3.5">
          {isFilipino
            ? 'Maaari mo itong palitan anumang oras sa pamamagitan ng "EN/FIL" button sa itaas.'
            : 'You can change your language anytime using the "EN/FIL" toggle in the top navbar.'}
        </p>
      </div>
    </div>
  );
};

export default LanguagePreferenceModal;
