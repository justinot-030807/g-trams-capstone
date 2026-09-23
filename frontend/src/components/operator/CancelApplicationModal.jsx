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
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={() => !cancelModal.isSubmitting && setCancelModal(prev => ({ ...prev, isOpen: false }))} 
      />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Cancel Application</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500 font-medium">Unit: {cancelModal.unit?.plateNo || 'PENDING PLATE'}</p>
            </div>
          </div>
          <button 
            disabled={cancelModal.isSubmitting}
            onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))} 
            className="text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-2xl flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              Notice: Cancelling this application will set its status to <b>Cancelled</b>. The reason provided will be recorded in audit logs for LGU Admin review.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Reason for Cancellation:
            </label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    cancelModal.reason === r 
                      ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 text-slate-900 dark:text-white font-bold' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelModal.reason === r}
                    onChange={() => setCancelModal(prev => ({ ...prev, reason: r }))}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {cancelModal.reason === "Other reason (Please specify below)" && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Additional Reason Details:
              </label>
              <textarea
                rows={3}
                value={cancelModal.customReason}
                onChange={(e) => setCancelModal(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="Enter details on why you wish to cancel..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={cancelModal.isSubmitting}
            onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={cancelModal.isSubmitting || (cancelModal.reason === "Other reason (Please specify below)" && !cancelModal.customReason?.trim())}
            onClick={handleConfirmCancel}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
