import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader for ApplyFranchise and RenewFranchise forms.
 * Replaces full-screen spinners with an authentic preview of the form stepper:
 * - Hero banner & Gasan municipal branding
 * - 3-Step Wizard tracker (Operator, Vehicle, Documents)
 * - Quota Tracker badge
 * - Form card with input placeholders and upload dropzones
 */
export const ApplyFranchiseSkeleton = ({ isRenewal = false, baseDelay = 30 }) => {
  return (
    <div className="w-full min-h-screen bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col transition-colors">
      {/* Top Hero Banner */}
      <div className="w-full bg-[#9E2A2B] text-white pt-4 pb-6 px-4 sm:px-6 relative overflow-hidden border-b border-[#7A1B22] shadow-xs">
        <div className="max-w-2xl mx-auto relative z-10 space-y-3">
          {/* Back button placeholder */}
          <div className="flex items-center justify-between">
            <SkeletonElement height="36px" className="w-20 bg-white/20" rounded="rounded-lg" delay={baseDelay} />
            <SkeletonElement height="24px" className="w-24 bg-white/20" rounded="rounded-full" delay={baseDelay + 10} />
          </div>

          {/* Form Title & Subtitle */}
          <div className="text-center pt-1 pb-2 flex flex-col items-center space-y-1.5">
            <SkeletonElement height="24px" className="w-56 sm:w-72 bg-white/30" rounded="rounded-md" delay={baseDelay + 20} />
            <SkeletonElement height="14px" className="w-44 sm:w-56 bg-white/20" rounded="rounded-xs" delay={baseDelay + 30} />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-16 flex-1 flex flex-col space-y-5">
        
        {/* Step Wizard Indicator (for New Application) */}
        {!isRenewal && (
          <div className="bg-white dark:bg-[#1C1917] p-3.5 sm:p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center justify-between gap-2">
            {[1, 2, 3].map((step, idx) => (
              <div key={step} className="flex-1 flex items-center gap-2">
                <SkeletonElement rounded="rounded-full" className="w-7 h-7 shrink-0" delay={baseDelay + 40 + idx * 15} />
                <div className="hidden sm:block space-y-1 flex-1">
                  <SkeletonElement height="11px" className="w-16" rounded="rounded-xs" delay={baseDelay + 45 + idx * 15} />
                  <SkeletonElement height="9px" className="w-20" rounded="rounded-xs" delay={baseDelay + 50 + idx * 15} />
                </div>
                {idx < 2 && <div className="h-0.5 flex-1 bg-[#E4E1DC] dark:bg-[#2E2A27] mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* Quota / Transport Pass Card */}
        <div className="bg-white dark:bg-[#1C1917] p-4 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SkeletonElement rounded="rounded-lg" className="w-10 h-10 shrink-0" delay={baseDelay + 90} />
            <div className="space-y-1.5">
              <SkeletonElement height="13px" className="w-36" rounded="rounded-xs" delay={baseDelay + 95} />
              <SkeletonElement height="10px" className="w-48" rounded="rounded-xs" delay={baseDelay + 100} />
            </div>
          </div>
          <SkeletonElement height="24px" className="w-28" rounded="rounded-full" delay={baseDelay + 105} />
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-5">
          {/* Section Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
            <SkeletonElement rounded="rounded-md" className="w-6 h-6 shrink-0" delay={baseDelay + 110} />
            <SkeletonElement height="16px" className="w-44" rounded="rounded-md" delay={baseDelay + 115} />
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <SkeletonElement height="11px" className="w-24" rounded="rounded-xs" delay={baseDelay + 120} />
              <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 125} />
            </div>
            <div className="space-y-1.5">
              <SkeletonElement height="11px" className="w-28" rounded="rounded-xs" delay={baseDelay + 130} />
              <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 135} />
            </div>
            <div className="space-y-1.5">
              <SkeletonElement height="11px" className="w-20" rounded="rounded-xs" delay={baseDelay + 140} />
              <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 145} />
            </div>
            <div className="space-y-1.5">
              <SkeletonElement height="11px" className="w-32" rounded="rounded-xs" delay={baseDelay + 150} />
              <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 155} />
            </div>
          </div>

          {/* Document Upload Slot Placeholder */}
          <div className="p-4 rounded-lg border border-dashed border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 flex flex-col items-center justify-center space-y-2 py-8">
            <SkeletonElement rounded="rounded-lg" className="w-10 h-10" delay={baseDelay + 160} />
            <SkeletonElement height="13px" className="w-44" rounded="rounded-xs" delay={baseDelay + 165} />
            <SkeletonElement height="10px" className="w-56" rounded="rounded-xs" delay={baseDelay + 170} />
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-[#E4E1DC] dark:border-[#2E2A27] flex items-center justify-between gap-3">
            <SkeletonElement height="42px" className="w-24" rounded="rounded-lg" delay={baseDelay + 175} />
            <SkeletonElement height="42px" className="w-32" rounded="rounded-lg" delay={baseDelay + 180} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyFranchiseSkeleton;
