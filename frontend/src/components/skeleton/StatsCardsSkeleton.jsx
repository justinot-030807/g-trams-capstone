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
            className="stagger-reveal bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden flex justify-between items-start"
            style={{ animationDelay: `${cardDelay}ms` }}
          >
            {/* Top Accent Strip Placeholder */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200/80 dark:bg-slate-700/80" />

            {/* Left Metrics */}
            <div className="space-y-1.5 flex-1 pr-2">
              <SkeletonElement
                height="12px"
                className="w-24 sm:w-28"
                rounded="rounded-md"
                delay={cardDelay}
              />
              <SkeletonElement
                height="30px"
                className="w-16 sm:w-20 my-1"
                rounded="rounded-lg"
                delay={cardDelay + 15}
              />
              <SkeletonElement
                height="10px"
                className="w-28 sm:w-32 max-w-full"
                rounded="rounded-sm"
                delay={cardDelay + 25}
              />
            </div>

            {/* Right Icon Box */}
            <SkeletonElement
              rounded="rounded-2xl"
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0"
              delay={cardDelay + 20}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StatsCardsSkeleton;
