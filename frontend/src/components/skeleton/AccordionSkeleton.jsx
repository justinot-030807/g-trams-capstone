import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader matching accordion list items (e.g. ValidateTODA directory).
 */
export const AccordionListSkeleton = ({ count = 5, baseDelay = 40, stepDelay = 50 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => {
        const itemDelay = baseDelay + index * stepDelay;
        return (
          <div
            key={index}
            className="stagger-reveal bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4 transition-colors"
            style={{ animationDelay: `${itemDelay}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <SkeletonElement rounded="rounded-lg" className="w-9 h-9 shrink-0" delay={itemDelay} />
              <div className="space-y-1.5 min-w-0">
                <SkeletonElement height="14px" className="w-36 sm:w-52" rounded="rounded-md" delay={itemDelay + 15} />
                <SkeletonElement height="10px" className="w-24" rounded="rounded-xs" delay={itemDelay + 25} />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <SkeletonElement height="22px" className="w-20" rounded="rounded-full" delay={itemDelay + 30} />
              <SkeletonElement rounded="rounded-lg" className="w-8 h-8 shrink-0" delay={itemDelay + 40} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Skeleton loader for submission history cards (e.g. SubmitMembers sidebar).
 */
export const SubmissionCardsSkeleton = ({ count = 3, baseDelay = 40, stepDelay = 50 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => {
        const itemDelay = baseDelay + index * stepDelay;
        return (
          <div
            key={index}
            className="stagger-reveal p-3.5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 flex flex-col gap-2 transition-colors"
            style={{ animationDelay: `${itemDelay}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <SkeletonElement rounded="rounded-md" className="w-6 h-6 shrink-0" delay={itemDelay} />
                <SkeletonElement height="13px" className="w-28" rounded="rounded-xs" delay={itemDelay + 15} />
              </div>
              <SkeletonElement height="16px" className="w-16" rounded="rounded-xs" delay={itemDelay + 25} />
            </div>
            <SkeletonElement height="10px" className="w-32" rounded="rounded-xs" delay={itemDelay + 35} />
          </div>
        );
      })}
    </div>
  );
};

export default AccordionListSkeleton;
