import React, { useState, useEffect } from 'react';
import { X, FileText, User, Receipt, ShieldCheck, FileCheck, Eye, Award, ExternalLink } from 'lucide-react';
import { formatZoneLabel } from '../../utils/constants';
import TricycleIcon from '../common/TricycleIcon';

const DEFAULT_MODAL_REQUIREMENTS = [
  { id: 'crDocument', label: 'Certificate of Registration (CR)', fieldUrl: 'crUrl' },
  { id: 'orDocument', label: 'Official Receipt (OR)', fieldUrl: 'orUrl' },
  { id: 'license', label: "Driver's License (Front)", fieldUrl: 'licenseUrl' },
  { id: 'licenseBack', label: "Driver's License (Back / DL Codes)", fieldUrl: 'licenseBackUrl' },
  { id: 'todaEndorsement', label: 'TODA Endorsement Certificate', fieldUrl: 'todaEndorsementUrl' },
  { id: 'brgyClearance', label: 'Barangay Clearance', fieldUrl: 'brgyClearanceUrl' },
  { id: 'cedulaDoc', label: 'Community Tax Certificate (Cedula)', fieldUrl: 'cedulaUrl' }
];

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
  title = 'Application Summary'
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
  const reqList = (Array.isArray(requirementsList) && requirementsList.length > 0)
    ? requirementsList
    : DEFAULT_MODAL_REQUIREMENTS;

  const getDocUrl = (req) => {
    if (uploadedDocs && uploadedDocs[req.id]) {
      return typeof uploadedDocs[req.id] === 'string' ? uploadedDocs[req.id] : URL.createObjectURL(uploadedDocs[req.id]);
    }
    if (filePreviews && filePreviews[req.id]) return filePreviews[req.id];
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

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative max-w-xl w-full bg-white dark:bg-[#1C1917] rounded-xl overflow-hidden shadow-2xl border border-[#E4E1DC] dark:border-[#2E2A27] p-5 sm:p-6 max-h-[88vh] flex flex-col animate-spring-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E4E1DC] dark:border-[#2E2A27] gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
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
                      : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                  }`}>
                    {data.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] truncate">Complete tricycle franchise specifications &amp; verified documents</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-[#1F1D1B] dark:text-[#EAE7E1]">
          {/* 1. Operator Information */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={13} /> 1. Operator &amp; Route Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Full Name</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.fullName || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Barangay Residence</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.address || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Assigned Route Zone</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.zone ? formatZoneLabel(data.zone) : '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">TODA Association</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.todaName || loggedInToda || 'NON-TODA'}</span>
              </div>
            </div>
          </div>

          {/* 2. Tricycle Details */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TricycleIcon size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> 2. Tricycle Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Plate Number</span>
                <span className="font-mono font-bold text-sm text-[#9E2A2B] dark:text-[#D4AF37]">{data?.plateNo || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Make &amp; Brand</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.make || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Year Model</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.made || data?.yearModel || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Motor / Engine No.</span>
                <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.motorNo || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] sm:col-span-2">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Chassis Serial No.</span>
                <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.chassisNo || '—'}</span>
              </div>
              {data?.color && (
                <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Color</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data.color}</span>
                </div>
              )}
              {data?.series && (
                <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Series</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data.series}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Driver & License Credentials */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCheck size={13} /> 3. Driver &amp; License Credentials
            </h4>
            <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Designation</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {data?.isOperatorDriver ? 'Operator (Owner-Driver)' : 'Designated Driver (Boundary)'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Active Driver Name</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    {data?.isOperatorDriver ? (data?.fullName || '—') : (data?.driverName || '—')}
                  </span>
                </div>
                {!data?.isOperatorDriver && data?.driverContact && (
                  <div className="col-span-2">
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Driver Contact</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data.driverContact}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Driver's License No.</span>
                  <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverLicenseNo || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Back Card Serial No.</span>
                  <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverLicenseSerialNo || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">License Expiry Date</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverLicenseExpiryDate || '—'}</span>
                </div>
                <div>
                  <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">DL Authorization Codes</span>
                  <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverDlCodes || 'A, A1'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Clearances & CTC (Cedula) */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Receipt size={13} /> 4. Clearances &amp; CTC (Cedula)
            </h4>
            <div className="space-y-2 text-xs">
              {/* Cedula Box */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block mb-1.5">
                  Community Tax Certificate (CTC / Cedula)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Serial No.</span>
                    <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.cedulaSerialNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Date Issued</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.cedulaDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Place Issued</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.cedulaAddress || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Amount Paid</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.cedulaAmount ? `₱${Number(data.cedulaAmount).toFixed(2)}` : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Barangay & TODA Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block mb-1">
                    Barangay Clearance
                  </span>
                  <div className="space-y-1">
                    <p className="flex justify-between">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Clearance No:</span>
                      <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.brgyClearanceNo || '—'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Date Issued:</span>
                      <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.brgyClearanceDate || '—'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Issuing Official:</span>
                      <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{data?.brgyIssuer || '—'}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block mb-1">
                    TODA Endorsement
                  </span>
                  <div className="space-y-1">
                    <p className="flex justify-between">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Cert No:</span>
                      <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.todaCertNo || '—'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Date Issued:</span>
                      <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.todaCertDate || '—'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#6B6761] dark:text-[#A8A29E]">Signatory:</span>
                      <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{data?.todaSignatory || '—'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Receipt if recorded */}
              {data?.officialReceiptNo && (
                <div className="bg-[#F0FDF4] dark:bg-[#052E16]/40 p-3 rounded-lg border border-[#BBF7D0] dark:border-[#166534]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803D] dark:text-[#4ADE80] block">
                        Treasury Official Receipt (OR)
                      </span>
                      <span className="font-mono font-bold text-sm text-[#15803D] dark:text-[#4ADE80]">
                        {data.officialReceiptNo}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#15803D] dark:text-[#4ADE80]">
                      ₱{data.amountPaid || 500} Settle Complete
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Uploaded Requirements */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} /> 5. Attached Documents
            </h4>
            <div className="space-y-1.5">
              {reqList.map((req) => {
                const docUrl = getDocUrl(req);
                const isAttached = Boolean(docUrl);
                return (
                  <div key={req.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs">
                    <span className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3] truncate pr-2">{req.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
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
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {data?.status === 'Active' && onViewECopy && (
            <button
              type="button"
              onClick={() => {
                handleClose();
                onViewECopy(data);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Award size={15} />
              <span>View E-Copy (Approved Certificate)</span>
            </button>
          )}

          <div className="flex items-center justify-end w-full sm:w-auto ml-auto">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[40px] rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
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
              <h4 className="font-bold text-sm text-[#1F1D1B] dark:text-white truncate">{docPreview.label}</h4>
              <div className="flex items-center gap-2">
                <a 
                  href={docPreview.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#9E2A2B] dark:hover:text-[#D4AF37] transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setDocPreview(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center py-4 bg-slate-50 dark:bg-black/30 rounded-lg mt-3">
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
