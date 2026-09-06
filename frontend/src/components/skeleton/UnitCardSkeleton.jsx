import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader matching Operator tricycle garage cards.
 */
export const UnitCardSkeleton = ({ delay = 60 }) => {
  return (
    <div
      className="stagger-reveal bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top status bar placeholder */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-800" />

      {/* Card Header: Plate & Status */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <SkeletonElement rounded="rounded-2xl" className="w-12 h-12 shrink-0" delay={delay} />
            <div className="space-y-1.5">
              <SkeletonElement height="18px" className="w-32" rounded="rounded-lg" delay={delay + 15} />
              <SkeletonElement height="12px" className="w-24" rounded="rounded-md" delay={delay + 25} />
            </div>
          </div>
          <SkeletonElement height="26px" className="w-24" rounded="rounded-full" delay={delay + 20} />
        </div>

        {/* 4-Step Progress Tracker Skeleton */}
        <div className="mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-700" />
            {[1, 2, 3, 4].map((step, idx) => (
              <div key={step} className="flex flex-col items-center relative z-10">
                <SkeletonElement
                  rounded="rounded-full"
                  className="w-7 h-7 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"
                  delay={delay + 30 + idx * 15}
                />
                <SkeletonElement
                  height="8px"
                  className="w-12 mt-2"
                  rounded="rounded-sm"
                  delay={delay + 35 + idx * 15}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Specs Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/60 mb-6">
          {[1, 2, 3, 4].map((item, idx) => (
            <div key={item} className="space-y-1">
              <SkeletonElement height="10px" className="w-16" rounded="rounded-sm" delay={delay + 60 + idx * 10} />
              <SkeletonElement height="14px" className="w-24" rounded="rounded-md" delay={delay + 70 + idx * 10} />
            </div>
          ))}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <SkeletonElement height="36px" className="w-28" rounded="rounded-xl" delay={delay + 100} />
        <div className="flex gap-2">
          <SkeletonElement height="36px" className="w-24" rounded="rounded-xl" delay={delay + 110} />
          <SkeletonElement height="36px" className="w-28" rounded="rounded-xl" delay={delay + 120} />
        </div>
      </div>
    </div>
  );
};

export const GarageGridSkeleton = ({ count = 2, baseDelay = 60 }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <UnitCardSkeleton key={i} delay={baseDelay + i * 90} />
      ))}
    </div>
  );
};

export default UnitCardSkeleton;
