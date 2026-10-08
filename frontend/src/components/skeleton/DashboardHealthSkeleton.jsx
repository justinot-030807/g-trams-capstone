import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader for Franchise Health Overview and Summary panel in AdminDashboard.
 */
export const DashboardHealthSkeleton = ({ baseDelay = 40 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Left: Franchise Health Overview */}
      <div className="lg:col-span-2 bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between space-y-5">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
            <div className="space-y-1">
              <SkeletonElement height="16px" className="w-44" rounded="rounded-xs" delay={baseDelay} />
              <SkeletonElement height="11px" className="w-64 max-w-full" rounded="rounded-xs" delay={baseDelay + 10} />
            </div>
            <SkeletonElement height="14px" className="w-20" rounded="rounded-xs" delay={baseDelay + 20} />
          </div>

          {/* Segmented Bar Placeholder */}
          <div className="mb-4">
            <SkeletonElement height="12px" className="w-full" rounded="rounded-sm" delay={baseDelay + 30} />
          </div>
        </div>

        {/* 4 Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((_, idx) => (
            <div
              key={idx}
              className="p-3 rounded border border-[#E4E1DC] dark:border-[#2E2A27] bg-[#F6F5F3]/50 dark:bg-[#14110F]/50 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <SkeletonElement rounded="rounded-full" className="w-2 h-2" delay={baseDelay + 40 + idx * 10} />
                <SkeletonElement height="10px" className="w-16" rounded="rounded-xs" delay={baseDelay + 45 + idx * 10} />
              </div>
              <SkeletonElement height="22px" className="w-20" rounded="rounded-xs" delay={baseDelay + 50 + idx * 10} />
              <SkeletonElement height="9px" className="w-24" rounded="rounded-xs" delay={baseDelay + 55 + idx * 10} />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Summary Snapshot */}
      <div className="bg-white dark:bg-[#1C1917] p-5 rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
          <SkeletonElement height="16px" className="w-24" rounded="rounded-xs" delay={baseDelay + 80} />
          <SkeletonElement height="12px" className="w-16" rounded="rounded-xs" delay={baseDelay + 90} />
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-around">
          {/* Compliance Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <SkeletonElement height="11px" className="w-28" rounded="rounded-xs" delay={baseDelay + 100} />
              <SkeletonElement height="14px" className="w-12" rounded="rounded-xs" delay={baseDelay + 110} />
            </div>
            <SkeletonElement height="6px" className="w-full" rounded="rounded-full" delay={baseDelay + 120} />
          </div>

          {/* New Applications Row */}
          <div className="flex items-center justify-between py-2 border-t border-[#E4E1DC]/70 dark:border-[#2E2A27]/70">
            <div className="space-y-1">
              <SkeletonElement height="12px" className="w-32" rounded="rounded-xs" delay={baseDelay + 130} />
              <SkeletonElement height="10px" className="w-24" rounded="rounded-xs" delay={baseDelay + 140} />
            </div>
            <SkeletonElement height="18px" className="w-10" rounded="rounded-xs" delay={baseDelay + 150} />
          </div>

          {/* Approval Queue Row */}
          <div className="flex items-center justify-between py-2 border-t border-[#E4E1DC]/70 dark:border-[#2E2A27]/70">
            <div className="space-y-1">
              <SkeletonElement height="12px" className="w-28" rounded="rounded-xs" delay={baseDelay + 160} />
              <SkeletonElement height="10px" className="w-32" rounded="rounded-xs" delay={baseDelay + 170} />
            </div>
            <SkeletonElement height="18px" className="w-10" rounded="rounded-xs" delay={baseDelay + 180} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHealthSkeleton;
