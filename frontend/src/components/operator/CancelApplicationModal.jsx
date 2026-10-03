import React from 'react';
import { XCircle, X, AlertCircle, Loader2 } from 'lucide-react';
import { CANCEL_REASONS } from '../../utils/constants';

const CancelApplicationModal = ({ 
  cancelModal, 
  setCancelModal, 
  handleConfirmCancel 
}) => {
  if (!cancelModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200" 
        onClick={() => !cancelModal.isSubmitting && setCancelModal(prev => ({ ...prev, isOpen: false }))} 
      />
      <div className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] w-full max-w-lg rounded-lg shadow-xl relative z-10 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <div className="flex items-center gap-2.5 text-[#B91C1C] dark:text-[#EF4444]">
            <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] dark:bg-[#7F1D1D]/60 flex items-center justify-center shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F1D1B] dark:text-[#F6F5F3]">Cancel Application</h3>
              <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-medium">Unit: {cancelModal.unit?.plateNo || 'PENDING PLATE'}</p>
            </div>
          </div>
          <button 
            disabled={cancelModal.isSubmitting}
            onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))} 
            className="text-[#6B6761] dark:text-[#A8A29E] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#FEF3C7]/50 dark:bg-[#78350F]/20 border border-[#F59E0B]/30 p-3.5 rounded-lg flex items-start gap-2.5">
            <AlertCircle size={16} className="text-[#B45309] dark:text-[#F59E0B] shrink-0 mt-0.5" />
            <p className="text-xs text-[#92400E] dark:text-[#FDE68A] leading-relaxed font-medium">
              Notice: Cancelling this application will set its status to <b>Cancelled</b>. The reason provided will be recorded in audit logs for LGU Admin review.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-2">
              Select Reason for Cancellation:
            </label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    cancelModal.reason === r 
                      ? 'border-[#B91C1C] bg-[#FEE2E2]/30 dark:bg-[#7F1D1D]/20 text-[#1F1D1B] dark:text-[#F6F5F3] font-bold' 
                      : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3]'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelModal.reason === r}
                    onChange={() => setCancelModal(prev => ({ ...prev, reason: r }))}
                    className="mt-0.5 text-[#B91C1C] focus:ring-[#B91C1C]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {cancelModal.reason === "Other reason (Please specify below)" && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-[#1F1D1B] dark:text-[#F6F5F3] mb-1">
                Additional Reason Details:
              </label>
              <textarea
                rows={3}
                value={cancelModal.customReason}
                onChange={(e) => setCancelModal(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="Enter details on why you wish to cancel..."
                className="w-full text-xs p-3 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] focus:outline-none focus:ring-1 focus:ring-[#9E2A2B]"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
          <button
            type="button"
            disabled={cancelModal.isSubmitting}
            onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
            className="px-4 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-[#1F1D1B] dark:text-[#F6F5F3] bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#EAE7E1] dark:hover:bg-[#2E2A27] transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={cancelModal.isSubmitting || (cancelModal.reason === "Other reason (Please specify below)" && !cancelModal.customReason?.trim())}
            onClick={handleConfirmCancel}
            className="flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-lg font-bold text-xs text-white bg-[#B91C1C] hover:bg-[#991B1B] transition-colors shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelModal.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            {cancelModal.isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelApplicationModal;
