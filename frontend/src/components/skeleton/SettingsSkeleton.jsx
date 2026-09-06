import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Settings Page Skeleton (Used in AdminSettings & OperatorSettings)
 */
export const SettingsSkeleton = ({ baseDelay = 40 }) => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Tab Pills Skeleton */}
      <div 
        className="stagger-reveal flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-fit"
        style={{ animationDelay: `${baseDelay}ms` }}
      >
        <SkeletonElement height="36px" className="w-36" rounded="rounded-xl" delay={baseDelay} />
        <SkeletonElement height="36px" className="w-36" rounded="rounded-xl" delay={baseDelay + 20} />
        <SkeletonElement height="36px" className="w-44 rounded-xl hidden sm:block" delay={baseDelay + 40} />
      </div>

      {/* Card 1: Primary Section */}
      <div 
        className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        style={{ animationDelay: `${baseDelay + 80}ms` }}
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <SkeletonElement rounded="rounded-xl" className="w-10 h-10 shrink-0" delay={baseDelay + 90} />
          <div className="space-y-2 flex-1">
            <SkeletonElement height="16px" className="w-48" delay={baseDelay + 100} />
            <SkeletonElement height="12px" className="w-72" delay={baseDelay + 110} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <SkeletonElement height="12px" className="w-32" delay={baseDelay + 120} />
            <SkeletonElement height="44px" className="w-full" rounded="rounded-xl" delay={baseDelay + 130} />
          </div>
          <div className="space-y-2">
            <SkeletonElement height="12px" className="w-32" delay={baseDelay + 140} />
            <SkeletonElement height="44px" className="w-full" rounded="rounded-xl" delay={baseDelay + 150} />
          </div>
          <div className="space-y-2">
            <SkeletonElement height="12px" className="w-32" delay={baseDelay + 160} />
            <SkeletonElement height="44px" className="w-full" rounded="rounded-xl" delay={baseDelay + 170} />
          </div>
        </div>
      </div>

      {/* Card 2: Secondary Section */}
      <div 
        className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        style={{ animationDelay: `${baseDelay + 180}ms` }}
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <SkeletonElement rounded="rounded-xl" className="w-10 h-10 shrink-0" delay={baseDelay + 190} />
          <div className="space-y-2 flex-1">
            <SkeletonElement height="16px" className="w-44" delay={baseDelay + 200} />
            <SkeletonElement height="12px" className="w-80" delay={baseDelay + 210} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonElement height="12px" className="w-24" delay={baseDelay + 220 + i * 20} />
              <SkeletonElement height="44px" className="w-full" rounded="rounded-xl" delay={baseDelay + 230 + i * 20} />
            </div>
          ))}
        </div>
      </div>

      {/* Card 3 & 4: Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          style={{ animationDelay: `${baseDelay + 300}ms` }}
        >
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <SkeletonElement rounded="rounded-xl" className="w-9 h-9 shrink-0" delay={baseDelay + 310} />
            <SkeletonElement height="16px" className="w-40" delay={baseDelay + 320} />
          </div>
          <div className="space-y-2.5">
            <SkeletonElement height="40px" className="w-full" rounded="rounded-xl" delay={baseDelay + 330} />
            <SkeletonElement height="40px" className="w-full" rounded="rounded-xl" delay={baseDelay + 340} />
            <SkeletonElement height="40px" className="w-full" rounded="rounded-xl" delay={baseDelay + 350} />
          </div>
        </div>

        <div 
          className="stagger-reveal bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
          style={{ animationDelay: `${baseDelay + 360}ms` }}
        >
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <SkeletonElement rounded="rounded-xl" className="w-9 h-9 shrink-0" delay={baseDelay + 370} />
            <SkeletonElement height="16px" className="w-36" delay={baseDelay + 380} />
          </div>
          <SkeletonElement height="16px" className="w-full" delay={baseDelay + 390} />
          <SkeletonElement height="16px" className="w-3/4" delay={baseDelay + 400} />
          <SkeletonElement height="64px" className="w-full" rounded="rounded-2xl mt-4" delay={baseDelay + 410} />
        </div>
      </div>
    </div>
  );
};

export default SettingsSkeleton;
