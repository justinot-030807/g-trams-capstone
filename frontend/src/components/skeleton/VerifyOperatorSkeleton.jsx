import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Public operator QR verification skeleton loader.
 * Matches VerifyOperator card layout.
 */
export const VerifyOperatorSkeleton = ({ baseDelay = 30 }) => {
  return (
    <div className="min-h-[100dvh] bg-[#F6F5F3] dark:bg-[#14110F] flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C1917] p-6 sm:p-8 rounded-lg shadow-md max-w-sm w-full text-center border border-[#E4E1DC] dark:border-[#2E2A27] space-y-4">
        {/* Verification Icon Box */}
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center">
          <SkeletonElement rounded="rounded-full" className="w-16 h-16" delay={baseDelay} />
        </div>

        {/* Verification Title */}
        <div className="space-y-1.5 flex flex-col items-center">
          <SkeletonElement height="20px" className="w-48" rounded="rounded-md" delay={baseDelay + 15} />
          <SkeletonElement height="12px" className="w-32" rounded="rounded-xs" delay={baseDelay + 25} />
        </div>

        {/* Operator Profile Block */}
        <div className="p-4 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] space-y-2.5 text-left">
          <div className="flex items-center gap-3">
            <SkeletonElement rounded="rounded-full" className="w-10 h-10 shrink-0" delay={baseDelay + 35} />
            <div className="space-y-1 flex-1 min-w-0">
              <SkeletonElement height="14px" className="w-36" rounded="rounded-md" delay={baseDelay + 40} />
              <SkeletonElement height="10px" className="w-24" rounded="rounded-xs" delay={baseDelay + 45} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
            <div className="space-y-1">
              <SkeletonElement height="9px" className="w-14" rounded="rounded-xs" delay={baseDelay + 50} />
              <SkeletonElement height="12px" className="w-20" rounded="rounded-xs" delay={baseDelay + 55} />
            </div>
            <div className="space-y-1">
              <SkeletonElement height="9px" className="w-14" rounded="rounded-xs" delay={baseDelay + 60} />
              <SkeletonElement height="12px" className="w-20" rounded="rounded-xs" delay={baseDelay + 65} />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center pt-1">
          <SkeletonElement height="26px" className="w-32" rounded="rounded-full" delay={baseDelay + 70} />
        </div>
      </div>
    </div>
  );
};

export default VerifyOperatorSkeleton;
