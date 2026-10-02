import React from 'react';
import { X, FileText, User, Receipt, ShieldCheck, FileCheck } from 'lucide-react';
import TricycleIcon from '../common/TricycleIcon';

const ApplicationSummaryModal = ({
  isSummaryModalOpen,
  setIsSummaryModalOpen,
  formData,
  loggedInToda,
  requirementsList,
  uploadedDocs,
  filePreviews
}) => {
  if (!isSummaryModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setIsSummaryModalOpen(false)}
    >
      <div 
        className="relative max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-h-[85vh] flex flex-col animate-spring-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 text-[#9E2A2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Application Summary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Complete application details before final submission</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsSummaryModalOpen(false)}
            className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* 1. Operator Information */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={13} /> 1. Operator Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.fullName || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Barangay Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.address || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Route Zone</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.zone ? `Zone ${formData.zone}` : '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">TODA Association</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.todaName || loggedInToda || '—'}</span>
              </div>
            </div>
          </div>

          {/* 2. Tricycle Details */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TricycleIcon size={14} className="text-[#9E2A2B] dark:text-[#D4AF37]" /> 2. Tricycle Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Make & Model</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.make || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Model Year</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.made || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Plate Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.plateNo || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Motor Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.motorNo || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Chassis Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.chassisNo || '—'}</span>
              </div>
            </div>
          </div>

          {/* 3. CTC / Cedula & Tax */}
          <div>
            <h4 className="text-xs font-bold text-[#9E2A2B] dark:text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Receipt size={13} /> 3. CTC / Cedula Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Cedula Serial No.</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formData.cedulaSerialNo || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Date Issued</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.cedulaDate || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Place Issued</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.cedulaAddress || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase font-bold">Date Applied</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formData.dateApplied || '—'}</span>
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  LTO OR / CR Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">OR / CR No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formData.orCrNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Expiration Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.orCrExpiryDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Driver & License Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  Driver &amp; License Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Driver Designation</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formData.isOperatorDriver ? 'Operator is Driver (Self)' : 'Designated Driver (Boundary)'}
                    </span>
                  </div>
                  {!formData.isOperatorDriver && (
                    <>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Driver Name</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formData.driverName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Driver Contact</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formData.driverContact || '—'}</span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">License No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formData.driverLicenseNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">License Expiry Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.driverLicenseExpiryDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* TODA Certificate Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  TODA Endorsement Certificate
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Certificate No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.todaCertNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Date Issued</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.todaCertDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Signatory</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.todaSignatory || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Barangay Clearance Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9E2A2B] dark:text-[#D4AF37] block">
                  Barangay Clearance
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Clearance No.</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.brgyClearanceNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Date Issued</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.brgyClearanceDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Issuing Official</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{formData.brgyIssuer || '—'}</span>
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
              {requirementsList.map((req) => {
                const isAttached = !!(uploadedDocs[req.id] || filePreviews[req.id]);
                return (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{req.label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      isAttached ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
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
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setIsSummaryModalOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSummaryModal;
