import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './AlertDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Dialog';

const ConfirmContext = createContext(null);

/**
 * Provides theme-consistent Radix Confirm & Prompt dialogs across the application,
 * replacing blocking native window.confirm() and window.prompt() calls.
 */
export function ConfirmProvider({ children }) {
  const resolverRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    mode: 'confirm', // 'confirm' | 'prompt'
    title: 'Confirm Action',
    description: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default', // 'default' | 'danger'
    placeholder: '',
    inputValue: '',
  });

  const closeWithResult = useCallback((result) => {
    setDialogState((prev) => ({ ...prev, open: false }));
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(result);
  }, []);

  const confirm = useCallback((options) => {
    const normalized = typeof options === 'string'
      ? { description: options }
      : (options || {});

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        mode: 'confirm',
        title: normalized.title || 'Confirm Action',
        description: normalized.description || '',
        confirmLabel: normalized.confirmLabel || 'Confirm',
        cancelLabel: normalized.cancelLabel || 'Cancel',
        variant: normalized.variant || 'default',
        placeholder: '',
        inputValue: '',
      });
    });
  }, []);

  const prompt = useCallback((options) => {
    const normalized = typeof options === 'string'
      ? { description: options }
      : (options || {});

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        mode: 'prompt',
        title: normalized.title || 'Enter Details',
        description: normalized.description || '',
        confirmLabel: normalized.confirmLabel || 'Submit',
        cancelLabel: normalized.cancelLabel || 'Cancel',
        variant: normalized.variant || 'default',
        placeholder: normalized.placeholder || '',
        inputValue: normalized.defaultValue ?? '',
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}

      {dialogState.mode === 'confirm' && (
        <AlertDialog
          open={dialogState.open}
          onOpenChange={(open) => {
            if (!open && dialogState.open) closeWithResult(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    dialogState.variant === 'danger'
                      ? 'bg-[#FEF2F2] dark:bg-[#450A0A] border-[#FECACA] dark:border-[#991B1B] text-[#B91C1C] dark:text-[#F87171]'
                      : 'bg-[#FDF2F4] dark:bg-[#2E1A1B] border-[#F8C5CA] dark:border-[#5C2427] text-[#9E2A2B] dark:text-[#F5E6B3]'
                  }`}
                >
                  {dialogState.variant === 'danger' ? <AlertTriangle size={18} /> : <HelpCircle size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
                  {dialogState.description && (
                    <AlertDialogDescription className="mt-1.5">
                      {dialogState.description}
                    </AlertDialogDescription>
                  )}
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => closeWithResult(false)}>
                {dialogState.cancelLabel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => closeWithResult(true)}
                className={
                  dialogState.variant === 'danger'
                    ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
                    : 'bg-[#9E2A2B] hover:bg-[#7A1B22]'
                }
              >
                {dialogState.confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {dialogState.mode === 'prompt' && (
        <Dialog
          open={dialogState.open}
          onOpenChange={(open) => {
            if (!open && dialogState.open) closeWithResult(null);
          }}
        >
          <DialogContent showClose={false}>
            <DialogHeader>
              <DialogTitle>{dialogState.title}</DialogTitle>
              {dialogState.description && (
                <DialogDescription>{dialogState.description}</DialogDescription>
              )}
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                closeWithResult(dialogState.inputValue);
              }}
              className="mt-3 space-y-4"
            >
              <textarea
                rows={3}
                autoFocus
                value={dialogState.inputValue}
                onChange={(e) => setDialogState((prev) => ({ ...prev, inputValue: e.target.value }))}
                placeholder={dialogState.placeholder}
                className="w-full rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3] dark:bg-[#14110F] px-3.5 py-2.5 text-sm text-[#1F1D1B] dark:text-[#F6F5F3] focus:outline-none focus:border-[#9E2A2B] dark:focus:border-[#D4AF37]"
              />
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => closeWithResult(null)}
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold border border-[#E4E1DC] dark:border-[#2E2A27] bg-white dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#F6F5F3] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] cursor-pointer"
                >
                  {dialogState.cancelLabel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-bold text-white bg-[#9E2A2B] hover:bg-[#7A1B22] cursor-pointer"
                >
                  {dialogState.confirmLabel}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * Returns `{ confirm, prompt }` async dialog helpers backed by Radix UI modals.
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside a ConfirmProvider');
  }
  return ctx;
}
