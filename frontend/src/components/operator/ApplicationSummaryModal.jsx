import React, { useState, useEffect } from 'react';
import { X, FileText, ShieldCheck, Eye, Award, ExternalLink, History, Receipt } from 'lucide-react';
import { formatZoneLabel } from '../../utils/constants';
import OfficialApplicationForm from '../common/OfficialApplicationForm';

const DEFAULT_MODAL_REQUIREMENTS = [
  { id: 'crDocument', label: 'Certificate of Registration (CR)', fieldUrl: 'crUrl' },
  { id: 'orDocument', label: 'Official Receipt (OR)', fieldUrl: 'orUrl' },
  { id: 'license', label: "Driver's License (Front)", fieldUrl: 'licenseUrl' },
  { id: 'licenseBack', label: "Driver's License (Back / DL Codes)", fieldUrl: 'licenseBackUrl' },
  { id: 'brgyClearance', label: 'Barangay Clearance', fieldUrl: 'brgyClearanceUrl' },
  { id: 'cedulaDoc', label: 'Community Tax Certificate (Cedula)', fieldUrl: 'cedulaUrl' }
];

const formatShortDateDisplay = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ApplicationSummaryModal = ({
  isOpen,
  isSummaryModalOpen,
  onClose,
  setIsSummaryModalOpen,
  formData = {},
  application = {},
  loggedInToda = '',
  requirementsList,
  uploadedDocs = {},
  filePreviews = {},
  onViewECopy = null,
  title = 'Official Application Form'
}) => {
  const visible = isOpen !== undefined ? Boolean(isOpen) : Boolean(isSummaryModalOpen);
  const [docPreview, setDocPreview] = useState(null); // { label, url }

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsSummaryModalOpen) setIsSummaryModalOpen(false);
  };

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (docPreview) setDocPreview(null);
        else handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, docPreview]);

  if (!visible) return null;

  const data = (formData && Object.keys(formData).length > 0) ? formData : (application || {});
  const rawReqList = (Array.isArray(requirementsList) && requirementsList.length > 0)
    ? requirementsList
    : DEFAULT_MODAL_REQUIREMENTS;
  const reqList = rawReqList.filter((req) => req.id !== 'todaEndorsement' && req.fieldUrl !== 'todaEndorsementUrl');

  const getDocUrl = (req) => {
    if (filePreviews && filePreviews[req.id]) return filePreviews[req.id];
    if (uploadedDocs && uploadedDocs[req.id]) {
      return typeof uploadedDocs[req.id] === 'string' ? uploadedDocs[req.id] : URL.createObjectURL(uploadedDocs[req.id]);
    }
    if (req.fieldUrl && uploadedDocs && uploadedDocs[req.fieldUrl]) {
      return typeof uploadedDocs[req.fieldUrl] === 'string' ? uploadedDocs[req.fieldUrl] : URL.createObjectURL(uploadedDocs[req.fieldUrl]);
    }
    if (req.fieldUrl && filePreviews && filePreviews[req.fieldUrl]) return filePreviews[req.fieldUrl];
    if (data && data[req.fieldUrl]) return data[req.fieldUrl];
    if (data && data[req.id]) return data[req.id];
    // Fallback for combined orCr
    if (req.id === 'crDocument' || req.id === 'orDocument') {
      return data?.orCrUrl || filePreviews?.orCrDocument || '';
    }
    return '';
  };

  const normalizedZone = data?.zone ? formatZoneLabel(data.zone) : '';
  const formPayload = {
    ...data,
    todaName: data?.todaName || loggedInToda || 'NON-TODA',
    zone: normalizedZone && normalizedZone !== 'N/A' ? normalizedZone : (data?.zone || '')
  };
  const priorTerms = Array.isArray(data?.paymentHistory) ? data.paymentHistory : [];

  return (
    <div 
      id="printable-application-modal-root"
      className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 print:static print:inset-auto print:bg-white print:p-0 print:block print:overflow-visible"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative max-w-4xl w-full bg-white dark:bg-[#1C1917] rounded-xl overflow-hidden shadow-2xl border border-[#E4E1DC] dark:border-[#2E2A27] p-4 sm:p-5 max-h-[92vh] flex flex-col animate-spring-in print:max-w-full print:max-h-none print:overflow-visible print:shadow-none print:border-none print:p-0 print:block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27] gap-3 print:hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              <FileText size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{title}</h3>
                {data?.status && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    data.status === 'Active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : data.status === 'Pending' || data.status === 'Pending for Approval'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : data.status === 'Cancelled' || data.status === 'Revoked'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                      : 'bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#F5E6B3] border-[#9E2A2B]/25 dark:border-[#D4AF37]/35'
                  }`}>
                    {data.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate mt-0.5">
                Plate <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.plateNo || 'PENDING'}</span>
                {' • '}TODA <span className="font-semibold">{formPayload.todaName}</span>
                {normalizedZone && normalizedZone !== 'N/A' ? ` (${normalizedZone})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {data?.officialReceiptNo && (
              <div className="bg-[#F0FDF4] dark:bg-[#052E16]/40 px-2.5 py-1 rounded-lg border border-[#BBF7D0] dark:border-[#166534] flex items-center gap-1.5 max-w-[230px]">
                <Receipt size={13} className="text-[#15803D] dark:text-[#4ADE80] shrink-0" />
                <span className="font-mono font-bold text-[11px] text-[#15803D] dark:text-[#4ADE80] break-all leading-tight">
                  OR# {data.officialReceiptNo}
                </span>
              </div>
            )}
            {data?.status === 'Active' && onViewECopy && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onViewECopy(data);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Award size={14} />
                <span>View E-Copy</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 text-[#1F1D1B] dark:text-[#EAE7E1] print:overflow-visible print:p-0 print:space-y-0">
          {/* 1:1 Official MTOP Application Form */}
          <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2 sm:p-4 rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] print:bg-white print:p-0 print:border-none">
            <OfficialApplicationForm
              formData={formPayload}
              isRenewal={data?.applicationType === 'Renewal'}
              showActions={true}
            />
          </div>

          {/* Attached Documents */}
          <div className="print:hidden">
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} /> Attached Documents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reqList.map((req) => {
                const docUrl = getDocUrl(req);
                const isAttached = Boolean(docUrl);
                return (
                  <div key={req.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs gap-2">
                    <span className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{req.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAttached && (
                        <button
                          type="button"
                          onClick={() => setDocPreview({ label: req.label, url: docUrl })}
                          className="px-2 py-0.5 rounded text-[11px] font-bold text-[#9E2A2B] dark:text-[#D4AF37] hover:bg-[#E4E1DC] dark:hover:bg-[#2E2A27] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Preview attached document"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      )}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        isAttached ? 'bg-[#F0FDF4] dark:bg-[#052E16]/40 text-[#15803D] dark:text-[#4ADE80] border border-[#BBF7D0] dark:border-[#166534]' : 'bg-[#FEF3C7] dark:bg-[#78350F]/40 text-[#B45309] dark:text-[#FDE68A] border border-[#F59E0B]/30'
                      }`}>
                        {isAttached ? '✓ Attached' : 'Missing'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prior Term / Renewal History (if renewed) */}
          {priorTerms.length > 0 && (
            <div className="print:hidden">
              <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History size={13} /> Prior Term / Renewal History ({priorTerms.length})
              </h4>
              <div className="space-y-1.5">
                {priorTerms.map((term, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] font-semibold text-[11px]">
                        {term.applicationType || 'New'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold uppercase">
                        {term.previousStatus || 'Expired'}
                      </span>
                      <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                        {term.mtopNo ? `MTOP #${term.mtopNo}` : 'No MTOP#'}
                      </span>
                      {term.officialReceiptNo && (
                        <span className="font-mono text-[#6B6761] dark:text-[#A8A29E] break-all">
                          OR# {term.officialReceiptNo}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium">
                      {formatShortDateDisplay(term.approvalDate || term.paymentDate)} &rarr; {formatShortDateDisplay(term.expiryDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-center justify-end gap-2.5 print:hidden">
          {data?.status === 'Active' && onViewECopy && (
            <button
              type="button"
              onClick={() => {
                handleClose();
                onViewECopy(data);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Award size={15} />
              <span>View E-Copy</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2 min-h-[40px] rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Document Lightbox Preview Modal */}
      {docPreview && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDocPreview(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white dark:bg-[#1C1917] rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
              <h4 className="font-bold text-sm text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{docPreview.label}</h4>
              <div className="flex items-center gap-2">
                <a 
                  href={docPreview.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 rounded-lg text-[#6B6761] dark:text-[#A8A29E] hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setDocPreview(null)}
                  className="p-1.5 rounded-lg text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center py-4 bg-[#F6F5F3] dark:bg-[#14110F] rounded-lg mt-3">
              {docPreview.url.endsWith('.pdf') ? (
                <iframe src={docPreview.url} title={docPreview.label} className="w-full h-[60vh] rounded" />
              ) : (
                <img src={docPreview.url} alt={docPreview.label} className="max-h-[65vh] max-w-full object-contain rounded" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationSummaryModal;
