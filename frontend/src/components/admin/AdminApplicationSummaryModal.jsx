import React from 'react';
import { 
  X, FileText, User, Car, Receipt, ShieldCheck, FileCheck, 
  CheckCircle2, XCircle, ExternalLink, Loader2, Sparkles, AlertTriangle, Check
} from 'lucide-react';
import { evaluateDocumentValidity } from '../../utils/dateValidity';

const AdminApplicationSummaryModal = ({
  isOpen,
  onClose,
  franchise,
  onApprove,
  onReject,
  onReview,
  isProcessing = false
}) => {
  if (!isOpen || !franchise) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isPending = franchise.status === 'Pending' || franchise.status === 'Pending for Approval';
  const orCrValidity = evaluateDocumentValidity(franchise.orCrExpiryDate);
  const licenseValidity = evaluateDocumentValidity(franchise.driverLicenseExpiryDate);

  const getStatusDisplay = (status) => {
    if (status === 'Pending' || status === 'Pending for Approval') return 'Pending for Approval';
    return status;
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-h-[90vh] flex flex-col animate-spring-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  Application Summary
                </h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                  isPending 
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    : franchise.status === 'Active'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : franchise.status === 'Cancelled'
                    ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                    : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                }`}>
                  {getStatusDisplay(franchise.status)}
                </span>
                {franchise.isResubmitted && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Corrected &amp; Re-submitted
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Review complete details before final decision
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* Trustworthy AI OCR Verification Banner */}
          {franchise.aiVerification && franchise.aiVerification.status !== 'unverified' ? (
            <div className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              franchise.aiVerification.status === 'flagged' || (franchise.aiVerification.summary?.mismatchedFields || 0) > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
            }`}>
              <div className="flex items-center gap-2 font-bold min-w-0">
                <Sparkles size={15} className={franchise.aiVerification.status === 'flagged' ? 'text-rose-600 shrink-0' : 'text-emerald-600 shrink-0'} />
                <span className="truncate">
                  {franchise.aiVerification.status === 'flagged'
                    ? 'Gemini OCR: Discrepancy or Document Type Issue'
                    : 'Gemini OCR: All Scanned Fields Matched'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold shrink-0 self-end sm:self-auto px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/60">
                {franchise.aiVerification.summary?.matchedFields || 0} matched &bull; {franchise.aiVerification.summary?.mismatchedFields || 0} mismatch
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span className="font-semibold">OCR Verification: Manual inspection active</span>
              <span className="text-[11px] text-slate-500">Unverified by AI</span>
            </div>
          )}

          {/* 1. Operator Information */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={13} /> 1. Operator Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{franchise.fullName || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Barangay Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{franchise.address || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Route Zone</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{franchise.zone ? `Zone ${franchise.zone}` : '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">TODA Association</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{franchise.todaName || '—'}</span>
              </div>
            </div>
          </div>

          {/* 2. Tricycle Details */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Car size={13} /> 2. Tricycle Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Make &amp; Model</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{franchise.make || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Model Year</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{franchise.made || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Plate Number</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{franchise.plateNo || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Motor Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{franchise.motorNo || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Chassis Number</span>
                <span className="font-mono font-bold text-[#9E2A2B] dark:text-[#D4AF37] truncate block">{franchise.chassisNo || '—'}</span>
              </div>
            </div>
          </div>

          {/* 3. CTC / Cedula Details */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Receipt size={13} /> 3. CTC / Cedula Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Cedula Serial No.</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{franchise.cedulaSerialNo || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Date Issued</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(franchise.cedulaDate)}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Place Issued</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{franchise.cedulaAddress || 'Gasan, Marinduque'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Date Applied</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(franchise.dateApplied || franchise.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 4. Document Metadata & Validity */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCheck size={13} /> 4. Document Metadata &amp; Validity
            </h4>
            
            <div className="space-y-2 text-xs">
              {/* LTO OR/CR */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37]">
                    LTO OR / CR
                  </span>
                  {franchise.orCrExpiryDate && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${orCrValidity.badgeColor}`}>
                      {orCrValidity.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold">OR / CR No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{franchise.orCrNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold">Registration Expiry</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(franchise.orCrExpiryDate)}</span>
                  </div>
                </div>
              </div>

              {/* Driver & License */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37]">
                    Driver &amp; License
                  </span>
                  {franchise.driverLicenseExpiryDate && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${licenseValidity.badgeColor}`}>
                      {licenseValidity.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold">Designation</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {franchise.isOperatorDriver ? 'Operator (Self)' : 'Designated Driver'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold">License No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{franchise.driverLicenseNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold">License Expiry</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(franchise.driverLicenseExpiryDate)}</span>
                  </div>
                  {!franchise.isOperatorDriver && franchise.driverName && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 dark:text-slate-500 block text-xs uppercase font-bold">Driver Name &amp; Contact</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {franchise.driverName} {franchise.driverContact ? `(${franchise.driverContact})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* TODA & Brgy Clearances */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block mb-1">
                    TODA Certificate
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Cert No:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{franchise.todaCertNo || '—'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block mb-1">
                    Barangay Clearance
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Clearance No:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{franchise.brgyClearanceNo || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Attached Document Links */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} /> 5. Attached Documents
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'OR / CR', url: franchise.orCrUrl },
                { label: "Driver's License", url: franchise.licenseUrl },
                { label: 'Cedula (CTC)', url: franchise.cedulaUrl },
                { label: 'TODA Endorsement', url: franchise.todaEndorsementUrl },
                { label: 'Brgy Clearance', url: franchise.brgyClearanceUrl }
              ].map((doc, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{doc.label}</span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9E2A2B] dark:text-[#D4AF37] hover:underline flex items-center gap-0.5 text-[10px] font-bold shrink-0 ml-1"
                      title="View document image"
                    >
                      <span>View</span>
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[10px]">None</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            {onReview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReview(franchise);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Open image inspection workbench"
              >
                <ExternalLink size={13} />
                <span>Review Photos</span>
              </button>
            )}
          </div>

          {/* Decision Buttons (Approve / Reject) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onReject(franchise);
              }}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <XCircle size={14} />
              <span>Reject</span>
            </button>

            {isPending && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(franchise);
                }}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Approve for Signing</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApplicationSummaryModal;
