import React, { useRef, useState } from 'react';
import { Camera, Upload, X, ZoomIn, FileCheck, CheckCircle2, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

const DocumentUploadCard = ({ 
  id, 
  label, 
  file, 
  previewUrl, 
  onFileSelect, 
  onFileRemove, 
  onPreviewZoom,
  required = false,
  isScanning = false,
  scanSuccess = false
}) => {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [sizeError, setSizeError] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const hasFile = !!file || !!previewUrl;
  const isPdf = previewUrl?.toLowerCase().includes('.pdf') || (file && file.type === 'application/pdf');

  const handleFileChange = async (e) => {
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
      
      try {
        setIsCompressing(true);
        const optimized = await compressImage(selected);
        onFileSelect(id, optimized);
      } catch (err) {
        console.error('Compression error:', err);
        onFileSelect(id, selected);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  return (
    <>
      <div className={`relative border rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
        hasFile 
          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 shadow-xs' 
          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
      }`}>
        
        {/* Hidden camera input for direct native camera photo capture */}
        <input 
          ref={cameraInputRef}
          type="file" 
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hidden file input for gallery / PDF upload */}
        <input 
          ref={galleryInputRef}
          type="file" 
          accept=".pdf,image/*,.webp,image/webp" 
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Card Header: Label & Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate leading-snug">
              {label} {required && <span className="text-red-500">*</span>}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {isCompressing ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Loader2 size={13} className="animate-spin" /> Optimizing photo...
                </span>
              ) : isScanning ? (
                <span className="text-[#9E2A2B] dark:text-[#D4AF37] font-bold flex items-center gap-1 animate-pulse">
                  <Sparkles size={13} className="animate-spin" /> AI scanning details...
                </span>
              ) : scanSuccess ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles size={13} /> Auto-filled by AI
                </span>
              ) : hasFile ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Ready
                </span>
              ) : (
                'Attach photo or PDF (Max 10MB)'
              )}
            </p>
          </div>

          {hasFile && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (previewUrl && previewUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(previewUrl);
                }
                onFileRemove(id);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1 -mt-1"
              title="Remove document"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Middle Body */}
        {!hasFile ? (
          <div className="my-1.5 py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full justify-center">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-xs active:scale-95 cursor-pointer min-h-[48px]"
              >
                <Camera size={16} className="text-[#D4AF37]" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs min-h-[48px]"
              >
                <Upload size={16} />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="my-1.5 relative rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[140px]">
            {isPdf ? (
              <div className="p-4 text-center flex flex-col items-center justify-center w-full">
                <FileCheck size={38} className="text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">Naka-attach ang PDF</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2.5">Handa nang i-review</span>
                <button
                  type="button"
                  onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label, isPdf: true })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95 min-h-[44px]"
                >
                  <ZoomIn size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <span>I-preview ang PDF</span>
                </button>
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
                  onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label, isPdf: false })}
                  className="absolute inset-0 bg-black/40 sm:bg-black/30 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <span className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <ZoomIn size={15} />
                    <span>I-preview</span>
                  </span>
                </button>
              </div>
            )}

            {/* Retake & Preview Bar */}
            <div className="w-full bg-emerald-50 dark:bg-emerald-950/70 py-2 px-3 flex items-center justify-between text-xs border-t border-emerald-200 dark:border-emerald-900/60">
              <span className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 size={13} /> Attached
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label, isPdf })}
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer min-h-[44px] px-1 text-xs"
                >
                  <ZoomIn size={12} /> Tingnan
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-[#9E2A2B] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer min-h-[44px] px-1 text-xs"
                >
                  <RotateCcw size={12} /> Palitan
                </button>
              </div>
            </div>
          </div>
        )}

        {sizeError && (
          <p className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400">
            File exceeds 10MB size limit. Please choose a smaller file.
          </p>
        )}

      </div>
    </>
  );
};

export default React.memo(DocumentUploadCard);
