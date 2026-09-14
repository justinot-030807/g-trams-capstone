import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Skeleton loader exactly matching the Operator Dashboard Tricycle Garage Cards.
 * Mirrors:
 * 1. Top accent strip
 * 2. Header row: TODA badge (left) & Status badge (right)
 * 3. Modern MTOP Plate box (Gasan MTOP header, plate number, make/model)
 * 4. Minimalist 2x2 Specs Grid (Route Zone & Motor Number with icon tiles)
 * 5. Application 4-Step Tracker / Expiration Meter
 * 6. Action buttons footer (View Details & Action button)
 */
export const UnitCardSkeleton = ({ delay = 60 }) => {
  return (
    <div
      className="stagger-reveal bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top Accent Strip Placeholder */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-200/80 dark:bg-slate-800" />

      <div>
        {/* 1. Header Row: TODA badge (left) & Status badge (right) */}
        <div className="flex justify-between items-center mb-3 mt-0.5 gap-2">
          <SkeletonElement
            height="24px"
            className="w-24 sm:w-28"
            rounded="rounded-xl"
            delay={delay}
          />
          <SkeletonElement
            height="24px"
            className="w-20 sm:w-24"
            rounded="rounded-xl"
            delay={delay + 15}
          />
        </div>

        {/* 2. Modern Government MTOP Plate Box */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/70 dark:to-slate-800/30 border border-slate-200/90 dark:border-slate-700/80 mb-3.5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <SkeletonElement
              height="10px"
              className="w-36 mb-2"
              rounded="rounded-sm"
              delay={delay + 25}
            />
            <SkeletonElement
              height="24px"
              className="w-28 sm:w-32"
              rounded="rounded-lg"
              delay={delay + 35}
            />
          </div>

          <div className="text-right shrink-0">
            <SkeletonElement
              height="20px"
              className="w-16 ml-auto"
              rounded="rounded-lg"
              delay={delay + 30}
            />
            <SkeletonElement
              height="10px"
              className="w-12 mt-1.5 ml-auto"
              rounded="rounded-sm"
              delay={delay + 40}
            />
          </div>
        </div>

        {/* 3. Minimalist 2x2 Specs Grid (Route Zone & Motor Number) */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {/* Route Zone */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <SkeletonElement
              rounded="rounded-lg"
              className="w-6 h-6 shrink-0"
              delay={delay + 45}
            />
            <div className="min-w-0 flex-1">
              <SkeletonElement height="9px" className="w-14" rounded="rounded-sm" delay={delay + 50} />
              <SkeletonElement height="12px" className="w-16 mt-1" rounded="rounded-md" delay={delay + 55} />
            </div>
          </div>

          {/* Motor Number */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <SkeletonElement
              rounded="rounded-lg"
              className="w-6 h-6 shrink-0"
              delay={delay + 50}
            />
            <div className="min-w-0 flex-1">
              <SkeletonElement height="9px" className="w-16" rounded="rounded-sm" delay={delay + 55} />
              <SkeletonElement height="12px" className="w-20 mt-1" rounded="rounded-md" delay={delay + 60} />
            </div>
          </div>
        </div>

        {/* 4. 4-Step Tracker / Expiration Meter Placeholder */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-3.5">
          <div className="flex justify-between items-center mb-2">
            <SkeletonElement height="10px" className="w-24" rounded="rounded-sm" delay={delay + 65} />
            <SkeletonElement height="12px" className="w-16" rounded="rounded-md" delay={delay + 70} />
          </div>
          <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
            <SkeletonElement height="100%" className="w-1/2" rounded="rounded-full" delay={delay + 75} />
          </div>
        </div>
      </div>

      {/* 5. Card Actions Footer */}
      <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
        <SkeletonElement
          height="36px"
          className="w-28"
          rounded="rounded-xl"
          delay={delay + 85}
        />
        <SkeletonElement
          height="36px"
          className="w-32"
          rounded="rounded-xl"
          delay={delay + 95}
        />
      </div>
    </div>
  );
};

export const GarageGridSkeleton = ({ count = 2, baseDelay = 60 }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <UnitCardSkeleton key={i} delay={baseDelay + i * 90} />
      ))}
    </div>
  );
};

export default UnitCardSkeleton;
