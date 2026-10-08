import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Settings Page Skeleton (Used in AdminSettings, CashierSettings & OperatorSettings)
 */
export const SettingsSkeleton = ({ baseDelay = 40 }) => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Tab Pills Skeleton */}
      <div 
        className="stagger-reveal flex items-center gap-2 p-1 bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg w-full sm:w-fit"
        style={{ animationDelay: `${baseDelay}ms` }}
      >
        <SkeletonElement height="34px" className="w-32" rounded="rounded-md" delay={baseDelay} />
        <SkeletonElement height="34px" className="w-32" rounded="rounded-md" delay={baseDelay + 20} />
        <SkeletonElement height="34px" className="w-36 rounded-md hidden sm:block" delay={baseDelay + 40} />
      </div>

      {/* Card 1: Primary Section */}
      <div 
        className="stagger-reveal bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-5 transition-colors"
        style={{ animationDelay: `${baseDelay + 60}ms` }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <SkeletonElement rounded="rounded-lg" className="w-9 h-9 shrink-0" delay={baseDelay + 70} />
          <div className="space-y-1.5 flex-1">
            <SkeletonElement height="15px" className="w-44" delay={baseDelay + 80} />
            <SkeletonElement height="11px" className="w-64 max-w-full" delay={baseDelay + 90} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <SkeletonElement height="11px" className="w-28" delay={baseDelay + 100} />
            <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 110} />
          </div>
          <div className="space-y-1.5">
            <SkeletonElement height="11px" className="w-28" delay={baseDelay + 120} />
            <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 130} />
          </div>
          <div className="space-y-1.5">
            <SkeletonElement height="11px" className="w-28" delay={baseDelay + 140} />
            <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 150} />
          </div>
        </div>
      </div>

      {/* Card 2: Secondary Section */}
      <div 
        className="stagger-reveal bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-5 transition-colors"
        style={{ animationDelay: `${baseDelay + 160}ms` }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <SkeletonElement rounded="rounded-lg" className="w-9 h-9 shrink-0" delay={baseDelay + 170} />
          <div className="space-y-1.5 flex-1">
            <SkeletonElement height="15px" className="w-40" delay={baseDelay + 180} />
            <SkeletonElement height="11px" className="w-72 max-w-full" delay={baseDelay + 190} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonElement height="11px" className="w-24" delay={baseDelay + 200 + i * 15} />
              <SkeletonElement height="40px" className="w-full" rounded="rounded-lg" delay={baseDelay + 210 + i * 15} />
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Action & Footer Card */}
      <div 
        className="stagger-reveal bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs space-y-4 transition-colors"
        style={{ animationDelay: `${baseDelay + 270}ms` }}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <SkeletonElement rounded="rounded-lg" className="w-9 h-9 shrink-0" delay={baseDelay + 280} />
          <SkeletonElement height="15px" className="w-36" delay={baseDelay + 290} />
        </div>
        <div className="space-y-2">
          <SkeletonElement height="12px" className="w-full" delay={baseDelay + 300} />
          <SkeletonElement height="12px" className="w-3/4" delay={baseDelay + 310} />
        </div>
        <div className="pt-2 flex justify-end">
          <SkeletonElement height="40px" className="w-32" rounded="rounded-lg" delay={baseDelay + 320} />
        </div>
      </div>
    </div>
  );
};

export default SettingsSkeleton;
