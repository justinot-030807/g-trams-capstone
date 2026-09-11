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
    <div className={`relative border-2 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
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
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {hasFile ? '✓ Dokumentong napili' : 'Kumuha ng litrato o pumili ng file'}
          </p>
        </div>

        {hasFile && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onFileRemove(id);
            }}
            className="text-slate-400 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
            title="Tanggalin ang dokumento"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Middle Body */}
      {!hasFile ? (
        <div className="my-2 py-3 px-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/60 dark:bg-slate-900/40">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full justify-center mb-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#7A1B22] hover:bg-[#8E2028] text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer min-h-[38px]"
            >
              <Camera size={15} />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs min-h-[38px]"
            >
              <Upload size={15} />
              <span>Files / Gallery</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Malinaw na litrato ng dokumento
          </p>
        </div>
      ) : (
        <div className="my-1.5 relative rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[120px]">
          {isPdf ? (
            <div className="p-3 text-center flex flex-col items-center">
              <FileCheck size={28} className="text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Dokumentong PDF</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Handa nang isumite</span>
            </div>
          ) : (
            <div className="w-full h-28 relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <img 
                src={previewUrl} 
                alt={label} 
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={() => onPreviewZoom && onPreviewZoom({ url: previewUrl, title: label })}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 text-xs font-bold cursor-pointer"
              >
                <ZoomIn size={16} />
                <span>Tingnan</span>
              </button>
            </div>
          )}

          {/* Quick Retake Action */}
          <div className="w-full bg-emerald-100/80 dark:bg-emerald-950/70 py-1.5 px-3 flex items-center justify-between text-xs border-t border-emerald-200 dark:border-emerald-900/60">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 size={13} /> Handa na
            </span>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="text-[#7A1B22] dark:text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
            >
              <RotateCcw size={11} /> Palitan
            </button>
          </div>
        </div>
      )}

      {/* Footer Helper */}
      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
        <span>JPG, PNG, o PDF</span>
        <span>Hanggang 10MB</span>
      </div>

    </div>
  );
};

export default DocumentUploadCard;
