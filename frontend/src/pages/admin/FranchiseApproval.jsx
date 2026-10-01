import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  CheckCircle, CheckCircle2, XCircle, Eye, FileText, AlertCircle, 
  X, Search, Loader2, ZoomIn, ZoomOut, RotateCw, Printer, ShieldCheck, Download,
  CalendarDays, User, Clock, ExternalLink, RefreshCw, ChevronRight, ChevronLeft, Shield,
  CheckSquare, Square, Filter, Users, Layers, FileSpreadsheet, Copy, Check,
  MoreVertical, SlidersHorizontal, Sparkles, Undo2, ArrowUpDown, CheckCheck, AlertTriangle
} from 'lucide-react';
import { QueueListSkeleton } from '../../components/skeleton';
import MtopCertificateModal from '../../components/admin/MtopCertificateModal';
import BatchMtopModal from '../../components/admin/BatchMtopModal';
import TransmittalSheetModal from '../../components/admin/TransmittalSheetModal';
import AdminApplicationSummaryModal from '../../components/admin/AdminApplicationSummaryModal';
import { evaluateDocumentValidity, triageApplication, getTimeWaiting } from '../../utils/dateValidity';
import { GASAN_BARANGAYS } from '../../utils/constants';

const REJECT_REASONS = [
  "Expired OR/CR Registration",
  "Expired or Invalid Driver's License",
  "Blurry / Unreadable Document Photo",
  "Name Mismatch (Applicant vs. Document)",
  "Vehicle Details Mismatch (Motor/Chassis No.)",
  "Missing / Incomplete Required Document",
  "Invalid or Unsigned TODA Endorsement",
  "Fake, Altered, or Tampered Document",
  "Others (Please specify)"
];

