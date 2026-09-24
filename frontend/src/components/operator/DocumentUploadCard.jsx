import React, { useRef, useState } from 'react';
import { Camera, Upload, X, ZoomIn, FileCheck, CheckCircle2, RotateCcw, Sparkles, SlidersHorizontal } from 'lucide-react';
import DocumentScannerModal from './DocumentScannerModal';

const DocumentUploadCard = ({ 
  id, 
  label, 
  file, 
  previewUrl, 
  onFileSelect, 
  onFileRemove, 
  onPreviewZoom,
  required = false 
}) => {
  const galleryInputRef = useRef(null);
  const [sizeError, setSizeError] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState(null);

  const hasFile = !!file || !!previewUrl;
  const isPdf = previewUrl?.toLowerCase().includes('.pdf') || (file && file.type === 'application/pdf');

  const handleGalleryChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 15 * 1024 * 1024) {
        setSizeError(true);
        setTimeout(() => setSizeError(false), 4000);
        return;
      }
      setSizeError(false);
      
      // Cleanup previous preview if any
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      onFileSelect(id, selected);
    }
  };

  const handleScannerComplete = ({ file: scannedFile, filter }) => {
    // Cleanup previous preview if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setAppliedFilter(filter);
    onFileSelect(id, scannedFile);
  };

  return (
    <>
      {/* Interactive Camera & Document Scanner Modal */}
      <DocumentScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onComplete={handleScannerComplete}
        documentTitle={label}
      />

      <div className={`relative border-2 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
        hasFile 
          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 shadow-xs' 
          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
      }`}>
        
        {/* Hidden file input for direct file/PDF upload */}
        <input 
          ref={galleryInputRef}
          type="file" 
          accept=".pdf,image/*,.webp,image/webp" 
          onChange={handleGalleryChange}
          className="hidden"
        />

        {/* Card Header: Label & Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate leading-snug">
              {label}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {hasFile ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Document Attached {appliedFilter === 'enhanced' && '(Magic Enhanced)'}
                </span>
              ) : (
                'Clear photo or file (JPG, PNG, WebP, PDF)'
              )}
            </p>
          </div>

          {hasFile && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setAppliedFilter(null);
                if (previewUrl && previewUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(previewUrl);
                }
                onFileRemove(id);
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-red-500 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2"
              title="Remove document"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Middle Body */}
        {!hasFile ? (
          <div className="my-2 py-3 px-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full justify-center mb-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#7A1B22] hover:bg-[#65151c] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
              >
                <Camera size={15} className="text-[#D4AF37]" />
                <span>Scan Document</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs min-h-[44px]"
              >
                <Upload size={15} />
                <span>Upload PDF / File</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Accepts JPG, PNG, WebP, or PDF (up to 15MB)
            </p>
          </div>
        ) : (
          <div className="my-1.5 relative rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[120px]">
            {isPdf ? (
              <div className="p-4 text-center flex flex-col items-center">
                <FileCheck size={32} className="text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">PDF Document</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Verified &amp; Ready</span>
              </div>
            ) : (
              <div className="w-full h-32 relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <img 
                  src={previewUrl} 
                  alt={label} 
                  className="w-full h-full object-contain p-1" 
                />
                <button
                  type="button"
                  onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label })}
                  className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <ZoomIn size={16} />
                  <span>Preview Fullscreen</span>
                </button>
              </div>
            )}

            {/* Retake & Enhance Bar */}
            <div className="w-full bg-emerald-50 dark:bg-emerald-950/70 py-2 px-3 flex items-center justify-between text-xs border-t border-emerald-200 dark:border-emerald-900/60">
              <span className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 size={13} /> Attached
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[#7A1B22] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer min-h-[44px] px-2 -mx-2 text-xs"
                >
                  <RotateCcw size={12} /> Re-scan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Helper */}
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 dark:text-slate-500 font-medium">
          <span>JPG, PNG, or PDF</span>
          <span>Max 15MB</span>
        </div>
        
        {sizeError && (
          <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
            File exceeds size limit. Please choose a smaller file.
          </p>
        )}

      </div>
    </>
  );
};

export default React.memo(DocumentUploadCard);
