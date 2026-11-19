import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const FeedbackModal = ({
  isOpen,
  type = 'success',
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onClose,
  isLoading = false
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (onClose) onClose();
        else if (onConfirm) onConfirm();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else if (onClose) onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#B91C1C] dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/60">
            <AlertCircle size={28} className="stroke-[2.2]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#B45309] dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/60">
            <AlertTriangle size={28} className="stroke-[2.2]" />
          </div>
        );
      case 'info':
        return (
          <div className="w-14 h-14 rounded-xl bg-[#FDF2F4] dark:bg-[#9E2A2B]/25 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center mx-auto mb-4 border border-[#F8C5CA] dark:border-[#9E2A2B]/40">
            <Info size={28} className="stroke-[2.2]" />
          </div>
        );
      case 'success':
      default:
        return (
          <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#15803D] dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-900/60">
            <CheckCircle2 size={28} className="stroke-[2.2]" />
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose || handleConfirm}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl p-6 sm:p-7 shadow-xl max-w-sm w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1.5 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {getIcon()}

        <h3 className="text-base sm:text-lg font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-[-0.015em] mb-2">
          {title}
        </h3>

        {message && (
          <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] leading-relaxed mb-6 font-medium">
            {message}
          </p>
        )}

        <div className={`flex items-center gap-2.5 ${cancelText ? 'flex-row' : 'flex-col'}`}>
          {cancelText && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#2E2A27] hover:bg-[#E4E1DC] dark:hover:bg-[#3D3834] border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer min-h-[44px] active:scale-[0.98]"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full ${cancelText ? 'flex-1' : ''} bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-[#14110F] font-bold text-xs sm:text-sm py-2.5 px-6 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer min-h-[44px] flex items-center justify-center`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
