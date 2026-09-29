import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, 
  FileText, AlertCircle, Loader2, Printer, Move, Check, AlertTriangle,
  Copy, ShieldCheck, User, Car, FileCheck, Layers, FileSpreadsheet, Sparkles
} from 'lucide-react';
import MtopCertificateModal from '../../components/admin/MtopCertificateModal';
import ApplicationDossierModal from '../../components/admin/ApplicationDossierModal';

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

  // Inspector Tabs State ('match' | 'applicant' | 'cedula' | 'ai')
  const [inspectorTab, setInspectorTab] = useState('match');
  const [copiedField, setCopiedField] = useState(null);

  // AI Verification State
  const [isAiVerifying, setIsAiVerifying] = useState(false);

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

  const handleRunAiVerification = async () => {
    if (!currentApp?._id) return;
    setIsAiVerifying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${currentApp._id}/verify-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok && data.franchise) {
        setCurrentApp(data.franchise);
        setInspectorTab('ai');
        showToast('Natapos ang AI Document Verification gamit ang Gemini!', 'success');
      } else {
        showToast(data.message || 'Hindi natapos ang verification.', 'error');
      }
    } catch (err) {
      console.error('AI verification failed:', err);
      showToast('Error habang sinusuri ang mga dokumento gamit ang AI.', 'error');
    } finally {
      setIsAiVerifying(false);
    }
  };

  const handleApplyMismatchRejection = (comparison) => {
    setIsRejecting(true);
    setRejectField(comparison.field || 'chassisNo');
    setCustomReason(`Discrepancy detected by AI: ${comparison.label} mismatch. In-enter ng operator: "${comparison.inputValue}", ngunit nakita sa opisyal na dokumento: "${comparison.extractedValue}". Mangyaring i-upload ang tamang dokumento o itama ang impormasyon.`);
    setRejectReason('Others (Please specify)');
    showToast(`Inilagay ang ${comparison.label} discrepancy sa rejection form.`, 'success');
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
        handleSelectDoc('todaEndorsement');
      } else if (e.key === '4') {
        e.preventDefault();
        handleSelectDoc('brgyClearance');
      } else if (e.key === '5') {
        e.preventDefault();
        handleSelectDoc('cedulaDoc');
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

          {/* Application Dossier */}
          <button
            onClick={() => setIsDossierOpen(true)}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
            title="Open Application Dossier & Evaluation Sheet"
          >
            <FileSpreadsheet size={14} className="text-[#D4AF37]" />
            <span className="hidden md:inline">Application Dossier</span>
          </button>

          {/* AI Verify Gemini Button */}
          <button
            onClick={() => {
              if (currentApp?.aiVerification?.status && currentApp?.aiVerification?.status !== 'unverified') {
                setInspectorTab('ai');
              } else {
                handleRunAiVerification();
              }
            }}
            disabled={isAiVerifying}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              currentApp?.aiVerification?.status === 'flagged'
                ? 'bg-rose-600/40 hover:bg-rose-600/60 text-rose-100 border-rose-400/60 shadow-xs ring-1 ring-rose-400/40'
                : currentApp?.aiVerification?.status === 'verified'
                ? 'bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-100 border-emerald-400/60'
                : 'bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-100 border-indigo-400/50'
            }`}
            title="Suriin ang mga dokumento gamit ang Gemini Vision AI"
          >
            {isAiVerifying ? (
              <Loader2 size={14} className="animate-spin text-[#D4AF37]" />
            ) : (
              <Sparkles size={14} className="text-[#D4AF37]" />
            )}
            <span className="hidden md:inline">
              {isAiVerifying ? 'Verifying...' : currentApp?.aiVerification?.status === 'flagged' ? 'AI Flagged' : currentApp?.aiVerification?.status === 'verified' ? 'AI Verified' : 'AI Verify'}
            </span>
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
                  Keyboard [1 - 4]
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
                  <span>Kumpirmahin ang Rejection &amp; Sunod</span>
                </button>
              </div>
            )}

            {/* 3. TABBED METADATA INSPECTOR */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Form Verification Inspector
                </span>
                <span className="text-[11px] font-semibold text-[#9E2A2B] dark:text-[#D4AF37] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 px-2 py-0.5 rounded-md">
                  {currentApp.applicationType || 'New Application'}
                </span>
              </div>

              {/* Segmented Control Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-[#0c101c] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectorTab('match')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inspectorTab === 'match'
                      ? 'bg-white dark:bg-[#1f293d] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Car size={13} />
                  <span>Match</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('applicant')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inspectorTab === 'applicant'
                      ? 'bg-white dark:bg-[#1f293d] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <User size={13} />
                  <span>Operator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('cedula')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inspectorTab === 'cedula'
                      ? 'bg-white dark:bg-[#1f293d] text-[#9E2A2B] dark:text-[#D4AF37] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileCheck size={13} />
                  <span>Cedula</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('ai')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                    inspectorTab === 'ai'
                      ? 'bg-white dark:bg-[#1f293d] text-indigo-700 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={13} className={currentApp.aiVerification?.status === 'flagged' ? 'text-rose-500' : 'text-indigo-500'} />
                  <span>AI Verify</span>
                  {currentApp.aiVerification?.summary?.mismatchedFields > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 animate-pulse" />
                  )}
                </button>
              </div>

              {/* TAB 1: VEHICLE VERIFICATION MATCH (CRITICAL FOR OR/CR INSPECTION) */}
              {inspectorTab === 'match' && (
                <div className="bg-slate-50/80 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Vehicle Specifications
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Click serial to copy
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {/* Plate Number */}
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Plate Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-amber-300 font-mono tracking-wide">
                          {currentApp.plateNo || 'Pending'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.plateNo, 'plateNo')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                          title="Copy Plate Number"
                        >
                          {copiedField === 'plateNo' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Chassis Serial No */}
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Chassis No:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] font-mono truncate max-w-[170px]">
                          {currentApp.chassisNo || 'N/A'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.chassisNo, 'chassisNo')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                          title="Copy Chassis Serial Number"
                        >
                          {copiedField === 'chassisNo' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Motor / Engine No */}
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Motor / Engine:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono truncate max-w-[170px]">
                          {currentApp.motorNo || 'N/A'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.motorNo, 'motorNo')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                          title="Copy Motor Number"
                        >
                          {copiedField === 'motorNo' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Vehicle Make & Year Model */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium block">Make</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{currentApp.make || 'N/A'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium block">Year Model</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{currentApp.made || 'N/A'}</span>
                      </div>
                    </div>

                    {/* LTO OR/CR No */}
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">LTO OR/CR No:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono truncate max-w-[170px]">
                          {currentApp.orCrNo || 'N/A'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.orCrNo, 'orCrNo')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                          title="Copy LTO OR/CR Number"
                        >
                          {copiedField === 'orCrNo' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* LTO Registration Validity / Expiry Date */}
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">LTO Validity:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatDate(currentApp.orCrExpiryDate)}
                        </span>
                        {currentApp.orCrExpiryDate && (
                          isDateExpired(currentApp.orCrExpiryDate) ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-900/60 px-1.5 py-0.5 rounded">
                              EXPIRED
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/60 px-1.5 py-0.5 rounded">
                              VALID
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                    <ShieldCheck size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>Compare Chassis and Motor No. with the official OR/CR document displayed on the right before approving.</span>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICANT & OPERATOR / DRIVER INFO */}
              {inspectorTab === 'applicant' && (
                <div className="bg-slate-50/80 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 animate-in fade-in duration-150">
                  {/* Operator Profile */}
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Operator Profile
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Zone {currentApp.zone || 1}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Full Name:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[210px]">{currentApp.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Contact Number:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{currentApp.contact || currentApp.operator?.contact || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Barangay:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[210px]">{currentApp.address}, Gasan</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">TODA Association:</span>
                        <span className="font-bold text-[#9E2A2B] dark:text-[#D4AF37] text-right truncate max-w-[210px]">{currentApp.todaName || 'Non-TODA'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Application Type:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{currentApp.applicationType || 'New'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Date Filed:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{formatDate(currentApp.dateApplied || currentApp.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Driver Designation */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between pb-1.5 mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <User size={12} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                        Authorized Driver
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        currentApp.isOperatorDriver !== false
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {currentApp.isOperatorDriver !== false ? 'Self-Operated (Owner-Driver)' : 'Designated Driver'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {currentApp.isOperatorDriver === false && (
                        <>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Driver's Name:</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[200px]">{currentApp.driverName || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Driver Contact:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{currentApp.driverContact || 'N/A'}</span>
                          </div>
                        </>
                      )}

                      {/* Driver's License No with copy */}
                      <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">License No:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {currentApp.driverLicenseNo || 'N/A'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentApp.driverLicenseNo, 'driverLicenseNo')}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                            title="Copy Driver's License Number"
                          >
                            {copiedField === 'driverLicenseNo' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* License Expiry Date */}
                      <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">License Expiry:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatDate(currentApp.driverLicenseExpiryDate)}
                          </span>
                          {currentApp.driverLicenseExpiryDate && (
                            isDateExpired(currentApp.driverLicenseExpiryDate) ? (
                              <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-900/60 px-1.5 py-0.5 rounded">
                                EXPIRED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/60 px-1.5 py-0.5 rounded">
                                VALID
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TODA & Barangay Statutory Verification */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={12} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                      Clearances &amp; Statutory Records
                    </span>

                    {/* TODA Certificate Card */}
                    <div className="p-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase">TODA Certificate</span>
                        {currentApp.todaCertNo && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentApp.todaCertNo, 'todaCertNo')}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Copy TODA Cert No"
                          >
                            {copiedField === 'todaCertNo' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Cert No:</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">{currentApp.todaCertNo || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Date Issued:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{formatDate(currentApp.todaCertDate)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Signatory:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{currentApp.todaSignatory || 'TODA President'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barangay Clearance Card */}
                    <div className="p-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase">Barangay Clearance</span>
                        {currentApp.brgyClearanceNo && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentApp.brgyClearanceNo, 'brgyClearanceNo')}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Copy Barangay Clearance No"
                          >
                            {copiedField === 'brgyClearanceNo' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Clearance No:</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">{currentApp.brgyClearanceNo || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Date Issued:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{formatDate(currentApp.brgyClearanceDate)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Issuer:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{currentApp.brgyIssuer || 'Punong Barangay'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: CEDULA / COMMUNITY TAX CERTIFICATE */}
              {inspectorTab === 'cedula' && (
                <div className="bg-slate-50/80 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Cedula Record
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Official CTC
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Serial No:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {currentApp.cedulaSerialNo || 'N/A'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentApp.cedulaSerialNo, 'cedulaSerial')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                          title="Copy Cedula Serial"
                        >
                          {copiedField === 'cedulaSerial' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Date of Issue:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{formatDate(currentApp.cedulaDate)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Place of Issue:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">{currentApp.cedulaAddress || 'Gasan, Marinduque'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GEMINI VISION AI DOCUMENT VERIFICATION */}
              {inspectorTab === 'ai' && (
                <div className="bg-slate-50/80 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 animate-in fade-in duration-150">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Gemini Vision Verification
                      </span>
                    </div>
                    {currentApp.aiVerification?.status && currentApp.aiVerification?.status !== 'unverified' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        currentApp.aiVerification.status === 'flagged'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60'
                      }`}>
                        {currentApp.aiVerification.status === 'flagged' ? 'DISCREPANCY DETECTED' : 'VERIFIED TUGMA'}
                      </span>
                    )}
                  </div>

                  {/* If never verified or to re-run */}
                  {(!currentApp.aiVerification || currentApp.aiVerification.status === 'unverified') ? (
                    <div className="p-3 text-center space-y-2.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={20} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Awtomatikong Basahin at I-crosscheck ang mga Dokumento
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Gagamitin ang Google Gemini Multimodal Vision upang basahin ang litrato ng OR/CR, Lisensya, atbp. at suriin kung tugma sa in-enter ng operator.
                      </p>
                      <button
                        type="button"
                        onClick={handleRunAiVerification}
                        disabled={isAiVerifying}
                        className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isAiVerifying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        <span>{isAiVerifying ? 'Sinisuri ang mga Dokumento...' : 'Simulan ang AI Verification'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Summary stats pill */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Tugma</span>
                          <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                            {currentApp.aiVerification.summary?.matchedFields || 0}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                          <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Hindi Tugma</span>
                          <span className="text-sm font-extrabold text-rose-800 dark:text-rose-300">
                            {currentApp.aiVerification.summary?.mismatchedFields || 0}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block">Malabo/Di Basa</span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                            {currentApp.aiVerification.summary?.unclearFields || 0}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Assessment */}
                      {currentApp.aiVerification.overallNotes && (
                        <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                          currentApp.aiVerification.status === 'flagged'
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                        }`}>
                          <p className="font-semibold">{currentApp.aiVerification.overallNotes}</p>
                        </div>
                      )}

                      {/* Document Details List */}
                      {Object.entries(currentApp.aiVerification.documents || {}).map(([docKey, docData]) => {
                        if (!docData || !docData.hasDocument || !Array.isArray(docData.comparisons) || docData.comparisons.length === 0) return null;
                        
                        const docLabels = {
                          orCr: 'LTO OR/CR Document',
                          license: "Driver's License Card",
                          cedula: 'Community Tax Certificate (Cedula)',
                          todaEndorsement: 'TODA Endorsement Certificate',
                          brgyClearance: 'Barangay Clearance'
                        };

                        return (
                          <div key={docKey} className="p-2.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
                              <span className="text-[11px] font-bold text-[#9E2A2B] dark:text-[#D4AF37]">
                                {docLabels[docKey] || docKey}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                docData.status === 'mismatch'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : docData.status === 'match'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {docData.status === 'mismatch' ? 'Mismatch' : docData.status === 'match' ? 'Match' : 'Inspect'}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {docData.comparisons.map((comp, cIdx) => (
                                <div key={cIdx} className={`p-1.5 rounded-lg border text-[11px] ${
                                  comp.status === 'mismatch'
                                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                                    : comp.status === 'match'
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {comp.label}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                      comp.status === 'match' ? 'text-emerald-600 dark:text-emerald-400' : comp.status === 'mismatch' ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-500'
                                    }`}>
                                      {comp.status === 'match' ? '✓ Tugma' : comp.status === 'mismatch' ? '✗ Hindi Tugma' : '? Malabo'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                                    <div>
                                      <span className="text-slate-400 dark:text-slate-500 block">In-enter:</span>
                                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{comp.inputValue}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 dark:text-slate-500 block">Nasa Dokumento:</span>
                                      <span className={`font-mono font-bold truncate block ${
                                        comp.status === 'mismatch' ? 'text-rose-600 dark:text-rose-400 underline' : 'text-slate-800 dark:text-slate-200'
                                      }`}>{comp.extractedValue}</span>
                                    </div>
                                  </div>

                                  {/* Quick Auto-Fill Rejection if Mismatch */}
                                  {comp.status === 'mismatch' && (
                                    <button
                                      type="button"
                                      onClick={() => handleApplyMismatchRejection(comp)}
                                      className="mt-1.5 w-full py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                      title="Auto-fill this mismatch reason in rejection form"
                                    >
                                      <XCircle size={11} />
                                      <span>I-reject Dahil sa Discrepancy na Ito</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Re-analyze Button */}
                      <button
                        type="button"
                        onClick={handleRunAiVerification}
                        disabled={isAiVerifying}
                        className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isAiVerifying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        <span>{isAiVerifying ? 'Muling sinusuri...' : 'Muling Suriin Gamit ang AI'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300">1-4</kbd>
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

      {/* Application Dossier Modal */}
      <ApplicationDossierModal 
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
