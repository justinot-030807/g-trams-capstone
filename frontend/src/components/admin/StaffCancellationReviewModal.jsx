import React, { useState } from 'react';
import { 
  X, AlertTriangle, FileText, CheckCircle2, XCircle, ZoomIn, ZoomOut, 
  RotateCw, ExternalLink, Download, Loader2, Calendar, User, ShieldAlert,
  HelpCircle, Eye, Info
} from 'lucide-react';
import TricycleIcon from '../common/TricycleIcon';

const StaffCancellationReviewModal = ({ 
  isOpen, 
  onClose, 
  unit, 
  onFinalize, 
  onReject, 
  isProcessing = false 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [staffNotes, setStaffNotes] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState('');

  if (!isOpen || !unit) return null;

  const letterUrl = unit.cancellationDetails?.letterUrl || unit.evidenceUrl || '';
  const isPdf = letterUrl.toLowerCase().endsWith('.pdf');
  const cancelReason = unit.cancellationDetails?.reason || unit.cancelReason || 'Voluntary Cancellation';
  const cancelRemarks = unit.cancellationDetails?.remarks || '';
  const requestDate = unit.cancellationDetails?.requestedAt 
    ? new Date(unit.cancellationDetails.requestedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'Recently';

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetView = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleConfirmFinalize = async () => {
    setActionError('');
    try {
      await onFinalize(unit, staffNotes);
      onClose();
    } catch (err) {
      setActionError(err.message || 'Failed to finalize cancellation.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejecting the cancellation request.');
      return;
    }
    setActionError('');
    try {
      await onReject(unit, rejectionReason, staffNotes);
      onClose();
    } catch (err) {
      setActionError(err.message || 'Failed to reject cancellation request.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200" 
        onClick={() => !isProcessing && onClose()} 
      />

      {/* Modal Container */}
      <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-4xl rounded-xl shadow-2xl relative z-10 flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between gap-3 bg-white dark:bg-[#1C1917] rounded-t-xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] dark:bg-[#450A0A] border border-[#FECACA] dark:border-[#991B1B] text-[#B91C1C] dark:text-[#EF4444] flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
                  Review Voluntary Franchise Cancellation
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-300 dark:border-amber-800">
                  Awaiting BPLO Action
                </span>
              </div>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium flex items-center gap-2 mt-0.5 truncate">
                <span>Plate: <strong className="font-mono text-[#1F1D1B] dark:text-[#F6F5F3]">{unit.plateNo}</strong></span>
                <span>•</span>
                <span>Operator: <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{unit.fullName}</strong></span>
                <span>•</span>
                <span>TODA: <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{unit.todaName || 'N/A'}</strong></span>
              </p>
            </div>
          </div>

          <button 
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Quick Details Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block mb-1">
                Reason for Surrender
              </span>
              <p className="text-xs font-bold text-[#B91C1C] dark:text-[#EF4444]">
                {cancelReason}
              </p>
            </div>

            <div className="p-3 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block mb-1">
                Date & Time Filed
              </span>
              <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                {requestDate}
              </p>
            </div>

            <div className="p-3 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6761] dark:text-[#A8A29E] block mb-1">
                Treasury Routing Status
              </span>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Zero Cashier Route (Bypassed)</span>
              </p>
            </div>
          </div>

          {/* Operator Remarks */}
          {cancelRemarks && (
            <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/60 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">
                Operator Remarks / Explanation
              </span>
              <p className="text-xs text-[#1F1D1B] dark:text-[#F6F5F3] leading-relaxed italic">
                "{cancelRemarks}"
              </p>
            </div>
          )}

          {/* Cancellation Letter Inspection Panel */}
          <div className="border border-[#E4E1DC] dark:border-[#2E2A27] rounded-xl overflow-hidden bg-[#F6F5F3] dark:bg-[#14110F]">
            
            {/* Document Controls Toolbar */}
            <div className="p-2.5 sm:px-4 bg-white dark:bg-[#1C1917] border-b border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
                <span className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                  Formal Cancellation / Handwritten Letter Evidence
                </span>
              </div>

              <div className="flex items-center gap-1">
                {!isPdf && letterUrl && (
                  <>
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[11px] font-mono font-semibold px-1 text-slate-600 dark:text-slate-400">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors ml-1"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetView}
                      className="px-2 py-1 text-[10px] font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors ml-1"
                    >
                      Reset
                    </button>
                  </>
                )}

                {letterUrl && (
                  <a
                    href={letterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#9E2A2B] hover:bg-[#7A1B22] text-white transition-colors ml-2 shadow-2xs"
                    title="Open document in a new window"
                  >
                    <ExternalLink size={12} />
                    <span>Open Full</span>
                  </a>
                )}
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div className="relative min-h-[350px] max-h-[480px] overflow-auto p-4 flex items-center justify-center bg-slate-900/10 dark:bg-black/30">
              {letterUrl ? (
                isPdf ? (
                  <iframe
                    src={letterUrl}
                    title="Cancellation Letter PDF"
                    className="w-full h-[450px] rounded border border-[#E4E1DC] dark:border-[#2E2A27]"
                  />
                ) : (
                  <div className="overflow-auto max-h-[450px] flex items-center justify-center transition-all duration-150">
                    <img
                      src={letterUrl}
                      alt="Cancellation Letter"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-w-full max-h-[420px] object-contain rounded shadow-md border border-white/20"
                    />
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-[#6B6761] dark:text-[#A8A29E]">
                  <FileText size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No cancellation letter attached.</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff Verification Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
              BPLO Staff Verification Notes (Optional)
            </label>
            <input
              type="text"
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="e.g., Verified valid surrender; surrender letter archived in municipal file..."
              className="w-full text-xs p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B]"
            />
          </div>

          {/* Rejection Prompt Details (If Staff chose to reject) */}
          {showRejectPrompt && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg animate-in fade-in duration-150 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle size={15} />
                <span>Specify Rejection Reason (Franchise will be restored to Active):</span>
              </div>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Cancellation letter is unreadable or not signed by the registered operator..."
                className="w-full text-xs p-2.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectPrompt(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel Rejection
                </button>
                <button
                  type="button"
                  disabled={isProcessing || !rejectionReason.trim()}
                  onClick={handleConfirmReject}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  <span>Confirm Reject Request</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showRejectPrompt && (
          <div className="p-4 sm:p-5 border-t border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#1C1917] rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-[#6B6761] dark:text-[#A8A29E] flex items-center gap-1.5">
              <Info size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              <span>Finalizing marks franchise as <strong>Cancelled</strong> with zero cashier payment.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowRejectPrompt(true)}
                className="px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <XCircle size={14} />
                <span>Reject Request</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmFinalize}
                className="px-5 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-white bg-[#B91C1C] hover:bg-[#991B1B] transition-all shadow-xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Finalizing Cancellation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Finalize Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffCancellationReviewModal;
