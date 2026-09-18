import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import { 
  CheckCircle, CheckCircle2, XCircle, Eye, FileText, AlertCircle, 
  X, Search, Loader2, ZoomIn, ZoomOut, RotateCw, Printer, ShieldCheck, Download,
  CalendarDays, User, Clock, ExternalLink, RefreshCw, ChevronRight, ChevronLeft, Shield,
  CheckSquare, Square, Filter, Users, Layers, FileSpreadsheet, Copy, Check
} from 'lucide-react';
import { QueueListSkeleton } from '../../components/skeleton';
import MtopCertificateModal from '../../components/admin/MtopCertificateModal';
import BatchMtopModal from '../../components/admin/BatchMtopModal';
import TransmittalSheetModal from '../../components/admin/TransmittalSheetModal';

const REJECT_REASONS = [
  "Incomplete Requirements",
  "Expired or Invalid Driver's License",
  "Mismatch in Vehicle Details (Motor/Chassis No.)",
  "Invalid TODA Endorsement",
  "Fake or Tampered Documents",
  "Others (Please specify)"
];

const FranchiseApproval = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Queue Filtering state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'ready' | 'all'
  const [selectedToda, setSelectedToda] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedToda, searchQuery]);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchApproveModal, setBatchApproveModal] = useState(false);
  const [batchReleaseModal, setBatchReleaseModal] = useState(false);

  // Quick Action modals state
  const [quickApproveTarget, setQuickApproveTarget] = useState(null);
  const [quickRejectTarget, setQuickRejectTarget] = useState(null);
  const [quickRejectReason, setQuickRejectReason] = useState(REJECT_REASONS[0]);
  const [quickRejectCustom, setQuickRejectCustom] = useState('');

  // Workstation state
  const [selectedApp, setSelectedApp] = useState(null); 
  const [activeDocKey, setActiveDocKey] = useState('orCr');
  const [mobilePane, setMobilePane] = useState('details'); // 'details' | 'document'

  // Workstation Rejection state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Document viewer state
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Print modals state
  const [printTargetUnit, setPrintTargetUnit] = useState(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isTransmittalOpen, setIsTransmittalOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises?limit=2000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Sort by earliest submission date (FIFO queue)
        const queue = (Array.isArray(data) ? data : (data.data || []))
          .filter(app => app.status === 'Pending' || app.status === 'Ready for Pickup')
          .sort((a, b) => new Date(a.dateApplied || a.createdAt) - new Date(b.dateApplied || b.createdAt));
        
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
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Document Completeness Evaluator
  const getDocCompleteness = (app) => {
    const isRenewal = app.applicationType === 'Renewal';
    const docs = [
      { name: 'OR/CR', uploaded: Boolean(app.orCrUrl) },
      { name: "License", uploaded: Boolean(app.licenseUrl) },
      { name: 'TODA', uploaded: Boolean(app.todaEndorsementUrl), optional: isRenewal },
      { name: 'Barangay', uploaded: Boolean(app.brgyClearanceUrl), optional: isRenewal }
    ];
    const requiredDocs = docs.filter(d => !d.optional);
    const totalRequired = requiredDocs.length;
    const uploadedRequired = requiredDocs.filter(d => d.uploaded).length;
    const allTotal = docs.length;
    const allUploaded = docs.filter(d => d.uploaded).length;
    const isComplete = uploadedRequired === totalRequired;
    return {
      isComplete,
      uploadedCount: allUploaded,
      totalCount: allTotal,
      missing: docs.filter(d => !d.uploaded).map(d => d.name)
    };
  };

  // Status Update for Single Unit (from Workstation or Quick Action)
  const handleUpdateStatus = async (status, targetApp = selectedApp, customReasonText = '', autoAdvance = false) => {
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
        body: JSON.stringify({ status: status, cancelReason: finalReason })
      });

      if (response.ok) {
        showToast(`Application for ${targetApp.fullName} updated to ${status}!`, "success");
        if (selectedApp?._id === targetApp._id) {
          setIsRejecting(false);
          if (autoAdvance) {
            // Find next eligible applicant in filteredApps
            const currIdx = filteredApps.findIndex(a => a._id === targetApp._id);
            const remaining = filteredApps.filter(a => a._id !== targetApp._id);

            let nextTarget = null;
            if (currIdx >= 0 && currIdx < filteredApps.length - 1) {
              nextTarget = filteredApps[currIdx + 1];
            } else if (remaining.length > 0) {
              nextTarget = remaining[Math.min(currIdx, remaining.length - 1)];
            }

            if (nextTarget) {
              handleOpenWorkstation(nextTarget);
            } else {
              showToast("Queue completed! All applications in view reviewed.", "success");
              setSelectedApp(null);
            }
          } else {
            setSelectedApp(null);
          }
        }
        setQuickApproveTarget(null);
        setQuickRejectTarget(null);
        fetchApplications(); 
      } else {
        showToast('Failed to update status. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error. Cannot connect to server.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Approval Action
  const handleConfirmBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);

    try {
      const promises = selectedIds.map(async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'Ready for Pickup' })
        });
        if (!res.ok) throw new Error(`Failed to approve ${id}`);
        return res;
      });

      await Promise.all(promises);
      showToast(`Successfully approved ${selectedIds.length} application(s) to Ready for Pickup!`, "success");
      setSelectedIds([]);
      setBatchApproveModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error in batch approval:', error);
      showToast('Encountered an error while processing batch approval.', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Release Action (Activates Ready for Pickup units)
  const handleConfirmBatchRelease = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);

    try {
      const promises = selectedIds.map(async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'Active' })
        });
        if (!res.ok) throw new Error(`Failed to release ${id}`);
        return res;
      });

      await Promise.all(promises);
      showToast(`Successfully released and activated ${selectedIds.length} franchise(s)!`, "success");
      setSelectedIds([]);
      setBatchReleaseModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error in batch release:', error);
      showToast('Encountered an error while processing batch release.', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Navigate to dedicated full-screen inspection workstation
  const handleOpenWorkstation = (app) => {
    navigate(`/franchise-approval/review/${app._id}`);
  };

  const getExpirationDate = (dateApplied) => {
    if (!dateApplied) return 'N/A';
    const date = new Date(dateApplied);
    date.setFullYear(date.getFullYear() + 1); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Count indicators
  const pendingCount = applications.filter(a => a.status === 'Pending').length;
  const readyCount = applications.filter(a => a.status === 'Ready for Pickup').length;
  const allCount = applications.length;

  // Extract unique TODAs for filter dropdown
  const uniqueTodas = Array.from(new Set(applications.map(a => a.todaName || 'NON-TODA').filter(Boolean))).sort();

  // Filter Pipeline: Tab Filter -> TODA Filter -> Search Filter
  const tabFiltered = applications.filter(app => {
    if (activeTab === 'pending') return app.status === 'Pending';
    if (activeTab === 'ready') return app.status === 'Ready for Pickup';
    return true;
  });

  const todaFiltered = tabFiltered.filter(app => {
    if (selectedToda === 'all') return true;
    return (app.todaName || 'NON-TODA').toLowerCase() === selectedToda.toLowerCase();
  });

  const filteredApps = todaFiltered.filter(app => 
    (app.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (app.plateNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (app.motorNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (app.todaName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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
      // Deselect visible on current page
      const visibleIds = paginatedApps.map(a => a._id);
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select visible on current page
      const newIds = Array.from(new Set([...selectedIds, ...paginatedApps.map(a => a._id)]));
      setSelectedIds(newIds);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Workstation Queue Navigator Helpers
  const currentWorkstationIndex = filteredApps.findIndex(a => a._id === selectedApp?._id);
  const hasPrevApp = currentWorkstationIndex > 0;
  const hasNextApp = currentWorkstationIndex >= 0 && currentWorkstationIndex < filteredApps.length - 1;

  const handlePrevApp = () => {
    if (hasPrevApp) handleOpenWorkstation(filteredApps[currentWorkstationIndex - 1]);
  };

  const handleNextApp = () => {
    if (hasNextApp) handleOpenWorkstation(filteredApps[currentWorkstationIndex + 1]);
  };

  // Keyboard Shortcuts for Rapid Admin Workstation Verification
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keystrokes when typing inside inputs, textareas, or selects
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(activeTag)) return;

      if (!selectedApp) return;

      if (e.key === 'Escape') {
        setSelectedApp(null);
      } else if (e.key === '1') {
        setActiveDocKey('orCr');
      } else if (e.key === '2') {
        setActiveDocKey('license');
      } else if (e.key === '3') {
        setActiveDocKey('toda');
      } else if (e.key === '4') {
        setActiveDocKey('brgy');
      } else if (e.key === 'ArrowLeft') {
        if (hasPrevApp) handlePrevApp();
      } else if (e.key === 'ArrowRight') {
        if (hasNextApp) handleNextApp();
      } else if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (selectedApp.status === 'Pending' && !isProcessing) {
          handleUpdateStatus('Ready for Pickup', selectedApp, '', true);
        } else if (selectedApp.status === 'Ready for Pickup' && !isProcessing) {
          handleUpdateStatus('Active', selectedApp, '', true);
        }
      } else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        if (selectedApp.status === 'Pending') {
          e.preventDefault();
          setIsRejecting(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApp, hasPrevApp, hasNextApp, filteredApps, isProcessing]);

  // Documents list for workstation
  const docTabs = selectedApp ? [
    { key: 'orCr', label: 'OR / CR Document', url: selectedApp.orCrUrl, short: 'OR/CR' },
    { key: 'license', label: "Driver's License", url: selectedApp.licenseUrl, short: 'License' },
    { key: 'toda', label: 'TODA Endorsement', url: selectedApp.todaEndorsementUrl, short: 'TODA' },
    { key: 'brgy', label: 'Barangay Clearance', url: selectedApp.brgyClearanceUrl, short: 'Barangay' }
  ] : [];

  const currentDoc = docTabs.find(d => d.key === activeDocKey) || docTabs[0];

  return (
    <MainLayout>
      <style>{`
        @media print {
          body:not(.printing-mtop):not(.printing-batch-mtop):not(.printing-transmittal) * { visibility: hidden; }
          body:not(.printing-mtop):not(.printing-batch-mtop):not(.printing-transmittal) #printable-document,
          body:not(.printing-mtop):not(.printing-batch-mtop):not(.printing-transmittal) #printable-document * { visibility: visible; }
          body:not(.printing-mtop):not(.printing-batch-mtop):not(.printing-transmittal) #printable-document { position: absolute; left: 0; top: 0; width: 100%; }
          .print-hide { display: none !important; }
        }
      `}</style>

      {/* Minimalist Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={15} />
              ) : (
                <CheckCircle2 size={15} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {toast.message}
              </p>
            </div>
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

      {/* Quick Approve Confirmation Modal */}
      {quickApproveTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {quickApproveTarget.status === 'Pending' ? 'Approve Application?' : 'Acknowledge Payment & Release?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quickApproveTarget.status === 'Pending' ? 'Set status to Ready for Pickup' : 'Set status to Active Franchise'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
              <p><span className="font-bold text-slate-500">Operator:</span> <strong className="text-slate-900 dark:text-white">{quickApproveTarget.fullName}</strong></p>
              <p><span className="font-bold text-slate-500">TODA / Zone:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{quickApproveTarget.todaName || 'NON-TODA'} (Zone {quickApproveTarget.zone})</span></p>
              <p><span className="font-bold text-slate-500">Plate Number:</span> <span className="font-mono font-bold text-[#7A1B22] dark:text-[#D4AF37]">{quickApproveTarget.plateNo || 'PENDING'}</span></p>
              {quickApproveTarget.status === 'Pending' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 pt-1 font-medium">
                  &bull; A digital Claim Stub Voucher will be immediately generated for the operator.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setQuickApproveTarget(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(quickApproveTarget.status === 'Pending' ? 'Ready for Pickup' : 'Active', quickApproveTarget)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                <span>Confirm {quickApproveTarget.status === 'Pending' ? 'Approval' : 'Release'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reject Modal */}
      {quickRejectTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <XCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Reject Application</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select reason for rejecting {quickRejectTarget.fullName}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rejection Reason</label>
              <select
                value={quickRejectReason}
                onChange={(e) => setQuickRejectReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-200"
              >
                {REJECT_REASONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
              </select>

              {quickRejectReason === 'Others (Please specify)' && (
                <textarea
                  placeholder="Specify inspection defect or instruction for the operator..."
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
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reasonText = quickRejectReason === 'Others (Please specify)' ? quickRejectCustom : quickRejectReason;
                  handleUpdateStatus('Cancelled', quickRejectTarget, reasonText);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Approve Confirmation Modal */}
      {batchApproveModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
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

            <p className="text-xs text-slate-600 dark:text-slate-400">
              All selected applications will transition to <strong className="text-blue-600 dark:text-blue-400">Ready for Pickup</strong>. Operators will immediately be notified and can view their Claim Stub Voucher to pay at the Municipal Cashier.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setBatchApproveModal(false)}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchApprove}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isBatchProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Approve All ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Release Confirmation Modal */}
      {batchReleaseModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Confirm Batch Release</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are releasing and activating <strong>{selectedIds.length}</strong> franchise(s).
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

            <p className="text-xs text-slate-600 dark:text-slate-400">
              All selected franchises will officially transition to <strong className="text-emerald-600 dark:text-emerald-400">Active</strong> status. MTOP certificates and official receipts are acknowledged as validated and released to operators.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setBatchReleaseModal(false)}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchRelease}
                disabled={isBatchProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isBatchProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Release All ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Ribbon */}
      <header className="mb-6 bg-gradient-to-br from-[#681419] via-[#7A1B22] to-[#3a0b0f] dark:from-[#0d121f] dark:via-[#1e0e15] dark:to-[#0a0d16] rounded-2xl p-4 sm:px-6 sm:py-5 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4 border border-[#D4AF37]/30 transition-all">
        <div className="relative z-10 flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 shadow-sm">
             <CheckCircle2 size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">Franchise Approval Queue</h1>
            <p className="text-white/75 dark:text-slate-400 font-medium text-xs sm:text-xs max-w-xl">
              Review, batch-approve, and generate official MTOPs and transmittal summaries.
            </p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="relative z-10 shrink-0">
            <button
              onClick={() => {
                const firstPending = applications.find(a => a.status === 'Pending') || applications[0];
                if (firstPending) navigate(`/franchise-approval/review/${firstPending._id}`);
              }}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c29e2f] text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Open full-screen inspection station for pending applications"
            >
              <Eye size={16} />
              <span>Start Review Queue ({pendingCount})</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </header>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col md:flex-row justify-end items-center gap-2.5 flex-wrap">
          {/* TODA Association Filter */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedToda}
              onChange={(e) => setSelectedToda(e.target.value)}
              className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#7A1B22] cursor-pointer"
            >
              <option value="all">All TODA Associations</option>
              {uniqueTodas.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name or Plate..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37]"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh Applications Queue"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-[#7A1B22] dark:text-[#D4AF37]' : ''} />
          </button>
        </div>
      {/* Status Tabs Bar & Select All Control */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-[#7A1B22] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={14} />
            <span>Needs Review (Pending)</span>
            <span className={`text-xs px-1.5 py-0.2 rounded-full ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ready')}
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
            onClick={() => setActiveTab('all')}
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

        {/* Select All Toggle */}
        {filteredApps.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer self-end sm:self-center"
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-[#7A1B22] dark:text-[#D4AF37]" />
            ) : (
              <Square size={16} className="text-slate-400" />
            )}
            <span>Select All in View ({filteredApps.length})</span>
          </button>
        )}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <QueueListSkeleton count={4} baseDelay={50} stepDelay={70} />
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
          <p className="font-bold text-base text-slate-800 dark:text-slate-200">No applications found!</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {searchQuery || selectedToda !== 'all' 
              ? 'Try adjusting your search or TODA filter.' 
              : activeTab === 'pending'
              ? 'There are no pending applications awaiting inspection right now.'
              : 'There are no applications currently in this queue view.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3.5 pb-6">
          {paginatedApps.map((app, index) => {
            const isSelected = selectedIds.includes(app._id);
            const comp = getDocCompleteness(app);

            return (
              <div 
                key={app._id} 
                className={`stagger-reveal bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected 
                    ? 'border-[#7A1B22] dark:border-[#D4AF37] ring-2 ring-[#7A1B22]/15 dark:ring-[#D4AF37]/20 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#7A1B22]/30 dark:hover:border-[#D4AF37]/30'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelect(app._id)}
                    className="mt-1 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                    title={isSelected ? "Deselect" : "Select"}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} className="text-[#7A1B22] dark:text-[#D4AF37]" />
                    ) : (
                      <Square size={20} className="text-slate-300 dark:text-slate-600 hover:text-slate-500" />
                    )}
                  </button>

                  {/* Status Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    app.status === 'Ready for Pickup' 
                      ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400' 
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                  }`}>
                    {app.status === 'Ready for Pickup' ? <Printer size={20} /> : <FileText size={20} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                        Queue #{startIndex + index + 1}
                      </span>
                      <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg truncate">
                        {app.fullName}
                      </h3>
                      
                      {app.status === 'Ready for Pickup' ? (
                        <span className="text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 uppercase font-black tracking-wider">
                          Ready for Pickup
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 uppercase font-black tracking-wider">
                          Pending Review
                        </span>
                      )}

                      {/* Document Completeness Badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                        comp.isComplete 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${comp.isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {comp.isComplete ? `${comp.uploadedCount}/${comp.totalCount} Docs Complete` : `Missing: ${comp.missing.join(', ')}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 
                        Plate: {app.plateNo || 'PENDING'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
                        TODA: {app.todaName || 'NON-TODA'} (Zone {app.zone || 1})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> 
                        Type: {app.applicationType || 'New'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">
                        <CalendarDays size={13} className="text-[#7A1B22] dark:text-[#D4AF37]" /> 
                        Submitted: {formatDate(app.dateApplied || app.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Cluster */}
                <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Quick Approve (If Pending) */}
                  {app.status === 'Pending' && (
                    <button
                      onClick={() => setQuickApproveTarget(app)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title="Quick Approve to Ready for Pickup"
                    >
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span className="hidden sm:inline">Quick Approve</span>
                    </button>
                  )}

                  {/* Quick Reject (If Pending) */}
                  {app.status === 'Pending' && (
                    <button
                      onClick={() => setQuickRejectTarget(app)}
                      className="px-2.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title="Reject Application"
                    >
                      <XCircle size={14} />
                      <span className="hidden sm:inline">Reject</span>
                    </button>
                  )}

                  {/* Quick Print MTOP (If Ready for Pickup) */}
                  {app.status === 'Ready for Pickup' && (
                    <button
                      onClick={() => setPrintTargetUnit(app)}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-[#7A1B22] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title="Print Official MTOP Certificate"
                    >
                      <Printer size={14} />
                      <span className="hidden sm:inline">Print MTOP</span>
                    </button>
                  )}

                  {/* Quick Release / Payment (If Ready for Pickup) */}
                  {app.status === 'Ready for Pickup' && (
                    <button
                      onClick={() => setQuickApproveTarget(app)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                      title="Acknowledge Payment & Release Franchise"
                    >
                      <CheckCircle2 size={14} />
                      <span className="hidden sm:inline">Release</span>
                    </button>
                  )}

                  {/* Deep Inspection Workstation Button */}
                  <button 
                    onClick={() => handleOpenWorkstation(app)} 
                    className="bg-slate-900 dark:bg-slate-800 text-white hover:bg-[#7A1B22] dark:hover:bg-[#7A1B22] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Open Full Inspection Workbench"
                  >
                    <Eye size={14} />
                    <span>Inspect</span>
                    <ChevronRight size={14} className="hidden sm:inline" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar for Queue */}
        {!isLoading && filteredApps.length > 0 && (
          <div className="mt-2 mb-20 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
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
                <span className="text-xs">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#7A1B22] dark:focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                        onClick={() => setCurrentPage(item)}
                        className={`min-w-[30px] h-[30px] rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#7A1B22] dark:bg-[#D4AF37] text-white dark:text-slate-950 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage >= totalPages}
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </>
    )}

      {/* ========================================================================= */}
      {/* 🚀 FLOATING BATCH ACTION BAR (Appears when 1+ applicants are selected) */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (() => {
        const selectedUnits = applications.filter(a => selectedIds.includes(a._id));
        const pendingUnitsCount = selectedUnits.filter(u => u.status === 'Pending').length;
        const readyUnitsCount = selectedUnits.filter(u => u.status === 'Ready for Pickup').length;
        const isReleasePrimary = activeTab === 'ready' || (readyUnitsCount > 0 && pendingUnitsCount === 0);

        return (
          <div className="fixed bottom-6 left-0 right-0 md:left-64 z-[100] flex justify-center pointer-events-none px-4">
            <div className="pointer-events-auto w-full max-w-2xl bg-slate-900/95 backdrop-blur-md text-white border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  {selectedIds.length}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {selectedIds.length} unit{selectedIds.length > 1 ? 's' : ''} selected
                  </p>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-white/60 hover:text-white underline cursor-pointer"
                  >
                    Clear selection
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Dynamic Batch Approve / Batch Release Action */}
                {isReleasePrimary ? (
                  <button
                    onClick={() => setBatchReleaseModal(true)}
                    disabled={isBatchProcessing}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Acknowledge Payment and Release Active Franchises"
                  >
                    <CheckCircle2 size={14} />
                    <span>Batch Release ({selectedIds.length})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setBatchApproveModal(true)}
                    disabled={isBatchProcessing}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Batch Approve selected applications to Ready for Pickup"
                  >
                    <CheckCircle2 size={14} />
                    <span>Batch Approve ({selectedIds.length})</span>
                  </button>
                )}

                {/* Batch Print MTOP */}
                <button
                  onClick={() => setIsBatchPrintOpen(true)}
                  className="px-3.5 py-1.5 bg-[#7A1B22] hover:bg-[#922029] active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Print MTOP Certificates for all selected units in 1 continuous job"
                >
                  <Printer size={14} />
                  <span>Batch Print MTOP</span>
                </button>

                {/* Print Transmittal Sheet */}
                <button
                  onClick={() => setIsTransmittalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-white/15 cursor-pointer"
                  title="Print Official LGU Transmittal and Endorsement Record"
                >
                  <FileSpreadsheet size={14} />
                  <span className="hidden sm:inline">Transmittal Sheet</span>
                  <span className="sm:hidden">Summary</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </MainLayout>
  );
};

export default FranchiseApproval;
