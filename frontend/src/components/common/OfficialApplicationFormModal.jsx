import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import OfficialApplicationForm from './OfficialApplicationForm';

const OfficialApplicationFormModal = ({
  isOpen,
  onClose,
  formData = {},
  isRenewal = false
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="printable-application-modal-root"
      className="fixed inset-0 z-[120] bg-black/75 overflow-y-auto overscroll-contain flex flex-col items-center justify-start p-2 sm:p-6 pb-28 pt-2 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[780px] flex flex-col items-center shrink-0 print:max-w-full print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top close button bar */}
        <div className="w-full flex justify-end pb-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <X size={16} />
            <span>Close (Esc)</span>
          </button>
        </div>

        {/* Embedded Official Form */}
        <OfficialApplicationForm
          formData={formData}
          isRenewal={isRenewal}
          showActions={true}
        />
      </div>
    </div>
  );
};

export default OfficialApplicationFormModal;
