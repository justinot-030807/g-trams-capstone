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
  onRescan = null,
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
      <div className={`relative border rounded-lg p-3.5 sm:p-4 transition-colors flex flex-col justify-between overflow-hidden group ${
        hasFile 
          ? 'bg-white dark:bg-[#1C1917] border-emerald-600/40 dark:border-emerald-500/40 shadow-xs' 
          : 'bg-white dark:bg-[#1C1917] border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/40 dark:hover:border-[#D4AF37]/40'
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
            <p className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] truncate leading-snug">
              {label} {required && <span className="text-[#B91C1C] dark:text-[#EF4444]">*</span>}
            </p>
            <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
              {isCompressing ? (
                <span className="text-[#B45309] dark:text-[#FBBF24] font-medium flex items-center gap-1">
                  <Loader2 size={13} className="animate-spin" /> Optimizing photo...
                </span>
              ) : isScanning ? (
                <span className="text-[#9E2A2B] dark:text-[#D4AF37] font-semibold flex items-center gap-1">
                  <Sparkles size={13} className="animate-spin" /> Scanning details...
                </span>
              ) : scanSuccess ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles size={13} /> Auto-filled from document
                </span>
              ) : hasFile ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={13} /> Attached & Ready
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
              className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#B91C1C] p-2 rounded-lg hover:bg-[#B91C1C]/10 transition-colors shrink-0 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1 -mt-1"
              title="Remove document"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Middle Body */}
        {!hasFile ? (
          <div className="my-1.5 py-3 px-3 border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg flex flex-col items-center justify-center text-center bg-[#F6F5F3] dark:bg-[#14110F]">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full justify-center">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
              >
                <Camera size={16} />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors active:scale-95 cursor-pointer shadow-xs min-h-[44px]"
              >
                <Upload size={16} />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="my-1.5 relative rounded-lg overflow-hidden border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center min-h-[140px]">
            {isPdf ? (
              <div className="p-4 text-center flex flex-col items-center justify-center w-full">
                <FileCheck size={38} className="text-emerald-700 dark:text-emerald-400 mb-1.5" />
                <span className="text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">PDF Attached</span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-2.5">Ready for review</span>
                <button
                  type="button"
                  onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label, isPdf: true })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white dark:bg-[#1C1917] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] transition-colors border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs cursor-pointer active:scale-95 min-h-[44px]"
                >
                  <ZoomIn size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  <span>Preview PDF</span>
                </button>
              </div>
            ) : (
              <div className="w-full h-32 relative overflow-hidden flex items-center justify-center bg-[#F6F5F3] dark:bg-[#14110F]">
                <img 
                  src={previewUrl} 
                  alt={label} 
                  className="w-full h-full object-contain p-1" 
                />
                <button
                  type="button"
                  onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label, isPdf: false })}
                  className="absolute inset-0 bg-black/50 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <span className="bg-black/70 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <ZoomIn size={15} />
                    <span>Preview</span>
                  </span>
                </button>
              </div>
            )}

            {/* Retake, Re-scan & Preview Bar */}
            <div className="w-full bg-emerald-500/10 dark:bg-emerald-950/40 py-2 px-3 flex items-center justify-between text-xs border-t border-emerald-500/20">
              <span className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 size={13} /> Attached
              </span>
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-end">
                {onRescan && !isPdf && (
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => onRescan(id)}
                    className="text-[#9E2A2B] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer min-h-[44px] px-1 text-xs disabled:opacity-50"
                    title="Re-run AI OCR extraction on this document"
                  >
                    {isScanning ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    <span>{isScanning ? 'Scanning...' : 'Re-scan'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label, isPdf })}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer min-h-[44px] px-1 text-xs"
                >
                  <ZoomIn size={12} /> View
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-[#6B6761] dark:text-[#A8A29E] font-semibold hover:underline flex items-center gap-1 cursor-pointer min-h-[44px] px-1 text-xs"
                >
                  <RotateCcw size={12} /> Replace
                </button>
              </div>
            </div>
          </div>
        )}

        {sizeError && (
          <p className="mt-1.5 text-xs font-semibold text-[#B91C1C] dark:text-[#EF4444]">
            File exceeds 10MB size limit. Please choose a smaller file.
          </p>
        )}

      </div>
    </>
  );
};

export default React.memo(DocumentUploadCard);
