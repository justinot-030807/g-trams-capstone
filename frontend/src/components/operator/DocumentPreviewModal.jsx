import React from 'react';
import { X, FileCheck } from 'lucide-react';

const DocumentPreviewModal = ({ fullPreview, setFullPreview }) => {
  if (!fullPreview) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setFullPreview(null)}
    >
      <div 
        className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
            {fullPreview.title || 'Document Preview'}
          </h4>
          <button 
            onClick={() => setFullPreview(null)}
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-950/5 dark:bg-black/30 rounded-2xl p-2">
          {fullPreview.url?.toLowerCase().includes('.pdf') ? (
            <iframe 
              src={fullPreview.url} 
              title={fullPreview.title} 
              className="w-full h-[60vh] rounded-xl border-0"
            />
          ) : (
            <img 
              src={fullPreview.url} 
              alt={fullPreview.title} 
              className="max-h-[65vh] w-auto object-contain rounded-xl shadow-xs" 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
