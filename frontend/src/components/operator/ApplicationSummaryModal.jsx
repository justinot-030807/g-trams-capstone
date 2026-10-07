import React, { useEffect } from 'react';
import { X, FileText, User, Receipt, ShieldCheck, FileCheck } from 'lucide-react';
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
  filePreviews = {}
}) => {
  const visible = isOpen !== undefined ? Boolean(isOpen) : Boolean(isSummaryModalOpen);

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsSummaryModalOpen) setIsSummaryModalOpen(false);
  };

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  if (!visible) return null;

  const data = (formData && Object.keys(formData).length > 0) ? formData : (application || {});
  const reqList = (Array.isArray(requirementsList) && requirementsList.length > 0)
    ? requirementsList
    : DEFAULT_MODAL_REQUIREMENTS;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative max-w-xl w-full bg-white dark:bg-[#1C1917] rounded-xl overflow-hidden shadow-2xl border border-[#E4E1DC] dark:border-[#2E2A27] p-5 sm:p-6 max-h-[88vh] flex flex-col animate-spring-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              <FileText size={19} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F1D1B] dark:text-[#F6F5F3]">Application Summary</h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E]">Complete application details before final submission</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 text-[#1F1D1B] dark:text-[#EAE7E1]">
          {/* 1. Operator Information */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={13} /> 1. Operator Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Full Name</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.fullName || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Barangay Address</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.address || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Route Zone</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.zone ? formatZoneLabel(data.zone) : '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">TODA Association</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.todaName || loggedInToda || '—'}</span>
              </div>
            </div>
          </div>

          {/* 2. Tricycle Details */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TricycleIcon size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> 2. Tricycle Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Make & Model</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.make || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Model Year</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.made || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Plate Number</span>
                <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.plateNo || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Motor Number</span>
                <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.motorNo || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] sm:col-span-2">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Chassis Number</span>
                <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.chassisNo || '—'}</span>
              </div>
            </div>
          </div>

          {/* 3. CTC / Cedula & Tax */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Receipt size={13} /> 3. CTC / Cedula Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Cedula Serial No.</span>
                <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.cedulaSerialNo || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Date Issued</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.cedulaDate || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Place Issued</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.cedulaAddress || '—'}</span>
              </div>
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27]">
                <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Date Applied</span>
                <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.dateApplied || '—'}</span>
              </div>
            </div>
          </div>

          {/* 4. Document Metadata */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCheck size={13} /> 4. Document Metadata &amp; Validity
            </h4>
            
            <div className="space-y-2.5">
              {/* OR/CR Box */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  LTO OR / CR Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">OR / CR No.</span>
                    <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.orCrNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Expiration Date</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.orCrExpiryDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Driver & License Box */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  Driver &amp; License Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Driver Designation</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">
                      {data?.isOperatorDriver ? 'Operator is Driver (Self)' : 'Designated Driver (Boundary)'}
                    </span>
                  </div>
                  {!data?.isOperatorDriver && (
                    <>
                      <div>
                        <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Driver Name</span>
                        <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Driver Contact</span>
                        <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverContact || '—'}</span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">License No.</span>
                    <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverLicenseNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">License Expiry Date</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.driverLicenseExpiryDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* TODA Certificate Box */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  TODA Endorsement Certificate
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Certificate No.</span>
                    <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.todaCertNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Date Issued</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.todaCertDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Signatory</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.todaSignatory || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Barangay Clearance Box */}
              <div className="bg-[#F6F5F3] dark:bg-[#14110F] p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  Barangay Clearance
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Clearance No.</span>
                    <span className="font-mono font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.brgyClearanceNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Date Issued</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3]">{data?.brgyClearanceDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6761] dark:text-[#A8A29E] block text-[10px] uppercase font-bold">Issuing Official</span>
                    <span className="font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate block">{data?.brgyIssuer || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Uploaded Requirements */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} /> 5. Attached Documents
            </h4>
            <div className="space-y-1.5">
              {reqList.map((req) => {
                const isAttached = !!(
                  (uploadedDocs && (uploadedDocs[req.id] || (req.fieldUrl && uploadedDocs[req.fieldUrl]))) ||
                  (filePreviews && (filePreviews[req.id] || (req.fieldUrl && filePreviews[req.fieldUrl]))) ||
                  (data && (data[req.id] || (req.fieldUrl && data[req.fieldUrl])))
                );
                return (
                  <div key={req.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs">
                    <span className="font-medium text-[#1F1D1B] dark:text-[#F6F5F3] truncate">{req.label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      isAttached ? 'bg-[#F0FDF4] dark:bg-[#052E16]/40 text-[#15803D] dark:text-[#4ADE80] border border-[#BBF7D0] dark:border-[#166534]' : 'bg-[#FEF3C7] dark:bg-[#78350F]/40 text-[#B45309] dark:text-[#FDE68A] border border-[#F59E0B]/30'
                    }`}>
                      {isAttached ? '✓ Attached' : 'Missing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 min-h-[44px] rounded-lg bg-[#9E2A2B] hover:bg-[#7A1B22] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSummaryModal;
