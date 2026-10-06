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
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import TricycleIcon from '../../components/common/TricycleIcon';
import { triageApplication } from '../../utils/dateValidity';
import { GASAN_BARANGAYS, formatZoneLabel } from '../../utils/constants';

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
  const activeTab = searchParams.get('tab') || 'pending'; // 'pending' | 'payment' | 'signing' | 'ready' | 'all' | 'approved' | 'rejected'
  const isHistoryTab = activeTab === 'approved' || activeTab === 'rejected';
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
  const [historyApps, setHistoryApps] = useState([]); // Active (approved) + Cancelled (rejected)
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
      if (k === 'tab') {
        if (!v || v === 'pending') {
          next.delete('tab');
        } else {
          next.set('tab', String(v));
        }
      } else if (v === null || v === undefined || v === '' || v === 'all' || v === false) {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    setSearchParams(next, { replace: true });
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [response, historyRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?status=Pending,Pending%20for%20Approval,For%20Payment,For%20Signing,Ready%20for%20Pickup&limit=2000&sort=oldest`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?status=Active,Cancelled&limit=500`, { headers })
      ]);
      if (response.ok) {
        const data = await response.json();
        // Server already sorted, ensure FIFO queue (oldest date applied first)
        const queue = (Array.isArray(data) ? data : (data.data || []))
          .sort((a, b) => new Date(a.dateApplied || a.createdAt || 0) - new Date(b.dateApplied || b.createdAt || 0));
        
        setApplications(queue);
      }
      if (historyRes.ok) {
        const hData = await historyRes.json();
        // History: most recently decided first
        const list = (Array.isArray(hData) ? hData : (hData.data || []))
          .sort((a, b) => new Date(b.updatedAt || b.approvalDate || 0) - new Date(a.updatedAt || a.approvalDate || 0));
        setHistoryApps(list);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
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

    const targetStatus = activeTab === 'signing' ? 'Ready for Pickup' : 'For Payment';
    const sourceStatus = activeTab === 'signing' ? 'For Signing' : 'Pending';

    try {
      const eligibleUnits = applications.filter(a => 
        selectedIds.includes(a._id) && (a.status === sourceStatus || (sourceStatus === 'Pending' && a.status === 'Pending for Approval'))
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
          ? `Marked ${eligibleUnits.length} units as signed and ready for pickup.`
          : `Sent ${eligibleUnits.length} units to the cashier for payment.`
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

  // Unified Status Counts
  const isPendingStatus = (s) => s === 'Pending' || s === 'Pending for Approval';
  const pendingCount = applications.filter(a => isPendingStatus(a.status)).length;
  const paymentCount = applications.filter(a => a.status === 'For Payment').length;
  const signingCount = applications.filter(a => a.status === 'For Signing').length;
  const readyCount = applications.filter(a => a.status === 'Ready for Pickup').length;
  const allCount = applications.length;
  const approvedCount = historyApps.filter(a => a.status === 'Active').length;
  const rejectedCount = historyApps.filter(a => a.status === 'Cancelled').length;

  // Extract unique TODAs for filter dropdown
  const uniqueTodas = Array.from(new Set([...applications, ...historyApps].map(a => a.todaName || 'NON-TODA').filter(Boolean))).sort();

  // Multi-Stage Filter Pipeline
  const filteredApps = useMemo(() => {
    const source = isHistoryTab ? historyApps : applications;
    return source.filter(app => {
      // 1. Tab Filter
      if (activeTab === 'pending' && !isPendingStatus(app.status)) return false;
      if (activeTab === 'payment' && app.status !== 'For Payment') return false;
      if (activeTab === 'signing' && app.status !== 'For Signing') return false;
      if (activeTab === 'ready' && app.status !== 'Ready for Pickup') return false;
      if (activeTab === 'approved' && app.status !== 'Active') return false;
      if (activeTab === 'rejected' && app.status !== 'Cancelled') return false;

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
  }, [applications, historyApps, isHistoryTab, activeTab, selectedToda, selectedType, selectedBarangay, startDate, endDate, flaggedOnly, searchQuery]);

  // Active filter state check & reset helper
  const hasActiveFilters = Boolean(
    searchQuery.trim() !== '' ||
    selectedToda !== 'all' ||
    selectedType !== 'all' ||
    selectedBarangay !== 'all' ||
    flaggedOnly ||
    startDate ||
    endDate
  );

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (activeTab && activeTab !== 'pending') {
      next.set('tab', activeTab);
    }
    setSearchParams(next, { replace: true });
  };

  // Pagination calculation
  const totalApps = filteredApps.length;
  const totalPages = Math.max(1, Math.ceil(totalApps / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalApps);
  const paginatedApps = filteredApps.slice(startIndex, endIndex);

  // Dossier summary next / prev sequential traversal
  const currentDossierIndex = useMemo(() => {
    if (!dossierTargetUnit) return -1;
    return filteredApps.findIndex(a => a._id === dossierTargetUnit._id);
  }, [dossierTargetUnit, filteredApps]);

  const handleNextDossier = () => {
    if (currentDossierIndex >= 0 && currentDossierIndex < filteredApps.length - 1) {
      setDossierTargetUnit(filteredApps[currentDossierIndex + 1]);
    }
  };

  const handlePrevDossier = () => {
    if (currentDossierIndex > 0) {
      setDossierTargetUnit(filteredApps[currentDossierIndex - 1]);
    }
  };

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
          <div className="bg-[#1F1D1B] dark:bg-[#1C1917] text-white border border-[#E4E1DC]/20 dark:border-[#2E2A27] shadow-sm rounded-lg px-4 py-3 flex items-center gap-4 max-w-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              {undoState.secondsLeft}s
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{undoState.message}</p>
              <p className="text-[11px] text-[#A8A29E]">Press Undo to revert this action within 10 seconds.</p>
            </div>
            <button
              onClick={handleRollbackUndo}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2b] text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
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
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : toast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={15} /> : toast.type === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            </div>
            <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#EAE7E1] leading-snug">
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
        units={
          selectedIds.length > 0 
            ? applications.filter(a => selectedIds.includes(a._id))
            : activeTab === 'signing'
            ? filteredApps.filter(a => a.status === 'For Signing')
            : applications.filter(a => a.status === 'For Signing')
        }
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
          setQuickApproveTarget(unit); 
        }} 
        onReject={() => { 
          const unit = dossierTargetUnit; 
          setDossierTargetUnit(null); 
          setQuickRejectTarget(unit); 
        }} 
        onReview={(unit) => {
          handleOpenWorkstation(unit);
        }}
        onNext={currentDossierIndex < filteredApps.length - 1 ? handleNextDossier : null}
        onPrev={currentDossierIndex > 0 ? handlePrevDossier : null}
        currentIndex={currentDossierIndex}
        totalCount={filteredApps.length}
        isProcessing={isProcessing} 
      />

      {/* Quick Approve Confirmation Modal */}
      {quickApproveTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-6 max-w-md w-full shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1F1D1B] dark:text-white">
                  {isPendingStatus(quickApproveTarget.status) 
                    ? 'Send to the cashier for payment?' 
                    : quickApproveTarget.status === 'For Signing'
                    ? 'Mark the MTOP as signed?'
                    : 'Release the franchise?'}
                </h3>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  {isPendingStatus(quickApproveTarget.status) 
                    ? 'Requirements are complete. The Treasury cashier will collect the fee and record the OR number.' 
                    : quickApproveTarget.status === 'For Signing'
                    ? 'The Mayor and Licensing Officer have signed. The operator will be told to pick it up.'
                    : 'The operator has claimed the signed MTOP. The franchise becomes active.'}
                </p>
              </div>
            </div>

            <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] text-xs space-y-1.5">
              <p><span className="text-[#6B6761] dark:text-[#A8A29E]">Operator:</span> <strong className="text-[#1F1D1B] dark:text-white">{quickApproveTarget.fullName}</strong></p>
              <p><span className="text-[#6B6761] dark:text-[#A8A29E]">TODA / Zone:</span> <span className="font-medium text-[#1F1D1B] dark:text-[#EAE7E1]">{quickApproveTarget.todaName || 'NON-TODA'} ({formatZoneLabel(quickApproveTarget.zone)})</span></p>
              <p><span className="text-[#6B6761] dark:text-[#A8A29E]">Plate Number:</span> <span className="font-mono font-semibold text-[#9E2A2B] dark:text-[#D4AF37]">{quickApproveTarget.plateNo || 'PENDING'}</span></p>
            </div>

            {quickApproveTarget.status === 'Ready for Pickup' && (
              <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 border ${
                quickApproveTarget.paymentStatus === 'Paid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-1.5">
                  {quickApproveTarget.paymentStatus === 'Paid' ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Cashier Payment Confirmed</span>
                    </>
                  ) : (
                    <>
                      <Clock size={14} className="text-amber-600 shrink-0" />
                      <span>Awaiting Cashier Payment (₱500.00)</span>
                    </>
                  )}
                </div>
                {quickApproveTarget.officialReceiptNo && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/70 dark:bg-[#14110F]">
                    OR# {quickApproveTarget.officialReceiptNo}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setQuickApproveTarget(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold text-xs rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(
                  isPendingStatus(quickApproveTarget.status)
                    ? 'For Payment' 
                    : quickApproveTarget.status === 'For Signing'
                    ? 'Ready for Pickup'
                    : 'Active', 
                  quickApproveTarget
                )}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                <span>
                  {isPendingStatus(quickApproveTarget.status) ? 'Send to cashier' : quickApproveTarget.status === 'For Signing' ? 'Mark signed' : 'Release franchise'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reject Modal */}
      {quickRejectTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-6 max-w-md w-full shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <XCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1F1D1B] dark:text-white">Reject Application</h3>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Return for operator correction: {quickRejectTarget.fullName}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider block">Defective / Incorrect Field (Directs Operator)</label>
              <select
                value={quickRejectField}
                onChange={(e) => setQuickRejectField(e.target.value)}
                className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2 text-xs font-medium text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:ring-1 focus:ring-[#9E2A2B]"
              >
                <option value="chassisNo">Chassis Number</option>
                <option value="motorNo">Motor / Engine Number</option>
                <option value="plateNo">Plate Number</option>
                <option value="cedulaDoc">Community Tax Certificate (Cedula) Document</option>
                <option value="orCrDocument">Tricycle OR/CR Document (LTO)</option>
                <option value="license">Driver's License</option>
                <option value="todaEndorsement">TODA Endorsement Certificate</option>
                <option value="brgyClearance">Barangay Clearance</option>
                <option value="make">Vehicle Make / Brand</option>
                <option value="made">Model Year</option>
                <option value="zone">Route / Zone Assignment</option>
                <option value="applicantName">Applicant / Personal Details</option>
              </select>

              <label className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] uppercase tracking-wider block">Preset Rejection Reason</label>
              <select
                value={quickRejectReason}
                onChange={(e) => setQuickRejectReason(e.target.value)}
                className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2 text-xs font-medium text-[#1F1D1B] dark:text-[#EAE7E1] outline-none focus:ring-1 focus:ring-[#9E2A2B]"
              >
                {REJECT_REASONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
              </select>

              {quickRejectReason === 'Others (Please specify)' && (
                <textarea
                  placeholder="Specify review defect or correction instruction for the operator..."
                  value={quickRejectCustom}
                  onChange={(e) => setQuickRejectCustom(e.target.value)}
                  className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-xs text-[#1F1D1B] dark:text-[#EAE7E1] min-h-[70px] outline-none focus:ring-1 focus:ring-[#9E2A2B]"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setQuickRejectTarget(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold text-xs rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reasonText = quickRejectReason === 'Others (Please specify)' ? quickRejectCustom : quickRejectReason;
                  handleUpdateStatus('Cancelled', quickRejectTarget, reasonText, quickRejectField);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-700 hover:bg-red-800 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-6 max-w-lg w-full shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1F1D1B] dark:text-white">Confirm Batch Approval</h3>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  You are approving <strong>{selectedIds.length}</strong> application(s) at once.
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              {applications.filter(a => selectedIds.includes(a._id)).map((app, i) => (
                <div key={app._id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-white dark:hover:bg-[#1C1917]">
                  <span className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">{i + 1}. {app.fullName}</span>
                  <span className="text-xs font-mono text-[#6B6761] dark:text-[#A8A29E]">{app.todaName || 'NON-TODA'} &bull; {app.plateNo || 'PENDING'}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
              {activeTab === 'signing' ? (
                <>All selected applications will transition to <strong className="text-amber-700 dark:text-amber-400">Ready for Pickup</strong>.</>
              ) : (
                <>All selected applications will transition to <strong className="text-emerald-700 dark:text-emerald-400">For Payment</strong> (Cashier Queue). A 10-second undo window will be available.</>
              )}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setBatchApproveModal(false)}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold text-xs rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchApprove}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-6 max-w-lg w-full shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1F1D1B] dark:text-white">Confirm Batch Release</h3>
                <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">
                  You are activating <strong>{selectedIds.length}</strong> franchise(s).
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
              {applications.filter(a => selectedIds.includes(a._id)).map((app, i) => (
                <div key={app._id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-white dark:hover:bg-[#1C1917]">
                  <span className="font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">{i + 1}. {app.fullName}</span>
                  <span className="text-xs font-mono text-[#6B6761] dark:text-[#A8A29E]">{app.todaName || 'NON-TODA'} &bull; {app.plateNo || 'PENDING'}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setBatchReleaseModal(false)}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-[#F6F5F3] dark:bg-[#14110F] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold text-xs rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchRelease}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isBatchProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Release All ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Page Header */}
      <PageHeader
        title="Franchise Approval Queue"
        subtitle={`${pendingCount} application${pendingCount !== 1 ? 's' : ''} waiting review • Oldest applications prioritized`}
        actions={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => {
                  const firstPending = applications.find(a => isPendingStatus(a.status)) || applications[0];
                  if (firstPending) handleOpenWorkstation(firstPending);
                }}
                className="px-3.5 py-2 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
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
              className="p-2 bg-white dark:bg-[#1C1917] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E4E1DC] dark:border-[#2E2A27] text-slate-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
              title="Refresh queue"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-[#9E2A2B]' : ''} />
            </button>
          </div>
        }
      />

      {/* 2. ADVANCED TOOLBAR (Single TODA dropdown, Type, Barangay, Date, Flagged, Compact Toggle) */}
      <div className="mb-4 bg-white dark:bg-[#1C1917] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Left: Quick Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name, Plate, Motor, or Chassis..." 
              value={searchQuery} 
              onChange={(e) => updateParams({ q: e.target.value, page: 1 })} 
              className="w-full bg-[#F6F5F3]/70 dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
            />
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* TODA Dropdown */}
            <select
              value={selectedToda}
              onChange={(e) => updateParams({ toda: e.target.value, page: 1 })}
              className="bg-[#F6F5F3]/70 dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-[#9E2A2B] cursor-pointer"
            >
              <option value="all">All TODAs</option>
              {uniqueTodas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Application Type */}
            <select
              value={selectedType}
              onChange={(e) => updateParams({ type: e.target.value, page: 1 })}
              className="bg-[#F6F5F3]/70 dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-[#9E2A2B] cursor-pointer"
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
              className="bg-[#F6F5F3]/70 dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-[#9E2A2B] cursor-pointer max-w-[140px]"
            >
              <option value="all">All Barangays</option>
              {GASAN_BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Flagged Only Toggle */}
            <button
              onClick={() => updateParams({ flaggedOnly: !flaggedOnly, page: 1 })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                flaggedOnly 
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-[#F6F5F3]/70 dark:bg-[#14110F] text-slate-600 dark:text-slate-300 border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-slate-100'
              }`}
              title="Filter applications with issues or warnings only"
            >
              <AlertTriangle size={13} className={flaggedOnly ? 'text-rose-600' : 'text-slate-400'} />
              <span>Flagged Only</span>
            </button>

            {/* Compact Density Toggle */}
            <button
              onClick={() => updateParams({ compact: !compactView })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                compactView 
                  ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]'
                  : 'bg-[#F6F5F3]/70 dark:bg-[#14110F] text-slate-600 dark:text-slate-300 border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-slate-100'
              }`}
              title="Toggle compact row view"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Compact</span>
            </button>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                title="Reset all active search and filter criteria"
              >
                <X size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. STATUS TABS BAR & TRIAGE ACTIONS */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#1C1917] p-2 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: 'pending', label: 'Needs Review', icon: FileText, count: pendingCount },
            { key: 'payment', label: 'For Payment', icon: Clock, count: paymentCount },
            { key: 'signing', label: 'For Signing', icon: ShieldCheck, count: signingCount },
            { key: 'ready', label: 'Ready for Pickup', icon: Printer, count: readyCount },
            { key: 'all', label: 'All in Queue', icon: null, count: allCount },
            { divider: true },
            { key: 'approved', label: 'Approved', icon: CheckCircle2, count: approvedCount, history: true },
            { key: 'rejected', label: 'Rejected', icon: XCircle, count: rejectedCount, history: true }
          ].map((t, i) => {
            if (t.divider) {
              return <span key={`d${i}`} aria-hidden="true" className="mx-1 h-5 w-px bg-[#E4E1DC] dark:bg-[#2E2A27] shrink-0" />;
            }
            const isActive = activeTab === t.key;
            const Icon = t.icon;
            const activeClass = t.history
              ? 'bg-[#1F1D1B] dark:bg-[#EAE7E1] text-white dark:text-[#1F1D1B] shadow-xs'
              : 'bg-[#9E2A2B] text-white shadow-xs';
            return (
              <button
                key={t.key}
                onClick={() => updateParams({ tab: t.key, page: 1 })}
                aria-pressed={isActive}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive ? activeClass : 'text-[#6B6761] dark:text-[#A8A29E] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {Icon && <Icon size={14} />}
                <span>{t.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium tabular-nums ${
                  isActive ? 'bg-white/20 dark:bg-black/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Triage Controls: Select All Clean + Batch Action */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {activeTab === 'signing' && (
            <button
              type="button"
              onClick={() => setIsBatchPrintOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-2xs transition-all cursor-pointer"
              title="Batch print MTOP certificates for mayor/licensing official signature"
            >
              <Printer size={14} />
              <span>Batch Print MTOP {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
            </button>
          )}

          {paginatedApps.length > 0 && !isHistoryTab && activeTab !== 'payment' && (
            <>
              {/* Select All Clean */}
              <button
                onClick={selectAllClean}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-all cursor-pointer"
                title="Select all verified clean applications on current page"
              >
                <CheckCheck size={14} />
                <span>Select Clean</span>
              </button>

              {/* Standard Select All */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer"
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

          {activeTab === 'payment' && (
            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] px-2">
              The Treasury cashier records payment. Paid applications move to For Signing on their own.
            </span>
          )}

          {/* Batch Actions Trigger */}
          {selectedIds.length > 0 && !isHistoryTab && activeTab !== 'payment' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#E4E1DC] dark:border-[#2E2A27]">
              {activeTab === 'ready' ? (
                <button
                  onClick={() => setBatchReleaseModal(true)}
                  className="px-3.5 py-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Release ({selectedIds.length})
                </button>
              ) : activeTab === 'signing' ? (
                <button
                  onClick={() => setBatchApproveModal(true)}
                  className="px-3.5 py-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>Mark signed ({selectedIds.length})</span>
                </button>
              ) : (
                <button
                  onClick={() => setBatchApproveModal(true)}
                  className="px-3.5 py-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>Send to cashier ({selectedIds.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. APPLICATIONS LIST */}
      {isLoading ? (
        <QueueListSkeleton count={4} baseDelay={50} stepDelay={70} />
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] p-12 text-center text-[#6B6761] dark:text-[#A8A29E] transition-colors">
          <div className="relative mb-3 flex justify-center">
            <div className="w-16 h-16 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center p-2.5 shadow-xs">
              <TricycleIcon size={46} />
            </div>
          </div>
          <p className="font-semibold text-base text-[#1F1D1B] dark:text-[#F6F5F3]">No applications found</p>
          <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-1 max-w-md mx-auto">
            {hasActiveFilters
              ? 'No applications match your active search and filter criteria. Click below to reset.' 
              : activeTab === 'pending'
              ? 'There are no pending applications awaiting review right now.'
              : 'There are no applications currently in this queue view.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1F1D1B] dark:bg-[#2E2A27] text-white rounded-lg text-xs font-semibold hover:bg-[#9E2A2B] transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 pb-6">
            {paginatedApps.map((app, index) => {
              const isSelected = selectedIds.includes(app._id);
              const isMenuOpen = activeMenuId === app._id;

              return (
                <div 
                  key={app._id} 
                  className={`bg-white dark:bg-[#1C1917] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    compactView ? 'p-3 rounded-lg' : 'p-3.5 sm:p-4 rounded-lg'
                  } ${
                    isSelected 
                      ? 'border-[#9E2A2B] dark:border-[#D4AF37] ring-1 ring-[#9E2A2B]/20 dark:ring-[#D4AF37]/30' 
                      : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/30 dark:hover:border-[#D4AF37]/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(app._id)}
                      className="p-1 text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] transition-colors cursor-pointer shrink-0"
                      title={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? (
                        <CheckSquare size={17} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                      ) : (
                        <Square size={17} className="text-[#E4E1DC] dark:text-[#2E2A27]" />
                      )}
                    </button>

                    {/* Queue Position */}
                    <span className="text-xs font-semibold text-[#6B6761] font-mono tabular-nums w-5 shrink-0">
                      {startIndex + index + 1}.
                    </span>

                    {/* Applicant & Unit Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] text-sm truncate">
                          {app.fullName}
                        </h3>
                        {app.isResubmitted && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
                            Corrected
                          </span>
                        )}
                        {app.aiDiscrepancies && app.aiDiscrepancies.length > 0 && (
                          <span 
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 shrink-0 flex items-center gap-1"
                            title={`${app.aiDiscrepancies.length} modified/discrepant field(s) detected between image and application`}
                          >
                            <AlertTriangle size={11} className="text-rose-600 dark:text-rose-400" />
                            <span>Modified ({app.aiDiscrepancies.length})</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 truncate">
                        <span className="font-mono font-medium text-[#1F1D1B] dark:text-[#F6F5F3]">{app.plateNo || 'No Plate'}</span>
                        <span>&bull;</span>
                        <span className="truncate">{app.todaName || 'NON-TODA'}</span>
                        {app.applicationType && (
                          <>
                            <span>&bull;</span>
                            <span>{app.applicationType}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Clean Standard Status Badge */}
                    <div className="shrink-0">
                      {app.status === 'Ready for Pickup' ? (
                        <StatusBadge
                          status={app.status}
                          customLabel={
                            app.paymentStatus === 'Paid'
                              ? `Ready for Pickup • Paid`
                              : `Ready for Pickup • Awaiting Cashier`
                          }
                        />
                      ) : (
                        <StatusBadge status={app.status} />
                      )}
                    </div>
                  </div>

                  {/* Actions: View Summary text button + Primary Action + More Menu */}
                  <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E4E1DC] dark:border-[#2E2A27]">
                    {/* View Summary text button */}
                    <button
                      onClick={() => setDossierTargetUnit(app)}
                      className="px-3 py-1.5 bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg font-medium text-xs transition-colors cursor-pointer"
                      title="View Application Summary"
                    >
                      View Summary
                    </button>

                    {/* Primary Button depending on status */}
                    {app.status === 'Ready for Pickup' ? (
                      <button
                        onClick={() => setQuickApproveTarget(app)}
                        className={`px-3.5 py-1.5 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                          app.paymentStatus === 'Paid' 
                            ? 'bg-emerald-700 hover:bg-emerald-800' 
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                        title={app.paymentStatus === 'Paid' ? 'Release active franchise' : 'Release franchise (Cashier payment pending)'}
                      >
                        <CheckCircle2 size={13} />
                        <span>Release</span>
                      </button>
                    ) : app.status === 'For Signing' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuickApproveTarget(app)}
                          className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Mark MTOP signed by Mayor and route to Ready for Pickup"
                        >
                          <CheckCircle2 size={13} />
                          <span>Mark Signed</span>
                        </button>
                        <button
                          onClick={() => handleOpenWorkstation(app)}
                          className="bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Open full review workstation"
                        >
                          <Eye size={13} />
                          <span className="hidden sm:inline">Review</span>
                        </button>
                      </div>
                    ) : app.status === 'For Payment' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md">
                          At Treasury
                        </span>
                        <button
                          onClick={() => handleOpenWorkstation(app)}
                          className="bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Open review details"
                        >
                          <Eye size={13} />
                          <span>Review</span>
                        </button>
                      </div>
                    ) : isHistoryTab ? (
                      <button
                        onClick={() => handleOpenWorkstation(app)}
                        className="bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="View completed application details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenWorkstation(app)}
                        className="bg-[#9E2A2B] hover:bg-[#7A1B22] text-white px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Open full review workstation"
                      >
                        <Eye size={13} />
                        <span>Review</span>
                        <ChevronRight size={12} />
                      </button>
                    )}

                    {/* Safe More Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : app._id)}
                        className="p-1.5 hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] rounded-lg text-[#6B6761] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] shadow-lg rounded-lg py-1">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setDossierTargetUnit(app);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] flex items-center gap-2 cursor-pointer"
                          >
                            <FileText size={14} />
                            <span>View Summary</span>
                          </button>

                          {isPendingStatus(app.status) && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setQuickApproveTarget(app);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 size={14} />
                              <span>Send to Cashier</span>
                            </button>
                          )}

                          {app.status === 'For Signing' && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setQuickApproveTarget(app);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 size={14} />
                              <span>Mark Signed</span>
                            </button>
                          )}

                          {app.status === 'Ready for Pickup' && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenWorkstation(app);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={14} />
                              <span>Review Documents</span>
                            </button>
                          )}

                          {(app.status === 'For Signing' || app.status === 'Ready for Pickup' || app.status === 'Active') && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setPrintTargetUnit(app);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer"
                            >
                              <Printer size={14} />
                              <span>Print MTOP</span>
                            </button>
                          )}

                          {(isPendingStatus(app.status) || app.status === 'For Payment') && (
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
          <div className="mt-2 mb-16 p-3.5 bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#6B6761] dark:text-[#A8A29E] font-medium flex-wrap justify-center sm:justify-start">
              <span>Showing</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{startIndex + 1}</span>
              <span>to</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{endIndex}</span>
              <span>of</span>
              <span className="font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] tabular-nums">{totalApps}</span>
              <span>applications</span>

              <span className="mx-1 text-[#E4E1DC] dark:text-[#2E2A27] hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs">Page Size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => updateParams({ limit: Number(e.target.value), page: 1 })}
                  className="bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-2 py-1 text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] cursor-pointer"
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
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                        <span key={item} className="px-1.5 text-[#6B6761] select-none">
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
                        className={`min-w-[30px] h-[30px] rounded-lg text-xs font-semibold tabular-nums transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#9E2A2B] text-white'
                            : 'border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]'
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
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
