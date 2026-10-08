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
export const UnitCardSkeleton = ({ delay = 40 }) => {
  return (
    <div
      className="stagger-reveal bg-white dark:bg-[#1C1917] rounded-lg p-5 sm:p-6 border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top Accent Strip Placeholder */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#E4E1DC] dark:bg-[#2E2A27]" />

      <div>
        {/* 1. Header Row: TODA badge (left) & Status badge (right) */}
        <div className="flex justify-between items-center mb-3 mt-0.5 gap-2">
          <SkeletonElement
            height="24px"
            className="w-28 sm:w-32"
            rounded="rounded-lg"
            delay={delay}
          />
          <SkeletonElement
            height="24px"
            className="w-20 sm:w-24"
            rounded="rounded-md"
            delay={delay + 15}
          />
        </div>

        {/* 2. Modern Government MTOP Plate Box */}
        <div className="p-3 sm:p-3.5 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] mb-3.5 flex items-center justify-between">
          <div className="min-w-0 pr-2 space-y-1.5">
            <SkeletonElement
              height="10px"
              className="w-32"
              rounded="rounded-xs"
              delay={delay + 25}
            />
            <SkeletonElement
              height="22px"
              className="w-28 sm:w-32"
              rounded="rounded-md"
              delay={delay + 35}
            />
          </div>

          <div className="text-right shrink-0 space-y-1.5">
            <SkeletonElement
              height="18px"
              className="w-16 ml-auto"
              rounded="rounded-md"
              delay={delay + 30}
            />
            <SkeletonElement
              height="10px"
              className="w-12 ml-auto"
              rounded="rounded-xs"
              delay={delay + 40}
            />
          </div>
        </div>

        {/* 3. Minimalist 2x2 Specs Grid (Route Zone & Motor Number) */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {/* Route Zone */}
          <div className="p-2.5 rounded-lg bg-[#F6F5F3]/60 dark:bg-[#14110F]/60 border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-2">
            <SkeletonElement
              rounded="rounded-md"
              className="w-6 h-6 shrink-0"
              delay={delay + 45}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <SkeletonElement height="9px" className="w-14" rounded="rounded-xs" delay={delay + 50} />
              <SkeletonElement height="12px" className="w-16" rounded="rounded-xs" delay={delay + 55} />
            </div>
          </div>

          {/* Motor Number */}
          <div className="p-2.5 rounded-lg bg-[#F6F5F3]/60 dark:bg-[#14110F]/60 border border-[#E4E1DC] dark:border-[#2E2A27] flex items-center gap-2">
            <SkeletonElement
              rounded="rounded-md"
              className="w-6 h-6 shrink-0"
              delay={delay + 50}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <SkeletonElement height="9px" className="w-16" rounded="rounded-xs" delay={delay + 55} />
              <SkeletonElement height="12px" className="w-20" rounded="rounded-xs" delay={delay + 60} />
            </div>
          </div>
        </div>

        {/* 4. 4-Step Tracker / Expiration Meter Placeholder */}
        <div className="p-3 rounded-lg bg-[#F6F5F3]/60 dark:bg-[#14110F]/60 border border-[#E4E1DC] dark:border-[#2E2A27] mb-3.5">
          <div className="flex justify-between items-center mb-2">
            <SkeletonElement height="10px" className="w-24" rounded="rounded-xs" delay={delay + 65} />
            <SkeletonElement height="11px" className="w-16" rounded="rounded-xs" delay={delay + 70} />
          </div>
          <div className="w-full bg-[#E4E1DC]/80 dark:bg-[#2E2A27]/80 rounded-full h-1.5 overflow-hidden">
            <SkeletonElement height="100%" className="w-2/3" rounded="rounded-full" delay={delay + 75} />
          </div>
        </div>
      </div>

      {/* 5. Card Actions Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
        <SkeletonElement
          height="36px"
          className="w-28"
          rounded="rounded-lg"
          delay={delay + 80}
        />
        <SkeletonElement
          height="36px"
          className="w-32"
          rounded="rounded-lg"
          delay={delay + 90}
        />
      </div>
    </div>
  );
};

export const GarageGridSkeleton = ({ count = 2, baseDelay = 40 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <UnitCardSkeleton key={i} delay={baseDelay + i * 70} />
      ))}
    </div>
  );
};

export default UnitCardSkeleton;
