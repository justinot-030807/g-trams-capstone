import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Upload, RotateCw, Check, X, RefreshCw, 
  Sparkles, FlipHorizontal, ArrowLeft
} from 'lucide-react';

const DocumentScannerModal = ({
  isOpen,
  onClose,
  onComplete,
  documentTitle = 'Document'
}) => {
  // Mode: 'camera' | 'preview'
  const [mode, setMode] = useState('camera');
  const [capturedImage, setCapturedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  
  // Camera state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // Enhancement state (CamScanner Magic Color)
  const [isEnhanced, setIsEnhanced] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hidden gallery file input
  const galleryInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Start / Stop Camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCameraReady(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser. You can select a file instead.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.log('Video play error:', e));
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError(err.message || 'Unable to access device camera.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, startCamera, stopCamera]);

  // Capture snapshot from video feed
  const handleShutterCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Scale down to max 1024px width to save memory
    const MAX_WIDTH = 1024;
    const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || 1280));
    
    const canvas = document.createElement('canvas');
    canvas.width = (video.videoWidth || 1280) * scale;
    canvas.height = (video.videoHeight || 720) * scale;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 0.85 for better compression
    stopCamera();
    loadCapturedImage(dataUrl);
  };

  // Handle image selected from gallery / file input
  const handleGalleryFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      stopCamera();
      loadCapturedImage(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Set loaded image and prepare preview mode
  const loadCapturedImage = (src) => {
    setCapturedImage(src);
    setOriginalImage(src);
    setRotation(0);
    setIsEnhanced(true);
    setMode('preview');
  };

  // Flip between front and back camera
  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Apply filters using HTML5 Canvas (CamScanner Magic Color)
  const applyImageFilters = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      const isRotatedQuarter = rotation % 180 !== 0;
      
      // Calculate max dimension for compression (max 1600px width/height)
      let targetWidth = isRotatedQuarter ? img.height : img.width;
      let targetHeight = isRotatedQuarter ? img.width : img.height;
      const MAX_DIM = 1600;

      if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * MAX_DIM) / targetWidth);
          targetWidth = MAX_DIM;
        } else {
          targetWidth = Math.round((targetWidth * MAX_DIM) / targetHeight);
          targetHeight = MAX_DIM;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const drawW = isRotatedQuarter ? canvas.height : canvas.width;
      const drawH = isRotatedQuarter ? canvas.width : canvas.height;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // CamScanner Magic Color: whitens paper background + enhances ink/seal vibrancy
      if (isEnhanced) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const len = data.length;

        // Step 1: Detect paper background level by sampling luminance
        let lumSum = 0;
        let samples = 0;
        for (let i = 0; i < len; i += 64) {
          lumSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          samples++;
        }
        const avgLum = lumSum / (samples || 1);
        const paperThreshold = Math.max(120, Math.min(215, avgLum * 0.94));

        // Step 2: Pixel transformation
        for (let i = 0; i < len; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const chroma = maxC - minC; // Colorfulness

          // A. VIBRANT COLOR BOOST (Magic Color: "natingkad kulay" for stamps, seals, blue pen signatures)
          if (chroma > 14) {
            const satBoost = 1.6;
            r = Math.min(255, Math.max(0, lum + (r - lum) * satBoost));
            g = Math.min(255, Math.max(0, lum + (g - lum) * satBoost));
            b = Math.min(255, Math.max(0, lum + (b - lum) * satBoost));
          }

          // B. PAPER BACKGROUND WHITENING ("pumuputi yung documents" - clears murky grey shadows & yellow tints)
          if (lum >= paperThreshold - 30 && chroma < 40) {
            const range = 255 - (paperThreshold - 30);
            const norm = Math.min(1, Math.max(0, (lum - (paperThreshold - 30)) / (range || 1)));
            const whitened = lum + (255 - lum) * Math.min(1, norm * 1.45 + 0.4);
            const delta = whitened - lum;
            r = Math.min(255, r + delta);
            g = Math.min(255, g + delta);
            b = Math.min(255, b + delta);
          } else if (lum < paperThreshold - 35 && chroma < 30) {
            // C. TEXT DEEPENING (Dark, bold, sharp text letters)
            r = Math.max(0, r * 0.72);
            g = Math.max(0, g * 0.72);
            b = Math.max(0, b * 0.72);
          }

          // D. CRISP DOCUMENT CONTRAST S-CURVE
          const contrast = 1.22;
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
          data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128 + 6));
          data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128 + 6));
          data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128 + 6));
        }

        ctx.putImageData(imgData, 0, 0);
      }

      setCapturedImage(canvas.toDataURL('image/jpeg', 0.86));
      setIsProcessing(false);
    };
    img.src = originalImage;
  }, [originalImage, isEnhanced, rotation]);

  useEffect(() => {
    if (mode === 'preview' && originalImage) {
      applyImageFilters();
    }
  }, [mode, originalImage, isEnhanced, rotation, applyImageFilters]);

  // Confirm and return compressed File
  const handleApplyAndAttach = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const cleanName = `${documentTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_scanned.jpg`;
      const optimizedFile = new File([blob], cleanName, { type: 'image/jpeg', lastModified: Date.now() });

      onComplete({
        file: optimizedFile,
        previewUrl: URL.createObjectURL(blob),
        filter: isEnhanced ? 'enhanced' : 'original'
      });
      onClose();
    }, 'image/jpeg', 0.85);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-[94vh] max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Hidden File Input for Gallery */}
        <input 
          ref={galleryInputRef}
          type="file" 
          accept="image/*,.webp,image/webp" 
          onChange={handleGalleryFile}
          className="hidden"
        />

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* TOP BAR */}
        <div className="px-4 sm:px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#7A1B22] flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
              <Camera size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {mode === 'camera' ? `Scan ${documentTitle}` : `Enhance & Verify ${documentTitle}`}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {mode === 'camera' ? 'Align paper within guidelines' : 'Review clarity before attaching'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'preview' && (
              <button
                type="button"
                onClick={() => {
                  setMode('camera');
                  startCamera();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Retake
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: LIVE CAMERA VIEWFINDER WITH GUIDE GRID */}
        {/* ========================================================================= */}
        {mode === 'camera' && (
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden select-none">
            
            {/* Live Video Feed */}
            <video 
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />

            {/* If Camera Error / Unsupported: Fallback Card */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <h4 className="text-base font-bold text-white">Camera Unavailable</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                  {cameraError} You can choose a photo directly from your device gallery.
                </p>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-4 py-2.5 bg-[#7A1B22] hover:bg-[#8E2028] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                  <Upload size={15} /> Upload from Gallery / Files
                </button>
              </div>
            )}

            {/* CAMERA GUIDE GRID & DOCUMENT FRAME OVERLAY */}
            {!cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 sm:p-6 z-20">
                
                {/* Floating Top Hint */}
                <div className="mb-3 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                  <ShieldCheck size={13} className="text-[#D4AF37]" />
                  <span>Align document edges inside the guide frame</span>
                </div>

                {/* Rectangular Document Frame */}
                <div className="relative w-full max-w-[420px] aspect-[3/4] max-h-[64vh] rounded-2xl border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex flex-col justify-between overflow-hidden">
                  
                  {/* Corner Target Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#D4AF37] rounded-br-xl" />

                  {/* 3x3 Rule-of-Thirds Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-25">
                    <div className="border-r border-dashed border-white h-full" />
                    <div className="border-r border-dashed border-white h-full" />
                    <div className="h-full" />
                  </div>
                  <div className="absolute inset-0 grid grid-rows-3 pointer-events-none opacity-25">
                    <div className="border-b border-dashed border-white w-full" />
                    <div className="border-b border-dashed border-white w-full" />
                    <div className="w-full" />
                  </div>

                  {/* Center Watermark Target */}
                  <div className="m-auto opacity-30 flex flex-col items-center gap-1">
                    <FileText size={32} className="text-white" />
                    <span className="text-[10px] font-mono tracking-wider uppercase text-white font-bold">Document Area</span>
                  </div>
                </div>

                {/* Bottom Helpful Guideline */}
                <p className="mt-3 text-[11px] text-white/70 font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
                  Avoid glare, shadows, and tilted angles
                </p>
              </div>
            )}

            {/* CAMERA BOTTOM CONTROLS DOCK */}
            <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-around px-6">
              
              {/* Gallery Upload Option */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md flex flex-col items-center justify-center transition-all cursor-pointer border border-white/10"
                title="Choose from Gallery"
              >
                <Upload size={18} />
                <span className="text-[9px] font-bold mt-0.5">Gallery</span>
              </button>

              {/* Big Ergonomic Shutter Button */}
              <button
                type="button"
                onClick={handleShutterCapture}
                disabled={!isCameraReady && !cameraError}
                className="w-18 h-18 rounded-full bg-white p-1 shadow-2xl active:scale-90 transition-transform cursor-pointer flex items-center justify-center ring-4 ring-[#7A1B22]/50 hover:ring-[#7A1B22]"
                title="Take Document Photo"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#7A1B22] to-[#99222B] border-3 border-white flex items-center justify-center text-white">
                  <Camera size={26} />
                </div>
              </button>

              {/* Switch Camera Button */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md flex flex-col items-center justify-center transition-all cursor-pointer border border-white/10"
                title="Flip Camera (Front / Back)"
              >
                <FlipHorizontal size={18} />
                <span className="text-[9px] font-bold mt-0.5">Flip</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: CAMSCANNER-STYLE ENHANCER & REVIEW CANVAS */}
        {/* ========================================================================= */}
        {mode === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            
            {/* CANVAS PREVIEW AREA */}
            <div className="flex-1 relative flex items-center justify-center p-3 sm:p-4 overflow-auto bg-slate-900/60 select-none">
              {isProcessing && (
                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-[#D4AF37]">
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Enhancing document...</span>
                </div>
              )}

              <div className="relative max-h-[66vh] max-w-full flex items-center justify-center">
                <img 
                  src={capturedImage || originalImage} 
                  alt="Scanned Document Preview"
                  className="max-h-[64vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/15 bg-white"
                />

                {/* Status Badge */}
                <div className={`absolute top-3 left-3 font-black text-[10px] uppercase px-2.5 py-1 rounded-lg shadow-md tracking-wider flex items-center gap-1.5 ${
                  isEnhanced 
                    ? 'bg-[#7A1B22] text-[#D4AF37] border border-[#D4AF37]/50' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}>
                  <Sparkles size={12} className={isEnhanced ? 'text-[#D4AF37]' : 'text-slate-600 dark:text-slate-400'} />
                  <span>{isEnhanced ? 'Magic Enhanced (CamScanner)' : 'Original Photo'}</span>
                </div>
              </div>
            </div>

            {/* ENHANCEMENT CONTROLS TOOLBAR */}
            <div className="px-4 py-3.5 bg-slate-900 border-t border-slate-800 space-y-2.5 shrink-0">
              
              {/* Single Enhance Button + Rotate Button */}
              <div className="flex items-center gap-2">
                {/* ONE Single Magic Enhance Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsEnhanced(prev => !prev)}
                  className={`flex-1 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border-2 active:scale-95 ${
                    isEnhanced
                      ? 'bg-gradient-to-r from-[#7A1B22] to-[#99222B] text-white border-[#D4AF37] shadow-[#7A1B22]/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isEnhanced ? 'CamScanner Magic Color Active (Tap to view original)' : 'Tap to enhance document'}
                >
                  <Sparkles size={16} className={isEnhanced ? 'text-[#D4AF37]' : 'text-slate-600 dark:text-slate-400'} />
                  <span>{isEnhanced ? 'Magic Enhance: ON' : 'Magic Enhance: OFF'}</span>
                </button>

                {/* Rotate Button */}
                <button
                  type="button"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 border-2 border-slate-700 active:scale-95"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw size={16} />
                  <span>Rotate</span>
                </button>
              </div>

              {/* Primary Attach Button */}
              <button
                type="button"
                onClick={handleApplyAndAttach}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-2 border-emerald-500"
              >
                <Check size={18} />
                <span>Attach This Document</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DocumentScannerModal;
