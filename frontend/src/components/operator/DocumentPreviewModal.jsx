import React, { useEffect } from 'react';
import { X, FileCheck, ExternalLink, Download } from 'lucide-react';

const DocumentPreviewModal = ({ 
  fullPreview, 
  setFullPreview, 
  fileUrl, 
  isOpen = true, 
  onClose 
}) => {
  // Normalize input props (supports both fullPreview object/string and fileUrl prop)
  const activeData = fullPreview || fileUrl;
  const isModalOpen = Boolean(activeData && (isOpen !== undefined ? isOpen : true));

  const handleClose = () => {
    if (onClose) onClose();
    if (setFullPreview) setFullPreview(null);
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  if (!isModalOpen || !activeData) return null;

  const url = typeof activeData === 'string' ? activeData : (activeData.url || activeData.fileUrl || '');
  const title = typeof activeData === 'object' ? (activeData.title || activeData.label || 'Document Preview') : 'Document Preview';
  
  const isPdf = Boolean(
    (typeof activeData === 'object' && (activeData.isPdf || activeData.type === 'application/pdf')) ||
    (typeof url === 'string' && (
      url.toLowerCase().includes('.pdf') || 
      url.toLowerCase().includes('/raw/upload') ||
      url.startsWith('data:application/pdf')
    ))
  );

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative max-w-4xl w-full max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 text-[#9E2A2B] dark:text-[#D4AF37]">
              <FileCheck size={18} />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {title}
            </h4>
            {isPdf && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                PDF
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] px-3 py-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                title="Buksan sa hiwalay na window o i-download"
              >
                <span className="hidden sm:inline">Buksan sa hiwalay na tab</span>
                <ExternalLink size={14} />
              </a>
            )}
            <button 
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Isara"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content Body */}
        <div className="flex-1 overflow-auto flex flex-col items-center justify-center bg-slate-100 dark:bg-black/40 p-2 sm:p-4 min-h-[300px]">
          {isPdf ? (
            <div className="w-full flex-1 flex flex-col min-h-[65vh]">
              <iframe 
                src={url} 
                title={title} 
                className="w-full flex-1 h-[60vh] sm:h-[68vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
              />
              <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <span>Hindi ma-render ang PDF?</span>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline inline-flex items-center gap-1"
                >
                  I-click dito para buksan o i-download <Download size={12} />
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-2">
              <img 
                src={url} 
                alt={title} 
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-md border border-slate-200 dark:border-slate-800" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
