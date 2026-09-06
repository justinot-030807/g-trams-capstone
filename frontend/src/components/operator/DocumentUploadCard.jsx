import React, { useRef } from 'react';
import { Camera, Upload, X, ZoomIn, FileCheck, CheckCircle2, RotateCcw, FileText } from 'lucide-react';

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
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const hasFile = !!file || !!previewUrl;
  const isPdf = previewUrl?.toLowerCase().includes('.pdf') || (file && file.type === 'application/pdf');

  const handleCameraChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(id, e.target.files[0]);
    }
  };

  const handleGalleryChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(id, e.target.files[0]);
    }
  };

  return (
    <div className={`relative border-2 rounded-2xl p-3 transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
      hasFile 
        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-xs' 
        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    }`}>
      
      {/* Hidden file inputs: One with capture="environment" for camera, one standard for file gallery */}
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
      />
      <input 
        ref={galleryInputRef}
        type="file" 
        accept=".pdf,image/*" 
        onChange={handleGalleryChange}
        className="hidden"
      />

      {/* Card Header: Label & Status */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {hasFile ? 'Document captured' : 'Photo or PDF required'}
          </p>
        </div>

        {hasFile && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onFileRemove(id);
            }}
            className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors shrink-0"
            title="Remove document"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Middle Body */}
      {!hasFile ? (
        <div className="my-2 py-4 px-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-[#7A1B22] hover:bg-[#8E2028] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <Camera size={13} />
              <span>Take Photo</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <Upload size={13} />
              <span>Gallery</span>
            </button>
          </div>
          <p className="text-[9px] text-slate-400 leading-tight">
            Clear, well-lit photo of document
          </p>
        </div>
      ) : (
        <div className="my-1 relative rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[110px]">
          {isPdf ? (
            <div className="p-3 text-center flex flex-col items-center">
              <FileCheck size={28} className="text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">PDF Document</span>
              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5">Ready for review</span>
            </div>
          ) : (
            <div className="w-full h-24 relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <img 
                src={previewUrl} 
                alt={label} 
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label })}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1 text-xs font-bold"
              >
                <ZoomIn size={16} />
                <span>Inspect</span>
              </button>
            </div>
          )}

          {/* Quick Retake Action */}
          <div className="w-full bg-emerald-100/70 dark:bg-emerald-950/60 p-1.5 flex items-center justify-between text-[10px] border-t border-emerald-200 dark:border-emerald-900/60 px-2">
            <span className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={12} /> Ready
            </span>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="text-[#7A1B22] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw size={10} /> Retake
            </button>
          </div>
        </div>
      )}

      {/* Footer Helper */}
      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
        <span>JPG, PNG, or PDF</span>
        <span>Max 10MB</span>
      </div>

    </div>
  );
};

export default DocumentUploadCard;
