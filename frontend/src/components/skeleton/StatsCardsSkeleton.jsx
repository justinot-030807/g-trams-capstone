import React from 'react';
import SkeletonElement from './SkeletonElement';

/**
 * Renders staggered metric / KPI stat cards.
 * Matches the exact layout of AdminDashboard stat cards:
 * - Top accent strip
 * - Left: Label, large metric number, and subtitle
 * - Right: Rounded-2xl icon container
 */
const StatsCardsSkeleton = ({
  count = 4,
  gridClassName = 'grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  baseDelay = 40,
  stepDelay = 50
}) => {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, index) => {
        const cardDelay = baseDelay + index * stepDelay;
        return (
          <div
            key={index}
            className="bg-white dark:bg-[#1C1917] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-lg p-4 shadow-xs flex flex-col justify-between"
            style={{ animationDelay: `${cardDelay}ms` }}
          >
            <div className="space-y-2">
              <SkeletonElement
                height="12px"
                className="w-24 sm:w-28"
                rounded="rounded-sm"
                delay={cardDelay}
              />
              <SkeletonElement
                height="28px"
                className="w-16 sm:w-20 my-1"
                rounded="rounded-sm"
                delay={cardDelay + 15}
              />
            </div>
            <div className="mt-2">
              <SkeletonElement
                height="10px"
                className="w-28 sm:w-32 max-w-full"
                rounded="rounded-sm"
                delay={cardDelay + 25}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCardsSkeleton;
