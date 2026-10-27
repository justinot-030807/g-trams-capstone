import React, { useState, useRef } from 'react';
import { 
  X, AlertTriangle, UploadCloud, FileText, Image as ImageIcon, 
  Trash2, Loader2, CheckCircle, ShieldAlert, ArrowRight, HelpCircle
} from 'lucide-react';
import TricycleIcon from '../common/TricycleIcon';

const CANCELLATION_REASONS = [
  { value: "Relocation / TODA Transfer", label: "Relocation / TODA Transfer (Paglipat ng TODA o Lugar)" },
  { value: "Unit Sale / Transfer of Ownership", label: "Unit Sale / Transfer of Ownership (Pagbenta o Paglipat ng Tricycle)" },
  { value: "Voluntary Cessation / Personal Reasons", label: "Voluntary Cessation / Personal Reasons (Kusang Pagtigil sa Pamamasada)" },
  { value: "Vehicle Damage / Total Loss", label: "Vehicle Damage / Total Loss (Nasira o Hindi na Magamit ang Unit)" },
  { value: "Other", label: "Other Reasons (Iba pang Dahilan)" }
];

const RequestCancellationModal = ({ isOpen, onClose, unit, onSuccess }) => {
  const [reason, setReason] = useState(CANCELLATION_REASONS[0].value);
  const [customReason, setCustomReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen || !unit) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a smaller image or PDF.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMessage('Invalid file type. Please upload a JPG, PNG, WebP image or PDF document.');
      return;
    }

    setErrorMessage('');
    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reason) {
      setErrorMessage('Please select a reason for cancellation.');
      return;
    }

    if (reason === 'Other' && !customReason.trim()) {
      setErrorMessage('Please specify your reason for cancellation.');
      return;
    }

    if (!file) {
      setErrorMessage('Please attach a photo or scan of your signed cancellation letter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('reason', reason);
      formData.append('customReason', customReason.trim());
      formData.append('remarks', remarks.trim());
      formData.append('cancellationLetter', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/franchises/${unit._id}/request-cancellation`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit cancellation request.');
      }

      if (onSuccess) {
        onSuccess(data.franchise || data);
      }
      onClose();
    } catch (err) {
      console.error('Cancellation submission error:', err);
      setErrorMessage(err.message || 'Cannot connect to server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" 
        onClick={() => !isSubmitting && onClose()} 
      />

      {/* Modal Dialog */}
      <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-xl rounded-lg shadow-xl relative z-10 p-5 sm:p-6 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] dark:bg-[#450A0A] border border-[#FECACA] dark:border-[#991B1B] text-[#B91C1C] dark:text-[#EF4444] flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#1F1D1B] dark:text-[#F6F5F3] leading-snug">
                Voluntary Franchise Cancellation
              </h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium flex items-center gap-1.5 mt-0.5">
                <TricycleIcon size={13} />
                <span>Plate: <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{unit.plateNo}</strong></span>
                <span>•</span>
                <span>TODA: <strong className="text-[#1F1D1B] dark:text-[#F6F5F3]">{unit.todaName || 'N/A'}</strong></span>
              </p>
            </div>
          </div>

          <button 
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Advisory Warning */}
        <div className="mt-4 bg-[#FEF2F2]/60 dark:bg-[#450A0A]/30 border border-[#FECACA] dark:border-[#991B1B]/60 p-3.5 rounded-lg flex items-start gap-2.5">
          <AlertTriangle size={17} className="text-[#B91C1C] dark:text-[#EF4444] shrink-0 mt-0.5" />
          <div className="text-xs text-[#991B1B] dark:text-[#FCA5A5] leading-relaxed">
            <p className="font-bold uppercase tracking-wider text-[11px] mb-0.5">Formal Surrender Notice</p>
            <p>
              Submitting this request will set your franchise to <strong>Cancellation Requested</strong>. 
              The BPLO Licensing Office will review your surrender letter and finalize cancellation. 
              <strong> No Cashier payment is required</strong> for voluntary franchise cancellation.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Reason for Cancellation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37] transition-all cursor-pointer"
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason if 'Other' */}
          {reason === 'Other' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                Specific Reason Details <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Pakisulat ang partikular na dahilan ng pagkakansela..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B]"
              />
            </div>
          )}

          {/* Remarks Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1D1B] dark:text-[#F6F5F3] mb-1.5">
              Remarks / Additional Context
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Magbigay ng karagdagang impormasyon (hal. Pangalan ng bagong may-ari kung nabenta, bagong ruta o TODA, o petsa ng paghinto)..."
              className="w-full text-xs p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] outline-none focus:border-[#9E2A2B] transition-all"
            />
          </div>

          {/* Formal Cancellation Letter Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F1D1B] dark:text-[#F6F5F3]">
                Formal Cancellation Letter / Handwritten Letter <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-[#6B6761] dark:text-[#A8A29E] font-medium">
                JPG, PNG, PDF up to 10MB
              </span>
            </div>

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B] dark:hover:border-[#D4AF37] rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 group"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-center text-[#9E2A2B] dark:text-[#D4AF37] group-hover:scale-110 transition-transform shadow-2xs">
                  <UploadCloud size={20} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3]">
                    Click to upload signed letter photo or PDF
                  </p>
                  <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] mt-0.5">
                    Formal notarized affidavit o sulat-kamay na nilagdaan ng operator
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-3 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {filePreview ? (
                    <img 
                      src={filePreview} 
                      alt="Cancellation Letter" 
                      className="w-12 h-12 rounded object-cover border border-[#E4E1DC] dark:border-[#2E2A27] shrink-0" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                      <FileText size={22} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-[#6B6761] dark:text-[#A8A29E]">
                      {(file.size / 1024).toFixed(1)} KB • Ready for upload
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 mt-6 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-white bg-[#B91C1C] hover:bg-[#991B1B] transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={15} />
                  <span>Submit Cancellation Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestCancellationModal;
