import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, 
  FileText, AlertCircle, Loader2, Printer, Move, Check, AlertTriangle,
  Copy, ShieldCheck, User, Car, FileCheck, Layers, FileSpreadsheet, Sparkles
} from 'lucide-react';
import MtopCertificateModal from '../../components/admin/MtopCertificateModal';
import AdminApplicationSummaryModal from '../../components/admin/AdminApplicationSummaryModal';

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
  const [isDocLoading, setIsDocLoading] = useState(true);
  const [docError, setDocError] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const [copiedField, setCopiedField] = useState(null);

  // Rejection State
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectField, setRejectField] = useState('chassisNo');
  const [customReason, setCustomReason] = useState('');

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Application Dossier Modal
  const [isDossierOpen, setIsDossierOpen] = useState(false);

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

  const isDateExpired = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text || text === 'N/A' || text === 'Pending') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Phase 1: INSTANT — fetch only the single franchise being reviewed
  const fetchCurrentApp = useCallback(async (franchiseId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${franchiseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentApp(data);
      }
    } catch (err) {
      console.error('Failed to fetch franchise:', err);
      showToast('Network error loading application.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Phase 2: BACKGROUND — fetch filtered queue for prev/next navigation
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?status=Pending,For%20Signing,Ready%20for%20Pickup&limit=500`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        
        // Prioritize pending applications first, then by date
        const sortedQueue = [...list].sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return new Date(a.dateApplied || a.createdAt || 0) - new Date(b.dateApplied || b.createdAt || 0);
        });

        setQueue(sortedQueue);
      }
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
    }
  }, []);

  useEffect(() => {
    fetchCurrentApp(id);
    fetchQueue();
  }, [id, fetchCurrentApp, fetchQueue]);

  // Preload all document images as soon as currentApp is available to eliminate switching delays
  useEffect(() => {
    if (!currentApp) return;
    const urls = [
      currentApp.orCrUrl,
      currentApp.licenseUrl,
      currentApp.todaEndorsementUrl,
      currentApp.brgyClearanceUrl
    ].filter(Boolean);

    urls.forEach(url => {
      if (!url.toLowerCase().includes('.pdf')) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [currentApp]);

  // Enforce 100% full-screen edge-to-edge layout without 0.9 desktop zoom shrinking
  useEffect(() => {
    document.documentElement.classList.add('review-station-active');
    document.body.classList.add('review-station-active');
    document.documentElement.style.zoom = '1';

    return () => {
      document.documentElement.classList.remove('review-station-active');
      document.body.classList.remove('review-station-active');
      if (window.innerWidth >= 769) {
        document.documentElement.style.zoom = '0.9';
      } else {
        document.documentElement.style.zoom = '1';
      }
    };
  }, []);

  // Document Tabs List Definition
  const docTabs = [
    { 
      key: 'orCrDocument', 
      label: 'Tricycle OR / CR Document (LTO)', 
      short: 'OR / CR (LTO)', 
      sub: 'Official Receipt & Registration',
      url: currentApp?.orCrUrl 
    },
    { 
      key: 'license', 
      label: "Driver's License (LTO)", 
      short: "Driver's License", 
      sub: 'Professional / Non-Prof',
      url: currentApp?.licenseUrl 
    },
    { 
      key: 'cedulaDoc', 
      label: 'Community Tax Certificate (Cedula)', 
      short: 'Cedula / CTC', 
      sub: 'Official Municipal Tax Receipt',
      url: currentApp?.cedulaUrl 
    },
    { 
      key: 'todaEndorsement', 
      label: 'TODA Endorsement Certificate', 
      short: 'TODA Endorsement', 
      sub: 'Zone Route Recommendation',
      url: currentApp?.todaEndorsementUrl 
    },
    { 
      key: 'brgyClearance', 
      label: 'Barangay Clearance (Gasan)', 
      short: 'Barangay Clearance', 
      sub: 'Community Residency Proof',
      url: currentApp?.brgyClearanceUrl 
    }
  ];

  const currentDoc = docTabs.find(d => d.key === activeDocKey) || docTabs[0];

  // Document switching helper with loading protection
  const handleSelectDoc = (key) => {
    if (key === activeDocKey) return;
    const targetDoc = docTabs.find(d => d.key === key);
    setIsDocLoading(Boolean(targetDoc?.url && !targetDoc.url.toLowerCase().includes('.pdf')));
    setDocError(false);
    setActiveDocKey(key);
    resetCanvasView();
  };

  // When active applicant changes, reset viewer position, zoom, and error states
  useEffect(() => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsRejecting(false);
    setDocError(false);
    const initialDoc = docTabs.find(d => d.key === activeDocKey) || docTabs[0];
    setIsDocLoading(Boolean(initialDoc?.url && !initialDoc.url.toLowerCase().includes('.pdf')));
  }, [id, currentApp?._id]);

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

  // Isolated Canvas Wheel Zoom
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

  // Pan & Drag Handlers
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

  // Status Action (Approve / Reject / Release)
  const handleUpdateStatus = async (newStatus, customCancelReason = null, autoAdvance = true, rejectedField = '') => {
    if (!currentApp) return;
    setIsProcessing(true);

    try {
      const payload = {
        status: newStatus,
        cancelReason: newStatus === 'Cancelled' ? (customCancelReason || 'Application rejected during technical review.') : null,
        rejectedField: newStatus === 'Cancelled' ? (rejectedField || undefined) : undefined
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
          newStatus === 'For Signing'
            ? 'Application approved and queued for municipal signatures!'
            : newStatus === 'Ready for Pickup'
            ? 'Marked as Signed! Status set to Ready for Pickup.'
            : newStatus === 'Active'
            ? 'Franchise officially activated and released!'
            : 'Application marked as Cancelled/Rejected.',
          'success'
        );

        setIsRejecting(false);

        const TERMINAL_STATUSES = ['Active', 'Cancelled', 'Revoked', 'Expired'];
        if (TERMINAL_STATUSES.includes(newStatus)) {
          setQueue(prev => prev.filter(item => item._id !== currentApp._id));
        } else {
          setQueue(prev => prev.map(item => item._id === currentApp._id ? { ...item, status: newStatus } : item));
        }

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

  // Keyboard Shortcuts (A for Approve, R for Reject, 1-4 for Docs, Arrows for Nav, Esc for Exit)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (currentApp?.status === 'Pending') {
          handleUpdateStatus('For Signing', null, true);
        } else if (currentApp?.status === 'For Signing') {
          handleUpdateStatus('Ready for Pickup', null, true);
        } else if (currentApp?.status === 'Ready for Pickup') {
          handleUpdateStatus('Active', null, true);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsRejecting(prev => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        handleSelectDoc('orCrDocument');
      } else if (e.key === '2') {
        e.preventDefault();
        handleSelectDoc('license');
      } else if (e.key === '3') {
        e.preventDefault();
        handleSelectDoc('cedulaDoc');
      } else if (e.key === '4') {
        e.preventDefault();
        handleSelectDoc('todaEndorsement');
      } else if (e.key === '5') {
        e.preventDefault();
        handleSelectDoc('brgyClearance');
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
  }, [currentApp, hasNext, hasPrev, queue, currentIndex, activeDocKey]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center z-50">
        <Loader2 size={36} className="animate-spin text-[#9E2A2B] dark:text-[#D4AF37] mb-3" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Loading Franchise Review Workbench...</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Preparing documents and records...</p>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center z-50">
        <AlertCircle size={44} className="text-amber-500 mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Franchise Application Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          This record may have been processed or the queue has finished.
        </p>
        <button
          onClick={() => navigate('/franchise-approval')}
          className="mt-4 px-4 py-2 bg-[#9E2A2B] hover:bg-[#65151c] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          Return to Review Queue
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 overflow-hidden select-none z-40">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 max-w-md">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              toast.type === 'error' ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{toast.message}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER: MUNICIPAL HERITAGE VELVET MAROON RIBBON                       */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 bg-gradient-to-r from-[#852024] via-[#9E2A2B] to-[#801820] dark:from-[#180407] dark:via-[#24060a] dark:to-[#1A0B0E] text-white flex items-center justify-between gap-3 shrink-0 z-30 shadow-md border-b border-[#D4AF37]/30">
        
        {/* Left: Back & Applicant Summary */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/franchise-approval"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Return to Table (Shortcut: Esc)"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to List</span>
          </Link>

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
                : currentApp.status === 'For Signing'
                ? 'bg-purple-500/20 text-purple-100 border-purple-300/40'
                : currentApp.status === 'Active'
                ? 'bg-emerald-500/20 text-emerald-100 border-emerald-300/40'
                : 'bg-amber-500/20 text-amber-100 border-amber-300/40'
            }`}>
              {currentApp.status}
            </span>
          </div>
        </div>

        {/* Center: Queue Progress Navigator */}
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/15 text-xs font-semibold">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="p-1 rounded-lg hover:bg-white/15 text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous Application (ArrowLeft)"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-xs text-white select-none">
            {currentIndex >= 0 ? currentIndex + 1 : 1} / {queue.length || 1}
          </span>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="p-1 rounded-lg hover:bg-white/15 text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next Application (ArrowRight)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* MTOP Print */}
          {(currentApp.status === 'For Signing' || currentApp.status === 'Ready for Pickup' || currentApp.status === 'Active') && (
            <button
              onClick={() => setIsPrintOpen(true)}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
              title="Print Official MTOP Certificate"
            >
              <Printer size={14} className="text-[#D4AF37]" />
              <span className="hidden md:inline">Print MTOP</span>
            </button>
          )}

          {/* Application Summary */}
          <button
            onClick={() => setIsDossierOpen(true)}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
            title="Open Application Summary"
          >
            <FileText size={14} className="text-[#D4AF37]" />
            <span className="hidden md:inline">Summary</span>
          </button>


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
            <kbd className="hidden lg:inline text-[10px] px-1 bg-black/25 rounded text-white/80 font-mono">R</kbd>
          </button>

          {/* Primary: Approve / Sign / Release */}
          {currentApp.status === 'Pending' ? (
            <button
              onClick={() => handleUpdateStatus('For Signing', null, true)}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Approve requirements and route for municipal signature (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Approve for Signing</span>
              <kbd className="hidden lg:inline text-[10px] px-1 bg-white/20 rounded font-mono">A</kbd>
              <ChevronRight size={14} />
            </button>
          ) : currentApp.status === 'For Signing' ? (
            <button
              onClick={() => handleUpdateStatus('Ready for Pickup', null, true)}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Mark MTOP certificate as signed and ready for pickup (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Mark Signed &amp; Ready</span>
              <kbd className="hidden lg:inline text-[10px] px-1 bg-white/20 rounded font-mono">A</kbd>
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
              <kbd className="hidden lg:inline text-[10px] px-1 bg-white/20 rounded font-mono">A</kbd>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN WORKBENCH: STREAMLINED REVIEW PANEL & CRISP STUDIO CANVAS            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* ======================================================================= */}
        {/* LEFT REVIEW SHEET: DOCUMENT CHECKLIST & TABBED METADATA INSPECTOR       */}
        {/* ======================================================================= */}
        <aside className="w-full md:w-[360px] lg:w-[400px] bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-y-auto shadow-xs z-10">
          
          <div className="p-3.5 space-y-3.5 flex-1 flex flex-col">
            
            {/* 1. DOCUMENT CHECKLIST CARDS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  Attached Documents
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Keyboard [1 - 5]
                </span>
              </div>

              <div className="space-y-1.5">
                {docTabs.map((tab, idx) => {
                  const isActive = tab.key === activeDocKey;
                  const hasFile = Boolean(tab.url);

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleSelectDoc(tab.key)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-red-50 to-white dark:from-[#2a0c10] dark:to-[#161f30] border-[#9E2A2B] dark:border-[#D4AF37]/60 shadow-xs ring-1 ring-[#9E2A2B]/20 dark:ring-[#D4AF37]/30'
                          : 'bg-slate-50/80 dark:bg-[#0c101c] border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isActive 
                            ? 'bg-[#9E2A2B] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-xs' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-[#9E2A2B] dark:text-[#D4AF37]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {tab.short}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {tab.sub}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {hasFile ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                            <Check size={11} className="stroke-[3]" />
                            <span className="hidden sm:inline">Attached</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                            <AlertCircle size={11} />
                            <span className="hidden sm:inline">Missing</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. REJECTION ACCORDION (If Admin clicked Reject) */}
            {isRejecting && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-3 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-red-800 dark:text-red-300 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <XCircle size={14} className="text-red-600 dark:text-red-400" /> Reason for Rejection
                  </span>
                  <button 
                    onClick={() => setIsRejecting(false)} 
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <label className="text-[10px] font-bold text-red-900 dark:text-red-300 uppercase tracking-wider block">Defective Field (Directs Operator)</label>
                <select
                  value={rejectField}
                  onChange={(e) => setRejectField(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-900/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-red-500 font-medium"
                >
                  <option value="chassisNo">Chassis Number (Numero ng Chassis)</option>
                  <option value="motorNo">Motor / Engine Number (Numero ng Makina)</option>
                  <option value="plateNo">Plate Number (Plaka)</option>
                  <option value="cedulaDoc">Community Tax Certificate (Cedula) Document</option>
                  <option value="orCrDocument">Tricycle OR/CR Document (LTO)</option>
                  <option value="license">Driver's License (Lisensya)</option>
                  <option value="todaEndorsement">TODA Endorsement Certificate</option>
                  <option value="brgyClearance">Barangay Clearance</option>
                  <option value="make">Vehicle Make / Brand</option>
                  <option value="made">Model Year</option>
                  <option value="zone">Route / Zone Assignment</option>
                  <option value="applicantName">Applicant / Personal Details</option>
                </select>

                <label className="text-[10px] font-bold text-red-900 dark:text-red-300 uppercase tracking-wider block">Reason for Rejection</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-900/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-red-500 font-medium"
                >
                  {REJECT_REASONS.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>

                {rejectReason === 'Others (Please specify)' && (
                  <textarea
                    rows={2}
                    placeholder="Enter specific reason for rejection..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-900/80 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  />
                )}

                <button
                  onClick={() => {
                    const reason = rejectReason === 'Others (Please specify)' ? customReason : rejectReason;
                    handleUpdateStatus('Cancelled', reason, true, rejectField);
                  }}
                  disabled={isProcessing}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  <span>Confirm Rejection &amp; Next</span>
                </button>
              </div>
            )}

            {/* 3. DOCUMENT SPECIFICATIONS (DYNAMIC TO ACTIVE DOCUMENT) */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                  Document Details
                </span>
                <span className="text-[11px] font-semibold text-[#9E2A2B] dark:text-[#D4AF37] bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 border border-[#9E2A2B]/20 dark:border-[#D4AF37]/20 px-2 py-0.5 rounded-md">
                  {currentDoc.short}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2.5">
                {/* Notice if document not attached */}
                {!currentDoc.url && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>No document uploaded for this requirement.</span>
                  </div>
                )}

                {/* Dynamic fields based on activeDocKey */}
                {activeDocKey === 'orCrDocument' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>LTO Registration Specifications</span>
                      <span className="text-[10px] text-slate-400">Cross-check with OR/CR image</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Plate Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Plate Number</span>
                          <span className="font-mono font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">{currentApp.plateNo || 'Pending'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.plateNo, 'plateNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy Plate Number"
                        >
                          {copiedField === 'plateNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* OR / CR Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">OR / CR Number</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.orCrNo || '—'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.orCrNo, 'orCrNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy OR/CR Number"
                        >
                          {copiedField === 'orCrNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* Motor Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Motor / Engine No.</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">{currentApp.motorNo || '—'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.motorNo, 'motorNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                          title="Copy Motor Number"
                        >
                          {copiedField === 'motorNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* Chassis Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Chassis Number</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">{currentApp.chassisNo || '—'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.chassisNo, 'chassisNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                          title="Copy Chassis Number"
                        >
                          {copiedField === 'chassisNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* Vehicle Make & Model */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Make / Brand</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">{currentApp.make || '—'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Model Year</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">{currentApp.made || '—'}</span>
                        </div>
                      </div>

                      {/* Registration Expiry Date */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Registration Expiry</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.orCrExpiryDate)}</span>
                        </div>
                        {currentApp.orCrExpiryDate && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isDateExpired(currentApp.orCrExpiryDate)
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                          }`}>
                            {isDateExpired(currentApp.orCrExpiryDate) ? 'Expired' : 'Valid'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeDocKey === 'license' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Driver's License Specifications</span>
                      <span className="text-[10px] text-slate-400">Cross-check with License card</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Driver Designation */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Driver Designation</span>
                          <span className="font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">
                            {currentApp.isOperatorDriver ? 'Operator is the Driver' : 'Designated Driver'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {currentApp.isOperatorDriver ? 'Self-Drive' : 'Employed'}
                        </span>
                      </div>

                      {/* Driver Name */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Driver Full Name</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">
                            {currentApp.isOperatorDriver ? currentApp.fullName : (currentApp.driverName || '—')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.isOperatorDriver ? currentApp.fullName : currentApp.driverName, 'driverName')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                          title="Copy Driver Name"
                        >
                          {copiedField === 'driverName' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* License Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">License Number</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.driverLicenseNo || '—'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.driverLicenseNo, 'driverLicenseNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy License Number"
                        >
                          {copiedField === 'driverLicenseNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* License Expiry */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">License Expiration</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.driverLicenseExpiryDate)}</span>
                        </div>
                        {currentApp.driverLicenseExpiryDate && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isDateExpired(currentApp.driverLicenseExpiryDate)
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                          }`}>
                            {isDateExpired(currentApp.driverLicenseExpiryDate) ? 'Expired' : 'Valid'}
                          </span>
                        )}
                      </div>

                      {/* Contact Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Driver Contact</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                            {currentApp.isOperatorDriver ? (currentApp.contact || '—') : (currentApp.driverContact || '—')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.isOperatorDriver ? currentApp.contact : currentApp.driverContact, 'driverContact')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy Driver Contact"
                        >
                          {copiedField === 'driverContact' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeDocKey === 'cedulaDoc' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Cedula / CTC Specifications</span>
                      <span className="text-[10px] text-slate-400">Cross-check with Cedula</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Cedula Serial No */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">CTC Serial Number</span>
                          <span className="font-mono font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">{currentApp.cedulaSerialNo || '—'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.cedulaSerialNo, 'cedulaSerialNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy Cedula Serial"
                        >
                          {copiedField === 'cedulaSerialNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* Date Issued */}
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Date Issued</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.cedulaDate)}</span>
                      </div>

                      {/* Place of Issue */}
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Place Issued</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.cedulaAddress || 'Gasan, Marinduque'}</span>
                      </div>

                      {/* Taxpayer Name */}
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Taxpayer Name</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.fullName || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDocKey === 'todaEndorsement' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>TODA Endorsement Specifications</span>
                      <span className="text-[10px] text-slate-400">Cross-check with Certificate</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* TODA Association */}
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">TODA Association</span>
                        <span className="font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">{currentApp.todaName || currentApp.toda || '—'}</span>
                      </div>

                      {/* Route Zone */}
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Assigned Route / Zone</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                          {currentApp.zone ? (currentApp.zone.toString().toLowerCase().includes('zone') ? currentApp.zone : `Zone ${currentApp.zone}`) : '—'}
                        </span>
                      </div>

                      {/* Certificate Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Certificate / Endorsement No.</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.todaCertNo || '—'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.todaCertNo, 'todaCertNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy TODA Cert No."
                        >
                          {copiedField === 'todaCertNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* Date Issued */}
                      {currentApp.todaCertDate && (
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Date Issued</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.todaCertDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDocKey === 'brgyClearance' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Barangay Clearance Specifications</span>
                      <span className="text-[10px] text-slate-400">Cross-check with Clearance</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Barangay */}
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Barangay of Residence</span>
                        <span className="font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">{currentApp.barangay || currentApp.address || '—'}</span>
                      </div>

                      {/* Clearance Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Clearance Number</span>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.brgyClearanceNo || '—'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.brgyClearanceNo, 'brgyClearanceNo')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy Clearance No."
                        >
                          {copiedField === 'brgyClearanceNo' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>

                      {/* Date Issued */}
                      {currentApp.brgyClearanceDate && (
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Date Issued</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.brgyClearanceDate)}</span>
                        </div>
                      )}

                      {/* Resident Full Name */}
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Resident Name</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.fullName || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. KEYBOARD SHORTCUT HELPER */}
            <div className="mt-auto pt-2">
              <div className="p-2.5 bg-slate-50 dark:bg-[#0c101c] rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-1.5">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300">A</kbd>
                  <span>Approve</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300">R</kbd>
                  <span>Reject</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300">1-5</kbd>
                  <span>Docs</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300">&larr;/&rarr;</kbd>
                  <span>Queue</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300">Esc</kbd>
                  <span>Exit</span>
                </span>
              </div>
            </div>

          </div>
        </aside>

        {/* ======================================================================= */}
        {/* RIGHT DOCUMENT VIEWER CANVAS (STUDIO DESK VIEWPORT)                    */}
        {/* ======================================================================= */}
        <main className="flex-1 flex flex-col bg-slate-200/75 dark:bg-[#070a12] relative overflow-hidden h-full">
          
          {/* FLOATING TOP CANVAS TOOLBAR */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200">
            {/* Zoom Out */}
            <button
              onClick={() => setZoomScale(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>

            {/* Percentage Badge */}
            <button
              onClick={resetCanvasView}
              className="text-xs font-semibold px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#9E2A2B] dark:text-[#D4AF37] min-w-[46px] text-center cursor-pointer"
              title="Click to reset to 100%"
            >
              {Math.round(zoomScale * 100)}%
            </button>

            {/* Zoom In */}
            <button
              onClick={() => setZoomScale(prev => Math.min(4.0, Number((prev + 0.25).toFixed(2))))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Rotate 90 deg */}
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rotate 90° Clockwise"
            >
              <RotateCw size={16} />
            </button>

            {/* Reset View */}
            <button
              onClick={resetCanvasView}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Reset View (Center & 100%)"
            >
              <RefreshCw size={14} />
            </button>

            {/* Open Original File in New Tab */}
            {currentDoc?.url && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                <a
                  href={currentDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#9E2A2B] dark:text-[#D4AF37] rounded-lg transition-colors flex items-center cursor-pointer"
                  title="Open Raw Original in New Tab"
                >
                  <ExternalLink size={15} />
                </a>
              </>
            )}
          </div>

          {/* ACTIVE DOCUMENT LABEL BADGE (TOP LEFT OF CANVAS) */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
              <FileText size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                {currentDoc.label}
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* THE INTERACTIVE PAN/DRAG CANVAS VIEWPORT                              */}
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
          >
            {/* If no document uploaded */}
            {!currentDoc?.url ? (
              <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md max-w-sm">
                <AlertCircle size={38} className="text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">No Attached Document</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  The applicant has not uploaded a file for {currentDoc.short} yet.
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
                className="max-w-none flex items-center justify-center pointer-events-none relative"
              >
                {/* Instant Loading Shimmer / Spinner Overlay */}
                {isDocLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-[#111827]/85 backdrop-blur-xs rounded-2xl z-10 p-6 min-w-[280px] min-h-[280px] border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in duration-150">
                    <Loader2 size={32} className="animate-spin text-[#9E2A2B] dark:text-[#D4AF37] mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Loading document...</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Rendering {currentDoc.short}</span>
                  </div>
                )}

                {/* Error Fallback */}
                {docError ? (
                  <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-2xl border border-red-200 dark:border-red-900/60 shadow-xl max-w-sm pointer-events-auto">
                    <AlertTriangle size={36} className="text-red-500 mx-auto mb-2" />
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Unable to Load Document</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      A network error occurred while loading the image. You can open the original file directly.
                    </p>
                    <a
                      href={currentDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ExternalLink size={13} /> Open in New Tab
                    </a>
                  </div>
                ) : (
                  <img
                    key={currentDoc.url}
                    src={currentDoc.url}
                    alt={currentDoc.label}
                    draggable={false}
                    onLoad={() => setIsDocLoading(false)}
                    onError={() => {
                      setIsDocLoading(false);
                      setDocError(true);
                    }}
                    className={`max-h-[82vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/70 bg-white dark:bg-[#111827] border border-slate-300/80 dark:border-slate-700/80 p-1.5 select-none transition-opacity duration-200 ${
                      isDocLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                )}
              </div>
            )}
          </div>

          {/* FLOATING BOTTOM HINT */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Move size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> Drag to pan
            </span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span className="flex items-center gap-1.5">
              <ZoomIn size={13} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> Scroll to zoom
            </span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Double-click to reset</span>
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

      {/* Application Summary Modal (Slide 1 Design) */}
      <AdminApplicationSummaryModal 
        isOpen={isDossierOpen} 
        onClose={() => setIsDossierOpen(false)} 
        franchise={currentApp} 
        onApprove={() => { 
          setIsDossierOpen(false); 
          handleUpdateStatus('For Signing', null, true); 
        }} 
        onReject={() => { 
          setIsDossierOpen(false); 
          setIsRejecting(true); 
        }} 
        isProcessing={isProcessing} 
      />
    </div>
  );
};

export default FranchiseReviewPage;
