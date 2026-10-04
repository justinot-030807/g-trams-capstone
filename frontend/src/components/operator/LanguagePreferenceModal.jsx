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
    localStorage.setItem('gtrams_lang_selected', 'true');
    localStorage.setItem('gtrams_lang_selected_global', 'true');
    if (onConfirm) {
      onConfirm(selectedLang);
    }
  };

  const isFilipino = selectedLang === 'fil';

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 animate-in fade-in duration-200 cursor-pointer"
        onClick={handleContinue}
      />

      {/* Sleek Compact Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg shadow-xl p-5 sm:p-6 z-10 overflow-hidden">
        {/* Accent Top Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#9E2A2B]" />

        {/* Compact Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
            <Globe size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight leading-snug">
              {isFilipino ? 'Pumili ng Wika' : 'Select Language'}
            </h3>
            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium truncate">
              {isFilipino ? 'Tagalog o English para sa buong portal' : 'Choose your preferred portal language'}
            </p>
          </div>
        </div>

        {/* Two Simple Language Tiles */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {/* English (Default) */}
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer relative flex flex-col justify-between min-h-[90px] ${
              selectedLang === 'en'
                ? 'border border-[#9E2A2B] dark:border-[#D4AF37] bg-[#9E2A2B]/5 dark:bg-[#D4AF37]/10 shadow-xs'
                : 'border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:border-[#9E2A2B]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E4E1DC]/70 dark:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tracking-wider">
                EN
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                selectedLang === 'en'
                  ? 'bg-[#9E2A2B] dark:bg-[#D4AF37] text-white dark:text-[#14110F]'
                  : 'border border-[#E4E1DC] dark:border-[#2E2A27]'
              }`}>
                {selectedLang === 'en' && <Check size={12} className="stroke-[3]" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">English</p>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">Default</p>
            </div>
          </button>

          {/* Filipino */}
          <button
            type="button"
            onClick={() => handleSelect('fil')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer relative flex flex-col justify-between min-h-[90px] ${
              selectedLang === 'fil'
                ? 'border border-[#9E2A2B] dark:border-[#D4AF37] bg-[#9E2A2B]/5 dark:bg-[#D4AF37]/10 shadow-xs'
                : 'border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] hover:border-[#9E2A2B]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E4E1DC]/70 dark:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] font-mono tracking-wider">
                FIL
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                selectedLang === 'fil'
                  ? 'bg-[#9E2A2B] dark:bg-[#D4AF37] text-white dark:text-[#14110F]'
                  : 'border border-[#E4E1DC] dark:border-[#2E2A27]'
              }`}>
                {selectedLang === 'fil' && <Check size={12} className="stroke-[3]" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">Filipino</p>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">Tagalog</p>
            </div>
          </button>
        </div>

        {/* Clean Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3 px-4 rounded-lg font-bold text-xs text-white bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] dark:text-[#14110F] transition-colors shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
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
