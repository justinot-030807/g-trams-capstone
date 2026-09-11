import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Check, ArrowRight, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LanguagePreferenceModal = ({ isOpen, onConfirm }) => {
  const { language, changeLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(language || 'en');

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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleContinue}
      />

      {/* Sleek Compact Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 animate-spring-in z-10 overflow-hidden">
        {/* Accent Top Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7A1B22] via-[#D4AF37] to-[#7A1B22]" />

        {/* Compact Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
            <Globe size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {isFilipino ? 'Pumili ng Wika' : 'Select Language'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {isFilipino ? 'Tagalog o English para sa buong portal' : 'Choose your preferred portal language'}
            </p>
          </div>
        </div>

        {/* Two Simple Language Tiles */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {/* Filipino */}
          <button
            type="button"
            onClick={() => handleSelect('fil')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 active:scale-95 cursor-pointer relative flex flex-col justify-between ${
              selectedLang === 'fil'
                ? 'border-2 border-[#7A1B22] dark:border-[#D4AF37] bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🇵🇭</span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                selectedLang === 'fil'
                  ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950'
                  : 'border border-slate-300 dark:border-slate-600'
              }`}>
                {selectedLang === 'fil' && <Check size={12} className="stroke-[3]" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Filipino</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tagalog</p>
            </div>
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 active:scale-95 cursor-pointer relative flex flex-col justify-between ${
              selectedLang === 'en'
                ? 'border-2 border-[#7A1B22] dark:border-[#D4AF37] bg-[#7A1B22]/5 dark:bg-[#D4AF37]/10 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🇺🇸</span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                selectedLang === 'en'
                  ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950'
                  : 'border border-slate-300 dark:border-slate-600'
              }`}>
                {selectedLang === 'en' && <Check size={12} className="stroke-[3]" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">English</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Default</p>
            </div>
          </button>
        </div>

        {/* Clean Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#7A1B22] to-[#922129] hover:from-[#5A1419] hover:to-[#7A1B22] dark:from-[#D4AF37] dark:to-[#bfa035] dark:text-slate-950 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{isFilipino ? 'Magpatuloy sa Portal' : 'Continue to Portal'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(modalContent, document.body)
    : null;
};

export default LanguagePreferenceModal;
