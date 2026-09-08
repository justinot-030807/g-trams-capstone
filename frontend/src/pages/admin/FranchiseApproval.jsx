import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { 
  CheckCircle, CheckCircle2, XCircle, Eye, FileText, AlertCircle, 
  X, Search, Loader2, ZoomIn, ZoomOut, RotateCw, Printer, ShieldCheck, Download,
  CalendarDays, User, Clock, ExternalLink, RefreshCw, ChevronRight, ChevronLeft, Shield,
  CheckSquare, Square, Filter, Users, Layers, FileSpreadsheet
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
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Queue Filtering state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'ready' | 'all'
  const [selectedToda, setSelectedToda] = useState('all');

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
  const handleUpdateStatus = async (status, targetApp = selectedApp, customReasonText = '') => {
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
          setSelectedApp(null); 
          setIsRejecting(false);
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
      const promises = selectedIds.map(id =>
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'Ready for Pickup' })
        })
      );

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
      const promises = selectedIds.map(id =>
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'Active' })
        })
      );

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

  // Reset document controls when an application is opened in Workstation
  const handleOpenWorkstation = (app) => {
    setSelectedApp(app);
    setIsRejecting(false);
    setZoomScale(1);
    setRotation(0);
    setMobilePane('details');

    // Default active doc to the first one available
    if (app.orCrUrl) setActiveDocKey('orCr');
    else if (app.licenseUrl) setActiveDocKey('license');
    else if (app.todaEndorsementUrl) setActiveDocKey('toda');
    else if (app.brgyClearanceUrl) setActiveDocKey('brgy');
    else setActiveDocKey('orCr');
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

  // Checkbox selection helpers
  const isAllSelected = filteredApps.length > 0 && filteredApps.every(a => selectedIds.includes(a._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect visible
      const visibleIds = filteredApps.map(a => a._id);
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select visible
      const newIds = Array.from(new Set([...selectedIds, ...filteredApps.map(a => a._id)]));
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
                <p className="text-[11px] text-blue-600 dark:text-blue-400 pt-1 font-medium">
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
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Rejection Reason</label>
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
                  <span className="text-[11px] font-mono text-slate-500">{app.todaName || 'NON-TODA'} &bull; {app.plateNo || 'PENDING'}</span>
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
                  <span className="text-[11px] font-mono text-slate-500">{app.todaName || 'NON-TODA'} &bull; {app.plateNo || 'PENDING'}</span>
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

      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#7A1B22] rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Franchise Approval Queue</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review, batch-approve, and generate official MTOPs and transmittal summaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Refresh Applications Queue"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

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
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
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
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
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
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
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
        <div className="space-y-3.5 pb-24">
          {filteredApps.map((app, index) => {
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
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                        Queue #{index + 1}
                      </span>
                      <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg truncate">
                        {app.fullName}
                      </h3>
                      
                      {app.status === 'Ready for Pickup' ? (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 uppercase font-black tracking-wider">
                          Ready for Pickup
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 uppercase font-black tracking-wider">
                          Pending Review
                        </span>
                      )}

                      {/* Document Completeness Badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
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
                    className="text-[10px] text-white/60 hover:text-white underline cursor-pointer"
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

      {/* ========================================================================= */}
      {/* 🖥️ SPLIT-SCREEN INSPECTION WORKSTATION (FULL MODAL WORKBENCH) */}
      {/* ========================================================================= */}
      {selectedApp && !printTargetUnit && !isBatchPrintOpen && !isTransmittalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setSelectedApp(null)} 
          />
          
          <div className="relative w-full h-[96vh] max-w-[1500px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10">
            
            {/* WORKSTATION TOP BAR */}
            <div className="px-5 py-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#7A1B22] flex items-center justify-center text-[#D4AF37] font-black text-xs shrink-0 shadow-sm border border-[#D4AF37]/30">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-base text-slate-900 dark:text-white tracking-tight truncate">
                      {selectedApp.fullName}
                    </h2>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/90 border border-slate-200 dark:border-white/15">
                      {selectedApp.applicationType || 'New'} Application
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 text-[#7A1B22] dark:text-[#D4AF37] border border-[#D4AF37]/40">
                      Plate: {selectedApp.plateNo || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {selectedApp.todaName} &bull; Zone {selectedApp.zone} &bull; Submitted: {formatDate(selectedApp.dateApplied || selectedApp.createdAt)}
                  </p>
                </div>
              </div>

              {/* Queue Navigator: Previous & Next Applicant */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
                <button
                  onClick={handlePrevApp}
                  disabled={!hasPrevApp}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous Application"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[11px] font-mono px-2 text-slate-600 dark:text-slate-300">
                  {currentWorkstationIndex >= 0 ? currentWorkstationIndex + 1 : 1} / {filteredApps.length}
                </span>
                <button
                  onClick={handleNextApp}
                  disabled={!hasNextApp}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next Application"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Mobile Pane Switcher (Tabs on < lg screens) */}
              <div className="flex lg:hidden items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
                <button
                  onClick={() => setMobilePane('details')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${mobilePane === 'details' ? 'bg-[#7A1B22] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Applicant Data
                </button>
                <button
                  onClick={() => setMobilePane('document')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${mobilePane === 'document' ? 'bg-[#7A1B22] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Live Document
                </button>
              </div>

              {/* Top Bar Actions */}
              <div className="flex items-center gap-2">
                {(selectedApp.status === 'Ready for Pickup' || selectedApp.status === 'Active') && (
                  <button
                    onClick={() => setPrintTargetUnit(selectedApp)}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-white/15 cursor-pointer"
                  >
                    <Printer size={14} className="text-[#D4AF37]" /> Print MTOP
                  </button>
                )}
                <button 
                  onClick={() => setSelectedApp(null)} 
                  className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-white/10 dark:hover:bg-red-500 text-slate-600 dark:text-white rounded-xl transition-colors cursor-pointer"
                  title="Close Workstation (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* WORKSTATION BODY: SPLIT VIEW */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              
              {/* LEFT PANE: APPLICANT DATA & INSPECTION CHECKLIST (42% on desktop) */}
              <div className={`w-full lg:w-[42%] flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-white dark:bg-slate-900 ${
                mobilePane === 'details' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="p-5 sm:p-6 space-y-5 flex-1">
                  
                  {/* Operator & Vehicle Spec Strip */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4.5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#7A1B22] dark:text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                        <User size={15} /> Operator & Vehicle Specs
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        ID: {selectedApp._id.slice(-6)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Full Name</p>
                        <p className="font-black text-slate-900 dark:text-white mt-0.5">{selectedApp.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">TODA & Zone</p>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedApp.todaName} (Zone {selectedApp.zone})</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Barangay Address</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedApp.address}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Make / Brand</p>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedApp.make} ({selectedApp.made || 'N/A'})</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Plate Number</p>
                        <p className="font-black text-slate-900 dark:text-white mt-0.5">{selectedApp.plateNo || 'PENDING ASSIGNMENT'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Motor Number</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-0.5 border border-slate-200 dark:border-slate-700 select-all">
                          {selectedApp.motorNo}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Chassis Number</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-0.5 border border-slate-200 dark:border-slate-700 select-all">
                          {selectedApp.chassisNo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SUBMITTED DOCUMENTS OVERVIEW (Clean & Elegant, Click to view on right pane) */}
                  <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={15} className="text-[#7A1B22] dark:text-[#D4AF37]" /> Submitted Documents
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Click to inspect</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {docTabs.map((tab) => {
                        const isSelected = activeDocKey === tab.key;
                        const hasFile = Boolean(tab.url);

                        return (
                          <div
                            key={tab.key}
                            onClick={() => {
                              setActiveDocKey(tab.key);
                              setMobilePane('document');
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-white dark:bg-slate-800 border-[#7A1B22] dark:border-[#D4AF37] shadow-sm ring-1 ring-[#7A1B22]/20 dark:ring-[#D4AF37]/20'
                                : 'bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#7A1B22] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                                <FileText size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#7A1B22] dark:text-[#D4AF37]' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {tab.label}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {hasFile ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={11} /> Attached
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                                  Missing
                                </span>
                              )}
                              <ChevronRight size={14} className={`transition-colors ${isSelected ? 'text-[#7A1B22] dark:text-[#D4AF37]' : 'text-slate-300 dark:text-slate-600'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* REJECTION REASON EXPANDABLE ACCORDION */}
                  {isRejecting && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4.5 animate-in fade-in slide-in-from-top-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-red-800 dark:text-red-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle size={15} /> Specify Rejection Reason
                        </h4>
                        <button 
                          onClick={() => setIsRejecting(false)} 
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <select 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)} 
                        className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-200"
                      >
                        {REJECT_REASONS.map((r, i) => <option key={i} value={r}>{r}</option>)}
                      </select>

                      {rejectReason === 'Others (Please specify)' && (
                        <textarea 
                          placeholder="Type specific inspection defect or reason for the operator..." 
                          value={customReason} 
                          onChange={(e) => setCustomReason(e.target.value)} 
                          className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white min-h-[70px] outline-none focus:ring-2 focus:ring-red-200" 
                        />
                      )}

                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => {
                            const reasonText = rejectReason === 'Others (Please specify)' ? customReason : rejectReason;
                            handleUpdateStatus('Cancelled', selectedApp, reasonText);
                          }} 
                          disabled={isProcessing} 
                          className="flex-1 bg-red-600 text-white hover:bg-red-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} 
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTION DOCK (LEFT PANE) */}
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  {!isRejecting && (
                    <>
                      {selectedApp.status === 'Pending' ? (
                        <button 
                          onClick={() => setIsRejecting(true)} 
                          className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border border-red-200 dark:border-red-800/40 cursor-pointer"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <Clock size={15} /> Awaiting Release
                        </span>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {selectedApp.status === 'Pending' ? (
                          <button 
                            onClick={() => handleUpdateStatus('Ready for Pickup', selectedApp)} 
                            disabled={isProcessing} 
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
                          >
                            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            Approve (Set to Ready for Pickup)
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateStatus('Active', selectedApp)} 
                            disabled={isProcessing} 
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
                          >
                            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            Acknowledge Payment & Release
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT PANE: DEDICATED LIVE DOCUMENT VIEWER CANVAS (58% on desktop) */}
              <div className={`w-full lg:w-[58%] flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white overflow-hidden ${
                mobilePane === 'document' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* DOCUMENT SELECTOR TABS & TOOLBAR */}
                <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  
                  {/* Doc Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {docTabs.map((tab) => {
                      const isActive = tab.key === activeDocKey;
                      const hasDoc = Boolean(tab.url);
                      return (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setActiveDocKey(tab.key);
                            setZoomScale(1);
                            setRotation(0);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-[#7A1B22] text-white shadow-sm border border-[#D4AF37]/40'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/5'
                          }`}
                        >
                          <FileText size={13} className={isActive ? 'text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'} />
                          <span>{tab.label}</span>
                          {!hasDoc && selectedApp.applicationType !== 'Renewal' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Missing attachment" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Controls (Zoom / Rotate / Reset / External) */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button 
                      onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))} 
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-1 text-slate-500 dark:text-slate-400 min-w-[40px] text-center">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button 
                      onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))} 
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button 
                      onClick={() => setRotation(prev => (prev + 90) % 360)} 
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw size={16} />
                    </button>
                    <button 
                      onClick={() => { setZoomScale(1); setRotation(0); }} 
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Reset View"
                    >
                      <RefreshCw size={14} />
                    </button>

                    {currentDoc?.url && (
                      <>
                        <div className="h-4 w-px bg-slate-300 dark:bg-white/20 mx-1" />
                        <a
                          href={currentDoc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 text-[#7A1B22] dark:text-[#D4AF37] rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Open Original in New Tab"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* WORKSPACE CANVAS / VIEWER */}
                <div className="flex-1 relative flex items-center justify-center p-4 overflow-auto bg-slate-100 dark:bg-slate-950/90 select-none">
                  {selectedApp.applicationType === 'Renewal' && !currentDoc?.url ? (
                    <div className="text-center p-8 max-w-md bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
                      <ShieldCheck size={36} className="mx-auto text-[#7A1B22] dark:text-[#D4AF37] mb-3 opacity-70" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Renewal Application</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        This is a franchise renewal application. Historical vehicle records and original requirements are archived on file.
                      </p>
                    </div>
                  ) : !currentDoc?.url ? (
                    <div className="text-center p-8 max-w-md bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
                      <AlertCircle size={36} className="mx-auto text-amber-500 mb-3 opacity-70" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">No Document Uploaded</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        The applicant has not uploaded an attachment for <strong className="text-amber-600 dark:text-amber-300">{currentDoc?.label}</strong>.
                      </p>
                    </div>
                  ) : currentDoc.url.toLowerCase().includes('.pdf') ? (
                    <iframe 
                      src={currentDoc.url} 
                      className="w-full h-full bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-white/10" 
                      title="Inspection Document PDF" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                      <img 
                        src={currentDoc.url} 
                        alt={currentDoc.label}
                        style={{ 
                          transform: `scale(${zoomScale}) rotate(${rotation}deg)`, 
                          transformOrigin: 'center', 
                          transition: 'transform 0.15s ease-out' 
                        }}
                        className="max-h-[82vh] max-w-[90%] object-contain rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10" 
                      />
                    </div>
                  )}
                </div>

                {/* CANVAS BOTTOM INFO BAR */}
                <div className="px-4 py-2 bg-white dark:bg-slate-900/90 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Eye size={13} className="text-[#7A1B22] dark:text-[#D4AF37]" /> Inspecting: <strong className="text-slate-800 dark:text-slate-200">{currentDoc?.label}</strong>
                  </span>
                  <span className="font-mono text-slate-400 dark:text-slate-500">
                    Use controls in toolbar to inspect fine details
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default FranchiseApproval;