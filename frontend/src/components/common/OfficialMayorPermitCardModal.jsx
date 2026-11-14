import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import OfficialMayorPermitCard from './OfficialMayorPermitCard';

const OfficialMayorPermitCardModal = ({
  isOpen,
  onClose,
  unit = {},
  permitYear = 2027
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[140] bg-black/80 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[760px] flex flex-col items-center shrink-0 print:max-w-full print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button for Desktop */}
        <button
          onClick={onClose}
          type="button"
          className="absolute -top-3 -right-3 z-50 bg-[#1F1D1B] hover:bg-[#2E2A27] text-white p-2 rounded-full border border-white/20 shadow-xl transition-all cursor-pointer print:hidden"
          title="Close Preview (Esc)"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <OfficialMayorPermitCard 
          unit={unit} 
          permitYear={permitYear}
          showActions={true} 
        />
      </div>
    </div>
  );
};

export default OfficialMayorPermitCardModal;
