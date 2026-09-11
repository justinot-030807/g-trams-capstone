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
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/60 shadow-inner">
            <AlertCircle size={30} className="stroke-[2.5]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/60 shadow-inner">
            <AlertTriangle size={30} className="stroke-[2.5]" />
          </div>
        );
      case 'info':
        return (
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-900/60 shadow-inner">
            <Info size={30} className="stroke-[2.5]" />
          </div>
        );
      case 'success':
      default:
        return (
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-900/60 shadow-inner">
            <CheckCircle2 size={30} className="stroke-[2.5]" />
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose || handleConfirm}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-sm w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {getIcon()}

        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          {title}
        </h3>

        {message && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
            {message}
          </p>
        )}

        <div className={`flex items-center gap-2.5 ${cancelText ? 'flex-row' : 'flex-col'}`}>
          {cancelText && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer min-h-[42px] active:scale-95"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full ${cancelText ? 'flex-1' : ''} bg-[#7A1B22] hover:bg-[#5A1419] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer min-h-[42px] flex items-center justify-center`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
