import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader matching accordion list items (e.g. TODA Directory).
 */
export const AccordionListSkeleton = ({ count = 5, baseDelay = 50, stepDelay = 60 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => {
        const itemDelay = baseDelay + index * stepDelay;
        return (
          <div
            key={index}
            className="stagger-reveal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4"
            style={{ animationDelay: `${itemDelay}ms` }}
          >
            <div className="flex items-center gap-3">
              <SkeletonElement rounded="rounded-xl" className="w-10 h-10 shrink-0" delay={itemDelay} />
              <div className="space-y-1.5">
                <SkeletonElement height="16px" className="w-40 sm:w-56" rounded="rounded-md" delay={itemDelay + 15} />
                <SkeletonElement height="11px" className="w-24" rounded="rounded-sm" delay={itemDelay + 25} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SkeletonElement height="24px" className="w-20" rounded="rounded-full" delay={itemDelay + 30} />
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
export const SubmissionCardsSkeleton = ({ count = 3, baseDelay = 50, stepDelay = 60 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => {
        const itemDelay = baseDelay + index * stepDelay;
        return (
          <div
            key={index}
            className="stagger-reveal p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 flex flex-col gap-2"
            style={{ animationDelay: `${itemDelay}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <SkeletonElement rounded="rounded-lg" className="w-6 h-6 shrink-0" delay={itemDelay} />
                <SkeletonElement height="14px" className="w-28" rounded="rounded-md" delay={itemDelay + 15} />
              </div>
              <SkeletonElement height="18px" className="w-16" rounded="rounded-md" delay={itemDelay + 25} />
            </div>
            <SkeletonElement height="10px" className="w-32" rounded="rounded-sm" delay={itemDelay + 35} />
          </div>
        );
      })}
    </div>
  );
};

export default AccordionListSkeleton;
