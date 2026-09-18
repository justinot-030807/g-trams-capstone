import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, 
  FileText, AlertCircle, Loader2, Printer, Move, Check, AlertTriangle,
  PanelLeftClose, PanelLeft, Maximize2, Minimize2
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

  // Full Screen and Sidebar Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Document Viewer State
  const [activeDocKey, setActiveDocKey] = useState('orCrDocument');
  const [zoomScale, setZoomScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
    { key: 'orCrDocument', label: 'Tricycle OR / CR Document (LTO)', short: 'OR / CR Document', url: currentApp?.orCrUrl },
    { key: 'license', label: "Driver's License", short: "Driver's License", url: currentApp?.licenseUrl },
    { key: 'todaEndorsement', label: 'TODA Endorsement Certificate', short: 'TODA Certificate', url: currentApp?.todaEndorsementUrl },
    { key: 'brgyClearance', label: 'Barangay Clearance (Gasan)', short: 'Barangay Clearance', url: currentApp?.brgyClearanceUrl }
  ];

  const currentDoc = docTabs.find(d => d.key === activeDocKey) || docTabs[0];

  // --------------------------------------------------------------------------
  // ISOLATED CANVAS ZOOM (Reliably bound whenever canvas is mounted)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const onWheelHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      const zoomStep = delta < 0 ? 0.15 : -0.15;

      setZoomScale(prev => {
        const next = Number((prev + zoomStep).toFixed(2));
        return Math.min(Math.max(0.5, next), 4.0);
      });
    };

    canvasEl.addEventListener('wheel', onWheelHandler, { passive: false });

    return () => {
      canvasEl.removeEventListener('wheel', onWheelHandler);
    };
  }, [isLoading, currentApp?._id, activeDocKey]);

  // --------------------------------------------------------------------------
  // INTERACTIVE PAN & DRAG HANDLERS (MOUSE & TOUCH)
  // --------------------------------------------------------------------------
  const handleMouseDown = (e) => {
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

  const handleDoubleClick = () => {
    if (zoomScale === 1) {
      setZoomScale(1.8);
    } else {
      resetCanvasView();
    }
  };

  // True Browser Fullscreen Mode
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
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

  // Keyboard Shortcuts (A for Approve, R for Reject, 1-4 for Docs, Arrows for Nav, S for Sidebar, F for Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e) => {
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
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
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
      <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#7A1B22] mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Franchise Inspection Station...</p>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={44} className="text-amber-500 mb-3" />
        <h2 className="text-base font-bold text-slate-800">Franchise Application Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          This record may have been processed or the queue has finished.
        </p>
        <button
          onClick={() => navigate('/franchise-approval')}
          className="mt-4 px-4 py-2 bg-[#7A1B22] hover:bg-[#65151c] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          Return to Approval Queue
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden select-none">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 max-w-md">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            </div>
            <p className="text-xs font-semibold text-slate-800">{toast.message}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER: MUNICIPAL HERITAGE MAROON RIBBON */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 bg-gradient-to-r from-[#681419] via-[#7A1B22] to-[#801820] text-white flex items-center justify-between gap-3 shrink-0 z-30 shadow-md border-b border-[#D4AF37]/30">
        
        {/* Left: Back & Applicant Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/franchise-approval"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Return to Table (Esc)"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to List</span>
          </Link>

          <div className="h-5 w-px bg-white/20 hidden sm:block" />

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            title={isSidebarOpen ? "Hide Application Form (Shortcut: S)" : "Show Application Form (Shortcut: S)"}
          >
            {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
            <span className="hidden md:inline">{isSidebarOpen ? 'Hide Form' : 'Show Form'}</span>
            <span className="text-[10px] px-1 bg-black/25 rounded text-white/80 font-mono">S</span>
          </button>

          <div className="h-5 w-px bg-white/20 hidden sm:block" />

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
              {currentApp.fullName}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-black/25 text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
              Plate: {currentApp.plateNo || 'Pending'}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
              currentApp.status === 'Ready for Pickup' 
                ? 'bg-blue-500/20 text-blue-100 border-blue-300/40' 
                : currentApp.status === 'Active'
                ? 'bg-emerald-500/20 text-emerald-100 border-emerald-300/40'
                : 'bg-amber-500/20 text-amber-100 border-amber-300/40'
            }`}>
              {currentApp.status}
            </span>
          </div>
        </div>

        {/* Center: Queue Progress Navigator */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/15 text-xs font-semibold">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="p-1 rounded-lg hover:bg-white/15 text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous (ArrowLeft)"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-xs text-white select-none">
            {currentIndex >= 0 ? currentIndex + 1 : 1} / {queue.length}
          </span>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="p-1 rounded-lg hover:bg-white/15 text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next (ArrowRight)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* MTOP Print if Ready or Active */}
          {(currentApp.status === 'Ready for Pickup' || currentApp.status === 'Active') && (
            <button
              onClick={() => setIsPrintOpen(true)}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isRejecting 
                ? 'bg-red-600 text-white border-red-500 shadow-sm' 
                : 'bg-red-500/20 hover:bg-red-600 text-red-100 hover:text-white border-red-400/30'
            }`}
            title="Reject Application (Shortcut: R)"
          >
            <XCircle size={14} />
            <span>Reject</span>
            <span className="hidden lg:inline text-xs px-1 bg-black/25 rounded text-white/80">R</span>
          </button>

          {/* Primary: Approve & Next */}
          {currentApp.status === 'Pending' ? (
            <button
              onClick={() => handleUpdateStatus('Ready for Pickup', null, true)}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Approve and advance to next applicant (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Approve &amp; Next</span>
              <span className="hidden lg:inline text-xs px-1 bg-white/20 rounded font-bold">A</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus('Active', null, true)}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Acknowledge payment, release franchise, and advance (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Release &amp; Next</span>
              <span className="hidden lg:inline text-xs px-1 bg-white/20 rounded font-bold">A</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN WORKBENCH: STREAMLINED SIDEBAR | CRISP STUDIO CANVAS */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* ======================================================================= */}
        {/* ======================================================================= */}
        {/* LEFT INSPECTION SHEET: COMPLETE OPERATOR FORM SUBMISSION DETAILS        */}
        {/* ======================================================================= */}
        {isSidebarOpen && (
          <aside className="w-full md:w-[350px] lg:w-[380px] bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto shadow-xs">
          
          <div className="p-4 space-y-3.5 flex-1">
            
            {/* 1. DOCUMENT SELECTOR BUTTONS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Attached Documents
                </span>
                <span className="text-xs text-slate-400 font-medium">
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
                      className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#7A1B22] border-[#7A1B22] text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[11px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold truncate">{tab.short}</span>
                      </div>

                      <span 
                        className={`w-2 h-2 rounded-full shrink-0 ${hasFile ? 'bg-emerald-500' : 'bg-amber-400'}`}
                        title={hasFile ? 'Document Attached' : 'Missing Document'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. REJECTION ACCORDION (If Admin clicked Reject) */}
            {isRejecting && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-red-800 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <XCircle size={14} className="text-red-600" /> Rejection Details
                  </span>
                  <button 
                    onClick={() => setIsRejecting(false)} 
                    className="text-slate-500 hover:text-slate-700 text-xs underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-white border border-red-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-red-500 font-medium"
                >
                  {REJECT_REASONS.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>

                {rejectReason === 'Others (Please specify)' && (
                  <textarea
                    rows={2}
                    placeholder="Enter specific reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-white border border-red-300 rounded-xl p-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-red-500 font-medium"
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

            {/* 3. COMPLETE APPLICATION FORM DETAILS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  Application Form Inputs
                </span>
                <span className="text-xs font-semibold text-[#7A1B22] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {currentApp.applicationType || 'New Application'}
                </span>
              </div>

              {/* CARD 1: APPLICANT & OPERATOR INFORMATION */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                <h4 className="text-xs font-bold text-[#7A1B22] pb-1 border-b border-slate-200/80">
                  Applicant &amp; Association Info
                </h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Full Name:</span>
                    <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">{currentApp.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Barangay Address:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{currentApp.address}, Gasan</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">TODA Association:</span>
                    <span className="font-bold text-[#7A1B22] text-right truncate max-w-[200px]">{currentApp.todaName || 'Non-TODA'}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Operational Zone:</span>
                    <span className="font-semibold text-slate-800 text-right">Zone {currentApp.zone || 1}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Application Type:</span>
                    <span className="font-semibold text-slate-800 text-right">{currentApp.applicationType || 'New'}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Date Filed:</span>
                    <span className="font-semibold text-slate-800 text-right">{formatDate(currentApp.dateApplied || currentApp.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: VEHICLE SPECIFICATIONS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                <h4 className="text-xs font-bold text-[#7A1B22] pb-1 border-b border-slate-200/80">
                  Vehicle Specifications
                </h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Plate Number:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-right">{currentApp.plateNo || 'Pending'}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Motor / Engine No:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{currentApp.motorNo || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Chassis Serial No:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{currentApp.chassisNo || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Vehicle Make:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{currentApp.make}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Year Model:</span>
                    <span className="font-semibold text-slate-800 text-right">{currentApp.made}</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: COMMUNITY TAX CERTIFICATE (CEDULA) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                <h4 className="text-xs font-bold text-[#7A1B22] pb-1 border-b border-slate-200/80">
                  Community Tax Certificate (Cedula)
                </h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">CTC / Cedula Serial No:</span>
                    <span className="font-bold text-slate-900 text-right">{currentApp.cedulaSerialNo || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Date of Issue:</span>
                    <span className="font-semibold text-slate-800 text-right">{formatDate(currentApp.cedulaDate)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-500 font-medium">Place of Issue:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">{currentApp.cedulaAddress || 'Gasan, Marinduque'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. KEYBOARD SHORTCUT HELPER */}
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-1">
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-semibold">A</kbd> Approve</span>
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-semibold">R</kbd> Reject</span>
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-semibold">S</kbd> Form</span>
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-semibold">F</kbd> Full</span>
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-semibold">1-4</kbd> Docs</span>
              <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-semibold">&larr;/&rarr;</kbd> Queue</span>
            </div>

          </div>
        </aside>
        )}

        {/* ======================================================================= */}
        {/* RIGHT DOCUMENT VIEWER CANVAS (STUDIO DESK VIEWPORT)                    */}
        {/* ======================================================================= */}
        <main className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden h-full">
          
          {/* FLOATING TOP CANVAS TOOLBAR */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-200 shadow-md text-slate-700">
            {/* Zoom Out */}
            <button
              onClick={() => setZoomScale(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>

            {/* Percentage Badge */}
            <button
              onClick={resetCanvasView}
              className="text-xs font-semibold px-2 py-0.5 rounded hover:bg-slate-100 text-[#7A1B22] min-w-[46px] text-center cursor-pointer"
              title="Click to reset to 100%"
            >
              {Math.round(zoomScale * 100)}%
            </button>

            {/* Zoom In */}
            <button
              onClick={() => setZoomScale(prev => Math.min(4.0, Number((prev + 0.25).toFixed(2))))}
              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            {/* Rotate 90 deg */}
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Rotate 90° Clockwise"
            >
              <RotateCw size={16} />
            </button>

            {/* Reset View */}
            <button
              onClick={resetCanvasView}
              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Reset View (Center & 100%)"
            >
              <RefreshCw size={14} />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            {/* Toggle Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-slate-100 text-[#7A1B22] rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen (Shortcut: F)" : "Fullscreen Mode (Shortcut: F)"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Open Original File in New Tab */}
            {currentDoc?.url && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-0.5" />
                <a
                  href={currentDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-100 text-[#7A1B22] rounded-lg transition-colors flex items-center cursor-pointer"
                  title="Open Raw Original in New Tab"
                >
                  <ExternalLink size={15} />
                </a>
              </>
            )}
          </div>

          {/* ACTIVE DOCUMENT LABEL BADGE & FORM TOGGLE (TOP LEFT OF CANVAS) */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-[#7A1B22] hover:bg-slate-50 transition-colors cursor-pointer"
                title="Show Form Details (Shortcut: S)"
              >
                <PanelLeft size={14} />
                <span>Show Form</span>
              </button>
            )}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 pointer-events-none">
              <FileText size={15} className="text-[#7A1B22]" />
              <span className="text-xs font-semibold text-slate-800">
                {currentDoc.label}
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
            onDoubleClick={handleDoubleClick}
            className={`flex-1 w-full h-full relative flex items-center justify-center overflow-hidden select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {!currentDoc?.url ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-md max-w-sm">
                <AlertCircle size={38} className="text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800">No Document Uploaded</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The applicant has not attached a file for {currentDoc.short}.
                </p>
              </div>
            ) : currentDoc.url.toLowerCase().includes('.pdf') ? (
              <iframe
                src={currentDoc.url}
                title={currentDoc.label}
                className="w-full h-full border-0 bg-white rounded-xl shadow-lg"
              />
            ) : (
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoomScale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.08s ease-out'
                }}
                className="max-w-none flex items-center justify-center pointer-events-none"
              >
                <img
                  src={currentDoc.url}
                  alt={currentDoc.label}
                  draggable={false}
                  className="h-[84vh] w-auto max-w-[94%] object-contain rounded-2xl shadow-2xl bg-white border border-slate-200/80 p-1.5 select-none"
                />
              </div>
            )}
          </div>

          {/* FLOATING BOTTOM HINT */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 shadow-sm flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Move size={13} className="text-[#7A1B22]" /> Drag to move
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="flex items-center gap-1.5">
              <ZoomIn size={13} className="text-[#7A1B22]" /> Scroll wheel to zoom
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs text-slate-500">Double-click to reset</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs text-slate-500 font-mono">[S] Form &bull; [F] Fullscreen</span>
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


