import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, ShieldCheck, 
  Copy, Check, FileText, AlertCircle, Loader2, Printer, 
  Maximize2, Move, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import MtopCertificateModal from '../../components/admin/MtopCertificateModal';

const REJECT_REASONS = [
  'Missing or Expired LTO Official Receipt / Certificate of Registration (OR/CR)',
  'Chassis Serial Number mismatch between application form and OR/CR document',
  'Motor / Engine Serial Number mismatch between application form and OR/CR document',
  'Blurry or unreadable document photo / scan',
  'Expired or invalid Professional Driver\'s License',
  'Missing TODA Endorsement Certificate for specified zone',
  'Barangay Clearance is expired or issued outside Gasan',
  'Vehicle model year does not meet municipal standard age criteria',
  'Others (Please specify)'
];

const FranchiseReviewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Queue and Application State
  const [queue, setQueue] = useState([]);
  const [currentApp, setCurrentApp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Document Viewer State
  const [activeDocKey, setActiveDocKey] = useState('orCrDocument');
  const [zoomScale, setZoomScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Copy Feedback
  const [copiedField, setCopiedField] = useState(null);

  // Rejection State
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch full queue to support seamless next/prev navigation
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=2000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        
        // Prioritize pending and ready for pickup applications
        const sortedQueue = [...list].sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        setQueue(sortedQueue);

        const target = sortedQueue.find(item => item._id === id);
        if (target) {
          setCurrentApp(target);
        } else if (sortedQueue.length > 0) {
          // Fallback to first if ID not found
          setCurrentApp(sortedQueue[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
      showToast('Network error loading franchise queue.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // When active applicant changes, reset viewer position and zoom
  useEffect(() => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsRejecting(false);
  }, [id]);

  // Current Queue Position
  const currentIndex = queue.findIndex(item => item._id === (currentApp?._id || id));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  const goToNext = () => {
    if (hasNext) {
      navigate(`/franchise-approval/review/${queue[currentIndex + 1]._id}`);
    }
  };

  const goToPrev = () => {
    if (hasPrev) {
      navigate(`/franchise-approval/review/${queue[currentIndex - 1]._id}`);
    }
  };

  // Document Tabs List
  const docTabs = [
    { key: 'orCrDocument', label: 'Tricycle OR / CR Document (LTO)', short: 'OR / CR', url: currentApp?.orCrUrl },
    { key: 'license', label: "Driver's License", short: 'License', url: currentApp?.licenseUrl },
    { key: 'todaEndorsement', label: 'TODA Endorsement Certificate', short: 'TODA', url: currentApp?.todaEndorsementUrl },
    { key: 'brgyClearance', label: 'Barangay Clearance (Gasan)', short: 'Barangay', url: currentApp?.brgyClearanceUrl }
  ];

  const currentDoc = docTabs.find(d => d.key === activeDocKey) || docTabs[0];

  // --------------------------------------------------------------------------
  // ISOLATED CANVAS ZOOM (Intercept wheel event with passive: false)
  // This prevents the whole browser window from zooming or scrolling!
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const onWheelHandler = (e) => {
      // PREVENT BROWSER INTERFACE ZOOM
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      const zoomStep = 0.15;

      setZoomScale(prev => {
        if (delta < 0) {
          return Math.min(prev + zoomStep, 4.0); // Zoom In
        } else {
          return Math.max(prev - zoomStep, 0.5); // Zoom Out
        }
      });
    };

    // Explicitly set passive: false so preventDefault() is respected by browser
    canvasEl.addEventListener('wheel', onWheelHandler, { passive: false });

    return () => {
      canvasEl.removeEventListener('wheel', onWheelHandler);
    };
  }, []);

  // --------------------------------------------------------------------------
  // INTERACTIVE PAN & DRAG HANDLERS (MOUSE & TOUCH)
  // --------------------------------------------------------------------------
  const handleMouseDown = (e) => {
    // Only primary left button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for touchscreen laptops/tablets
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetCanvasView = () => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Copy text helper
  const handleCopyText = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName}: ${text}`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Status Action (Approve / Reject / Release)
  const handleUpdateStatus = async (newStatus, customCancelReason = null, autoAdvance = true) => {
    if (!currentApp) return;
    setIsProcessing(true);

    try {
      const payload = {
        status: newStatus,
        cancelReason: newStatus === 'Cancelled' ? (customCancelReason || 'Application rejected during technical inspection.') : null
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${currentApp._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(
          newStatus === 'Ready for Pickup'
            ? 'Application approved! Status set to Ready for Pickup.'
            : newStatus === 'Active'
            ? 'Franchise officially activated and released!'
            : 'Application marked as Cancelled/Rejected.',
          'success'
        );

        setIsRejecting(false);

        // Update local queue entry
        setQueue(prev => prev.map(item => item._id === currentApp._id ? { ...item, status: newStatus } : item));

        if (autoAdvance) {
          if (hasNext) {
            goToNext();
          } else {
            showToast('Queue completed! All applications in this session have been reviewed.', 'success');
            setTimeout(() => navigate('/franchise-approval'), 1200);
          }
        }
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server communication error.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard Shortcuts (A for Approve, R for Reject, 1-4 for Docs, Arrows for Nav)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside text fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (currentApp?.status === 'Pending') {
          handleUpdateStatus('Ready for Pickup', null, true);
        } else if (currentApp?.status === 'Ready for Pickup') {
          handleUpdateStatus('Active', null, true);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsRejecting(prev => !prev);
      } else if (e.key === '1') {
        setActiveDocKey('orCrDocument');
        resetCanvasView();
      } else if (e.key === '2') {
        setActiveDocKey('license');
        resetCanvasView();
      } else if (e.key === '3') {
        setActiveDocKey('todaEndorsement');
        resetCanvasView();
      } else if (e.key === '4') {
        setActiveDocKey('brgyClearance');
        resetCanvasView();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        navigate('/franchise-approval');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentApp, hasNext, hasPrev, queue, currentIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#D4AF37] mb-3" />
        <p className="text-sm font-bold text-slate-300">Loading Franchise Inspection Station...</p>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-amber-400 mb-3" />
        <h2 className="text-lg font-bold">Franchise Application Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          This record may have been deleted or the queue has finished.
        </p>
        <button
          onClick={() => navigate('/franchise-approval')}
          className="mt-5 px-5 py-2.5 bg-[#7A1B22] hover:bg-[#65151c] text-white rounded-xl text-xs font-bold transition-all"
        >
          Return to Approval Queue
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-3 max-w-md">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'error' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <p className="text-xs font-bold text-slate-100">{toast.message}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP CONTROL BAR (SLIM, ZERO-DISTRACTION WORKBENCH RIBBON) */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-30 shadow-sm">
        
        {/* Left: Back & Applicant Overview */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/franchise-approval"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            title="Return to Table (Esc)"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to List</span>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs">
              {currentApp.fullName}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold shrink-0">
              {currentApp.plateNo || 'PENDING PLATE'}
            </span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
              currentApp.status === 'Pending' 
                ? 'bg-amber-950/60 text-amber-300 border-amber-800' 
                : 'bg-blue-950/60 text-blue-300 border-blue-800'
            }`}>
              {currentApp.status}
            </span>
          </div>
        </div>

        {/* Center: Queue Progress Navigator */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous (ArrowLeft)"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 font-mono text-xs text-slate-300 select-none">
            {currentIndex >= 0 ? currentIndex + 1 : 1} / {queue.length}
          </span>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next (ArrowRight)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: High-Speed Primary Actions */}
        <div className="flex items-center gap-2">
          {/* MTOP Print if Ready or Active */}
          {(currentApp.status === 'Ready for Pickup' || currentApp.status === 'Active') && (
            <button
              onClick={() => setIsPrintOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="Print Official MTOP Certificate"
            >
              <Printer size={14} className="text-[#D4AF37]" />
              <span className="hidden md:inline">Print MTOP</span>
            </button>
          )}

          {/* Reject Trigger */}
          <button
            onClick={() => setIsRejecting(prev => !prev)}
            disabled={isProcessing}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isRejecting 
                ? 'bg-red-600 text-white border-red-500' 
                : 'bg-slate-800 hover:bg-red-950/50 text-red-400 hover:text-red-300 border-red-900/40'
            }`}
            title="Reject Application (Shortcut: R)"
          >
            <XCircle size={14} />
            <span className="hidden sm:inline">Reject</span>
            <kbd className="hidden lg:inline text-[9px] px-1 bg-black/40 rounded font-mono">R</kbd>
          </button>

          {/* Primary: Approve & Next */}
          {currentApp.status === 'Pending' ? (
            <button
              onClick={() => handleUpdateStatus('Ready for Pickup', null, true)}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              title="Approve and advance to next applicant (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>Approve &amp; Next</span>
              <kbd className="hidden lg:inline text-[9px] px-1 bg-white/20 rounded font-mono font-bold">A</kbd>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus('Active', null, true)}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              title="Acknowledge payment, release franchise, and advance (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>Release &amp; Next</span>
              <kbd className="hidden lg:inline text-[9px] px-1 bg-white/20 rounded font-mono font-bold">A</kbd>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN WORKBENCH BODY: 28% INSPECTOR PANEL | 72% MAXIMIZED CANVAS */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* ======================================================================= */}
        {/* LEFT INSPECTION SHEET (28% WIDTH, CLEAN & COMPACT) */}
        {/* ======================================================================= */}
        <aside className="w-full md:w-[320px] lg:w-[360px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-y-auto">
          
          <div className="p-4 space-y-4 flex-1">
            
            {/* 1. DOCUMENT SELECTOR PILLS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Select Document to View
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Keys [1-4]
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {docTabs.map((tab, idx) => {
                  const isActive = tab.key === activeDocKey;
                  const hasFile = Boolean(tab.url);

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveDocKey(tab.key);
                        resetCanvasView();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#7A1B22]/40 border-[#D4AF37] text-white shadow-xs'
                          : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">[{idx + 1}]</span>
                        <span className="text-xs font-bold truncate">{tab.short}</span>
                      </div>
                      <span 
                        className={`w-2 h-2 rounded-full shrink-0 ${hasFile ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        title={hasFile ? 'Document Attached' : 'Missing Document'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. REJECTION ACCORDION (If Admin clicked Reject) */}
            {isRejecting && (
              <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between text-red-300 text-xs font-black uppercase">
                  <span className="flex items-center gap-1.5">
                    <XCircle size={14} /> Rejection Details
                  </span>
                  <button 
                    onClick={() => setIsRejecting(false)} 
                    className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-900 border border-red-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-red-400"
                >
                  {REJECT_REASONS.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>

                {rejectReason === 'Others (Please specify)' && (
                  <textarea
                    rows={2}
                    placeholder="Enter specific defect reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-slate-900 border border-red-800 rounded-xl p-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-red-400"
                  />
                )}

                <button
                  onClick={() => {
                    const reason = rejectReason === 'Others (Please specify)' ? customReason : rejectReason;
                    handleUpdateStatus('Cancelled', reason, true);
                  }}
                  disabled={isProcessing}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  <span>Confirm Rejection &amp; Next</span>
                </button>
              </div>
            )}

            {/* 3. CROSS-CHECK VERIFICATION CARD (Direct match against OR/CR) */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Compare with Document
                </span>
                <span className="text-[10px] text-slate-400">Click to copy</span>
              </div>

              {/* Plate Number */}
              <div 
                onClick={() => handleCopyText(currentApp.plateNo, 'Plate No')}
                className="bg-slate-900/90 p-2 rounded-xl border border-slate-700 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Plate Number</p>
                  <p className="font-mono font-black text-white text-xs tracking-wider">
                    {currentApp.plateNo || 'PENDING'}
                  </p>
                </div>
                {copiedField === 'Plate No' ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={13} className="text-slate-500 group-hover:text-slate-300 shrink-0" />
                )}
              </div>

              {/* Motor & Chassis Numbers */}
              <div className="grid grid-cols-2 gap-2">
                <div 
                  onClick={() => handleCopyText(currentApp.motorNo, 'Motor No')}
                  className="bg-slate-900/90 p-2 rounded-xl border border-slate-700 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Motor No.</p>
                    <p className="font-mono font-bold text-white text-xs truncate">
                      {currentApp.motorNo || 'N/A'}
                    </p>
                  </div>
                  {copiedField === 'Motor No' ? <Check size={14} className="text-emerald-400 shrink-0" /> : <Copy size={13} className="text-slate-500 group-hover:text-slate-300 shrink-0" />}
                </div>

                <div 
                  onClick={() => handleCopyText(currentApp.chassisNo, 'Chassis No')}
                  className="bg-slate-900/90 p-2 rounded-xl border border-slate-700 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Chassis No.</p>
                    <p className="font-mono font-bold text-white text-xs truncate">
                      {currentApp.chassisNo || 'N/A'}
                    </p>
                  </div>
                  {copiedField === 'Chassis No' ? <Check size={14} className="text-emerald-400 shrink-0" /> : <Copy size={13} className="text-slate-500 group-hover:text-slate-300 shrink-0" />}
                </div>
              </div>

              {/* Operator Name */}
              <div 
                onClick={() => handleCopyText(currentApp.fullName, 'Owner Name')}
                className="bg-slate-900/90 p-2 rounded-xl border border-slate-700 hover:border-[#D4AF37]/60 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Registered Operator</p>
                  <p className="font-bold text-white text-xs">
                    {currentApp.fullName}
                  </p>
                </div>
                {copiedField === 'Owner Name' ? <Check size={14} className="text-emerald-400 shrink-0" /> : <Copy size={13} className="text-slate-500 group-hover:text-slate-300 shrink-0" />}
              </div>

              {/* Vehicle & Toda specs */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Vehicle Model</p>
                  <p className="text-slate-200 font-semibold truncate">{currentApp.make} ({currentApp.made})</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">TODA &amp; Zone</p>
                  <p className="text-[#D4AF37] font-semibold truncate">{currentApp.todaName} (Z{currentApp.zone})</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Barangay Residence</p>
                  <p className="text-slate-300 font-medium truncate">{currentApp.address}, Gasan</p>
                </div>
              </div>
            </div>

            {/* QUICK CHEAT SHEET SHORTCUTS */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300 mb-1 flex items-center gap-1">
                <HelpCircle size={12} /> Keyboard Speed Tips:
              </p>
              <p><kbd className="px-1 bg-slate-800 rounded font-mono text-[10px] text-white">A</kbd> Approve &amp; Next</p>
              <p><kbd className="px-1 bg-slate-800 rounded font-mono text-[10px] text-white">R</kbd> Toggle Rejection</p>
              <p><kbd className="px-1 bg-slate-800 rounded font-mono text-[10px] text-white">1 - 4</kbd> Switch Document</p>
              <p><kbd className="px-1 bg-slate-800 rounded font-mono text-[10px] text-white">&larr; / &rarr;</kbd> Prev / Next Applicant</p>
            </div>

          </div>
        </aside>

        {/* ======================================================================= */}
        {/* RIGHT DOCUMENT VIEWER CANVAS (72% WIDTH - FULL SCREEN INTERACTIVE PAN)  */}
        {/* ======================================================================= */}
        <main className="flex-1 flex flex-col bg-[#060a12] relative overflow-hidden h-full">
          
          {/* FLOATING TOP CANVAS TOOLBAR */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-slate-700 shadow-xl">
            {/* Zoom Out */}
            <button
              onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>

            {/* Percentage Badge */}
            <span className="text-xs font-mono font-bold px-1 text-[#D4AF37] min-w-[42px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>

            {/* Zoom In */}
            <button
              onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 4.0))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Rotate 90 deg */}
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rotate 90° Clockwise"
            >
              <RotateCw size={16} />
            </button>

            {/* Reset View */}
            <button
              onClick={resetCanvasView}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Reset View (Center & 100%)"
            >
              <RefreshCw size={14} />
            </button>

            {/* Open Original File in New Tab */}
            {currentDoc?.url && (
              <>
                <div className="h-4 w-px bg-slate-700 mx-0.5" />
                <a
                  href={currentDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-800 text-[#D4AF37] rounded-lg transition-colors flex items-center cursor-pointer"
                  title="Open Raw Original in New Tab"
                >
                  <ExternalLink size={15} />
                </a>
              </>
            )}
          </div>

          {/* ACTIVE DOCUMENT LABEL BADGE (TOP LEFT OF CANVAS) */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-md flex items-center gap-2">
              <FileText size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-white">
                {currentDoc.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                (Scroll wheel to zoom &bull; Click and drag to pan)
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* THE INTERACTIVE PAN/DRAG CANVAS VIEWPORT */}
          {/* ===================================================================== */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex-1 w-full h-full relative flex items-center justify-center overflow-hidden select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {!currentDoc?.url ? (
              <div className="p-8 text-center bg-slate-900/90 rounded-2xl border border-slate-800 max-w-sm">
                <AlertCircle size={40} className="text-amber-400 mx-auto mb-2 opacity-80" />
                <h3 className="font-bold text-sm text-white">No Document Uploaded</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The applicant did not attach a file for {currentDoc.short}.
                </p>
              </div>
            ) : currentDoc.url.toLowerCase().includes('.pdf') ? (
              <iframe
                src={currentDoc.url}
                title={currentDoc.label}
                className="w-full h-full border-0 bg-white rounded-xl shadow-2xl"
              />
            ) : (
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoomScale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                className="max-w-none flex items-center justify-center"
              >
                <img
                  src={currentDoc.url}
                  alt={currentDoc.label}
                  draggable={false}
                  className="max-h-[88vh] max-w-[88vw] object-contain rounded-xl shadow-2xl bg-slate-900 border border-slate-700 pointer-events-none"
                />
              </div>
            )}
          </div>

          {/* FLOATING BOTTOM HINT */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/85 backdrop-blur-md px-4 py-1 rounded-full border border-slate-800 text-[11px] text-slate-400 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Move size={12} className="text-[#D4AF37]" /> Drag to move
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <ZoomIn size={12} className="text-[#D4AF37]" /> Scroll to zoom document only
            </span>
          </div>
        </main>
      </div>

      {/* MTOP Certificate Print Modal */}
      {isPrintOpen && currentApp && (
        <MtopCertificateModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          unit={currentApp}
        />
      )}
    </div>
  );
};

export default FranchiseReviewPage;