const FranchiseApproval = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-Persisted State
  const activeTab = searchParams.get('tab') || 'pending'; // 'pending' | 'signing' | 'ready' | 'all'
  const selectedToda = searchParams.get('toda') || 'all';
  const selectedType = searchParams.get('type') || 'all';
  const selectedBarangay = searchParams.get('barangay') || 'all';
  const flaggedOnly = searchParams.get('flaggedOnly') === 'true';
  const compactView = searchParams.get('compact') === 'true';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('limit') || '25', 10);
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchApproveModal, setBatchApproveModal] = useState(false);
  const [batchReleaseModal, setBatchReleaseModal] = useState(false);

  // Quick Action modals state
  const [quickApproveTarget, setQuickApproveTarget] = useState(null);
  const [quickRejectTarget, setQuickRejectTarget] = useState(null);
  const [quickRejectReason, setQuickRejectReason] = useState(REJECT_REASONS[0]);
  const [quickRejectField, setQuickRejectField] = useState('chassisNo');
  const [quickRejectCustom, setQuickRejectCustom] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Application Dossier Modal state
  const [dossierTargetUnit, setDossierTargetUnit] = useState(null);

  // 10-Second Undo Notification State
  const [undoState, setUndoState] = useState(null); // { timer, secondsLeft: 10, items: [{ _id, prevStatus, name }], message }

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Print modals state
  const [printTargetUnit, setPrintTargetUnit] = useState(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isTransmittalOpen, setIsTransmittalOpen] = useState(false);

  // Helper to update URL params cleanly
  const updateParams = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || v === 'all' || v === false) {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, selectedToda, selectedType, selectedBarangay, flaggedOnly, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Cleanup undo countdown on unmount
  useEffect(() => {
    return () => {
      if (undoState?.timer) clearInterval(undoState.timer);
    };
  }, [undoState]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?status=Pending,Pending%20for%20Approval,For%20Signing,Ready%20for%20Pickup&limit=2000&sort=oldest`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Server already sorted, ensure FIFO queue (oldest date applied first)
        const queue = (Array.isArray(data) ? data : (data.data || []))
          .sort((a, b) => new Date(a.dateApplied || a.createdAt || 0) - new Date(b.dateApplied || b.createdAt || 0));
        
        setApplications(queue);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // 10-Second Undo Execution
  const triggerUndoCountdown = (affectedItems, message) => {
    if (undoState?.timer) clearInterval(undoState.timer);

    const timer = setInterval(() => {
      setUndoState(prev => {
        if (!prev || prev.secondsLeft <= 1) {
          clearInterval(timer);
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    setUndoState({
      timer,
      secondsLeft: 10,
      items: affectedItems,
      message
    });
  };

  const handleRollbackUndo = async () => {
    if (!undoState) return;
    clearInterval(undoState.timer);
    const toRevert = undoState.items;
    setUndoState(null);
    showToast("Reverting previous action...", "info");

    try {
      await Promise.all(toRevert.map(item => 
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${item._id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: item.prevStatus,
            cancelReason: '',
            rejectedField: ''
          })
        })
      ));
      showToast(`Action undone! Reverted ${toRevert.length} application(s).`, "success");
      fetchApplications();
    } catch (err) {
      console.error('Undo error:', err);
      showToast("Failed to undo action.", "error");
    }
  };

  // Status Update for Single Unit (Quick Action)
  const handleUpdateStatus = async (status, targetApp, customReasonText = '', rejectedField = '') => {
    if (!targetApp) return;
    setIsProcessing(true);
    const finalReason = status === 'Cancelled' ? customReasonText : '';

    if (status === 'Cancelled' && !finalReason.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${targetApp._id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: status, 
          cancelReason: finalReason,
          rejectedField: status === 'Cancelled' ? (rejectedField || undefined) : undefined
        })
      });

      if (response.ok) {
        const prevStatus = targetApp.status;
        setQuickApproveTarget(null);
        setQuickRejectTarget(null);
        setActiveMenuId(null);
        fetchApplications();

        triggerUndoCountdown(
          [{ _id: targetApp._id, prevStatus, name: targetApp.fullName }],
          `Updated ${targetApp.fullName} to ${status}.`
        );
      } else {
        showToast('Failed to update status. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error. Cannot connect to server.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Approval Action with 10-Second Undo
  const handleConfirmBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);

    const targetStatus = activeTab === 'signing' ? 'Ready for Pickup' : 'For Signing';
    const sourceStatus = activeTab === 'signing' ? 'For Signing' : 'Pending';

    try {
      const eligibleUnits = applications.filter(a => 
        selectedIds.includes(a._id) && (a.status === sourceStatus || a.status === 'Pending for Approval' || activeTab === 'all')
      );
      if (eligibleUnits.length === 0) {
        showToast('No eligible units found for batch approval.', 'error');
        setIsBatchProcessing(false);
        return;
      }

      const promises = eligibleUnits.map(unit => 
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${unit._id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: targetStatus })
        })
      );

      await Promise.all(promises);

      const affected = eligibleUnits.map(u => ({ _id: u._id, prevStatus: u.status, name: u.fullName }));
      setSelectedIds([]);
      setBatchApproveModal(false);
      fetchApplications();

      triggerUndoCountdown(
        affected,
        targetStatus === 'Ready for Pickup'
          ? `Marked ${eligibleUnits.length} units as Signed & Ready for Pickup.`
          : `Approved ${eligibleUnits.length} units for Municipal Signatures.`
      );
    } catch (error) {
      console.error('Error in batch action:', error);
      showToast('Encountered an error while processing batch action.', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Release Action
  const handleConfirmBatchRelease = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);

    try {
      const eligibleUnits = applications.filter(a => selectedIds.includes(a._id) && a.status === 'Ready for Pickup');
      if (eligibleUnits.length === 0) {
        showToast('Only units with status "Ready for Pickup" can be released.', 'error');
        setIsBatchProcessing(false);
        return;
      }

      const promises = eligibleUnits.map(unit => 
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${unit._id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'Active' })
        })
      );

      await Promise.all(promises);
      const affected = eligibleUnits.map(u => ({ _id: u._id, prevStatus: u.status, name: u.fullName }));
      setSelectedIds([]);
      setBatchReleaseModal(false);
      fetchApplications();

      triggerUndoCountdown(
        affected,
        `Released and activated ${eligibleUnits.length} franchise(s).`
      );
    } catch (error) {
      console.error('Error in batch release:', error);
      showToast('Encountered an error while processing batch release.', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Navigate to dedicated full-screen review workstation (persists origin tab!)
  const handleOpenWorkstation = (app) => {
    navigate(`/franchise-approval/review/${app._id}?tab=${activeTab}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Unified Status Counts
  const isPendingStatus = (s) => s === 'Pending' || s === 'Pending for Approval';
  const pendingCount = applications.filter(a => isPendingStatus(a.status)).length;
  const signingCount = applications.filter(a => a.status === 'For Signing').length;
  const readyCount = applications.filter(a => a.status === 'Ready for Pickup').length;
  const allCount = applications.length;

  // Extract unique TODAs for filter dropdown
  const uniqueTodas = Array.from(new Set(applications.map(a => a.todaName || 'NON-TODA').filter(Boolean))).sort();

  // Multi-Stage Filter Pipeline
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // 1. Tab Filter
      if (activeTab === 'pending' && !isPendingStatus(app.status)) return false;
      if (activeTab === 'signing' && app.status !== 'For Signing') return false;
      if (activeTab === 'ready' && app.status !== 'Ready for Pickup') return false;

      // 2. TODA Filter
      if (selectedToda !== 'all' && (app.todaName || 'NON-TODA').toLowerCase() !== selectedToda.toLowerCase()) {
        return false;
      }

      // 3. Application Type Filter
      if (selectedType !== 'all') {
        const appType = app.applicationType || 'New';
        if (appType.toLowerCase() !== selectedType.toLowerCase()) return false;
      }

      // 4. Barangay Filter
      if (selectedBarangay !== 'all') {
        const addr = (app.address || '').toLowerCase();
        if (!addr.includes(selectedBarangay.toLowerCase())) return false;
      }

      // 5. Date Range Filter
      if (startDate && endDate) {
        const d = new Date(app.dateApplied || app.createdAt || 0);
        const s = new Date(startDate);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (d < s || d > e) return false;
      }

      // 6. Flagged Only Triage Filter
      if (flaggedOnly) {
        const triage = triageApplication(app);
        if (triage.isClean) return false;
      }

      // 7. Search Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches = (
          (app.fullName || '').toLowerCase().includes(q) ||
          (app.plateNo || '').toLowerCase().includes(q) ||
          (app.motorNo || '').toLowerCase().includes(q) ||
          (app.chassisNo || '').toLowerCase().includes(q) ||
          (app.todaName || '').toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [applications, activeTab, selectedToda, selectedType, selectedBarangay, startDate, endDate, flaggedOnly, searchQuery]);

  // Pagination calculation
  const totalApps = filteredApps.length;
  const totalPages = Math.max(1, Math.ceil(totalApps / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalApps);
  const paginatedApps = filteredApps.slice(startIndex, endIndex);

  // Checkbox selection helpers
  const isAllSelected = paginatedApps.length > 0 && paginatedApps.every(a => selectedIds.includes(a._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = paginatedApps.map(a => a._id);
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const newIds = Array.from(new Set([...selectedIds, ...paginatedApps.map(a => a._id)]));
      setSelectedIds(newIds);
    }
  };

  const selectAllClean = () => {
    const cleanIds = paginatedApps.filter(a => triageApplication(a).isClean).map(a => a._id);
    if (cleanIds.length === 0) {
      showToast('No clean applications found on this page.', 'warning');
      return;
    }
    const merged = Array.from(new Set([...selectedIds, ...cleanIds]));
    setSelectedIds(merged);
    showToast(`Selected ${cleanIds.length} clean application(s) for fast approval.`, 'success');
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <MainLayout>
      {/* 10-Second Floating Undo Toast */}
      {undoState && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-4 max-w-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              {undoState.secondsLeft}s
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{undoState.message}</p>
              <p className="text-[11px] text-slate-400">Press Undo to revert this action within 10 seconds.</p>
            </div>
            <button
              onClick={handleRollbackUndo}
              className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2b] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm"
            >
              <Undo2 size={13} />
              <span>Undo</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Standard Toast */}
      {toast.show && !undoState && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white/95 dark:bg-[#111827]/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : toast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : toast.type === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* Official Printable MTOP Certificate Modal */}
      <MtopCertificateModal 
        isOpen={Boolean(printTargetUnit)} 
        onClose={() => setPrintTargetUnit(null)} 
        unit={printTargetUnit} 
      />

      {/* Batch MTOP Multi-Certificate Modal */}
      <BatchMtopModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        units={applications.filter(a => selectedIds.includes(a._id))}
      />

      {/* Official LGU Transmittal Summary Sheet Modal */}
      <TransmittalSheetModal
        isOpen={isTransmittalOpen}
        onClose={() => setIsTransmittalOpen(false)}
        units={applications.filter(a => selectedIds.includes(a._id))}
      />

      {/* Official Application Summary Modal */}
      <AdminApplicationSummaryModal 
        isOpen={Boolean(dossierTargetUnit)} 
        onClose={() => setDossierTargetUnit(null)} 
        franchise={dossierTargetUnit} 
        onApprove={() => { 
          const unit = dossierTargetUnit; 
          setDossierTargetUnit(null); 
          handleQuickApprove(unit); 
        }} 
        onReject={() => { 
          const unit = dossierTargetUnit; 
          setDossierTargetUnit(null); 
          setQuickRejectTarget(unit); 
        }} 
        onReview={(unit) => {
          handleOpenWorkstation(unit);
        }}
        isProcessing={isProcessing} 
      />

      {/* Quick Approve Confirmation Modal */}
      {quickApproveTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isPendingStatus(quickApproveTarget.status) 
                    ? 'Approve for Municipal Signatures?' 
                    : quickApproveTarget.status === 'For Signing'
                    ? 'Mark Signed & Ready for Pickup?'
                    : 'Acknowledge Payment & Release?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPendingStatus(quickApproveTarget.status) 
                    ? 'Queue for Mayor and Licensing Official signatures' 
                    : quickApproveTarget.status === 'For Signing'
                    ? 'Notify operator that MTOP certificate is ready for claiming'
                    : 'Set status to Active road-authorized franchise'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
              <p><span className="font-bold text-slate-500">Operator:</span> <strong className="text-slate-900 dark:text-white">{quickApproveTarget.fullName}</strong></p>
              <p><span className="font-bold text-slate-500">TODA / Zone:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{quickApproveTarget.todaName || 'NON-TODA'} (Zone {quickApproveTarget.zone})</span></p>
              <p><span className="font-bold text-slate-500">Plate Number:</span> <span className="font-mono font-bold text-[#9E2A2B] dark:text-[#D4AF37]">{quickApproveTarget.plateNo || 'PENDING'}</span></p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setQuickApproveTarget(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(
                  isPendingStatus(quickApproveTarget.status)
                    ? 'For Signing' 
                    : quickApproveTarget.status === 'For Signing'
                    ? 'Ready for Pickup'
                    : 'Active', 
                  quickApproveTarget
                )}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                <span>
                  Confirm {isPendingStatus(quickApproveTarget.status) ? 'Approval' : quickApproveTarget.status === 'For Signing' ? 'Signing' : 'Release'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reject Modal */}
      {quickRejectTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <XCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Reject Application</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Return for operator correction: {quickRejectTarget.fullName}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Defective / Incorrect Field (Directs Operator)</label>
              <select
                value={quickRejectField}
                onChange={(e) => setQuickRejectField(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-200"
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

              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Preset Rejection Reason</label>
              <select
                value={quickRejectReason}
                onChange={(e) => setQuickRejectReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-200"
              >
                {REJECT_REASONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
              </select>

              {quickRejectReason === 'Others (Please specify)' && (
                <textarea
                  placeholder="Specify review defect or correction instruction for the operator..."
                  value={quickRejectCustom}
                  onChange={(e) => setQuickRejectCustom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white min-h-[70px] outline-none focus:ring-2 focus:ring-red-200"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setQuickRejectTarget(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reasonText = quickRejectReason === 'Others (Please specify)' ? quickRejectCustom : quickRejectReason;
                  handleUpdateStatus('Cancelled', quickRejectTarget, reasonText, quickRejectField);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Approve Modal */}
      {batchApproveModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Confirm Batch Approval</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are approving <strong>{selectedIds.length}</strong> application(s) at once.
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              {applications.filter(a => selectedIds.includes(a._id)).map((app, i) => (
                <div key={app._id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{i + 1}. {app.fullName}</span>
                  <span className="text-xs font-mono text-slate-500">{app.todaName || 'NON-TODA'} &bull; {app.plateNo || 'PENDING'}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {activeTab === 'signing' ? (
                <>All selected applications will transition to <strong className="text-blue-600 dark:text-blue-400">Ready for Pickup</strong>.</>
              ) : (
                <>All selected applications will transition to <strong className="text-purple-600 dark:text-purple-400">For Signing</strong>. A 10-second undo window will be available.</>
              )}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setBatchApproveModal(false)}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchApprove}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isBatchProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Approve All ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Release Modal */}
      {batchReleaseModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Confirm Batch Release</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are activating <strong>{selectedIds.length}</strong> franchise(s).
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              {applications.filter(a => selectedIds.includes(a._id)).map((app, i) => (
                <div key={app._id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{i + 1}. {app.fullName}</span>
                  <span className="text-xs font-mono text-slate-500">{app.todaName || 'NON-TODA'} &bull; {app.plateNo || 'PENDING'}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setBatchReleaseModal(false)}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchRelease}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isBatchProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Release All ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SLIM & COMPACT HEADER RIBBON (Phase 2 Item 8) */}
      <header className="mb-4 bg-gradient-to-r from-[#852024] via-[#9E2A2B] to-[#70151c] dark:from-[#180407] dark:via-[#24060a] dark:to-[#120305] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-md flex items-center justify-between gap-3 border border-[#9E2A2B]/30 dark:border-[#D4AF37]/25">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">Franchise Approval Queue</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-[#D4AF37] border border-[#D4AF37]/30">
                Peak Renewal Mode
              </span>
            </div>
            <p className="text-white/80 text-xs hidden sm:block truncate">
              {pendingCount} waiting review &bull; Oldest applications prioritized
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pendingCount > 0 && (
            <button
              onClick={() => {
                const firstPending = applications.find(a => isPendingStatus(a.status)) || applications[0];
                if (firstPending) handleOpenWorkstation(firstPending);
              }}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#D4AF37] hover:bg-[#c29e2f] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Open full-screen review workstation"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Start Review Queue</span>
              <span>({pendingCount})</span>
              <ChevronRight size={14} />
            </button>
          )}

          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl transition-all cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-[#D4AF37]' : ''} />
          </button>
        </div>
      </header>

      {/* 2. ADVANCED TOOLBAR (Single TODA dropdown, Type, Barangay, Date, Flagged, Compact Toggle) */}
      <div className="mb-4 bg-white dark:bg-[#111827] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Left: Quick Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name, Plate, Motor, or Chassis..." 
              value={searchQuery} 
              onChange={(e) => updateParams({ q: e.target.value, page: 1 })} 
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
            />
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* TODA Dropdown (Single instance, duplicate chips removed!) */}
            <select
              value={selectedToda}
              onChange={(e) => updateParams({ toda: e.target.value, page: 1 })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#9E2A2B] cursor-pointer"
            >
              <option value="all">All TODAs</option>
              {uniqueTodas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Application Type */}
            <select
              value={selectedType}
              onChange={(e) => updateParams({ type: e.target.value, page: 1 })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#9E2A2B] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="New">New</option>
              <option value="Renewal">Renewal</option>
              <option value="Transfer">Transfer</option>
            </select>

            {/* Barangay Filter */}
            <select
              value={selectedBarangay}
              onChange={(e) => updateParams({ barangay: e.target.value, page: 1 })}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#9E2A2B] cursor-pointer max-w-[140px]"
            >
              <option value="all">All Barangays</option>
              {GASAN_BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Flagged Only Toggle */}
            <button
              onClick={() => updateParams({ flaggedOnly: !flaggedOnly, page: 1 })}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                flaggedOnly 
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="Filter applications with issues or warnings only"
            >
              <AlertTriangle size={13} className={flaggedOnly ? 'text-rose-600' : 'text-slate-400'} />
              <span>Flagged Only</span>
            </button>

            {/* Compact Density Toggle */}
            <button
              onClick={() => updateParams({ compact: !compactView })}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                compactView 
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle compact row view for 1366x768 screens"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. STATUS TABS BAR & TRIAGE ACTIONS */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => updateParams({ tab: 'pending', page: 1 })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={14} />
            <span>Needs Review (Pending for Approval)</span>
            <span className={`text-xs px-1.5 py-0.2 rounded-full ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => updateParams({ tab: 'signing', page: 1 })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'signing'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck size={14} />
            <span>For Signing (Routing)</span>
            <span className={`text-xs px-1.5 py-0.2 rounded-full ${
              activeTab === 'signing' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {signingCount}
            </span>
          </button>

          <button
            onClick={() => updateParams({ tab: 'ready', page: 1 })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ready'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Printer size={14} />
            <span>Ready for Pickup / Cashier</span>
            <span className={`text-xs px-1.5 py-0.2 rounded-full ${
              activeTab === 'ready' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {readyCount}
            </span>
          </button>

          <button
            onClick={() => updateParams({ tab: 'all', page: 1 })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All in Queue</span>
            <span className={`text-xs px-1.5 py-0.2 rounded-full ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {allCount}
            </span>
          </button>
        </div>

        {/* Triage Controls: Select All Clean + Batch Action */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {paginatedApps.length > 0 && (
            <>
              {/* Select All Clean (Phase 2 Item 7) */}
              <button
                onClick={selectAllClean}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-all cursor-pointer"
                title="Select all verified clean applications on current page"
              >
                <CheckCheck size={14} />
                <span>Select Clean</span>
              </button>

              {/* Standard Select All */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isAllSelected ? (
                  <CheckSquare size={15} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                ) : (
                  <Square size={15} className="text-slate-400" />
                )}
                <span>All ({paginatedApps.length})</span>
              </button>
            </>
          )}

          {/* Batch Actions Trigger */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              {activeTab === 'ready' ? (
                <button
                  onClick={() => setBatchReleaseModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Release ({selectedIds.length})
                </button>
              ) : (
                <button
                  onClick={() => setBatchApproveModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>Batch Approve ({selectedIds.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. APPLICATIONS LIST (Redesigned rows with triage chips and safe actions) */}
      {isLoading ? (
        <QueueListSkeleton count={4} baseDelay={50} stepDelay={70} />
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
          <p className="font-bold text-base text-slate-800 dark:text-slate-200">No applications found!</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {searchQuery || selectedToda !== 'all' || selectedType !== 'all' || flaggedOnly
              ? 'Try adjusting your search filters or clear the Flagged Only toggle.' 
              : activeTab === 'pending'
              ? 'There are no pending applications awaiting review right now.'
              : 'There are no applications currently in this queue view.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 pb-6">
            {paginatedApps.map((app, index) => {
              const isSelected = selectedIds.includes(app._id);
              const triage = triageApplication(app);
              const waitingTime = getTimeWaiting(app.dateApplied || app.createdAt);
              const isMenuOpen = activeMenuId === app._id;

              return (
                <div 
                  key={app._id} 
                  className={`bg-white dark:bg-[#111827] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    compactView ? 'p-3 rounded-2xl' : 'p-4 sm:p-5 rounded-3xl'
                  } ${
                    isSelected 
                      ? 'border-[#9E2A2B] dark:border-[#D4AF37] ring-2 ring-[#9E2A2B]/15 dark:ring-[#D4AF37]/20 shadow-md' 
                      : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#9E2A2B]/30 dark:hover:border-[#D4AF37]/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(app._id)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                      title={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                      ) : (
                        <Square size={18} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    {/* Queue Position */}
                    <span className="text-xs font-black text-slate-400 font-mono w-6 shrink-0">
                      {startIndex + index + 1}.
                    </span>

                    {/* Main Row Info Cluster */}
                    <div className="min-w-0 flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
                      {/* Full Name */}
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                        {app.fullName}
                      </h3>

                      {/* Plate Number */}
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                        {app.plateNo || 'PENDING PLATE'}
                      </span>

                      {/* TODA Name */}
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                        {app.todaName || 'NON-TODA'}
                      </span>

                      {/* Application Type Chip */}
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                        {app.applicationType || 'New'}
                      </span>

                      {/* Time Waiting Chip */}
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0" title="Time waiting in queue">
                        <Clock size={11} />
                        <span>{waitingTime}</span>
                      </span>

                      {/* Documents Progress Indicator */}
                      <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold shrink-0 border ${
                        triage.isDocsComplete 
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                      }`}>
                        {triage.docsSummary} Docs
                      </span>

                      {/* Resubmitted Chip */}
                      {app.isResubmitted && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                          Corrected
                        </span>
                      )}

                      {/* Triage Clean vs Flagged Chips (Phase 2 Item 6 & 7) */}
                      {triage.isClean ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0 flex items-center gap-1">
                          <Check size={11} className="stroke-[3]" />
                          <span>Clean</span>
                        </span>
                      ) : (
                        triage.flags.slice(0, 2).map((flag, fi) => (
                          <span 
                            key={fi}
                            className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                              flag.severity === 'error'
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                            }`}
                          >
                            {flag.label}
                          </span>
                        ))
                      )}

                      {/* Redundant "PENDING" status is REMOVED when on Needs Review tab! Only show when on "All in Queue" tab */}
                      {activeTab === 'all' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                          {isPendingStatus(app.status) ? 'Pending for Approval' : app.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Cluster (Phase 2 Item 9: Primary Review, Safe Reject) */}
                  <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Primary Action: Full Review Workstation */}
                    <button 
                      onClick={() => handleOpenWorkstation(app)} 
                      className="bg-slate-900 dark:bg-slate-800 text-white hover:bg-[#9E2A2B] dark:hover:bg-[#9E2A2B] px-3.5 py-2 rounded-xl font-bold text-xs transition-colors active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Open full review workstation"
                    >
                      <Eye size={14} />
                      <span>Review</span>
                      <ChevronRight size={13} className="hidden sm:inline" />
                    </button>

                    {/* Quick Approve (ONLY for Clean applications in Pending tab, safe & fast!) */}
                    {triage.isClean && isPendingStatus(app.status) && (
                      <button
                        onClick={() => setQuickApproveTarget(app)}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title="Approve clean requirements for signing"
                      >
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span className="hidden sm:inline">Approve</span>
                      </button>
                    )}

                    {/* Quick Print MTOP */}
                    {(app.status === 'For Signing' || app.status === 'Ready for Pickup') && (
                      <button
                        onClick={() => setPrintTargetUnit(app)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-[#9E2A2B] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title="Print Official MTOP Certificate"
                      >
                        <Printer size={14} />
                        <span className="hidden sm:inline">MTOP</span>
                      </button>
                    )}

                    {/* Quick Mark Signed */}
                    {app.status === 'For Signing' && (
                      <button
                        onClick={() => setQuickApproveTarget(app)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title="Mark as Signed & Ready for Pickup"
                      >
                        <CheckCircle2 size={14} className="text-blue-600" />
                        <span className="hidden sm:inline">Signed</span>
                      </button>
                    )}

                    {/* Quick Release */}
                    {app.status === 'Ready for Pickup' && (
                      <button
                        onClick={() => setQuickApproveTarget(app)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                        title="Acknowledge payment and release franchise"
                      >
                        <CheckCircle2 size={14} />
                        <span className="hidden sm:inline">Release</span>
                      </button>
                    )}

                    {/* Application Summary Quick View */}
                    <button
                      onClick={() => setDossierTargetUnit(app)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
                      title="View Application Summary Modal"
                    >
                      <FileText size={15} />
                    </button>

                    {/* Safe 'More' Menu (Replaces accidental-reject risk) */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : app._id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl py-1.5 animate-in fade-in duration-100">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setDossierTargetUnit(app);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <FileText size={14} />
                            <span>View Summary</span>
                          </button>

                          {(isPendingStatus(app.status) || app.status === 'For Signing') && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setQuickRejectTarget(app);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                            >
                              <XCircle size={14} />
                              <span>Reject / Return</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. PAGINATION & ROWS SELECTOR (Default 25, options 25/50/100) */}
          <div className="mt-2 mb-20 p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium flex-wrap justify-center sm:justify-start">
              <span>Showing</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{endIndex}</span>
              <span>of</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalApps}</span>
              <span>applications</span>

              <span className="mx-1 text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs">Page Size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => updateParams({ limit: Number(e.target.value), page: 1 })}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateParams({ page: Math.max(1, validCurrentPage - 1) })}
                disabled={validCurrentPage <= 1}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - validCurrentPage) <= 1) return true;
                    return false;
                  })
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push('ellipsis-' + page);
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item) => {
                    if (typeof item === 'string') {
                      return (
                        <span key={item} className="px-1.5 text-slate-400 select-none">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = item === validCurrentPage;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => updateParams({ page: item })}
                        className={`min-w-[30px] h-[30px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#9E2A2B] text-white shadow-2xs scale-105'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => updateParams({ page: Math.min(totalPages, validCurrentPage + 1) })}
                disabled={validCurrentPage >= totalPages}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default FranchiseApproval;
