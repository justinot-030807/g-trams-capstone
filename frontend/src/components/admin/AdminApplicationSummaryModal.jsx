import React, { useState, useEffect, useRef } from 'react';
import {
  X, FileText, CheckCircle2, XCircle, ExternalLink, Loader2,
  AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Printer, FileSpreadsheet, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import OfficialApplicationForm from '../common/OfficialApplicationForm';
import { downloadOriginalLguTemplate } from '../../utils/downloadOriginalLguTemplate';
import { cleanText, formatVehicleMake, formatVehicleModelYear } from '../../utils/vehicleFormatters';

const AdminApplicationSummaryModal = ({
  isOpen,
  onClose,
  franchise,
  onApprove,
  onReject,
  onReview,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
  franchiseFee: franchiseFeeProp,
  isProcessing = false
}) => {
  const [isAiNoticeOpen, setIsAiNoticeOpen] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [fetchedFee, setFetchedFee] = useState(500);
  const modalRootRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    setIsAiNoticeOpen(false);
  }, [franchise?._id]);

  useEffect(() => {
    if (!isOpen || franchiseFeeProp != null) return;
    let active = true;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const feeVal = json?.data?.franchiseFee ?? json?.franchiseFee;
        if (active && feeVal != null && !Number.isNaN(Number(feeVal))) {
          setFetchedFee(Number(feeVal));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isOpen, franchiseFeeProp]);

  const effectiveFee = Number(franchiseFeeProp ?? fetchedFee ?? 500);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement;
    const focusTimer = setTimeout(() => {
      const root = modalRootRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        root.focus();
      }
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key === 'Tab' && modalRootRef.current) {
        const focusable = Array.from(
          modalRootRef.current.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !franchise) return null;

  const isPending = franchise.status === 'Pending' || franchise.status === 'Pending for Approval';
  const isPaid = franchise.paymentStatus === 'Paid' || franchise.isPaid;
  const canReject =
    !isPaid &&
    !['Ready for Pickup', 'Active', 'For Signing', 'Released', 'Cancelled'].includes(franchise.status) &&
    Boolean(onReject);
  const canApprove = isPending && Boolean(onApprove);
  const discrepancies = Array.isArray(franchise.aiDiscrepancies) ? franchise.aiDiscrepancies : [];

  const getStatusDisplay = (status) => {
    if (status === 'Pending' || status === 'Pending for Approval') return 'Pending for Approval';
    return status;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = async () => {
    if (isDownloadingExcel) return;
    setIsDownloadingExcel(true);
    try {
      const op = franchise.operator || franchise.operatorId || {};
      const fullName = String(
        franchise.fullName ||
        franchise.ownerName ||
        franchise.operatorName ||
        op.name ||
        ''
      ).trim();

      await downloadOriginalLguTemplate({
        franchise: {
          ...franchise,
          _id: franchise._id || franchise.id,
          ownerName: fullName,
          firstName: franchise.firstName || op.firstName,
          middleName: franchise.middleName || op.middleName,
          lastName: franchise.lastName || op.lastName,
          applicationType: franchise.applicationType === 'Renewal' ? 'Renewal' : 'New',
          zone: franchise.zone || franchise.todaZone,
          barangay: franchise.barangay || op.barangay || franchise.address || op.address,
          occupation: franchise.occupation || op.occupation || 'TRICYCLE OPERATOR',
          make: formatVehicleMake(franchise, ''),
          yearModel: formatVehicleModelYear(franchise, ''),
          motorNumber: cleanText(franchise.motorNo || franchise.motorNumber || franchise.engineNumber, ''),
          chassisNumber: cleanText(franchise.chassisNo || franchise.chassisNumber, ''),
          plateNumber: cleanText(franchise.plateNo || franchise.plateNumber, ''),
          sidecarNumber: cleanText(franchise.scNo || franchise.sidecarNumber || franchise.bodyNumber, ''),
          ctcNumber: cleanText(franchise.cedulaSerialNo || franchise.ctcNumber || franchise.cedulaNo, ''),
          ctcDateIssued: franchise.cedulaDate || franchise.ctcDateIssued || franchise.dateApplied || franchise.createdAt,
          createdAt: franchise.dateApplied || franchise.createdAt
        },
        type: 'application'
      });
    } catch (err) {
      console.error('Error downloading original Application Form Excel:', err);
      toast.error('Could not download Excel file. Please try again.');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  return (
    <div
      ref={modalRootRef}
      tabIndex={-1}
      id="admin-summary-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-summary-modal-title"
      className="fixed inset-0 z-[9999] bg-black/75 overflow-y-auto overscroll-contain flex flex-col items-center justify-start p-2 sm:p-6 pb-20 pt-3 animate-in fade-in duration-150 print:static print:inset-auto print:bg-white print:p-0 print:block print:overflow-visible"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[820px] flex flex-col items-center gap-3 shrink-0 print:max-w-full print:m-0 print:block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Control & Action Bar (Hidden when printing) */}
        <div className="sticky top-2 z-20 w-full bg-[#1C1917] text-[#F6F5F3] border border-[#2E2A27] rounded-xl p-3 sm:px-4 shadow-xl flex flex-col gap-2.5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#9E2A2B] text-white flex items-center justify-center shrink-0">
                <FileText size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="admin-summary-modal-title" className="text-sm font-bold text-[#F6F5F3] truncate">
                    Application Summary (Printable Form)
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    isPending
                      ? 'bg-amber-950/60 text-amber-300 border-amber-700/70'
                      : franchise.status === 'Active'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/70'
                      : franchise.status === 'Cancelled'
                      ? 'bg-red-950/60 text-red-300 border-red-700/70'
                      : 'bg-[#9E2A2B]/25 text-[#F5E6B3] border-[#D4AF37]/40'
                  }`}>
                    {getStatusDisplay(franchise.status)}
                  </span>
                  {franchise.isResubmitted && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-700/70">
                      Corrected &amp; Re-submitted
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#A8A29E] truncate mt-0.5">
                  Plate <span className="font-mono tabular-nums text-[#F5E6B3]">{cleanText(franchise.plateNo || franchise.plateNumber, 'PENDING')}</span>
                  {' • '}TODA <span className="font-semibold text-[#F6F5F3]">{franchise.todaName || 'NON-TODA'}</span>
                  {' • '}Fee <span className="font-mono tabular-nums text-[#F6F5F3]">₱{effectiveFee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {totalCount > 1 && (
                <div className="flex items-center gap-0.5 bg-[#14110F] rounded-lg p-1 border border-[#2E2A27]">
                  <button
                    type="button"
                    onClick={onPrev}
                    disabled={!onPrev}
                    className="p-1.5 rounded-md hover:bg-[#2E2A27] text-[#A8A29E] hover:text-[#F6F5F3] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Previous application"
                    aria-label="Previous application"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="font-mono tabular-nums text-[11px] font-bold px-1.5 text-[#F6F5F3] min-w-[44px] text-center">
                    {(currentIndex ?? 0) + 1} / {totalCount}
                  </span>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!onNext}
                    className="p-1.5 rounded-md hover:bg-[#2E2A27] text-[#A8A29E] hover:text-[#F6F5F3] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Next application"
                    aria-label="Next application"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={isDownloadingExcel}
                className="min-h-[38px] flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                title="Download populated original Gasan LGU Application Form (.xlsx)"
              >
                {isDownloadingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                <span className="hidden sm:inline">Original Excel</span>
                <span className="sm:hidden">.XLSX</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[38px] flex items-center gap-1.5 bg-[#9E2A2B] hover:bg-[#7A1B22] active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                title="Print or Save Official Application Form as PDF"
              >
                <Printer size={14} />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#A8A29E] hover:text-[#F6F5F3] hover:bg-[#2E2A27] transition-colors cursor-pointer"
                title="Close (Esc)"
                aria-label="Close application summary"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Row: Review Photos, Approve & Reject + Treasury Indicator */}
          <div className="pt-2 border-t border-[#2E2A27] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                isPaid
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60'
                  : 'bg-[#14110F] text-[#A8A29E] border-[#2E2A27]'
              }`}>
                <Receipt size={12} />
                {isPaid
                  ? `Paid • OR# ${franchise.officialReceiptNo || franchise.orNo || 'Recorded'}`
                  : 'Awaiting Cashier Payment'}
              </span>

              {onReview && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReview(franchise);
                  }}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#2E2A27] hover:bg-[#3A3532] text-[#F6F5F3] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open full image inspection workbench"
                >
                  <ExternalLink size={13} />
                  <span>Review Photos</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {canReject && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReject(franchise);
                  }}
                  disabled={isProcessing}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 active:scale-95 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Reject application and return to operator"
                >
                  <XCircle size={14} />
                  <span>Reject</span>
                </button>
              )}

              {canApprove && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApprove(franchise);
                  }}
                  disabled={isProcessing}
                  className="min-h-[38px] px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Approve requirements and send to Municipal Cashier for payment"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Approve (Send to Cashier)</span>
                </button>
              )}
            </div>
          </div>

          {/* Optional AI Document Discrepancy Notice */}
          {discrepancies.length > 0 && (
            <div className="bg-amber-950/50 border border-amber-700/70 rounded-lg text-xs text-amber-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAiNoticeOpen((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-amber-900/30 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                  <span className="font-bold text-amber-200 truncate">
                    AI Discrepancy Flagged ({discrepancies.length}) — Verify via Review Photos before approving
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 shrink-0">
                  <span>{isAiNoticeOpen ? 'Hide' : 'Show'}</span>
                  {isAiNoticeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {isAiNoticeOpen && (
                <div className="px-3 pb-2.5 pt-1 border-t border-amber-800/60 space-y-1">
                  {discrepancies.map((d, idx) => (
                    <div key={idx} className="text-[11px] flex items-center justify-between gap-2 border-b border-amber-900/40 pb-1 last:border-0 last:pb-0">
                      <span className="font-medium text-amber-100">{d.label || d.field}:</span>
                      <span className="text-right font-mono tabular-nums">
                        <span className="text-red-300 font-bold mr-1">Image: {d.scannedValue || '—'} {d.severity === 'critical' ? '(Expired)' : ''}</span>
                        <span className="text-amber-500">|</span>
                        <span className="text-[#F6F5F3] font-bold ml-1">Entered: {d.enteredValue || '—'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Printable Official MTOP Application File (1:1 Original LGU Form pursuant to Ord. No. 48 s. 1999) */}
        <OfficialApplicationForm
          formData={franchise}
          isRenewal={franchise.applicationType === 'Renewal'}
          showActions={false}
          className="print:w-full"
        />
      </div>
    </div>
  );
};

export default AdminApplicationSummaryModal;
