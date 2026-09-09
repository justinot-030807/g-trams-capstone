import React, { useState } from 'react';
import { Languages, Check, ArrowRight } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal Dialog Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 p-6 sm:p-8 animate-spring-in overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1B22] via-[#D4AF37] to-[#7A1B22]" />

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 border border-[#7A1B22]/20 dark:border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4 text-[#7A1B22] dark:text-[#D4AF37] shadow-2xs">
          <Languages size={28} />
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
            {selectedLang === 'fil' ? 'Pumili ng Wika' : 'Choose Your Language'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {selectedLang === 'fil' 
              ? 'Piliin ang wikang mas madali para sa iyo. Maaari itong palitan anumang oras.'
              : 'Select your preferred language. You can easily change this anytime in settings.'}
          </p>
        </div>

        {/* Language Selection Cards */}
        <div className="space-y-3 mb-6">
          {/* Filipino / Tagalog */}
          <button
            type="button"
            onClick={() => handleSelect('fil')}
            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between touch-bounce active:scale-[0.98] cursor-pointer ${
              selectedLang === 'fil'
                ? 'border-2 border-[#7A1B22] dark:border-[#D4AF37] bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="text-2xl shrink-0" role="img" aria-label="Philippines Flag">🇵🇭</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Filipino (Tagalog)</h3>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37]">
                    Inirerekomenda
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Madaling intindihin para sa mga tsuper at operator
                </p>
              </div>
            </div>

            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
              selectedLang === 'fil'
                ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-2xs'
                : 'border border-slate-300 dark:border-slate-700'
            }`}>
              {selectedLang === 'fil' && <Check size={14} className="stroke-[3]" />}
            </div>
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between touch-bounce active:scale-[0.98] cursor-pointer ${
              selectedLang === 'en'
                ? 'border-2 border-[#7A1B22] dark:border-[#D4AF37] bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="text-2xl shrink-0" role="img" aria-label="United States Flag">🇺🇸</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">English</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Official municipal and transport terminology
                </p>
              </div>
            </div>

            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
              selectedLang === 'en'
                ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-2xs'
                : 'border border-slate-300 dark:border-slate-700'
            }`}>
              {selectedLang === 'en' && <Check size={14} className="stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:text-slate-950 dark:hover:bg-[#c29e2f] transition-all shadow-md touch-bounce active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            {selectedLang === 'fil' ? 'Magpatuloy sa Dashboard' : 'Continue to Dashboard'}
          </span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default LanguagePreferenceModal;
