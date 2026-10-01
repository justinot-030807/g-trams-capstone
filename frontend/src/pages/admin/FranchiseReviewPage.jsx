import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw, ExternalLink, 
  FileText, AlertCircle, Loader2, Printer, Move, Check, AlertTriangle,
  Copy, ShieldCheck, User, Car, FileCheck, Layers, FileSpreadsheet, Sparkles,
  Maximize2, SunMedium, Keyboard, Undo2, Lock
} from 'lucide-react';
import MtopCertificateModal from '../../components/admin/MtopCertificateModal';
import AdminApplicationSummaryModal from '../../components/admin/AdminApplicationSummaryModal';
import { useSocket } from '../../context/SocketContext';
import { evaluateDocumentValidity } from '../../utils/dateValidity';

const REJECT_REASONS = [
  'Missing or Expired LTO Official Receipt / Certificate of Registration (OR/CR)',
  'Chassis Serial Number mismatch between application form and OR/CR document',
  'Motor / Engine Serial Number mismatch between application form and OR/CR document',
  'Blurry or unreadable document photo / scan',
  'Expired or invalid Professional Driver\'s License',
  'Missing or Expired TODA Endorsement Certificate for specified zone',
  'Barangay Clearance is expired or issued outside Gasan, Marinduque',
  'Missing Community Tax Certificate (Cedula) / CTC date invalid',
  'Vehicle model year does not meet municipal standard age criteria',
  'Applicant name mismatch across submitted documents',
  'Others (Please specify)'
];

const FranchiseReviewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';
  const { socket } = useSocket() || {};

  // Queue and Application State
  const [queue, setQueue] = useState([]);
  const [currentApp, setCurrentApp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 10-Second Undo State
  const [undoState, setUndoState] = useState({
    show: false,
    franchiseId: null,
    previousStatus: '',
    previousCancelReason: '',
    previousRejectedField: '',
    newStatus: '',
    applicantName: '',
    secondsLeft: 10
  });

  // Concurrency Review Lock
  const [reviewLock, setReviewLock] = useState({ isLocked: false, reviewerName: '' });

  // Document Viewer State
  const [activeDocKey, setActiveDocKey] = useState('orCrDocument');
  const [isDocLoading, setIsDocLoading] = useState(true);
  const [docError, setDocError] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isFitToWidth, setIsFitToWidth] = useState(false);
  const [brightness, setBrightness] = useState(100); // 100, 125, 150, 175
  const [contrast, setContrast] = useState(100);     // 100, 125, 150
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const [copiedField, setCopiedField] = useState(null);

  // Rejection State
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectField, setRejectField] = useState('chassisNo');
  const [customReason, setCustomReason] = useState('');

  // Modals
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

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

  const copyToClipboard = (text, fieldName) => {
    if (!text || text === 'N/A' || text === 'Pending') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Phase 1: Fetch current franchise
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

  // Phase 2: Fetch tab-specific queue so the pager accurately iterates the current tab
  const fetchQueue = useCallback(async () => {
    try {
      let statusQuery = 'Pending,Pending for Approval';
      if (currentTab === 'signing') statusQuery = 'For Signing';
      else if (currentTab === 'ready') statusQuery = 'Ready for Pickup';
      else if (currentTab === 'all') statusQuery = 'All';

      const url = statusQuery === 'All'
        ? `${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=500`
        : `${import.meta.env.VITE_API_URL}/api/v1/franchises?status=${encodeURIComponent(statusQuery)}&limit=500`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        
        // FIFO queue sorting (oldest first for peak processing)
        const sortedQueue = [...list].sort((a, b) => 
          new Date(a.dateApplied || a.createdAt || 0) - new Date(b.dateApplied || b.createdAt || 0)
        );

        setQueue(sortedQueue);
      }
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
    }
  }, [currentTab]);

  useEffect(() => {
    fetchCurrentApp(id);
    fetchQueue();
  }, [id, fetchCurrentApp, fetchQueue]);

  // Concurrency: Socket Review Locking
  useEffect(() => {
    if (!socket || !currentApp?._id) return;
    const adminName = localStorage.getItem('name') || 'Administrator';

    socket.emit('review:join', { franchiseId: currentApp._id, userName: adminName }, (res) => {
      if (res?.isLocked) {
        setReviewLock({ isLocked: true, reviewerName: res.reviewerName });
      } else {
        setReviewLock({ isLocked: false, reviewerName: '' });
      }
    });

    const onLocked = (data) => {
      if (data.franchiseId === currentApp._id && data.reviewerId !== socket.userId) {
        setReviewLock({ isLocked: true, reviewerName: data.reviewerName });
      }
    };

    const onUnlocked = (data) => {
      if (data.franchiseId === currentApp._id) {
        setReviewLock({ isLocked: false, reviewerName: '' });
      }
    };

    socket.on('review:locked', onLocked);
    socket.on('review:unlocked', onUnlocked);

    return () => {
      socket.emit('review:leave', { franchiseId: currentApp._id });
      socket.off('review:locked', onLocked);
      socket.off('review:unlocked', onUnlocked);
    };
  }, [socket, currentApp?._id]);

  // 10-Second Undo Timer
  useEffect(() => {
    if (!undoState.show) return;
    if (undoState.secondsLeft <= 0) {
      setUndoState(prev => ({ ...prev, show: false }));
      return;
    }
    const timer = setInterval(() => {
      setUndoState(prev => {
        if (prev.secondsLeft <= 1) {
          clearInterval(timer);
          return { ...prev, show: false, secondsLeft: 0 };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [undoState.show, undoState.secondsLeft]);

  // Preload current application document images
  useEffect(() => {
    if (!currentApp) return;
    const urls = [
      currentApp.orCrUrl,
      currentApp.licenseUrl,
      currentApp.cedulaUrl,
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

  // Preload NEXT application document images for instantaneous transition
  const currentIndex = queue.findIndex(item => item._id === (currentApp?._id || id));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  useEffect(() => {
    if (hasNext && queue[currentIndex + 1]) {
      const nextApp = queue[currentIndex + 1];
      [nextApp.orCrUrl, nextApp.licenseUrl, nextApp.cedulaUrl, nextApp.todaEndorsementUrl, nextApp.brgyClearanceUrl]
        .filter(Boolean)
        .forEach(url => {
          if (!url.toLowerCase().includes('.pdf')) {
            const img = new Image();
            img.src = url;
          }
        });
    }
  }, [hasNext, currentIndex, queue]);

  // Enforce edge-to-edge layout
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

  const handleSelectDoc = (key) => {
    if (key === activeDocKey) return;
    const targetDoc = docTabs.find(d => d.key === key);
    setIsDocLoading(Boolean(targetDoc?.url && !targetDoc.url.toLowerCase().includes('.pdf')));
    setDocError(false);
    setActiveDocKey(key);
    resetCanvasView();
  };

  useEffect(() => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsFitToWidth(false);
    setIsRejecting(false);
    setDocError(false);
    const initialDoc = docTabs.find(d => d.key === activeDocKey) || docTabs[0];
    setIsDocLoading(Boolean(initialDoc?.url && !initialDoc.url.toLowerCase().includes('.pdf')));
  }, [id, currentApp?._id]);

  const goToNext = () => {
    if (hasNext) {
      navigate(`/franchise-approval/review/${queue[currentIndex + 1]._id}?tab=${currentTab}`);
    }
  };

  const goToPrev = () => {
    if (hasPrev) {
      navigate(`/franchise-approval/review/${queue[currentIndex - 1]._id}?tab=${currentTab}`);
    }
  };

  // Wheel Zoom
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
    return () => canvasEl.removeEventListener('wheel', onWheelHandler);
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

  const handleMouseUp = () => setIsDragging(false);

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

  const handleTouchEnd = () => setIsDragging(false);

  const resetCanvasView = () => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsFitToWidth(false);
    setBrightness(100);
    setContrast(100);
  };

  const handleDoubleClick = () => {
    if (zoomScale === 1) {
      setZoomScale(1.8);
    } else {
      resetCanvasView();
    }
  };

  const toggleBrightness = () => {
    const cycle = [100, 125, 150, 175];
    const nextIdx = (cycle.indexOf(brightness) + 1) % cycle.length;
    setBrightness(cycle[nextIdx]);
    if (cycle[nextIdx] > 100) {
      setContrast(120);
    } else {
      setContrast(100);
    }
  };

  // Status Action (Approve / Reject / Release) + 10s Undo + Auto Advance
  const handleUpdateStatus = async (newStatus, customCancelReason = null, autoAdvance = true, rejectedField = '') => {
    if (!currentApp || reviewLock.isLocked) return;
    setIsProcessing(true);

    const prevAppStatus = currentApp.status;
    const prevAppReason = currentApp.cancelReason || '';
    const prevAppField = currentApp.rejectedField || '';
    const targetAppId = currentApp._id;
    const targetApplicantName = currentApp.fullName;

    try {
      const payload = {
        status: newStatus,
        cancelReason: newStatus === 'Cancelled' ? (customCancelReason || 'Application rejected during technical review.') : null,
        rejectedField: newStatus === 'Cancelled' ? (rejectedField || undefined) : undefined
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${targetAppId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsRejecting(false);

        // Arm 10-second undo toast
        setUndoState({
          show: true,
          franchiseId: targetAppId,
          previousStatus: prevAppStatus,
          previousCancelReason: prevAppReason,
          previousRejectedField: prevAppField,
          newStatus,
          applicantName: targetApplicantName,
          secondsLeft: 10
        });

        const TERMINAL_STATUSES = ['Active', 'Cancelled', 'Revoked', 'Expired'];
        if (TERMINAL_STATUSES.includes(newStatus)) {
          setQueue(prev => prev.filter(item => item._id !== targetAppId));
        } else {
          setQueue(prev => prev.map(item => item._id === targetAppId ? { ...item, status: newStatus } : item));
        }

        if (autoAdvance) {
          if (hasNext) {
            goToNext();
          } else {
            showToast('All applications in this tab review session completed!', 'success');
            setTimeout(() => navigate(`/franchise-approval?tab=${currentTab}`), 1200);
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

  // Rollback Action on Undo
  const handleExecuteUndo = async () => {
    if (!undoState.franchiseId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${undoState.franchiseId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: undoState.previousStatus,
          cancelReason: undoState.previousCancelReason,
          rejectedField: undoState.previousRejectedField
        })
      });

      if (res.ok) {
        showToast(`Action undone! Restored ${undoState.applicantName} to ${undoState.previousStatus}.`, 'success');
        navigate(`/franchise-approval/review/${undoState.franchiseId}?tab=${currentTab}`);
        setUndoState({ show: false, franchiseId: null, secondsLeft: 10 });
      } else {
        showToast('Unable to rollback action.', 'error');
      }
    } catch (err) {
      showToast('Server error while rolling back.', 'error');
    }
  };

  // Keyboard Shortcuts (Safe & Repeat-guarded)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Ignore if typing in text inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) {
        return;
      }

      // 2. Ignore key repeats (holding down a key)
      if (e.repeat) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (reviewLock.isLocked) return;
        if (currentApp?.status === 'Pending' || currentApp?.status === 'Pending for Approval') {
          handleUpdateStatus('For Signing', null, true);
        } else if (currentApp?.status === 'For Signing') {
          handleUpdateStatus('Ready for Pickup', null, true);
        } else if (currentApp?.status === 'Ready for Pickup') {
          handleUpdateStatus('Active', null, true);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (reviewLock.isLocked) return;
        setIsRejecting(prev => !prev);
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFitToWidth(prev => !prev);
      } else if (e.key === '0') {
        e.preventDefault();
        resetCanvasView();
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
      } else if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isRejecting) {
          setIsRejecting(false);
        } else {
          navigate(`/franchise-approval?tab=${currentTab}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentApp, hasNext, hasPrev, queue, currentIndex, activeDocKey, currentTab, reviewLock.isLocked, isShortcutsOpen, isRejecting]);

  // Document Validity evaluations (Asia/Manila timezone grounded)
  const orCrValidity = evaluateDocumentValidity(currentApp?.orCrExpiryDate, 'Asia/Manila');
  const licenseValidity = evaluateDocumentValidity(currentApp?.driverLicenseExpiryDate, 'Asia/Manila');
  const hasExpiredDoc = (orCrValidity?.isExpired) || (licenseValidity?.isExpired);
  const hasExpiringSoonDoc = (orCrValidity?.isExpiringSoon) || (licenseValidity?.isExpiringSoon);

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center z-50">
        <Loader2 size={36} className="animate-spin text-[#9E2A2B] dark:text-[#D4AF37] mb-3" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Loading Franchise Review Workbench...</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Preparing documents and records...</p>
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
          onClick={() => navigate(`/franchise-approval?tab=${currentTab}`)}
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
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[300] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
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

      {/* 10-Second Undo Banner Toast */}
      {undoState.show && (
        <div className="fixed bottom-6 right-6 z-[350] animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex flex-col gap-2.5 min-w-[320px] max-w-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    Moved to {undoState.newStatus}
                  </p>
                  <p className="text-xs text-slate-300 truncate">
                    {undoState.applicantName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExecuteUndo}
                className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c29d28] text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              >
                <Undo2 size={14} />
                <span>Undo ({undoState.secondsLeft}s)</span>
              </button>
            </div>
            {/* Countdown progress line */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#D4AF37] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(undoState.secondsLeft / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Concurrency Warning Banner (if another admin has this record open) */}
      {reviewLock.isLocked && (
        <div className="h-9 px-4 bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shrink-0 z-35 shadow-sm">
          <Lock size={14} className="shrink-0" />
          <span>Currently being reviewed by Admin. Decision actions are locked to prevent duplicate processing.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER: MUNICIPAL HERITAGE VELVET MAROON RIBBON                       */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 bg-gradient-to-r from-[#852024] via-[#9E2A2B] to-[#801820] dark:from-[#180407] dark:via-[#24060a] dark:to-[#1A0B0E] text-white flex items-center justify-between gap-3 shrink-0 z-30 shadow-md border-b border-[#D4AF37]/30">
        
        {/* Left: Back & Applicant Summary */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/franchise-approval?tab=${currentTab}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Return to Table (Shortcut: Esc)"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to Queue</span>
          </Link>

          <div className="h-5 w-px bg-white/20 hidden sm:block" />

          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-bold text-white truncate max-w-[160px] sm:max-w-xs">
              {currentApp.fullName}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-black/25 text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
              Plate: {currentApp.plateNo || 'Pending'}
            </span>

            {/* Application Type Chip */}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/15 text-white border border-white/20 shrink-0">
              {currentApp.applicationType || 'New'}
            </span>

            {/* Resubmitted Flag */}
            {(currentApp.isResubmitted || currentApp.status === 'Pending for Approval') && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/40 shrink-0 flex items-center gap-1.5">
                <RefreshCw size={12} className="shrink-0" />
                <span>Corrected Resubmission</span>
              </span>
            )}

            {/* Document Expired Flag */}
            {hasExpiredDoc ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-500/30 text-red-200 border border-red-400/40 shrink-0 flex items-center gap-1">
                <AlertTriangle size={12} /> Document Expired
              </span>
            ) : hasExpiringSoonDoc ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 border border-amber-400/40 shrink-0 flex items-center gap-1">
                <Clock size={12} /> Expiring Soon (30d)
              </span>
            ) : null}

            {/* Status Badge */}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
              currentApp.status === 'Ready for Pickup' 
                ? 'bg-blue-500/20 text-blue-100 border-blue-300/40' 
                : currentApp.status === 'For Signing'
                ? 'bg-purple-500/20 text-purple-100 border-purple-300/40'
                : currentApp.status === 'Active'
                ? 'bg-emerald-500/20 text-emerald-100 border-emerald-300/40'
                : 'bg-amber-500/20 text-amber-100 border-amber-300/40'
            }`}>
              {currentApp.status === 'Pending' || currentApp.status === 'Pending for Approval' ? 'Needs Review' : currentApp.status}
            </span>
          </div>
        </div>

        {/* Center: Queue Progress Navigator (Scoped strictly to current tab) */}
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/15 text-xs font-semibold">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="p-1 rounded-lg hover:bg-white/15 text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous Application (Shortcut: P or ArrowLeft)"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-xs text-white select-none whitespace-nowrap">
            {currentIndex >= 0 ? currentIndex + 1 : 1} / {queue.length || 1}
          </span>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="p-1 rounded-lg hover:bg-white/15 text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next Application (Shortcut: N or ArrowRight)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Shortcuts Cheat Sheet */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold transition-colors cursor-pointer"
            title="Keyboard Shortcuts Cheat Sheet (Shortcut: ?)"
          >
            <Keyboard size={15} />
          </button>

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
            disabled={isProcessing || reviewLock.isLocked}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isRejecting 
                ? 'bg-red-600 text-white border-red-500 shadow-sm' 
                : 'bg-red-500/20 hover:bg-red-600 text-red-100 hover:text-white border-red-400/30'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Reject Application (Shortcut: R)"
          >
            <XCircle size={14} />
            <span>Reject</span>
            <kbd className="hidden lg:inline text-xs px-1 bg-black/25 rounded text-white/80 font-mono">R</kbd>
          </button>

          {/* Primary: Approve / Sign / Release */}
          {currentApp.status === 'Pending' || currentApp.status === 'Pending for Approval' ? (
            <button
              onClick={() => handleUpdateStatus('For Signing', null, true)}
              disabled={isProcessing || reviewLock.isLocked}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Approve requirements and route for municipal signature (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Approve for Signing</span>
              <kbd className="hidden lg:inline text-xs px-1 bg-white/20 rounded font-mono">A</kbd>
              <ChevronRight size={14} />
            </button>
          ) : currentApp.status === 'For Signing' ? (
            <button
              onClick={() => handleUpdateStatus('Ready for Pickup', null, true)}
              disabled={isProcessing || reviewLock.isLocked}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Mark MTOP certificate as signed and ready for pickup (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Mark Signed &amp; Ready</span>
              <kbd className="hidden lg:inline text-xs px-1 bg-white/20 rounded font-mono">A</kbd>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus('Active', null, true)}
              disabled={isProcessing || reviewLock.isLocked}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Acknowledge payment, release franchise, and advance (Shortcut: A)"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Release &amp; Next</span>
              <kbd className="hidden lg:inline text-xs px-1 bg-white/20 rounded font-mono">A</kbd>
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
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {tab.sub}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {hasFile ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                            <Check size={11} className="stroke-[3]" />
                            <span className="hidden sm:inline">Attached</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
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

                <label className="text-xs font-bold text-red-900 dark:text-red-300 uppercase tracking-wider block">Defective Field (Directs Operator)</label>
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

                <label className="text-xs font-bold text-red-900 dark:text-red-300 uppercase tracking-wider block">Reason for Rejection</label>
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
                  Document Details &amp; Validity
                </span>
                <span className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/10 border border-[#9E2A2B]/20 dark:border-[#D4AF37]/20 px-2 py-0.5 rounded-md">
                  {currentDoc.short}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2.5">
                {!currentDoc.url && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>No document uploaded for this requirement.</span>
                  </div>
                )}

                {/* OR/CR Details */}
                {activeDocKey === 'orCrDocument' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>LTO Registration Specifications</span>
                      <span className="text-xs text-slate-400">Cross-check with OR/CR</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Plate Number</span>
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

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">OR / CR Number</span>
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

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div className="min-w-0 pr-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Motor / Engine No.</span>
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

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div className="min-w-0 pr-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Chassis Number</span>
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

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Make / Brand</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">{currentApp.make || '—'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Model Year</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block">{currentApp.made || '—'}</span>
                        </div>
                      </div>

                      {/* Registration Expiry Date + Asia/Manila 30-day Validity Flag */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Registration Expiry</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.orCrExpiryDate)}</span>
                        </div>
                        {currentApp.orCrExpiryDate && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                            orCrValidity.isExpired
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                              : orCrValidity.isExpiringSoon
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                          }`}>
                            {orCrValidity.isExpired ? 'Expired' : orCrValidity.isExpiringSoon ? `Expiring (${orCrValidity.daysUntilExpiry}d)` : 'Valid'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver's License Details */}
                {activeDocKey === 'license' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Driver's License Specifications</span>
                      <span className="text-xs text-slate-400">Cross-check with License</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Driver Designation</span>
                          <span className="font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">
                            {currentApp.isOperatorDriver ? 'Operator is Driver (Self-Drive)' : 'Designated Driver (Employed)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div className="min-w-0 pr-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Driver Full Name</span>
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

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">License Number</span>
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

                      {/* License Expiry + Validity */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">License Expiration</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.driverLicenseExpiryDate)}</span>
                        </div>
                        {currentApp.driverLicenseExpiryDate && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                            licenseValidity.isExpired
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                              : licenseValidity.isExpiringSoon
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                          }`}>
                            {licenseValidity.isExpired ? 'Expired' : licenseValidity.isExpiringSoon ? `Expiring (${licenseValidity.daysUntilExpiry}d)` : 'Valid'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Driver Contact</span>
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

                {/* Cedula Details */}
                {activeDocKey === 'cedulaDoc' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Cedula / CTC Specifications</span>
                      <span className="text-xs text-slate-400">Cross-check with Cedula</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">CTC Serial Number</span>
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

                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Date Issued</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.cedulaDate)}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Place Issued</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.cedulaAddress || 'Gasan, Marinduque'}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Taxpayer Name</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.fullName || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TODA Endorsement Details */}
                {activeDocKey === 'todaEndorsement' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>TODA Endorsement Specifications</span>
                      <span className="text-xs text-slate-400">Cross-check with Certificate</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">TODA Association</span>
                        <span className="font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">{currentApp.todaName || currentApp.toda || '—'}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Assigned Route / Zone</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                          {currentApp.zone ? (currentApp.zone.toString().toLowerCase().includes('zone') ? currentApp.zone : `Zone ${currentApp.zone}`) : '—'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Certificate / Endorsement No.</span>
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

                      {currentApp.todaCertDate && (
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Date Issued</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.todaCertDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Barangay Clearance Details */}
                {activeDocKey === 'brgyClearance' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Barangay Clearance Specifications</span>
                      <span className="text-xs text-slate-400">Cross-check with Clearance</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Barangay of Residence</span>
                        <span className="font-bold text-xs text-[#9E2A2B] dark:text-[#D4AF37]">{currentApp.barangay || currentApp.address || '—'}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Clearance Number</span>
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

                      {currentApp.brgyClearanceDate && (
                        <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Date Issued</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{formatDate(currentApp.brgyClearanceDate)}</span>
                        </div>
                      )}

                      <div className="p-2 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold block">Resident Name</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{currentApp.fullName || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. KEYBOARD SHORTCUT HELPER STRIP */}
            <div className="mt-auto pt-2">
              <div 
                onClick={() => setIsShortcutsOpen(true)}
                className="p-2.5 bg-slate-50 dark:bg-[#0c101c] rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                title="Click to view all shortcuts"
              >
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">A</kbd>
                  <span>Approve</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">R</kbd>
                  <span>Reject</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">N</kbd>
                  <span>Next</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">?</kbd>
                  <span>Cheatsheet</span>
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
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200">
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
              className="text-xs font-bold px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#9E2A2B] dark:text-[#D4AF37] min-w-[46px] text-center cursor-pointer"
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

            {/* Fit to width */}
            <button
              onClick={() => setIsFitToWidth(prev => !prev)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFitToWidth 
                  ? 'bg-[#9E2A2B]/10 text-[#9E2A2B] dark:text-[#D4AF37] font-bold' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Toggle Fit to Width (Shortcut: F)"
            >
              <Maximize2 size={15} />
            </button>

            {/* Brightness Booster for Dark Phone Photos */}
            <button
              onClick={toggleBrightness}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                brightness > 100 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title={`Photo Lighting Preset: ${brightness}% (Click to cycle)`}
            >
              <SunMedium size={15} />
              {brightness > 100 && <span className="text-xs font-bold">{brightness}%</span>}
            </button>

            {/* Rotate Counter-Clockwise */}
            <button
              onClick={() => setRotation(prev => (prev - 90 + 360) % 360)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw size={15} />
            </button>

            {/* Rotate Clockwise */}
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rotate 90° Clockwise"
            >
              <RotateCw size={15} />
            </button>

            {/* Reset View */}
            <button
              onClick={resetCanvasView}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Reset View (Center, 100%, 0° - Shortcut: 0)"
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
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  transition: isDragging ? 'none' : 'transform 0.08s ease-out'
                }}
                className="max-w-none flex items-center justify-center pointer-events-none relative"
              >
                {/* Instant Loading Shimmer / Spinner Overlay */}
                {isDocLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-[#111827]/85 backdrop-blur-xs rounded-2xl z-10 p-6 min-w-[280px] min-h-[280px] border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in duration-150">
                    <Loader2 size={32} className="animate-spin text-[#9E2A2B] dark:text-[#D4AF37] mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Loading document...</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rendering {currentDoc.short}</span>
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
                    className={`${isFitToWidth ? 'w-[90vw] max-w-none' : 'max-h-[82vh] max-w-[85vw]'} object-contain rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/70 bg-white dark:bg-[#111827] border border-slate-300/80 dark:border-slate-700/80 p-1.5 select-none transition-opacity duration-200 ${
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

      {/* KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[250] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Keyboard size={20} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Review Station Shortcuts</h3>
              </div>
              <button 
                onClick={() => setIsShortcutsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                Close (Esc)
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Approve Application (Advance Stage)</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">A</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Open Rejection Dialog</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">R</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Next Application in Queue</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">N or &rarr;</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Previous Application in Queue</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">P or &larr;</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Switch Attached Documents</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">1 - 5</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Toggle Fit to Width</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">F</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Reset Zoom, Rotation &amp; Pan</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">0</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Exit to Review Queue</span>
                <kbd className="px-2 py-0.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">Esc</kbd>
              </div>
            </div>

            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="w-full py-2 bg-[#9E2A2B] text-white font-bold text-xs rounded-xl hover:bg-[#801820] transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* MTOP Certificate Print Modal */}
      {isPrintOpen && currentApp && (
        <MtopCertificateModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          unit={currentApp}
        />
      )}

      {/* Application Summary Modal */}
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
